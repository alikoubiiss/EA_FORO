// ============================================================
//  Spotter · interfaz del foro
//  Vanilla JS, sin framework. Todo lo que toca la base de datos
//  está en data.js.
// ============================================================
import * as db from "./data.js";

/* ---------------- Datos fijos ---------------- */

const CATS = [
  { id: "rutinas",   name: "Rutinas",           color: "var(--red)",    desc: "Comparte planes de entrenamiento y pide opinión sobre los tuyos." },
  { id: "tecnica",   name: "Técnica",           color: "var(--blue)",   desc: "Ejecución, movilidad y cómo evitar lesiones." },
  { id: "progreso",  name: "Progreso y marcas", color: "var(--yellow)", desc: "Marcas personales, estancamientos y tus estadísticas." },
  { id: "nutricion", name: "Nutrición",         color: "var(--green)",  desc: "Comida, suplementos y recuperación." },
  { id: "app",       name: "La app",            color: "var(--iron)",   desc: "Sugerencias, errores y novedades de la app." },
  { id: "general",   name: "General",           color: "var(--white)",  desc: "Todo lo demás sobre el gimnasio." },
];
const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));

/* ---------------- Estado ---------------- */

const S = {
  me: null, profile: null, ready: false, offline: false,
  threads: [], votes: { threads: new Set(), replies: new Set() },
  cat: "all", sort: "recent", q: "",
  open: null, thread: null, replies: [], editingReply: null, editingThread: null,
  chThreads: null, chReplies: null,
  att: { type: "none", name: "", items: [], pr: { ex: "", kg: "", reps: "" } },
};

/* ---------------- Utilidades ---------------- */

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

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
const uidOf = () => S.me?.id || null;
const canWrite = () => !!S.me;
const isMod = () => S.profile?.role === "moderator";
const who = (id, name) => (id && id === uidOf() ? "Tú" : (name || "Alguien"));

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2400);
}

// Cualquier fallo de la base de datos pasa por aquí para que el
// usuario vea algo útil en vez de un error en la consola.
async function safe(fn, ok) {
  try { await fn(); if (ok) toast(ok); return true; }
  catch (e) {
    console.error(e);
    const m = String(e?.message || "");
    toast(/row-level security|permission/i.test(m)
      ? "No tienes permiso para hacer esto."
      : /Failed to fetch|NetworkError/i.test(m)
        ? "Sin conexión con el servidor."
        : "No se pudo guardar. Inténtalo de nuevo.");
    return false;
  }
}

/* ---------------- Cabecera y sesión ---------------- */

function renderAuthBox() {
  const box = $("#authBox");
  if (!S.me) {
    box.innerHTML = `<button class="btn" data-act="gate">Entrar</button>`;
  } else {
    box.innerHTML = `<span class="who">Hola, <strong>${esc(S.profile?.username || "")}</strong>${isMod() ? " · moderador" : ""}</span>
      <button class="btn ghost" data-act="logout">Salir</button>`;
  }
  $("#newBtn").disabled = !canWrite();
}

let authMode = "login";
function renderGate(msg, bad) {
  $("#main").innerHTML = `
    <div class="gate">
      <h2>${authMode === "login" ? "Entra en Spotter" : "Crea tu cuenta"}</h2>
      <p class="lead">${authMode === "login"
        ? "Necesitas una cuenta para publicar y responder. Leer es libre."
        : "Elige un nombre: es el que verá el resto del foro."}</p>
      ${authMode === "signup" ? `<label class="f">Nombre<input type="text" id="aUser" maxlength="32" autocomplete="nickname" placeholder="laura_lifts"></label>` : ""}
      <label class="f">Correo<input type="email" id="aMail" autocomplete="email" placeholder="tu@correo.com"></label>
      <label class="f">Contraseña<input type="password" id="aPass" autocomplete="${authMode === "login" ? "current-password" : "new-password"}" placeholder="Mínimo 6 caracteres"></label>
      <div class="row">
        <button class="btn" data-act="back">Volver</button>
        <button class="btn primary" data-act="submit">${authMode === "login" ? "Entrar" : "Crear cuenta"}</button>
      </div>
      <div class="divider">o</div>
      <button class="btn" data-act="google" style="width:100%">Continuar con Google</button>
      ${msg ? `<p class="msg ${bad ? "bad" : "good"}">${esc(msg)}</p>` : ""}
      <p class="hint" style="margin-top:16px">${authMode === "login"
        ? `¿No tienes cuenta? <button class="switch" data-act="mode">Regístrate</button>`
        : `¿Ya tienes cuenta? <button class="switch" data-act="mode">Entra</button>`}</p>
    </div>`;
}

