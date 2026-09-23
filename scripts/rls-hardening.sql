-- Закрытие уязвимости, использованной при атаке 22.09.2026 18:06 UTC.
--
-- Суть дыры: политики записи проверяли только auth.role() = 'authenticated',
-- то есть "любой зарегистрированный", а часть таблиц имела USING (true) —
-- открытый доступ вообще без входа. Таблица players была без RLS.
-- Таблица admin_users ограничивала только интерфейс, но не базу.
--
-- После этой миграции право записи = членство в admin_users.
-- Публичное чтение сайта сохраняется везде, где было.
-- service_role (скрипты в scripts/*.mjs) обходит RLS и продолжает работать.

begin;

-- 1. Кто считается админом: наличие email в admin_users.
--    SECURITY DEFINER — чтобы функция читала admin_users в обход его же RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.admin_users where email = auth.email())
$$;

-- 2. teams
drop policy if exists "Admin write teams" on public.teams;
create policy "Admin write teams" on public.teams
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 3. matches
drop policy if exists "Admin write matches" on public.matches;
create policy "Admin write matches" on public.matches
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 4. set_scores
drop policy if exists "Admin write set_scores" on public.set_scores;
create policy "Admin write set_scores" on public.set_scores
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 5. match_stats — три раздельные политики заменяются одной
drop policy if exists "Auth insert" on public.match_stats;
drop policy if exists "Auth update" on public.match_stats;
drop policy if exists "Auth delete" on public.match_stats;
create policy "Admin write match_stats" on public.match_stats
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 6. season_teams — было две политики с USING (true), одна из них для anon
drop policy if exists "all season_teams" on public.season_teams;
drop policy if exists "season_teams_write" on public.season_teams;
create policy "Admin write season_teams" on public.season_teams
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 7. seasons — то же самое
drop policy if exists "all seasons" on public.seasons;
drop policy if exists "seasons_write" on public.seasons;
create policy "Admin write seasons" on public.seasons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 8. leagues — ВНИМАНИЕ: тут была ровно одна политика ALL (true),
--    она же обеспечивала публичное чтение. Поэтому чтение добавляем явно,
--    иначе у сайта отвалится переключатель лиг.
drop policy if exists "all access leagues" on public.leagues;
create policy "Public read leagues" on public.leagues
  for select to anon, authenticated using (true);
create policy "Admin write leagues" on public.leagues
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 9. awards
drop policy if exists "Service write" on public.awards;
create policy "Admin write awards" on public.awards
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 10. team_memberships
drop policy if exists "Service write" on public.team_memberships;
create policy "Admin write team_memberships" on public.team_memberships
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 11. players — RLS был выключен полностью: 1167 записей были открыты
--     на чтение и удаление кому угодно без входа.
alter table public.players enable row level security;
create policy "Public read players" on public.players
  for select to anon, authenticated using (true);
create policy "Admin write players" on public.players
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 12. activity_log — журнал аудита был открыт анониму на чтение и на запись
--     (можно было и подсмотреть все действия админов, и подделать записи).
drop policy if exists "insert activity_log" on public.activity_log;
drop policy if exists "select activity_log" on public.activity_log;
create policy "Admin insert activity_log" on public.activity_log
  for insert to authenticated with check (public.is_admin());
create policy "Admin read activity_log" on public.activity_log
  for select to authenticated using (public.is_admin());

-- 13. site_visit_events — анонимная запись нужна для аналитики посещений,
--     её оставляем; чтение сужаем с "любой вошедший" до админов.
drop policy if exists "auth_read_site_visit_events" on public.site_visit_events;
create policy "Admin read site_visit_events" on public.site_visit_events
  for select to authenticated using (public.is_admin());

commit;
