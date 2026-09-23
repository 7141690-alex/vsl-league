// Реконструкция данных, уничтоженных атакой 22.09.2026, из журнала activity_log.
//
// Журнал уцелел (3230 записей, апрель-сентябрь) и хранит в details полное
// состояние матчей: дату, зал, лигу, счёт по сетам, ссылки и UUID обеих команд.
// UUID команд критичны: с ними восстановленные матчи свяжутся с командами
// так же, как было до атаки.
//
// Запуск:  SUPABASE_SERVICE_KEY=... node scripts/restore-from-activity-log.mjs
// Пишет в scripts/restore-output/ — ничего в базу не отправляет.

import { writeFileSync, mkdirSync } from 'node:fs'

const API = 'https://gvkdumzyhdguupdhcqeb.supabase.co/rest/v1'
const KEY = process.env.SUPABASE_SERVICE_KEY
if (!KEY) { console.error('Нужен SUPABASE_SERVICE_KEY'); process.exit(1) }

const OUT = new URL('./restore-output/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

async function fetchAll(table, select = '*', order = 'created_at.asc') {
  const rows = []
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${API}/${table}?select=${select}&order=${order}&limit=1000&offset=${offset}`, {
      headers: { apikey: KEY },
    })
    const page = await res.json()
    if (!Array.isArray(page)) throw new Error(JSON.stringify(page))
    rows.push(...page)
    if (page.length < 1000) return rows
  }
}

const log = await fetchAll('activity_log')
const players = await fetchAll('players', 'id,name,gender')
console.log(`Журнал: ${log.length} записей. Игроков уцелело: ${players.length}`)

const splitVs = name => {
  const m = String(name || '').split(/\s+vs\s+/i)
  return m.length === 2 ? [m[0].trim(), m[1].trim()] : null
}

// --- КОМАНДЫ -------------------------------------------------------------
// UUID берём из матчей, имя — из entity_name ("A vs B"), лигу — из details.
const teams = new Map() // id -> { id, name, league, seenAt }
for (const r of log) {
  if (r.entity_type !== 'игра' || !r.details?.home_team_id) continue
  const pair = splitVs(r.entity_name)
  if (!pair) continue
  for (const [id, name] of [[r.details.home_team_id, pair[0]], [r.details.away_team_id, pair[1]]]) {
    if (!id) continue
    const prev = teams.get(id)
    // более поздняя запись авторитетнее: имя команды могли переименовать
    if (!prev || r.created_at > prev.seenAt) {
      teams.set(id, { id, name, league: r.details.league || prev?.league || null, seenAt: r.created_at })
    }
  }
}

// Команды, которые заводили, но которые ни разу не сыграли — без UUID.
const addedTeamNames = new Map()
for (const r of log) {
  if (r.entity_type === 'команда' && r.action === 'Добавлено') {
    addedTeamNames.set(r.entity_name, r.details?.league || null)
  }
}
const known = new Set([...teams.values()].map(t => t.name.toLowerCase()))
const teamsWithoutId = [...addedTeamNames]
  .filter(([n]) => !known.has(n.toLowerCase()))
  .map(([name, league]) => ({ name, league }))

// --- МАТЧИ ---------------------------------------------------------------
// Ключ — пара команд + дата. "Добавлено" даёт season_id, "Изменено" — финальный счёт.
const matches = new Map()
for (const r of log) {
  if (r.entity_type !== 'игра') continue
  if (r.action !== 'Добавлено' && r.action !== 'Изменено') continue
  const d = r.details
  if (!d?.home_team_id || !d?.away_team_id || !d?.match_date) continue
  const key = `${d.home_team_id}|${d.away_team_id}|${String(d.match_date).slice(0, 10)}`
  const prev = matches.get(key)
  matches.set(key, {
    ...(prev || {}),
    home_team_id: d.home_team_id,
    away_team_id: d.away_team_id,
    match_date: d.match_date,
    league: d.league,
    venue: d.venue ?? null,
    status: d.status ?? 'scheduled',
    home_sets: d.home_sets ?? null,
    away_sets: d.away_sets ?? null,
    photo_url: d.photo_url ?? null,
    video_url: d.video_url ?? null,
    // season_id встречается только в "Добавлено" — не затираем его правками
    season_id: d.season_id ?? prev?.season_id ?? null,
    name: r.entity_name,
    lastSeen: r.created_at,
  })
}

// Удалённые до атаки матчи восстанавливать не нужно.
for (const r of log) {
  if (r.entity_type === 'игра' && r.action === 'Удалено') {
    for (const [key, m] of matches) {
      if (m.name === r.entity_name && m.lastSeen < r.created_at) matches.delete(key)
    }
  }
}

// --- НАГРАДЫ -------------------------------------------------------------
// В журнале только "Игрок — Номинация". Даты матча нет: подставляем дату записи.
// Идём хронологически: "Добавлено" кладёт награду, "Удалено" снимает одну такую же.
const byName = new Map(players.map(p => [p.name.toLowerCase(), p]))
const awardsAlive = new Map() // entity_name -> массив живых наград
for (const r of log) {
  if (r.entity_type !== 'награда') continue
  const bucket = awardsAlive.get(r.entity_name) || []
  if (r.action === 'Добавлено') {
    const playerName = String(r.entity_name).split('—')[0].trim()
    bucket.push({
      entity_name: r.entity_name,
      player_name: playerName,
      player_id: byName.get(playerName.toLowerCase())?.id ?? null,
      nomination: r.details?.nomination ?? null,
      match_date_approx: r.created_at.slice(0, 10),
      logged_at: r.created_at,
    })
  } else if (r.action === 'Удалено') {
    bucket.pop()
  }
  awardsAlive.set(r.entity_name, bucket)
}
const awards = [...awardsAlive.values()].flat()

// --- СОСТАВЫ -------------------------------------------------------------
const memberships = []
for (const r of log) {
  if (r.entity_type !== 'игрок') continue
  if (r.action === 'Добавлен в команду') {
    memberships.push({
      player_name: r.entity_name,
      player_id: byName.get(String(r.entity_name).toLowerCase())?.id ?? null,
      team: r.details?.team ?? null,
      season: r.details?.season ?? null,
      at: r.created_at,
      action: 'in',
    })
  } else if (r.action === 'Убран из команды') {
    memberships.push({ player_name: r.entity_name, team: null, season: r.details?.season ?? null, at: r.created_at, action: 'out' })
  }
}

// --- ВЫВОД ---------------------------------------------------------------
const teamList = [...teams.values()].map(({ seenAt, ...t }) => t)
const matchList = [...matches.values()].map(({ name, lastSeen, ...m }) => m)

const sql = [
  '-- Восстановление из activity_log. Проверьте данные перед выполнением.',
  '-- UUID команд сохранены оригинальные, поэтому матчи свяжутся корректно.',
  'begin;',
  '',
  '-- Команды',
  ...teamList.map(t =>
    `insert into teams (id, name, league) values ('${t.id}', ${q(t.name)}, ${q(t.league)}) on conflict (id) do nothing;`),
  '',
  '-- Матчи',
  ...matchList.map(m =>
    `insert into matches (home_team_id, away_team_id, match_date, league, venue, status, home_sets, away_sets, photo_url, video_url${m.season_id ? ', season_id' : ''}) values ` +
    `('${m.home_team_id}', '${m.away_team_id}', ${q(m.match_date)}, ${q(m.league)}, ${q(m.venue)}, ${q(m.status)}, ` +
    `${n(m.home_sets)}, ${n(m.away_sets)}, ${q(m.photo_url)}, ${q(m.video_url)}${m.season_id ? `, '${m.season_id}'` : ''});`),
  '',
  'commit;',
].join('\n')

function q(v) { return v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'` }
function n(v) { return v == null ? 'null' : Number(v) }

writeFileSync(OUT + 'teams.json', JSON.stringify(teamList, null, 2))
writeFileSync(OUT + 'teams-without-uuid.json', JSON.stringify(teamsWithoutId, null, 2))
writeFileSync(OUT + 'matches.json', JSON.stringify(matchList, null, 2))
writeFileSync(OUT + 'awards.json', JSON.stringify(awards, null, 2))
writeFileSync(OUT + 'memberships.json', JSON.stringify(memberships, null, 2))
writeFileSync(OUT + 'restore.sql', sql)

const finished = matchList.filter(m => m.status === 'finished' && m.home_sets != null).length
const withVideo = matchList.filter(m => m.video_url).length
const awardsResolved = awards.filter(a => a.player_id).length

console.log(`
ВОССТАНОВЛЕНО ИЗ ЖУРНАЛА
  команды (с оригинальным UUID) : ${teamList.length}
  команды без UUID (не играли)  : ${teamsWithoutId.length}
  матчи                          : ${matchList.length}
    из них со счётом (finished)  : ${finished}
    со ссылкой на видео          : ${withVideo}
  награды                        : ${awards.length} (игрок опознан: ${awardsResolved})
  события составов               : ${memberships.length}

Файлы в scripts/restore-output/`)
