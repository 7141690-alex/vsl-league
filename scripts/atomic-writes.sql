-- Атомарная замена связанных записей.
--
-- В админке счёт по сетам и статистика матча сохранялись так:
--   delete from ... where match_id = X;  затем  insert ...
-- Две отдельные операции без транзакции. Если insert не проходил (отказ RLS,
-- обрыв связи, закрытая вкладка), данные оставались удалёнными — а интерфейс
-- показывал «Сохранено». Для статистики матча результат ошибки вообще не
-- проверялся.
--
-- Функции ниже делают delete+insert одной транзакцией и сами проверяют права.

begin;

-- ─── Счёт по сетам ──────────────────────────────────────────────────────────
create or replace function public.replace_set_scores(p_match_id uuid, p_rows jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Недостаточно прав' using errcode = '42501';
  end if;

  delete from public.set_scores where match_id = p_match_id;

  insert into public.set_scores (match_id, set_number, home_points, away_points)
  select p_match_id, (r->>'set_number')::int, (r->>'home_points')::int, (r->>'away_points')::int
  from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) as r;
end $$;

-- ─── Статистика матча ───────────────────────────────────────────────────────
create or replace function public.replace_match_stats(p_match_id uuid, p_rows jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Недостаточно прав' using errcode = '42501';
  end if;

  delete from public.match_stats where match_id = p_match_id;

  insert into public.match_stats
    (match_id, player_id, team_id, season_id, attack_pts, blocks, aces, assists, reception_pct)
  select
    p_match_id,
    (r->>'player_id')::uuid,
    (r->>'team_id')::uuid,
    nullif(r->>'season_id', '')::uuid,
    coalesce((r->>'attack_pts')::int, 0),
    coalesce((r->>'blocks')::int, 0),
    coalesce((r->>'aces')::int, 0),
    coalesce((r->>'assists')::int, 0),
    nullif(r->>'reception_pct', '')::numeric
  from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) as r;
end $$;

-- ─── Текущий сезон ──────────────────────────────────────────────────────────
-- Было два раздельных update: сначала снять is_current у всех, потом
-- поставить одному. Сбой между ними оставлял лигу вообще без текущего сезона.
create or replace function public.set_current_season(p_season_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Недостаточно прав' using errcode = '42501';
  end if;

  update public.seasons set is_current = false where is_current and id <> p_season_id;
  update public.seasons set is_current = true where id = p_season_id;
end $$;

-- Вызывать их могут только вошедшие; внутри каждая проверяет is_admin().
revoke all on function public.replace_set_scores(uuid, jsonb) from public, anon;
revoke all on function public.replace_match_stats(uuid, jsonb) from public, anon;
revoke all on function public.set_current_season(uuid) from public, anon;
grant execute on function public.replace_set_scores(uuid, jsonb) to authenticated;
grant execute on function public.replace_match_stats(uuid, jsonb) to authenticated;
grant execute on function public.set_current_season(uuid) to authenticated;

commit;
