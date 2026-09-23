// Второй этап восстановления, на данных из site_visit_events.
//
// Эта таблица уцелела (108k записей) и хранила контекст просмотра: при заходе
// на страницу игрока писались его UUID и UUID команды, из состава которой на
// него перешли. Это восстанавливает связь игрок->команда, уничтоженную вместе
// с team_memberships, причём по настоящим UUID — в отличие от журнала, где
// команда записана только названием (а названия дублируются в разных лигах).
//
// Запуск:  SUPABASE_SERVICE_KEY=... node scripts/restore-from-visits.mjs [--dry]

const API = 'https://gvkdumzyhdguupdhcqeb.supabase.co/rest/v1'
const KEY = process.env.SUPABASE_SERVICE_KEY
if (!KEY) { console.error('Нужен SUPABASE_SERVICE_KEY'); process.exit(1) }
const DRY = process.argv.includes('--dry')

async function page(path) {
  const out = []
  for (let i = 0; ; i += 1000) {
    const url = `${API}/${path}${path.includes('?') ? '&' : '?'}limit=1000&offset=${i}`
    const r = await fetch(url, { headers: { apikey: KEY } })
    const j = await r.json()
    if (!Array.isArray(j)) throw new Error(JSON.stringify(j))
    out.push(...j)
    if (j.length < 1000) break
  }
  return out
}

async function insert(table, rows) {
  if (!rows.length || DRY) return rows.length
  let done = 0
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100)
    const res = await fetch(`${API}/${table}`, {
      method: 'POST',
      headers: { apikey: KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(chunk),
    })
    if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`)
    done += chunk.length
  }
  return done
}

const [events, teams, players, matches, log, seasons, existing] = await Promise.all([
  page('site_visit_events?page_key=eq.player&select=metadata'),
  page('teams?select=id,name,league'),
  page('players?select=id,name'),
  page('matches?select=id,home_team_id,away_team_id,match_date,league,season_id'),
  page('activity_log?select=*&order=created_at.asc'),
  page('seasons?select=id,name'),
  page('team_memberships?select=player_id,team_id,season_id'),
])
const already = new Set(existing.map(m => `${m.player_id}|${m.team_id}|${m.season_id ?? ''}`))

const teamById = new Map(teams.map(t => [t.id, t]))
const playerByName = new Map(players.map(p => [p.name.toLowerCase(), p.id]))
// в просмотрах есть игроки, удалённые ещё до атаки — их UUID больше не существуют
const playerExists = new Set(players.map(p => p.id))
const seasonIds = new Set(seasons.map(s => s.id))

// --- игрок -> команда (+ сезон), по частоте просмотров -------------------
const seen = new Map() // playerId -> Map(teamId -> {count, seasons:Set})
for (const e of events) {
  const c = e.metadata?.context
  if (!c?.selectedPlayer || !c?.selectedTeamId) continue
  if (!teamById.has(c.selectedTeamId)) continue
  if (!playerExists.has(c.selectedPlayer)) continue
  if (!seen.has(c.selectedPlayer)) seen.set(c.selectedPlayer, new Map())
  const m = seen.get(c.selectedPlayer)
  const cur = m.get(c.selectedTeamId) || { count: 0, seasons: new Set() }
  cur.count++
  if (c.seasonId && seasonIds.has(c.seasonId)) cur.seasons.add(c.seasonId)
  m.set(c.selectedTeamId, cur)
}

const memberships = []
const playerTeam = new Map() // playerId -> teamId (самый частый)
for (const [pid, m] of seen) {
  const ranked = [...m].sort((a, b) => b[1].count - a[1].count)
  playerTeam.set(pid, ranked[0][0])
  for (const [tid, info] of ranked) {
    if (info.seasons.size === 0) memberships.push({ player_id: pid, team_id: tid, season_id: null })
    else for (const sid of info.seasons) memberships.push({ player_id: pid, team_id: tid, season_id: sid })
  }
}
const fresh = memberships.filter(m => !already.has(`${m.player_id}|${m.team_id}|${m.season_id ?? ''}`))
console.log(`игроков с восстановленной командой : ${playerTeam.size}`)
console.log(`записей состава к вставке          : ${fresh.length}  (уже в базе: ${memberships.length - fresh.length})`)

// --- награды -------------------------------------------------------------
// Живые = "Добавлено" минус последующие "Удалено".
const alive = new Map()
for (const r of log) {
  if (r.entity_type !== 'награда') continue
  const b = alive.get(r.entity_name) || []
  if (r.action === 'Добавлено') b.push(r)
  else if (r.action === 'Удалено') b.pop()
  alive.set(r.entity_name, b)
}
const awardLog = [...alive.values()].flat()

// матчи команды, отсортированные по дате — чтобы найти игру, к которой относится награда
const byTeam = new Map()
for (const m of matches) {
  for (const tid of [m.home_team_id, m.away_team_id]) {
    if (!byTeam.has(tid)) byTeam.set(tid, [])
    byTeam.get(tid).push(m)
  }
}
for (const arr of byTeam.values()) arr.sort((a, b) => a.match_date.localeCompare(b.match_date))

const awards = []
const skip = { noPlayer: 0, noTeam: 0 }
for (const a of awardLog) {
  const pid = playerByName.get(String(a.entity_name).split('—')[0].trim().toLowerCase())
  if (!pid) { skip.noPlayer++; continue }
  const tid = playerTeam.get(pid)
  if (!tid) { skip.noTeam++; continue }
  const team = teamById.get(tid)
  const logged = a.created_at.slice(0, 10)
  // ближайший матч команды не позже даты внесения награды (в пределах 14 дней)
  const games = byTeam.get(tid) || []
  let best = null
  for (const g of games) {
    const d = g.match_date.slice(0, 10)
    if (d <= logged && (!best || d > best.match_date.slice(0, 10))) best = g
  }
  const within = best && (new Date(logged) - new Date(best.match_date.slice(0, 10))) / 86400000 <= 14
  awards.push({
    player_id: pid,
    team_id: tid,
    league: team.league,
    nomination: a.details?.nomination || String(a.entity_name).split('—')[1]?.trim(),
    match_date: within ? best.match_date.slice(0, 10) : logged,
    season_id: within ? best.season_id : null,
    created_at: a.created_at,
  })
}
const exact = awards.filter(a => a.season_id).length
console.log(`\nнаград к вставке                   : ${awards.length}`)
console.log(`  с датой реального матча          : ${exact}`)
console.log(`  с датой внесения (матч не найден): ${awards.length - exact}`)
console.log(`  пропущено: игрок ${skip.noPlayer}, команда неизвестна ${skip.noTeam}`)

if (DRY) { console.log('\n(dry run — в базу ничего не писалось)'); process.exit(0) }

console.log(`\nвставлено составов: ${await insert('team_memberships', fresh)}`)
console.log(`вставлено наград  : ${await insert('awards', awards)}`)
