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

// El "select" anidado pide, en una sola consulta, el tema y el nombre
// de su autor (PostgREST + claves foráneas).
const THREAD_FIELDS = `
  id, title, body, category, attachment, pinned, score,
  created_at,
  author:profiles!threads_author_id_fkey ( username )
`;

export async function listThreads() {
  const { data, error } = await supabase
    .from("threads").select(THREAD_FIELDS)
    .order("created_at", { ascending: false })
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

/* ---------------- Tiempo real ---------------- */

// Si añades o cambias contenido en Supabase, las pestañas abiertas
// lo reciben sin recargar.
export function watchThreads(onChange) {
  return supabase.channel("threads-feed")
    .on("postgres_changes", { event: "*", schema: "public", table: "threads" }, onChange)
    .subscribe();
}

/* ---------------- Utilidades internas ---------------- */

function normalizeThread(r) {
  return {
    id: r.id, title: r.title, body: r.body, cat: r.category, att: r.attachment,
    authorName: r.author?.username || "",
    pinned: r.pinned, score: r.score ?? 0,
    createdAt: new Date(r.created_at).getTime(),
  };
}
