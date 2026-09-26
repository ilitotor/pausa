// ============================================================================
// Pausa — service worker (MV3)
// Detecta ociosidade do SISTEMA via chrome.idle (não só do navegador),
// acumula tempo ativo, sugere pausas e registra estatísticas diárias.
//
// Robustez MV3: o service worker pode ser encerrado a qualquer momento, então
// todo o estado vive em chrome.storage.local e o "tick" usa timestamps
// (Date.now) em vez de assumir que os timers rodam com precisão.
// ============================================================================

importScripts("i18n.js"); // disponibiliza I18N, getLang(), t()

const DEFAULT_CONFIG = {
  workLimitMin: 30,       // minutos de atividade até o aviso
  breakDurationMin: 3,    // minutos parado para valer como pausa
  snoozeMin: 15,          // quanto o "+15 min" adia
  idleDetectionSec: 15,   // granularidade do chrome.idle (mínimo permitido)
  alertStyle: "tab"       // "tab" (abre página de pausa) ou "notification"
};

const CAP_DT = 120;       // limite de segundos por tick (evita saltos após suspensão)
const TICK_MINUTES = 0.5; // periodicidade do alarme (pode ser ajustada pelo Chrome)

const NOTIF = {
  breakReminder: "pausa-break",
  sittingCheck: "pausa-sitting",
  welcomeBack: "pausa-welcome"
};

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

async function load() {
  const data = await chrome.storage.local.get(["config", "state", "stats"]);
  const config = Object.assign({}, DEFAULT_CONFIG, data.config || {});
  const state = data.state || freshState(config);
  const stats = data.stats || {};
  return { config, state, stats };
}

function freshState(config) {
  return {
    phase: "working",              // working | awaitingConfirmation | onBreak
    activeSeconds: 0,
    nextAlertAt: config.workLimitMin * 60,
    notified: false,
    snoozeCount: 0,
    idleSince: null,               // timestamp (ms) em que a ociosidade começou
    breakStart: null,              // timestamp (ms) de início da pausa
    currentIdleSeconds: 0,
    lastBreakSeconds: null,
    sittingSnoozeUntil: 0,         // enquanto > now, ignora lógica de pausa
    breakTabId: null,              // id da aba de pausa aberta (se houver)
    lastCheck: Date.now()
  };
}

async function save(state, stats) {
  await chrome.storage.local.set({ state, stats });
}

// ---------------------------------------------------------------------------
// Estatísticas
// ---------------------------------------------------------------------------

function todayKey() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function ensureDay(stats) {
  const key = todayKey();
  if (!stats[key]) {
    stats[key] = { active: new Array(24).fill(0), break: new Array(24).fill(0), breakCount: 0 };
    pruneStats(stats);
  }
  return stats[key];
}

function pruneStats(stats) {
  const keys = Object.keys(stats).sort();
  const keep = 14;
  while (keys.length > keep) {
    delete stats[keys.shift()];
  }
}

function addActive(stats, seconds) {
  ensureDay(stats).active[new Date().getHours()] += Math.round(seconds);
}
function addBreak(stats, seconds) {
  if (seconds <= 0) return;
  ensureDay(stats).break[new Date().getHours()] += Math.round(seconds);
}

// ---------------------------------------------------------------------------
// Núcleo: avaliação periódica
// ---------------------------------------------------------------------------

async function evaluate() {
  const now = Date.now();
  const { config, state, stats } = await load();

  let idleState = "active";
  try {
    idleState = await new Promise((res) =>
      chrome.idle.queryState(config.idleDetectionSec, res));
  } catch (_) { /* mantém active */ }

  const dt = Math.max(0, Math.min((now - state.lastCheck) / 1000, CAP_DT));
  const active = idleState === "active";
  const breakThreshold = config.breakDurationMin * 60;

  if (state.phase === "onBreak") {
    if (active) {
      endBreak(state, stats, now);
    } else {
      state.currentIdleSeconds = (now - (state.breakStart || now)) / 1000;
      addBreak(stats, dt);
    }
  } else {
    // working ou awaitingConfirmation
    if (active) {
      if (state.phase === "awaitingConfirmation") {
        state.phase = "working";
        chrome.notifications.clear(NOTIF.sittingCheck);
      }
      state.idleSince = null;
      state.currentIdleSeconds = 0;
      state.activeSeconds += dt;
      addActive(stats, dt);

      if (state.activeSeconds >= state.nextAlertAt && !state.notified) {
        state.notified = true;
        await triggerBreakAlert(state, config);
      }
    } else {
      // ocioso (ou bloqueado)
      if (state.idleSince == null) {
        state.idleSince = now - config.idleDetectionSec * 1000;
      }
      const idleDur = (now - state.idleSince) / 1000;
      state.currentIdleSeconds = idleDur;

      const suppressed = now < state.sittingSnoozeUntil;
      if (idleDur >= breakThreshold && !suppressed) {
        if (state.phase !== "awaitingConfirmation") {
          state.phase = "awaitingConfirmation";
          showSittingCheck(config);
        } else {
          // já perguntamos e continua parado → é pausa de verdade
          beginBreak(state, stats, now);
        }
      }
    }
  }

  state.lastCheck = now;
  await save(state, stats);
  updateBadge(state);
}

