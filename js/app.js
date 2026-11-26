// ============================================================
//  Spotter · foro (solo lectura)
//  Vanilla JS, sin framework. Todo lo que toca la base de datos
//  está en data.js. Aquí solo se pinta y se navega.
// ============================================================
import * as db from "./data.js";

/* ---------------- Datos fijos ---------------- */

const CATS = [
  { id: "rutinas",   name: "Rutinas",           color: "var(--c-rutinas)",   desc: "Planes de entrenamiento y opiniones sobre ellos." },
  { id: "tecnica",   name: "Técnica",           color: "var(--c-tecnica)",   desc: "Ejecución, movilidad y cómo evitar lesiones." },
  { id: "progreso",  name: "Progreso y marcas", color: "var(--c-progreso)",  desc: "Marcas personales, estancamientos y estadísticas." },
  { id: "nutricion", name: "Nutrición",         color: "var(--c-nutricion)", desc: "Comida, suplementos y recuperación." },
  { id: "app",       name: "La app",            color: "var(--c-app)",       desc: "Novedades, sugerencias y dudas de la app." },
  { id: "general",   name: "General",           color: "var(--c-general)",   desc: "Todo lo demás sobre el gimnasio." },
];
const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));
const TITLE = "Spotter · Foro";

/* ---------------- Estado ---------------- */

const S = {
  ready: false, offline: false,
  threads: [], cat: "all", sort: "recent", q: "",
  open: null, thread: null,
};

/* ---------------- Utilidades ---------------- */

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Párrafos en blanco separados, **negrita** y enlaces. Todo escapado antes.
function fmt(text) {
  return esc(text).trim().split(/\n{2,}/).map(p =>
    "<p>" + p
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n/g, "<br>") + "</p>").join("");
}

function ago(t) {
  if (!t) return "";
  const s = (Date.now() - t) / 1000;
  if (s < 60) return "ahora mismo";
  const m = s / 60; if (m < 60) return `hace ${Math.floor(m)} min`;
  const h = m / 60; if (h < 24) return `hace ${Math.floor(h)} h`;
  const d = h / 24; if (d < 7) return `hace ${Math.floor(d)} ${Math.floor(d) === 1 ? "día" : "días"}`;
  return new Date(t).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: d > 300 ? "numeric" : undefined });
}

const num = n => Number(n).toLocaleString("es-ES", { maximumFractionDigits: 1 });
const e1rm = (kg, reps) => (reps <= 1 ? kg : kg * (1 + reps / 30));

const ICON = {
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  spot: '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="5" fill="currentColor"/></svg>',
};

/* ---------------- Categorías ---------------- */

function renderCats() {
  const counts = {};
  S.threads.forEach(t => (counts[t.cat] = (counts[t.cat] || 0) + 1));
  const item = (id, name, color, n) => `<li><button class="cat-btn${id === "all" ? " all" : ""}" data-cat="${id}" aria-pressed="${S.cat === id}">
    <span class="plate" style="--c:${color}" aria-hidden="true"></span><span class="cat-name">${esc(name)}</span><span class="cat-count">${n}</span></button></li>`;
  $("#cats").innerHTML = item("all", "Todos los temas", "", S.threads.length) +
    CATS.map(c => item(c.id, c.name, c.color, counts[c.id] || 0)).join("");
  $("#catDesc").textContent = S.cat === "all"
    ? "Elige una categoría para centrarte en un tema."
    : CAT[S.cat].desc;
}

/* ---------------- Lista de temas ---------------- */

function visibleThreads() {
  let l = S.threads.slice();
  if (S.cat !== "all") l = l.filter(t => t.cat === S.cat);
  if (S.q) { const q = S.q.toLowerCase(); l = l.filter(t => (t.title + " " + t.body).toLowerCase().includes(q)); }
  if (S.sort === "popular") l.sort((a, b) => b.score - a.score || b.createdAt - a.createdAt);
  // Fijados arriba en orden cronológico (el más antiguo primero); el resto, del más nuevo al más antiguo.
  else l.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
    || (a.pinned ? a.createdAt - b.createdAt : b.createdAt - a.createdAt));
  return l;
}

function attBadge(a) {
  if (!a) return "";
  if (a.type === "pr") return `<span class="chip att">Marca · ${esc(a.ex)} · ${num(a.kg)} kg × ${a.reps}</span>`;
  if (a.type === "routine") return `<span class="chip att">Rutina · ${a.items.length} ejercicios</span>`;
  return "";
}

function renderList() {
  const sorts = [["recent", "Recientes"], ["popular", "Populares"]];
  let body;
  if (S.offline) {
    body = `<div class="empty"><h3>No se pudo cargar el foro</h3><p>Inténtalo de nuevo en unos minutos.</p></div>`;
  } else if (!S.ready) {
    body = `<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>`;
  } else {
    const l = visibleThreads();
    body = l.length ? l.map(t => {
      const c = CAT[t.cat] || CAT.general;
      return `<article class="row${t.pinned ? " pinned" : ""}" data-open="${esc(t.id)}">
        <div class="score"><b>${t.score}</b><span>votos</span></div>
        <div>
          <h3><a href="#t/${esc(t.id)}">${esc(t.title)}</a></h3>
          <p class="excerpt">${esc(t.body.split("**").join("").slice(0, 240))}</p>
          <div class="meta">
            <span class="chip"><span class="plate sm" style="--c:${c.color}"></span>${esc(c.name)}</span>
            ${t.pinned ? `<span class="chip pin">${ICON.spot}Fijado</span>` : ""}
            ${attBadge(t.att)}
            <span>${esc(t.authorName || "Alguien")}</span>
            <span>${ago(t.createdAt)}</span>
          </div>
        </div>
      </article>`;
    }).join("")
      : `<div class="empty">
          <h3>${S.q ? "Nada coincide con tu búsqueda" : "Todavía no hay temas aquí"}</h3>
          <p>${S.q ? "Prueba con otras palabras o cambia de categoría." : "Vuelve pronto: el equipo publica nuevos temas con frecuencia."}</p>
        </div>`;
  }
  $("#main").innerHTML = `
    <div class="toolbar">
      <h2>${esc(S.cat === "all" ? "Todos los temas" : CAT[S.cat].name)}</h2>
      <div class="seg" role="group" aria-label="Ordenar">${sorts
        .map(([v, n]) => `<button data-sort="${v}" aria-pressed="${S.sort === v}">${n}</button>`).join("")}</div>
    </div>
    <div class="list">${body}</div>
    ${S.ready && !S.offline ? '<p class="foot-note">Foro de lectura abierta: no hace falta cuenta. Los temas los publica el equipo de Spotter.</p>' : ""}`;
}

