// ============================================================
//  Capa de datos: todo lo que habla con Supabase vive aquí.
//  app.js no sabe que existe Supabase; solo llama a estas
//  funciones. Así, si algún día cambiáis de base de datos,
//  solo hay que reescribir este archivo.
// ============================================================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const configured =
  !SUPABASE_URL.includes("TU-PROYECTO") && !SUPABASE_ANON_KEY.includes("PEGA-AQUI");

/* ---------------- Sesión ---------------- */

export const getSession = () => supabase.auth.getSession().then(r => r.data.session);
export const onAuthChange = fn => supabase.auth.onAuthStateChange((_e, s) => fn(s));

export const signUp = (email, password, username) =>
  supabase.auth.signUp({
    email,
    password,
    options: { data: { username }, emailRedirectTo: window.location.origin },
  });

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password });

export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });

export const signOut = () => supabase.auth.signOut();

export const getProfile = id =>
  supabase.from("profiles").select("id, username, role").eq("id", id).single();

/* ---------------- Temas ---------------- */

// El "select" anidado pide, en una sola consulta, el tema, el nombre
// de su autor y cuántas respuestas y votos tiene. Eso es PostgREST
// aprovechando las claves foráneas del esquema.
const THREAD_FIELDS = `
  id, title, body, category, attachment, author_id, pinned,
  solved_reply_id, created_at, edited_at, last_activity,
  author:profiles!threads_author_id_fkey ( username ),
  replies ( count ),
  votes ( count )
`;

export async function listThreads() {
  const { data, error } = await supabase
    .from("threads")
    .select(THREAD_FIELDS)
    .order("last_activity", { ascending: false })
    .limit(400);
  if (error) throw error;
  return data.map(normalizeThread);
}

export async function getThread(id) {
  const { data, error } = await supabase
    .from("threads").select(THREAD_FIELDS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? normalizeThread(data) : null;
}

export async function createThread({ title, body, category, attachment, authorId }) {
  const { data, error } = await supabase
    .from("threads")
    .insert({ title, body, category, attachment, author_id: authorId })
    .select("id").single();
  if (error) throw error;
  return data.id;
}

export async function updateThread(id, patch) {
  const { error } = await supabase
    .from("threads").update({ ...patch, edited_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function setPinned(id, pinned) {
  const { error } = await supabase.from("threads").update({ pinned }).eq("id", id);
  if (error) throw error;
}

export async function setSolved(id, replyId) {
  const { error } = await supabase
    .from("threads").update({ solved_reply_id: replyId }).eq("id", id);
  if (error) throw error;
}

// Las respuestas y los votos caen solos: el esquema los borra en
// cascada al borrar el tema.
export async function deleteThread(id) {
  const { error } = await supabase.from("threads").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- Respuestas ---------------- */

const REPLY_FIELDS = `
  id, thread_id, author_id, body, created_at, edited_at,
  author:profiles!replies_author_id_fkey ( username ),
  votes ( count )
`;

export async function listReplies(threadId) {
  const { data, error } = await supabase
    .from("replies").select(REPLY_FIELDS)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map(normalizeReply);
}

export async function createReply({ threadId, body, authorId }) {
  const { error } = await supabase
    .from("replies").insert({ thread_id: threadId, body, author_id: authorId });
  if (error) throw error;
}

export async function updateReply(id, body) {
  const { error } = await supabase
    .from("replies").update({ body, edited_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteReply(id) {
  const { error } = await supabase.from("replies").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- Votos ---------------- */

// Qué ha votado la persona que mira la página, para pintar los
// botones pulsados.
export async function myVotes(userId) {
  if (!userId) return { threads: new Set(), replies: new Set() };
  const { data, error } = await supabase
    .from("votes").select("thread_id, reply_id").eq("user_id", userId);
  if (error) throw error;
  return {
    threads: new Set(data.filter(v => v.thread_id).map(v => v.thread_id)),
    replies: new Set(data.filter(v => v.reply_id).map(v => v.reply_id)),
  };
}

export async function toggleVote({ userId, threadId = null, replyId = null, on }) {
  if (on) {
    const { error } = await supabase
      .from("votes").insert({ user_id: userId, thread_id: threadId, reply_id: replyId });
    if (error && error.code !== "23505") throw error; // 23505 = ya había votado
  } else {
    let q = supabase.from("votes").delete().eq("user_id", userId);
    q = threadId ? q.eq("thread_id", threadId) : q.eq("reply_id", replyId);
    const { error } = await q;
    if (error) throw error;
  }
}

/* ---------------- Tiempo real ---------------- */

// Un canal escucha los cambios de la base de datos y avisa a la
// interfaz. Cada pestaña abierta recibe el aviso a la vez.
export function watchThreads(onChange) {
  return supabase.channel("threads-feed")
    .on("postgres_changes", { event: "*", schema: "public", table: "threads" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, onChange)
    .subscribe();
}

export function watchReplies(threadId, onChange) {
  return supabase.channel("thread-" + threadId)
    .on("postgres_changes",
        { event: "*", schema: "public", table: "replies", filter: `thread_id=eq.${threadId}` },
        onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, onChange)
    .subscribe();
}

export const unwatch = channel => channel && supabase.removeChannel(channel);

/* ---------------- Utilidades internas ---------------- */

const count = rel => (Array.isArray(rel) ? rel[0]?.count ?? 0 : 0);

function normalizeThread(r) {
  return {
    id: r.id, title: r.title, body: r.body, cat: r.category, att: r.attachment,
    author: r.author_id, authorName: r.author?.username || "",
    pinned: r.pinned, solved: r.solved_reply_id,
    createdAt: new Date(r.created_at).getTime(),
    edited: r.edited_at ? new Date(r.edited_at).getTime() : null,
    lastActivity: new Date(r.last_activity).getTime(),
    replyCount: count(r.replies), voteCount: count(r.votes),
  };
}

function normalizeReply(r) {
  return {
    id: r.id, threadId: r.thread_id,
    author: r.author_id, authorName: r.author?.username || "",
    body: r.body,
    createdAt: new Date(r.created_at).getTime(),
    edited: r.edited_at ? new Date(r.edited_at).getTime() : null,
    voteCount: count(r.votes),
  };
}
