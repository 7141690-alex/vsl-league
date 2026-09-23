-- Продолжение rls-hardening.sql.
--
-- В первой миграции право записи во все содержательные таблицы свели к
-- is_admin() = «email есть в admin_users». Но политики самой admin_users
-- остались нетронутыми. Если там уцелела политика вида
-- `for all to authenticated using (true)`, то цепочка обхода такая:
--   регистрация -> insert в admin_users со своим email -> is_admin() = true
--   -> полный доступ на запись ко всем таблицам.
-- То есть вся первая миграция обходится одним insert.
--
-- Здесь admin_users закрывается, и отдельно ограничивается анонимная
-- запись в site_visit_events, которой сейчас можно раздуть базу.

begin;

-- ─── 1. Кто такой суперадмин ────────────────────────────────────────────────
-- Управлять составом админов может только суперадмин, а не любой админ:
-- иначе суб-админ с доступом к одной вкладке повышает себя до полного.

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.admin_users
    where email = auth.email() and is_super_admin
  )
$$;

-- ─── 2. admin_users ─────────────────────────────────────────────────────────
-- Сносим ВСЕ существующие политики по списку из pg_policies, а не по именам:
-- имена уцелевших политик неизвестны, а именно они и есть дыра.

do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'admin_users'
  loop
    execute format('drop policy %I on public.admin_users', pol.policyname);
  end loop;
end $$;

alter table public.admin_users enable row level security;

-- Читать: свою запись (нужно для входа в панель) или все — если суперадмин.
create policy "Read own or super admin" on public.admin_users
  for select to authenticated
  using (email = auth.email() or public.is_super_admin());

-- Писать: только суперадмин.
create policy "Super admin write" on public.admin_users
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ─── 3. site_visit_events: ограничить анонимную запись ──────────────────────
-- Вставка от anon нужна для аналитики, но размер не ограничен ничем:
-- скриптом заливаются миллионы строк с гигабайтами jsonb. Побочный эффект —
-- админская вкладка аналитики перестаёт открываться.
-- NOT VALID: проверяются только новые строки, старые не перепроверяются.

alter table public.site_visit_events
  add constraint site_visit_events_metadata_size
  check (pg_column_size(metadata) <= 8192) not valid;

alter table public.site_visit_events
  add constraint site_visit_events_text_limits
  check (
    length(visitor_id) <= 64
    and length(session_id) <= 64
    and length(page_key) <= 32
    and (league is null or length(league) <= 32)
    and (referrer is null or length(referrer) <= 512)
    and length(url) <= 1024
    and length(path) <= 1024
  ) not valid;

commit;

-- ─── 4. Аудит: выполнить отдельно и глазами просмотреть результат ───────────
--
-- Ищем то, что пережило обе миграции: политики, дающие доступ без условий.
-- Строки с qual = 'true' или with_check = 'true' под ролями anon/authenticated
-- для команд, отличных от SELECT, — это дыры.
--
--   select tablename, policyname, roles, cmd, qual, with_check
--   from pg_policies
--   where schemaname = 'public'
--   order by tablename, policyname;
--
-- Таблицы вообще без RLS (как были players до первой миграции):
--
--   select tablename from pg_tables
--   where schemaname = 'public' and not rowsecurity;
--
-- Политики бакетов Storage — загрузка логотипов идёт через service-role
-- в /api/upload-logo, поэтому anon/authenticated писать в storage не должны:
--
--   select policyname, roles, cmd, qual, with_check
--   from pg_policies where schemaname = 'storage' and tablename = 'objects';