/* ---------------- Vista de tema ---------------- */

function renderAtt(a) {
  if (!a) return "";
  if (a.type === "pr") {
    return `<div class="log record"><div class="log-head"><strong>${esc(a.ex)}</strong><span>Marca personal</span></div>
      <div class="pr"><div class="big">${num(a.kg)}<small> kg × ${a.reps}</small></div>
      <div class="sub">1RM estimado<br><b>${num(e1rm(+a.kg, +a.reps))} kg</b> (fórmula de Epley)</div></div></div>`;
  }
  if (a.type === "routine") {
    const vol = a.items.reduce((s, i) => s + (+i.sets || 0) * (+i.reps || 0) * (+i.kg || 0), 0);
    const sets = a.items.reduce((s, i) => s + (+i.sets || 0), 0);
    return `<div class="log"><div class="log-head"><strong>${esc(a.name || "Rutina")}</strong><span>${sets} series · ${num(vol)} kg de volumen</span></div>
      <table>${a.items.map(i => `<tr><td>${esc(i.ex)}</td><td class="n"><b>${i.sets}×${i.reps}</b>${+i.kg ? ` @ ${num(i.kg)} kg` : ""}</td></tr>`).join("")}</table></div>`;
  }
  return "";
}

function renderThread() {
  const t = S.thread;
  if (!t) {
    $("#main").innerHTML = `<button class="back" data-act="back">← Volver</button>
      <div class="list"><div class="empty"><h3>Este tema ya no existe</h3><p>Puede que se haya retirado.</p></div></div>`;
    return;
  }
  const c = CAT[t.cat] || CAT.general;

  $("#main").innerHTML = `
    <button class="back" data-act="back">← Todos los temas</button>
    <article class="post">
      <div class="meta"><span class="chip"><span class="plate sm" style="--c:${c.color}"></span>${esc(c.name)}</span>
        ${t.pinned ? `<span class="chip pin">${ICON.spot}Fijado</span>` : ""}</div>
      <h1>${esc(t.title)}</h1>
      <div class="byline"><strong>${esc(t.authorName || "Alguien")}</strong><span>${ago(t.createdAt)}</span></div>
      <div class="content">${fmt(t.body)}</div>
      ${renderAtt(t.att)}
      <div class="actions"><span class="pill" aria-label="${t.score} votos">${ICON.up}${t.score}</span></div>
    </article>`;
}

/* ---------------- Navegación ---------------- */

function render() { S.open ? renderThread() : renderList(); }

async function openThread(id) {
  S.open = id; S.thread = null;
  if (location.hash !== "#t/" + id) history.pushState(null, "", "#t/" + id);
  render(); window.scrollTo(0, 0);
  try { S.thread = await db.getThread(id); }
  catch (e) { console.error(e); }
  if (S.thread) document.title = `${S.thread.title} · ${TITLE}`;
  render();
}

function closeThread() {
  S.open = null; S.thread = null;
  document.title = TITLE;
  if (location.hash.startsWith("#t/")) history.pushState(null, "", location.pathname + location.search);
}

async function refreshList() {
  try {
    S.threads = await db.listThreads();
    S.ready = true; S.offline = false;
  } catch (e) { console.error(e); S.offline = true; }
  renderCats();
  if (!S.open) return render();
  const t = S.threads.find(x => x.id === S.open);
  if (S.thread) { S.thread = t || null; render(); }
}

/* ---------------- Eventos ---------------- */

$("#cats").addEventListener("click", e => {
  const b = e.target.closest("[data-cat]"); if (!b) return;
  S.cat = b.dataset.cat; closeThread(); renderCats(); render();
});

$("#q").addEventListener("input", e => {
  clearTimeout($("#q")._t);
  $("#q")._t = setTimeout(() => { S.q = e.target.value.trim(); closeThread(); render(); }, 150);
});

$("#main").addEventListener("click", e => {
  const el = e.target.closest("[data-act],[data-sort],[data-open]"); if (!el) return;
  if (el.dataset.sort) { S.sort = el.dataset.sort; return render(); }
  if (el.dataset.act === "back") { closeThread(); return render(); }
  if (el.dataset.open) { e.preventDefault(); return openThread(el.dataset.open); }
});

window.addEventListener("popstate", () => {
  const m = location.hash.match(/^#t\/(.+)$/);
  if (m) openThread(m[1]); else if (S.open) { closeThread(); render(); }
});

/* ---------------- Arranque ---------------- */

renderCats(); render();

if (!db.configured) {
  S.offline = true;
  render();
  console.warn("Falta configurar js/config.js con la URL y la clave anon de Supabase.");
} else {
  (async () => {
    await refreshList();
    db.watchThreads(() => refreshList());
    const m = location.hash.match(/^#t\/(.+)$/);
    if (m) openThread(m[1]);
  })();
}