function beginBreak(state, stats, now) {
  state.breakStart = state.idleSince || now;
  const idleDur = (now - state.breakStart) / 1000;
  addBreak(stats, Math.min(idleDur, CAP_DT * 4));
  state.phase = "onBreak";
  state.currentIdleSeconds = idleDur;
  resetWorkClock(state);
  chrome.notifications.clear(NOTIF.sittingCheck);
  closeBreakTab(state);
}

function endBreak(state, stats, now) {
  const len = (now - (state.breakStart || now)) / 1000;
  state.lastBreakSeconds = len;
  ensureDay(stats).breakCount += 1;
  showWelcomeBack(len);
  state.phase = "working";
  state.breakStart = null;
  state.idleSince = null;
  state.currentIdleSeconds = 0;
  resetWorkClock(state);
}

function resetWorkClock(state, config) {
  state.activeSeconds = 0;
  state.nextAlertAt = (config ? config.workLimitMin : DEFAULT_CONFIG.workLimitMin) * 60;
  state.notified = false;
  state.snoozeCount = 0;
}

// ---------------------------------------------------------------------------
// Badge (mostra estado no ícone da barra)
// ---------------------------------------------------------------------------

function updateBadge(state) {
  if (state.phase === "onBreak") {
    const m = Math.floor(state.currentIdleSeconds / 60);
    chrome.action.setBadgeText({ text: m < 1 ? "•" : String(m) });
    chrome.action.setBadgeBackgroundColor({ color: "#14b8a6" });
  } else if (state.notified) {
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

// ---------------------------------------------------------------------------
// Notificações
// ---------------------------------------------------------------------------

// Dispara o aviso de pausa: abre a página de pausa (padrão) ou uma notificação.
async function triggerBreakAlert(state, config) {
  if (config.alertStyle === "notification") {
    showBreakNotification(state);
    return;
  }
  await openBreakTab(state);
}

// Abre a aba de pausa; se já existir uma, apenas foca nela em vez de duplicar.
async function openBreakTab(state) {
  const url = chrome.runtime.getURL("break.html");
  if (state.breakTabId != null) {
    try {
      await chrome.tabs.update(state.breakTabId, { active: true });
      const tab = await chrome.tabs.get(state.breakTabId);
      if (tab && tab.windowId != null) {
        await chrome.windows.update(tab.windowId, { focused: true });
      }
      return;
    } catch (_) {
      state.breakTabId = null; // a aba não existe mais
    }
  }
  try {
    const tab = await chrome.tabs.create({ url, active: true });
    state.breakTabId = tab.id;
    if (tab.windowId != null) {
      chrome.windows.update(tab.windowId, { focused: true }).catch(() => {});
    }
  } catch (_) {
    showBreakNotification(state); // fallback se não conseguir abrir a aba
  }
}

// Fecha a aba de pausa (se aberta). Define o id como null de imediato.
function closeBreakTab(state) {
  const id = state.breakTabId;
  state.breakTabId = null;
  if (id != null) chrome.tabs.remove(id).catch(() => {});
}

async function showBreakNotification(state) {
  const lang = await getLang();
  chrome.notifications.create(NOTIF.breakReminder, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: t(lang, "notif_break_title"),
    message: t(lang, "notif_break_msg", Math.round(state.activeSeconds / 60)),
    buttons: [{ title: t(lang, "notif_snooze_btn") }, { title: t(lang, "notif_done_btn") }],
    requireInteraction: true,
    priority: 2
  });
}

async function showSittingCheck(config) {
  const lang = await getLang();
  chrome.notifications.create(NOTIF.sittingCheck, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: t(lang, "notif_sitting_title"),
    message: t(lang, "notif_sitting_msg"),
    buttons: [{ title: t(lang, "notif_sitting_yes") }, { title: t(lang, "notif_sitting_no") }],
    requireInteraction: true,
    priority: 2
  });
}

