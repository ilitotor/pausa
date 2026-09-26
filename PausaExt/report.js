let LANG = "en";

function fmtHM(seconds) {
  seconds = Math.round(seconds);
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}min` : `${h}h`;
  return `${m}min`;
}

function todayKey() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

async function render() {
  const data = await chrome.storage.local.get("stats");
  const stats = data.stats || {};
  const today = stats[todayKey()] || { active: new Array(24).fill(0), break: new Array(24).fill(0), breakCount: 0 };

  const totalActive = today.active.reduce((a, b) => a + b, 0);
  const totalBreak = today.break.reduce((a, b) => a + b, 0);

  document.getElementById("c-active").textContent = fmtHM(totalActive);
  document.getElementById("c-break").textContent = fmtHM(totalBreak);
  document.getElementById("c-count").textContent = String(today.breakCount || 0);

  // --- Gráfico por hora (barras empilhadas: ativo + pausa) ---
  const hourly = document.getElementById("hourly");
  hourly.innerHTML = "";
  const maxHour = Math.max(60, ...today.active.map((a, i) => a + today.break[i]));

  for (let h = 0; h < 24; h++) {
    const col = el("div", "bar-col");
    const stack = el("div", "bar-stack");

    const aMin = today.active[h] / 60;
    const bMin = today.break[h] / 60;
    const maxMin = maxHour / 60;

    const active = el("div", "bar green");
    active.style.height = `${(aMin / maxMin) * 100}%`;
    active.title = `${h}h — ativo: ${Math.round(aMin)} min`;

    const brk = el("div", "bar teal");
    brk.style.height = `${(bMin / maxMin) * 100}%`;
    brk.title = `${h}h — pausa: ${Math.round(bMin)} min`;

    stack.appendChild(active);
    stack.appendChild(brk);
    col.appendChild(stack);

    if (h % 3 === 0) {
      const lbl = el("div", "bar-label");
      lbl.textContent = `${h}h`;
      col.appendChild(lbl);
    }
    hourly.appendChild(col);
  }

  // --- Gráfico dos últimos dias (horas ativas) ---
  const weekly = document.getElementById("weekly");
  weekly.innerHTML = "";
  const keys = Object.keys(stats).sort().slice(-7);

  if (keys.length <= 1) {
    const empty = el("div", "empty");
    empty.textContent = t(LANG, "not_enough_history");
    weekly.appendChild(empty);
    return;
  }

  const dayTotals = keys.map((k) => (stats[k].active || []).reduce((a, b) => a + b, 0));
  const maxDay = Math.max(3600, ...dayTotals);

  keys.forEach((k, i) => {
    const col = el("div", "bar-col");
    const stack = el("div", "bar-stack");
    const bar = el("div", "bar green");
    bar.style.height = `${(dayTotals[i] / maxDay) * 100}%`;
    bar.title = `${k}: ${fmtHM(dayTotals[i])}`;
    stack.appendChild(bar);
    col.appendChild(stack);

    const lbl = el("div", "bar-label");
    lbl.textContent = k.slice(5); // MM-DD
    col.appendChild(lbl);
    weekly.appendChild(col);
  });
}

(async () => {
  LANG = await applyStaticI18n();
  render();
  chrome.storage.onChanged.addListener(render);
})();
