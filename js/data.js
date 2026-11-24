// ============================================================
//  Capa de datos (solo lectura): todo lo que habla con Supabase
//  vive aquí. El navegador solo puede LEER; la base de datos no
//  tiene ninguna política de escritura para el público. El
//  contenido se gestiona desde Supabase (SQL Editor o panel).
// ============================================================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

export const configured =
  !SUPABASE_URL.includes("TU-PROYECTO") && !SUPABASE_ANON_KEY.includes("PEGA-AQUI");

/* ---------------- Temas ---------------- */

// El "select" anidado pide, en una sola consulta, el tema, el nombre
// de su autor y cuántas respuestas tiene (PostgREST + claves foráneas).
const THREAD_FIELDS = `
  id, title, body, category, attachment, pinned, score,
  solved_reply_id, created_at, last_activity,
  author:profiles!threads_author_id_fkey ( username ),
  replies!replies_thread_id_fkey ( count )
`;

export async function listThreads() {
  const { data, error } = await supabase
    .from("threads").select(THREAD_FIELDS)
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

/* ---------------- Respuestas ---------------- */

const REPLY_FIELDS = `
  id, thread_id, body, score, created_at,
  author:profiles!replies_author_id_fkey ( username )
`;

export async function listReplies(threadId) {
  const { data, error } = await supabase
    .from("replies").select(REPLY_FIELDS)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map(normalizeReply);
}

/* ---------------- Tiempo real ---------------- */

// Si añades o cambias contenido en Supabase, las pestañas abiertas
// lo reciben sin recargar.
export function watchThreads(onChange) {
  return supabase.channel("threads-feed")
    .on("postgres_changes", { event: "*", schema: "public", table: "threads" }, onChange)
    .subscribe();
}

export function watchReplies(threadId, onChange) {
  return supabase.channel("thread-" + threadId)
    .on("postgres_changes",
        { event: "*", schema: "public", table: "replies", filter: `thread_id=eq.${threadId}` },
        onChange)
    .subscribe();
}

export const unwatch = channel => channel && supabase.removeChannel(channel);

/* ---------------- Utilidades internas ---------------- */

const count = rel => (Array.isArray(rel) ? rel[0]?.count ?? 0 : 0);

function normalizeThread(r) {
  return {
    id: r.id, title: r.title, body: r.body, cat: r.category, att: r.attachment,
    authorName: r.author?.username || "",
    pinned: r.pinned, solved: r.solved_reply_id, score: r.score ?? 0,
    createdAt: new Date(r.created_at).getTime(),
    lastActivity: new Date(r.last_activity).getTime(),
    replyCount: count(r.replies),
  };
}

function normalizeReply(r) {
  return {
    id: r.id, threadId: r.thread_id,
    authorName: r.author?.username || "",
    body: r.body, score: r.score ?? 0,
    createdAt: new Date(r.created_at).getTime(),
  };
}
