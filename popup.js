const DEFAULT_CONFIG = { workLimitMin: 30, breakDurationMin: 3, snoozeMin: 15, idleDetectionSec: 15, alertStyle: "tab" };

let LANG = "en";

function fmtHM(seconds) {
  seconds = Math.round(seconds);
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}min` : `${h}h`;
  return `${m}min`;
}

function fmtClock(seconds) {
  const m = Math.floor(seconds / 60), s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

async function loadAll() {
  const data = await chrome.storage.local.get(["config", "state", "stats"]);
  return {
    config: Object.assign({}, DEFAULT_CONFIG, data.config || {}),
    state: data.state || null,
    stats: data.stats || {}
  };
}

function todayKey() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function render() {
  const { config, state, stats } = await loadAll();

  const statusEl = document.getElementById("status");
  const progressEl = document.getElementById("progress");
  const subinfoEl = document.getElementById("subinfo");
  const todayEl = document.getElementById("today");

  statusEl.className = "status";
  progressEl.className = "progress-bar";

  if (!state) {
    statusEl.textContent = t(LANG, "starting");
  } else if (state.phase === "onBreak") {
    statusEl.textContent = t(LANG, "on_break_for", fmtHM(state.currentIdleSeconds));
    statusEl.classList.add("break");
    progressEl.style.width = "0%";
    subinfoEl.textContent = t(LANG, "break_hint");
  } else {
    statusEl.textContent = t(LANG, "active_time", fmtClock(state.activeSeconds));
    const pct = Math.min(100, (state.activeSeconds / state.nextAlertAt) * 100);
    progressEl.style.width = `${pct}%`;

    if (state.notified) {
      statusEl.classList.add("alert");
      statusEl.textContent = t(LANG, "alert_now");
      progressEl.classList.add("alert");
      subinfoEl.textContent = t(LANG, "alert_hint");
    } else {
      const left = Math.max(0, Math.round((state.nextAlertAt - state.activeSeconds) / 60));
      let info = t(LANG, "next_in", left);
      if (state.snoozeCount > 0) info += t(LANG, "snoozed_x", state.snoozeCount);
      subinfoEl.textContent = info;
    }
  }

  const day = stats[todayKey()] || { active: [], break: [] };
  const active = (day.active || []).reduce((a, b) => a + b, 0);
  const brk = (day.break || []).reduce((a, b) => a + b, 0);
  todayEl.textContent = t(LANG, "today_summary", fmtHM(active), fmtHM(brk));

  document.getElementById("workLimit").value = String(config.workLimitMin);
  document.getElementById("breakDuration").value = String(config.breakDurationMin);
  document.getElementById("alertStyle").value = config.alertStyle;
  document.getElementById("lang").value = LANG;
}

// --- Configuração de tempo (campo livre + stepper) ---

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function commitNumber(id) {
  const el = document.getElementById(id);
  const min = Number(el.min), max = Number(el.max);
  let v = parseInt(el.value, 10);
  if (isNaN(v)) v = min;
  v = clamp(v, min, max);
  el.value = String(v);
  const key = id === "workLimit" ? "workLimitMin" : "breakDurationMin";
  chrome.runtime.sendMessage({ type: "setConfig", config: { [key]: v } });
}

["workLimit", "breakDuration"].forEach((id) => {
  const el = document.getElementById(id);
  el.addEventListener("change", () => commitNumber(id));
});

document.querySelectorAll(".step").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.target;
    const el = document.getElementById(id);
    const delta = Number(btn.dataset.delta);
    el.value = String(clamp((parseInt(el.value, 10) || 0) + delta, Number(el.min), Number(el.max)));
    commitNumber(id);
  });
});

document.getElementById("alertStyle").addEventListener("change", (e) => {
  chrome.runtime.sendMessage({ type: "setConfig", config: { alertStyle: e.target.value } });
});

document.getElementById("lang").addEventListener("change", async (e) => {
  LANG = e.target.value;
  await setLang(LANG);
  await applyStaticI18n();
  render();
});

document.getElementById("snooze").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "snooze" }, render);
});
document.getElementById("reset").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "reset" }, render);
});
document.getElementById("report").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("report.html") });
});

// Inicialização
(async () => {
  LANG = await applyStaticI18n();
  render();
  setInterval(render, 1000);
  chrome.storage.onChanged.addListener(render);
})();