async function showWelcomeBack(seconds) {
  const lang = await getLang();
  chrome.notifications.create(NOTIF.welcomeBack, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: t(lang, "notif_welcome_title"),
    message: t(lang, "notif_welcome_msg", formatDuration(seconds)),
    priority: 1
  });
}

function formatDuration(seconds) {
  const total = Math.round(seconds);
  if (total < 60) return `${total} s`;
  const m = Math.floor(total / 60), s = total % 60;
  return s === 0 ? `${m} min` : `${m} min ${s} s`;
}

// ---------------------------------------------------------------------------
// Ações do usuário (botões das notificações)
// ---------------------------------------------------------------------------

chrome.notifications.onButtonClicked.addListener(async (notifId, btnIdx) => {
  const { config, state, stats } = await load();

  if (notifId === NOTIF.breakReminder) {
    if (btnIdx === 0) {                 // Adiar +15
      state.nextAlertAt = state.activeSeconds + config.snoozeMin * 60;
      state.notified = false;
      state.snoozeCount += 1;
    } else {                            // Já fiz minha pausa
      resetWorkClock(state, config);
    }
    chrome.notifications.clear(NOTIF.breakReminder);
  } else if (notifId === NOTIF.sittingCheck) {
    if (btnIdx === 0) {                 // Sim, estou aqui
      state.phase = "working";
      state.idleSince = Date.now();
      state.currentIdleSeconds = 0;
      state.sittingSnoozeUntil = Date.now() + config.snoozeMin * 60 * 1000;
    } else {                            // É uma pausa
      beginBreak(state, stats, Date.now());
    }
    chrome.notifications.clear(NOTIF.sittingCheck);
  }

  await save(state, stats);
  updateBadge(state);
});

// ---------------------------------------------------------------------------
// Mensagens vindas do popup (snooze, reset, mudança de config)
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    const { config, state, stats } = await load();

    switch (msg.type) {
      case "snooze":
        state.nextAlertAt = state.activeSeconds + config.snoozeMin * 60;
        state.notified = false;
        state.snoozeCount += 1;
        closeBreakTab(state);
        break;
      case "reset":
        resetWorkClock(state, config);
        closeBreakTab(state);
        break;
      case "setConfig": {
        const newConfig = Object.assign({}, config, msg.config);
        await chrome.storage.local.set({ config: newConfig });
        // Se o limite mudou e não estamos em pausa, reancora o próximo aviso
        if (msg.config.workLimitMin != null && state.phase !== "onBreak") {
          state.nextAlertAt = newConfig.workLimitMin * 60;
          state.notified = false;
        }
        chrome.idle.setDetectionInterval(newConfig.idleDetectionSec);
        break;
      }
    }

    await save(state, stats);
    updateBadge(state);
    sendResponse({ ok: true });
  })();
  return true; // resposta assíncrona
});

// ---------------------------------------------------------------------------
// Eventos de ciclo de vida
// ---------------------------------------------------------------------------

async function setup() {
  const { config, state, stats } = await load();
  chrome.idle.setDetectionInterval(config.idleDetectionSec);
  chrome.alarms.create("tick", { periodInMinutes: TICK_MINUTES });
  // Garante que o estado inicial exista
  await save(state, stats);
  updateBadge(state);
}

chrome.runtime.onInstalled.addListener(setup);
chrome.runtime.onStartup.addListener(setup);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "tick") evaluate();
});

// Reage na hora quando o sistema entra/sai de ocioso ou é bloqueado
chrome.idle.onStateChanged.addListener(() => evaluate());

// Se o usuário fechar a aba de pausa manualmente, esquece o id guardado
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const { state, stats } = await load();
  if (state.breakTabId === tabId) {
    state.breakTabId = null;
    await save(state, stats);
  }
});
