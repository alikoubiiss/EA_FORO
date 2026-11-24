-- ============================================================
--  Spotter · esquema de la base de datos (foro de SOLO LECTURA)
--  Pégalo entero en Supabase → SQL Editor → Run.
--  Es idempotente y NO borra temas ni respuestas: si ya tenías la
--  versión anterior (con cuentas y votos), la convierte.
--
--  Modelo de seguridad: el público (clave anon) solo puede LEER.
--  No hay ninguna política de INSERT/UPDATE/DELETE, así que nadie
--  puede escribir desde el navegador. Quien tiene acceso a la
--  base (SQL Editor, panel de Supabase, MCP) escribe sin problema
--  porque salta RLS.
-- ============================================================

-- 1. Limpieza de la versión anterior --------------------------------
drop table if exists public.votes cascade;

do $$
declare p record;
begin
  for p in select policyname, tablename from pg_policies
           where schemaname = 'public' and tablename in ('profiles','threads','replies')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

drop function if exists public.is_moderator();
drop trigger  if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2. Autores -------------------------------------------------------
--    Ya no cuelgan de auth.users: son solo un nombre público que
--    elige quien administra el foro.
create table if not exists public.profiles (
  id         uuid primary key default gen_random_uuid(),
  username   text not null check (char_length(username) between 2 and 32),
  created_at timestamptz not null default now()
);
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles alter column id set default gen_random_uuid();
alter table public.profiles drop column if exists role;

-- 3. Temas ---------------------------------------------------------
create table if not exists public.threads (
  id              uuid primary key default gen_random_uuid(),
  title           text not null check (char_length(title) between 5 and 140),
  body            text not null check (char_length(body) between 1 and 8000),
  category        text not null check (category in
                    ('rutinas','tecnica','progreso','nutricion','app','general')),
  attachment      jsonb,
  author_id       uuid not null references public.profiles(id) on delete cascade,
  pinned          boolean not null default false,
  score           integer not null default 0 check (score >= 0),
  solved_reply_id uuid,
  created_at      timestamptz not null default now(),
  edited_at       timestamptz,
  last_activity   timestamptz not null default now()
);
alter table public.threads add column if not exists score integer not null default 0 check (score >= 0);

create index if not exists threads_activity_idx on public.threads (last_activity desc);
create index if not exists threads_category_idx on public.threads (category);

-- 4. Respuestas ----------------------------------------------------
create table if not exists public.replies (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.threads(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 6000),
  score      integer not null default 0 check (score >= 0),
  created_at timestamptz not null default now(),
  edited_at  timestamptz
);
alter table public.replies add column if not exists score integer not null default 0 check (score >= 0);

create index if not exists replies_thread_idx on public.replies (thread_id, created_at);

alter table public.threads drop constraint if exists threads_solved_fk;
alter table public.threads
  add constraint threads_solved_fk
  foreign key (solved_reply_id) references public.replies(id) on delete set null;

-- Al añadir una respuesta, el tema sube a lo más reciente (según la
-- fecha de la respuesta, así los datos de ejemplo conservan su fecha).
create or replace function public.bump_thread()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.threads
     set last_activity = greatest(last_activity, new.created_at)
   where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists on_reply_created on public.replies;
create trigger on_reply_created
  after insert on public.replies
  for each row execute function public.bump_thread();

-- 5. Seguridad: lectura pública, escritura solo para el administrador
alter table public.profiles enable row level security;
alter table public.threads  enable row level security;
alter table public.replies  enable row level security;

create policy "perfiles visibles"   on public.profiles for select using (true);
create policy "temas visibles"      on public.threads  for select using (true);
create policy "respuestas visibles" on public.replies  for select using (true);

-- Cinturón y tirantes: aunque alguien añadiera una política por error,
-- estos roles no tienen permiso de escritura sobre las tablas.
revoke insert, update, delete, truncate on public.profiles, public.threads, public.replies from anon, authenticated;
grant  select on public.profiles, public.threads, public.replies to anon, authenticated;

-- 6. Tiempo real: las pestañas abiertas reciben los cambios -----------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'threads') then
    alter publication supabase_realtime add table public.threads;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'replies') then
    alter publication supabase_realtime add table public.replies;
  end if;
end $$;
