// ============================================================================
// i18n compartilhado da extensão. Strings simples ou funções (para partes
// dinâmicas). Usado no popup, na página de pausa, no relatório e — via
// importScripts — no service worker (background.js).
// ============================================================================

const I18N = {
  en: {
    // Popup
    starting: "Starting…",
    on_break_for: (dur) => `⏸ On a break for ${dur}`,
    break_hint: "Enjoy! The counter has been reset.",
    active_time: (clock) => `Active time: ${clock}`,
    alert_now: "⚠️ Time for a break!",
    alert_hint: "Stand up and take a break, or snooze +15 min.",
    next_in: (min) => `Next reminder in ${min} min`,
    snoozed_x: (n) => ` · snoozed ${n}×`,
    today_summary: (a, b) => `Today: ${a} active · ${b} on breaks`,
    remind_every: "Activity block",
    break_after: "Break counts after",
    alert_style: "Alert style",
    alert_style_tab: "Open break tab",
    alert_style_notif: "Notification only",
    unit_min: "min",
    btn_report: "📊 View report",
    btn_snooze: "⏰ Snooze +15 min",
    btn_reset: "✅ I took my break",
    language: "Language",

    // Break page
    break_title: "Time for a break! 🚶",
    break_subtitle_default: "You've worked for a good while. Stand up and breathe.",
    break_subtitle: (m) => `You've been active for ${m} min. Stand up, stretch and rest your eyes.`,
    suggested_break: "suggested break",
    tip_eyes: "👀 Look at something 6 m away for 20 seconds",
    tip_stretch: "🧍 Stand up and stretch your neck and shoulders",
    tip_water: "💧 Drink a glass of water",
    btn_done: "✅ I took my break",
    btn_snooze_break: "⏰ Snooze +15 min",

    // Report page
    report_title: "Daily report",
    card_active: "Active time",
    card_break: "Break time",
    card_count: "Breaks",
    today_by_hour: "Today, by hour",
    legend_active: "Active",
    legend_break: "Break",
    last_days: "Last days (active hours)",
    not_enough_history: "Not enough history yet. Come back tomorrow!",
    report_note: "Data is recorded only while Chrome is open, at ~15–30s resolution. We keep the last 14 days.",

    // Notifications
    notif_break_title: "Time for a break! 🚶",
    notif_break_msg: (m) => `You've been active for ${m} min. Stand up, stretch or drink some water.`,
    notif_snooze_btn: "Snooze +15 min",
    notif_done_btn: "I took my break",
    notif_sitting_title: "Are you still there? 🪑",
    notif_sitting_msg: "No activity detected. If you're sitting (e.g. in a meeting), let me know. Otherwise I'll log a break.",
    notif_sitting_yes: "Yes, I'm here",
    notif_sitting_no: "It's a break",
    notif_welcome_title: "Welcome back! 👋",
    notif_welcome_msg: (dur) => `Your break was ${dur}. Nice work!`
  },

  pt_BR: {
    // Popup
    starting: "Iniciando…",
    on_break_for: (dur) => `⏸ Em pausa há ${dur}`,
    break_hint: "Aproveite! O contador foi zerado.",
    active_time: (clock) => `Tempo ativo: ${clock}`,
    alert_now: "⚠️ Hora da pausa!",
    alert_hint: "Levante e faça uma pausa, ou adie +15 min.",
    next_in: (min) => `Próximo aviso em ${min} min`,
    snoozed_x: (n) => ` · adiado ${n}×`,
    today_summary: (a, b) => `Hoje: ${a} ativo · ${b} em pausa`,
    remind_every: "Bloco de atividade",
    break_after: "Pausa válida após",
    alert_style: "Estilo do aviso",
    alert_style_tab: "Abrir aba de pausa",
    alert_style_notif: "Só notificação",
    unit_min: "min",
    btn_report: "📊 Ver relatório",
    btn_snooze: "⏰ Adiar +15 min",
    btn_reset: "✅ Já fiz minha pausa",
    language: "Idioma",

    // Break page
    break_title: "Hora de uma pausa! 🚶",
    break_subtitle_default: "Você trabalhou por um bom tempo. Levante e respire um pouco.",
    break_subtitle: (m) => `Você está ativo há ${m} min. Levante, alongue-se e descanse os olhos.`,
    suggested_break: "pausa sugerida",
    tip_eyes: "👀 Olhe para algo a 6 metros por 20 segundos",
    tip_stretch: "🧍 Levante e alongue o pescoço e os ombros",
    tip_water: "💧 Beba um copo d'água",
    btn_done: "✅ Já fiz minha pausa",
    btn_snooze_break: "⏰ Adiar +15 min",

    // Report page
    report_title: "Relatório do dia",
    card_active: "Tempo ativo",
    card_break: "Tempo em pausa",
    card_count: "Pausas",
    today_by_hour: "Hoje, por hora",
    legend_active: "Ativo",
    legend_break: "Pausa",
    last_days: "Últimos dias (horas ativas)",
    not_enough_history: "Ainda não há histórico suficiente. Volte amanhã!",
    report_note: "Os dados são registrados apenas enquanto o Chrome está aberto, com granularidade de ~15–30s. Guardamos os últimos 14 dias.",

    // Notifications
    notif_break_title: "Hora de uma pausa! 🚶",
    notif_break_msg: (m) => `Você está ativo há ${m} min. Levante, alongue ou beba uma água.`,
    notif_snooze_btn: "Adiar +15 min",
    notif_done_btn: "Já fiz minha pausa",
    notif_sitting_title: "Você ainda está aí? 🪑",
    notif_sitting_msg: "Não detectei atividade. Se você está sentado (ex.: reunião), avise. Senão, vou registrar uma pausa.",
    notif_sitting_yes: "Sim, estou aqui",
    notif_sitting_no: "É uma pausa",
    notif_welcome_title: "Bem-vindo de volta! 👋",
    notif_welcome_msg: (dur) => `Sua pausa foi de ${dur}. Bom trabalho!`
  }
};

// Detecta o idioma salvo ou, na ausência, o idioma do navegador.
async function getLang() {
  try {
    const { lang } = await chrome.storage.local.get("lang");
    if (lang && I18N[lang]) return lang;
  } catch (_) { /* ignora */ }
  const ui = (typeof navigator !== "undefined" && navigator.language ? navigator.language : "en").toLowerCase();
  return ui.startsWith("pt") ? "pt_BR" : "en";
}

async function setLang(lang) {
  await chrome.storage.local.set({ lang });
}

// Retorna a string traduzida; se for função, invoca com os argumentos.
function t(lang, key, ...args) {
  const dict = I18N[lang] || I18N.en;
  const val = dict[key] !== undefined ? dict[key] : I18N.en[key];
  if (val === undefined) return key;
  return typeof val === "function" ? val(...args) : val;
}

// Aplica traduções a elementos com [data-i18n] (para textos estáticos no HTML).
async function applyStaticI18n() {
  const lang = await getLang();
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(lang, key);
  });
  document.documentElement.lang = lang === "pt_BR" ? "pt-BR" : "en";
  return lang;
}