async function handleGate(act) {
  if (act === "mode") { authMode = authMode === "login" ? "signup" : "login"; renderGate(); return; }
  if (act === "back") { S.gate = false; render(); return; }
  if (act === "google") { await db.signInWithGoogle(); return; }
  const email = $("#aMail").value.trim(), pass = $("#aPass").value;
  if (!email || pass.length < 6) return renderGate("Revisa el correo y que la contraseña tenga al menos 6 caracteres.", true);
  if (authMode === "signup") {
    const name = $("#aUser").value.trim();
    if (name.length < 2) return renderGate("Escribe un nombre de al menos 2 caracteres.", true);
    const { error } = await db.signUp(email, pass, name);
    return renderGate(error ? error.message : "Cuenta creada. Mira tu correo y confirma el enlace.", !!error);
  }
  const { error } = await db.signIn(email, pass);
  if (error) renderGate("No hemos podido entrar. Revisa el correo y la contraseña.", true);
}

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
  if (S.sort === "unanswered") l = l.filter(t => t.replyCount === 0);
  if (S.sort === "mine") l = l.filter(t => t.author === uidOf());
  if (S.sort === "popular") l.sort((a, b) => b.voteCount - a.voteCount || b.lastActivity - a.lastActivity);
  else l.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.lastActivity - a.lastActivity);
  return l;
}

function attBadge(a) {
  if (!a) return "";
  if (a.type === "pr") return `<span class="chip">🏋️ ${esc(a.ex)} · ${num(a.kg)} kg × ${a.reps}</span>`;
  if (a.type === "routine") return `<span class="chip">📋 Rutina · ${a.items.length} ejercicios</span>`;
  return "";
}

function renderList() {
  const sorts = [["recent", "Recientes"], ["popular", "Populares"], ["unanswered", "Sin respuesta"], ["mine", "Míos"]];
  let body;
  if (S.offline) {
    body = `<div class="empty"><h3>Sin conexión con la base de datos</h3><p>Revisa las claves de <code>js/config.js</code> y que el proyecto de Supabase no esté en pausa.</p></div>`;
  } else if (!S.ready) {
    body = `<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>`;
  } else {
    const l = visibleThreads();
    body = l.length ? l.map(t => {
      const c = CAT[t.cat] || CAT.general;
      return `<article class="row${t.pinned ? " pinned" : ""}" data-open="${esc(t.id)}">
        <div class="score"><b>${t.voteCount}</b><span>votos</span></div>
        <div>
          <h3><a href="#t/${esc(t.id)}">${esc(t.title)}</a></h3>
          <p class="excerpt">${esc(t.body.slice(0, 240))}</p>
          <div class="meta">
            <span class="chip"><span class="plate sm" style="--c:${c.color}"></span>${esc(c.name)}</span>
            ${t.pinned ? '<span class="chip pin">📌 Fijado</span>' : ""}
            ${t.solved ? '<span class="chip solved">✓ Resuelto</span>' : ""}
            ${attBadge(t.att)}
            <span>${esc(who(t.author, t.authorName))}</span>
            <span>${t.replyCount ? "última actividad " + ago(t.lastActivity) : ago(t.createdAt)}</span>
          </div>
        </div>
        <div class="side-stat"><b>${t.replyCount}</b>${t.replyCount === 1 ? "respuesta" : "respuestas"}</div>
      </article>`;
    }).join("")
      : `<div class="empty">
          <h3>${S.q ? "Nada coincide con tu búsqueda" : S.sort === "mine" ? "Aún no has abierto ningún tema" : "Todavía no hay temas aquí"}</h3>
          <p>${S.q ? "Prueba con otras palabras o cambia de categoría." : "Abre el primero: una duda, tu rutina o tu última marca."}</p>
          ${S.q || !canWrite() ? "" : `<p><button class="btn primary" data-act="new">Nuevo tema</button></p>`}
        </div>`;
  }
  $("#main").innerHTML = `
    ${S.ready && !canWrite() && !S.offline ? '<div class="notice">Estás leyendo como invitado. <button class="switch" data-act="gate">Entra o crea una cuenta</button> para publicar, responder y votar.</div>' : ""}
    <div class="toolbar">
      <h2>${esc(S.cat === "all" ? "Todos los temas" : CAT[S.cat].name)}</h2>
      <div class="seg" role="group" aria-label="Ordenar">${sorts
        .filter(([v]) => v !== "mine" || canWrite())
        .map(([v, n]) => `<button data-sort="${v}" aria-pressed="${S.sort === v}">${n}</button>`).join("")}</div>
    </div>
    <div class="list">${body}</div>`;
}

