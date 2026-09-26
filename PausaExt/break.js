// Mostra por quanto tempo o usuário ficou ativo e oferece as ações.

async function init() {
  const lang = await applyStaticI18n();
  const data = await chrome.storage.local.get("state");
  const state = data.state;
  if (state && typeof state.activeSeconds === "number") {
    const min = Math.round(state.activeSeconds / 60);
    document.getElementById("subtitle").textContent = t(lang, "break_subtitle", min);
  }
}

// Contador regressivo de pausa sugerida (5 min), apenas visual.
let remaining = 5 * 60;
function tick() {
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  document.getElementById("timer").textContent =
    `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  if (remaining > 0) remaining--;
}
tick();
setInterval(tick, 1000);

document.getElementById("done").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "reset" });
  window.close();
});
document.getElementById("snooze").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "snooze" });
  window.close();
});

init();
