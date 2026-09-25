-- ============================================================
--  Spotter · esquema de la base de datos
--  Pégalo entero en Supabase → SQL Editor → Run
--  Es idempotente: puedes volver a ejecutarlo sin romper nada.
-- ============================================================

-- ------------------------------------------------------------
-- 1. PERFILES
--    auth.users es una tabla interna de Supabase que no se puede
--    consultar desde el navegador. Guardamos aquí el nombre
--    público de cada persona.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null check (char_length(username) between 2 and 32),
  role       text not null default 'member' check (role in ('member','moderator')),
  created_at timestamptz not null default now()
);

-- Cuando alguien se registra, se crea su perfil automáticamente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'username'), ''),
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 2. TEMAS
-- ------------------------------------------------------------
create table if not exists public.threads (
  id              uuid primary key default gen_random_uuid(),
  title           text not null check (char_length(title) between 5 and 140),
  body            text not null check (char_length(body) between 1 and 8000),
  category        text not null check (category in
                    ('rutinas','tecnica','progreso','nutricion','app','general')),
  attachment      jsonb,
  author_id       uuid not null references public.profiles(id) on delete cascade,
  pinned          boolean not null default false,
  solved_reply_id uuid,
  created_at      timestamptz not null default now(),
  edited_at       timestamptz,
  last_activity   timestamptz not null default now()
);

create index if not exists threads_activity_idx on public.threads (last_activity desc);
create index if not exists threads_category_idx on public.threads (category);

-- ------------------------------------------------------------
-- 3. RESPUESTAS
-- ------------------------------------------------------------
create table if not exists public.replies (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.threads(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 6000),
  created_at timestamptz not null default now(),
  edited_at  timestamptz
);

create index if not exists replies_thread_idx on public.replies (thread_id, created_at);

-- La solución de un tema apunta a una respuesta suya.
alter table public.threads drop constraint if exists threads_solved_fk;
alter table public.threads
  add constraint threads_solved_fk
  foreign key (solved_reply_id) references public.replies(id) on delete set null;

-- Al responder, el tema sube a lo más reciente.
create or replace function public.bump_thread()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.threads set last_activity = now() where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists on_reply_created on public.replies;
create trigger on_reply_created
  after insert on public.replies
  for each row execute function public.bump_thread();

-- ------------------------------------------------------------
-- 4. VOTOS
--    Cada fila es un voto. Un voto va a un tema o a una
--    respuesta, nunca a los dos, y solo uno por persona.
-- ------------------------------------------------------------
create table if not exists public.votes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  thread_id  uuid references public.threads(id) on delete cascade,
  reply_id   uuid references public.replies(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint votes_one_target check (num_nonnulls(thread_id, reply_id) = 1)
);

create unique index if not exists votes_thread_uq
  on public.votes (user_id, thread_id) where thread_id is not null;
create unique index if not exists votes_reply_uq
  on public.votes (user_id, reply_id) where reply_id is not null;

-- ------------------------------------------------------------
-- 5. SEGURIDAD A NIVEL DE FILA (RLS)
--    Sin esto, cualquiera con la clave pública podría borrar
--    toda la base de datos. Es la pieza que protege los datos.
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.threads  enable row level security;
alter table public.replies  enable row level security;
alter table public.votes    enable row level security;

-- ¿Quien llama es moderador?
create or replace function public.is_moderator()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'moderator'
  );
$$;

-- Perfiles: los lee todo el mundo, cada quien edita el suyo.
drop policy if exists "perfiles visibles"      on public.profiles;
drop policy if exists "editar mi perfil"       on public.profiles;
create policy "perfiles visibles" on public.profiles for select using (true);
create policy "editar mi perfil"  on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id and role = 'member');

-- Temas: lectura pública, escritura solo del autor.
drop policy if exists "temas visibles"   on public.threads;
drop policy if exists "crear tema"       on public.threads;
drop policy if exists "editar mi tema"   on public.threads;
drop policy if exists "borrar mi tema"   on public.threads;
create policy "temas visibles" on public.threads for select using (true);
create policy "crear tema"     on public.threads for insert
  with check (auth.uid() = author_id and pinned = false);
create policy "editar mi tema" on public.threads for update
  using (auth.uid() = author_id or public.is_moderator())
  with check (auth.uid() = author_id or public.is_moderator());
create policy "borrar mi tema" on public.threads for delete
  using (auth.uid() = author_id or public.is_moderator());

-- Respuestas: igual.
drop policy if exists "respuestas visibles"  on public.replies;
drop policy if exists "crear respuesta"      on public.replies;
drop policy if exists "editar mi respuesta"  on public.replies;
drop policy if exists "borrar mi respuesta"  on public.replies;
create policy "respuestas visibles" on public.replies for select using (true);
create policy "crear respuesta"     on public.replies for insert
  with check (auth.uid() = author_id);
create policy "editar mi respuesta" on public.replies for update
  using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "borrar mi respuesta" on public.replies for delete
  using (auth.uid() = author_id or public.is_moderator());

-- Votos: se cuentan en público, cada quien pone y quita el suyo.
drop policy if exists "votos visibles" on public.votes;
drop policy if exists "votar"          on public.votes;
drop policy if exists "desvotar"       on public.votes;
create policy "votos visibles" on public.votes for select using (true);
create policy "votar"          on public.votes for insert with check (auth.uid() = user_id);
create policy "desvotar"       on public.votes for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 6. TIEMPO REAL
--    Para que las respuestas aparezcan sin recargar la página.
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.threads;
alter publication supabase_realtime add table public.replies;
alter publication supabase_realtime add table public.votes;

-- ------------------------------------------------------------
-- 7. HACERTE MODERADOR (opcional)
--    Regístrate primero en la web y luego ejecuta esto con tu
--    correo para poder fijar temas.
-- ------------------------------------------------------------
-- update public.profiles set role = 'moderator'
-- where id = (select id from auth.users where email = 'tu@correo.com');