/* ---------------- Vista de tema ---------------- */

function renderAtt(a) {
  if (!a) return "";
  if (a.type === "pr") {
    return `<div class="log"><div class="log-head"><strong>${esc(a.ex)}</strong><span>Marca personal</span></div>
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

const upIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';

function renderThread() {
  const t = S.thread;
  if (!t) {
    $("#main").innerHTML = `<button class="btn back" data-act="back">← Volver</button>
      <div class="list"><div class="empty"><h3>Este tema ya no existe</h3><p>Puede que su autor lo haya borrado.</p></div></div>`;
    return;
  }
  const c = CAT[t.cat] || CAT.general, isAuthor = t.author === uidOf();
  const replies = S.replies.slice().sort((a, b) =>
    (b.id === t.solved) - (a.id === t.solved) || a.createdAt - b.createdAt);
  const keep = $("#replyText")?.value || "";

  $("#main").innerHTML = `
    <button class="btn back" data-act="back">← Todos los temas</button>
    <article class="post">
      <div class="meta"><span class="chip"><span class="plate sm" style="--c:${c.color}"></span>${esc(c.name)}</span>
        ${t.pinned ? '<span class="chip pin">📌 Fijado</span>' : ""}${t.solved ? '<span class="chip solved">✓ Resuelto</span>' : ""}</div>
      <h1>${esc(t.title)}</h1>
      <div class="byline"><strong>${esc(who(t.author, t.authorName))}</strong><span>${ago(t.createdAt)}${t.edited ? " · editado" : ""}</span></div>
      <div class="content">${fmt(t.body)}</div>
      ${renderAtt(t.att)}
      <div class="actions">
        <button class="vote" data-act="vote-thread" aria-pressed="${S.votes.threads.has(t.id)}" ${canWrite() ? "" : "disabled"}>${upIcon}${t.voteCount}</button>
        ${isAuthor ? `<button class="btn ghost" data-act="edit-thread">Editar</button>` : ""}
        ${isAuthor || isMod() ? `<button class="btn ghost danger" data-act="del-thread">Borrar tema</button>` : ""}
        ${isMod() ? `<button class="btn ghost" data-act="pin">${t.pinned ? "Quitar de fijados" : "Fijar arriba"}</button>` : ""}
      </div>
    </article>
    <h2 class="replies-head">${replies.length} ${replies.length === 1 ? "respuesta" : "respuestas"}</h2>
    <div id="replies">${replies.map(r => renderReply(r, t, isAuthor)).join("")}</div>
    ${canWrite() ? `<div class="composer-inline">
        <label class="sr" for="replyText">Tu respuesta</label>
        <textarea id="replyText" maxlength="6000" placeholder="Escribe tu respuesta…"></textarea>
        <div class="form-foot"><span class="hint">Sé concreto: series, repeticiones y cargas ayudan mucho.</span>
          <button class="btn primary" data-act="send-reply">Responder</button></div>
      </div>`
      : `<p class="hint" style="margin-top:16px"><button class="switch" data-act="gate">Entra</button> para responder.</p>`}`;

  if (keep) $("#replyText").value = keep;
}

function renderReply(r, t, isAuthor) {
  const acc = r.id === t.solved, own = r.author === uidOf();
  if (S.editingReply === r.id) {
    return `<div class="reply"><textarea id="editReplyText">${esc(r.body)}</textarea>
      <div class="form-foot"><span></span><div style="display:flex;gap:8px">
        <button class="btn" data-act="cancel-edit">Cancelar</button>
        <button class="btn primary" data-act="save-reply" data-id="${esc(r.id)}">Guardar cambios</button>
      </div></div></div>`;
  }
  return `<div class="reply${acc ? " accepted" : ""}">
    <div class="byline"><strong>${esc(who(r.author, r.authorName))}</strong><span>${ago(r.createdAt)}${r.edited ? " · editado" : ""}</span>
      ${acc ? '<span class="accepted-tag">✓ Solución</span>' : ""}</div>
    <div class="content">${fmt(r.body)}</div>
    <div class="actions">
      <button class="vote" data-act="vote-reply" data-id="${esc(r.id)}" aria-pressed="${S.votes.replies.has(r.id)}" ${canWrite() ? "" : "disabled"}>${upIcon}${r.voteCount}</button>
      ${isAuthor ? `<button class="btn ghost" data-act="accept" data-id="${esc(r.id)}">${acc ? "Quitar solución" : "Marcar como solución"}</button>` : ""}
      ${own ? `<button class="btn ghost" data-act="edit-reply" data-id="${esc(r.id)}">Editar</button>
               <button class="btn ghost danger" data-act="del-reply" data-id="${esc(r.id)}">Borrar</button>` : ""}
    </div></div>`;
}

/* ---------------- Navegación ---------------- */

function render() {
  if (S.gate) return renderGate();
  renderAuthBox();
  S.open ? renderThread() : renderList();
}

async function openThread(id) {
  S.open = id; S.editingReply = null; S.replies = []; S.thread = null;
  if (location.hash !== "#t/" + id) history.pushState(null, "", "#t/" + id);
  render(); window.scrollTo(0, 0);
  try {
    S.thread = await db.getThread(id);
    S.replies = S.thread ? await db.listReplies(id) : [];
  } catch (e) { console.error(e); }
  db.unwatch(S.chReplies);
  S.chReplies = db.watchReplies(id, () => refreshThread(id));
  render();
}

async function refreshThread(id) {
  if (S.open !== id) return;
  try {
    S.thread = await db.getThread(id);
    S.replies = S.thread ? await db.listReplies(id) : [];
    if (uidOf()) S.votes = await db.myVotes(uidOf());
  } catch (e) { console.error(e); return; }
  if (!S.editingReply) render();
}

function closeThread() {
  db.unwatch(S.chReplies); S.chReplies = null;
  S.open = null; S.thread = null; S.replies = [];
  if (location.hash.startsWith("#t/")) history.pushState(null, "", location.pathname + location.search);
}

async function refreshList() {
  try {
    S.threads = await db.listThreads();
    if (uidOf()) S.votes = await db.myVotes(uidOf());
    S.ready = true; S.offline = false;
  } catch (e) { console.error(e); S.offline = true; }
  renderCats();
  if (!S.open) render();
}

/* ---------------- Eventos ---------------- */

$("#cats").addEventListener("click", e => {
  const b = e.target.closest("[data-cat]"); if (!b) return;
  S.cat = b.dataset.cat; S.gate = false; closeThread(); renderCats(); render();
});

$("#q").addEventListener("input", e => {
  clearTimeout($("#q")._t);
  $("#q")._t = setTimeout(() => { S.q = e.target.value.trim(); S.gate = false; closeThread(); render(); }, 150);
});

$("#newBtn").addEventListener("click", () => openComposer());
$("#authBox").addEventListener("click", async e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  if (b.dataset.act === "gate") { S.gate = true; authMode = "login"; render(); }
  if (b.dataset.act === "logout") { await db.signOut(); toast("Sesión cerrada"); }
});

document.addEventListener("keydown", e => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && e.target.id === "replyText")
    document.querySelector('[data-act="send-reply"]')?.click();
});

$("#main").addEventListener("click", async e => {
  const el = e.target.closest("[data-act],[data-sort],[data-open],a"); if (!el) return;
  const act = el.dataset.act, id = el.dataset.id, t = S.thread;

  if (S.gate && act) { e.preventDefault(); return handleGate(act); }
  if (act === "gate") { S.gate = true; authMode = "login"; return render(); }
  if (el.dataset.sort) { S.sort = el.dataset.sort; return render(); }
  if (act === "new") return openComposer();
  if (act === "back") { closeThread(); return render(); }

  const row = el.closest("[data-open]");
  if (row && !act) { e.preventDefault(); return openThread(row.dataset.open); }
  if (!t) return;

  if (act === "vote-thread") {
    const on = !S.votes.threads.has(t.id);
    on ? S.votes.threads.add(t.id) : S.votes.threads.delete(t.id);
    t.voteCount += on ? 1 : -1; render();
    return safe(() => db.toggleVote({ userId: uidOf(), threadId: t.id, on }));
  }
  if (act === "vote-reply") {
    const r = S.replies.find(x => x.id === id); if (!r) return;
    const on = !S.votes.replies.has(id);
    on ? S.votes.replies.add(id) : S.votes.replies.delete(id);
    r.voteCount += on ? 1 : -1; render();
    return safe(() => db.toggleVote({ userId: uidOf(), replyId: id, on }));
  }
  if (act === "pin") return safe(() => db.setPinned(t.id, !t.pinned), t.pinned ? "Tema desfijado" : "Tema fijado");
  if (act === "accept") return safe(() => db.setSolved(t.id, t.solved === id ? null : id),
    t.solved === id ? "Solución quitada" : "Marcada como solución");
  if (act === "edit-thread") return openComposer(t);
  if (act === "del-thread") {
    if (!confirm("¿Borrar este tema y todas sus respuestas? No se puede deshacer.")) return;
    const ok = await safe(() => db.deleteThread(t.id), "Tema borrado");
    if (ok) { closeThread(); refreshList(); render(); }
    return;
  }
  if (act === "send-reply") {
    const ta = $("#replyText"), body = ta.value.trim();
    if (!body) return ta.focus();
    el.disabled = true;
    const ok = await safe(() => db.createReply({ threadId: t.id, body, authorId: uidOf() }), "Respuesta publicada");
    if (ok) ta.value = "";
    el.disabled = false;
    return refreshThread(t.id);
  }
  if (act === "edit-reply") { S.editingReply = id; render(); $("#editReplyText")?.focus(); return; }
  if (act === "cancel-edit") { S.editingReply = null; return render(); }
  if (act === "save-reply") {
    const body = $("#editReplyText").value.trim(); if (!body) return;
    S.editingReply = null;
    await safe(() => db.updateReply(id, body), "Cambios guardados");
    return refreshThread(t.id);
  }
  if (act === "del-reply") {
    if (!confirm("¿Borrar esta respuesta?")) return;
    await safe(() => db.deleteReply(id), "Respuesta borrada");
    return refreshThread(t.id);
  }
});

window.addEventListener("popstate", () => {
  const m = location.hash.match(/^#t\/(.+)$/);
  if (m) openThread(m[1]); else if (S.open) { closeThread(); render(); }
});

/* ---------------- Formulario de tema ---------------- */

$("#fCats").innerHTML = CATS.map(c =>
  `<input type="radio" name="cat" id="fc-${c.id}" value="${c.id}">
   <label for="fc-${c.id}"><span class="plate md" style="--c:${c.color}"></span>${c.name}</label>`).join("");

function setAttType(v) {
  S.att.type = v;
  $("#fAttType").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === v));
  if (v === "routine" && !S.att.items.length) S.att.items = [{ ex: "", sets: 3, reps: 10, kg: "" }];
  renderAttForm();
}

function renderAttForm() {
  const box = $("#fAtt");
  if (S.att.type === "routine") {
    box.innerHTML = `<label class="f">Nombre de la rutina<input type="text" id="rName" maxlength="80" placeholder="Ej.: Empuje A" value="${esc(S.att.name || "")}"></label>
      <div class="att-labels"><span>Ejercicio</span><span>Series</span><span>Reps</span><span>Kg</span><span></span></div>
      <div class="att-rows">${S.att.items.map((i, k) => `<div class="att-row" data-k="${k}">
        <input type="text" aria-label="Ejercicio" data-f="ex" value="${esc(i.ex)}" placeholder="Press banca" maxlength="60">
        <input type="number" aria-label="Series" data-f="sets" min="1" max="20" value="${esc(i.sets)}">
        <input type="number" aria-label="Repeticiones" data-f="reps" min="1" max="100" value="${esc(i.reps)}">
        <input type="number" aria-label="Kilos" data-f="kg" min="0" step="0.5" value="${esc(i.kg)}">
        <button type="button" class="btn ghost" data-rm="${k}" aria-label="Quitar ejercicio">✕</button></div>`).join("")}</div>
      <div><button type="button" class="btn" id="addEx" ${S.att.items.length >= 20 ? "disabled" : ""}>Añadir ejercicio</button></div>`;
  } else if (S.att.type === "pr") {
    const p = S.att.pr;
    box.innerHTML = `<div class="pr-grid">
      <label class="f">Ejercicio<input type="text" data-p="ex" value="${esc(p.ex)}" placeholder="Sentadilla" maxlength="60"></label>
      <label class="f">Kg<input type="number" data-p="kg" min="0" step="0.5" value="${esc(p.kg)}"></label>
      <label class="f">Reps<input type="number" data-p="reps" min="1" max="30" value="${esc(p.reps)}"></label></div>
      <p class="live" id="prLive"></p>`;
    updatePrLive();
  } else box.innerHTML = "";
}

function updatePrLive() {
  const p = S.att.pr, l = $("#prLive"); if (!l) return;
  l.innerHTML = (+p.kg > 0 && +p.reps > 0)
    ? `1RM estimado: <b>${num(e1rm(+p.kg, +p.reps))} kg</b>`
    : "Indica kilos y repeticiones para calcular tu 1RM estimado.";
}

$("#fAttType").addEventListener("click", e => {
  const b = e.target.closest("button"); if (b) setAttType(b.dataset.v);
});

$("#fAtt").addEventListener("input", e => {
  const row = e.target.closest(".att-row");
  if (row) S.att.items[+row.dataset.k][e.target.dataset.f] = e.target.value;
  if (e.target.id === "rName") S.att.name = e.target.value;
  if (e.target.dataset.p) { S.att.pr[e.target.dataset.p] = e.target.value; updatePrLive(); }
});

$("#fAtt").addEventListener("click", e => {
  if (e.target.id === "addEx") {
    S.att.items.push({ ex: "", sets: 3, reps: 10, kg: "" });
    renderAttForm(); $("#fAtt .att-row:last-child input")?.focus();
  }
  const rm = e.target.closest("[data-rm]");
  if (rm) {
    S.att.items.splice(+rm.dataset.rm, 1);
    S.att.items.length ? renderAttForm() : setAttType("none");
  }
});

function openComposer(t) {
  if (!canWrite()) { S.gate = true; authMode = "login"; return render(); }
  S.editingThread = t || null;
  $("#dlgTitle").textContent = t ? "Editar tema" : "Nuevo tema";
  $("#fSubmit").textContent = t ? "Guardar cambios" : "Publicar tema";
  $("#fTitle").value = t ? t.title : "";
  $("#fBody").value = t ? t.body : "";
  $("#fErr").textContent = "";
  $("#fc-" + (t ? t.cat : (S.cat !== "all" ? S.cat : "general"))).checked = true;
  const a = t && t.att;
  S.att = {
    type: a ? a.type : "none",
    name: a?.type === "routine" ? a.name : "",
    items: a?.type === "routine" ? a.items.map(i => ({ ...i })) : [],
    pr: a?.type === "pr" ? { ex: a.ex, kg: a.kg, reps: a.reps } : { ex: "", kg: "", reps: "" },
  };
  setAttType(S.att.type);
  $("#dlg").showModal(); $("#fTitle").focus();
}

$("#threadForm").addEventListener("submit", async e => {
  if (e.submitter?.value === "cancel") return;
  e.preventDefault();
  const title = $("#fTitle").value.trim(), body = $("#fBody").value.trim();
  const category = document.querySelector("input[name=cat]:checked")?.value;
  const err = m => { $("#fErr").textContent = m; };
  if (title.length < 5) return err("El título necesita al menos 5 caracteres.");
  if (!body) return err("Escribe un mensaje.");

  let attachment = null;
  if (S.att.type === "routine") {
    const items = S.att.items.filter(i => i.ex.trim()).map(i => ({
      ex: i.ex.trim(), sets: Math.max(1, +i.sets || 1),
      reps: Math.max(1, +i.reps || 1), kg: Math.max(0, +i.kg || 0),
    }));
    if (!items.length) return err("Añade al menos un ejercicio a la rutina o quita el adjunto.");
    attachment = { type: "routine", name: S.att.name.trim(), items };
  } else if (S.att.type === "pr") {
    const p = S.att.pr;
    if (!p.ex.trim() || !(+p.kg > 0) || !(+p.reps > 0)) return err("Completa ejercicio, kilos y repeticiones de tu marca.");
    attachment = { type: "pr", ex: p.ex.trim(), kg: +p.kg, reps: Math.round(+p.reps) };
  }

  const btn = $("#fSubmit"); btn.disabled = true;
  const editing = S.editingThread;
  if (editing) {
    const ok = await safe(() => db.updateThread(editing.id, { title, body, category, attachment }), "Cambios guardados");
    if (ok) { $("#dlg").close(); await refreshThread(editing.id); await refreshList(); }
  } else {
    let newId = null;
    const ok = await safe(async () => {
      newId = await db.createThread({ title, body, category, attachment, authorId: uidOf() });
    }, "Tema publicado");
    if (ok) { $("#dlg").close(); await refreshList(); openThread(newId); }
  }
  btn.disabled = false;
});

/* ---------------- Arranque ---------------- */

renderCats(); render();

if (!db.configured) {
  S.offline = true;
  render();
  console.warn("Falta configurar js/config.js con la URL y la clave anon de Supabase.");
} else {
  db.onAuthChange(async session => {
    S.me = session?.user || null;
    S.profile = null;
    if (S.me) {
      const { data } = await db.getProfile(S.me.id);
      S.profile = data;
      S.votes = await db.myVotes(S.me.id).catch(() => S.votes);
    } else {
      S.votes = { threads: new Set(), replies: new Set() };
    }
    S.gate = false;
    renderAuthBox();
    render();
  });

  (async () => {
    const session = await db.getSession();
    S.me = session?.user || null;
    if (S.me) {
      const { data } = await db.getProfile(S.me.id);
      S.profile = data;
    }
    await refreshList();
    S.chThreads = db.watchThreads(() => refreshList());
    const m = location.hash.match(/^#t\/(.+)$/);
    if (m) openThread(m[1]); else render();
  })();
}
