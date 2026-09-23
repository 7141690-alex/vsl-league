// Заливка реконструированных данных в базу.
// Порядок важен: teams -> matches -> season_teams -> team_memberships (внешние ключи).
//
// Запуск:  SUPABASE_SERVICE_KEY=... node scripts/apply-restore.mjs [--dry]

import { readFileSync } from 'node:fs'

const API = 'https://gvkdumzyhdguupdhcqeb.supabase.co/rest/v1'
const KEY = process.env.SUPABASE_SERVICE_KEY
if (!KEY) { console.error('Нужен SUPABASE_SERVICE_KEY'); process.exit(1) }
const DRY = process.argv.includes('--dry')

const OUT = new URL('./restore-output/', import.meta.url).pathname
const read = f => JSON.parse(readFileSync(OUT + f, 'utf8'))

async function get(path) {
  const res = await fetch(`${API}/${path}`, { headers: { apikey: KEY } })
  const j = await res.json()
  if (!Array.isArray(j)) throw new Error(JSON.stringify(j))
  return j
}

async function insert(table, rows) {
  if (!rows.length) return 0
  if (DRY) return rows.length
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

const teams = read('teams.json')
const matches = read('matches.json')
const memberships = read('memberships.json')

// --- 1. КОМАНДЫ ---------------------------------------------------------
const nTeams = await insert('teams', teams.map(t => ({ id: t.id, name: t.name, league: t.league })))
console.log(`1. teams              -> ${nTeams}`)

// --- 2. МАТЧИ -----------------------------------------------------------
const nMatches = await insert('matches', matches.map(m => ({
  home_team_id: m.home_team_id, away_team_id: m.away_team_id, match_date: m.match_date,
  league: m.league, venue: m.venue, status: m.status,
  home_sets: m.home_sets, away_sets: m.away_sets,
  photo_url: m.photo_url, video_url: m.video_url, season_id: m.season_id,
})))
console.log(`2. matches            -> ${nMatches}`)

// --- 3. SEASON_TEAMS ----------------------------------------------------
// Не было в журнале, но однозначно выводится: какие команды играли в каком сезоне.
// Без этой связи приложение не покажет команды внутри сезона.
const pairs = new Set()
for (const m of matches) {
  if (!m.season_id) continue
  pairs.add(`${m.season_id}|${m.home_team_id}`)
  pairs.add(`${m.season_id}|${m.away_team_id}`)
}
const seasonTeams = [...pairs].map(p => {
  const [season_id, team_id] = p.split('|')
  return { season_id, team_id }
})
const nST = await insert('season_teams', seasonTeams)
console.log(`3. season_teams       -> ${nST}  (выведено из матчей)`)

// --- 4. СОСТАВЫ ---------------------------------------------------------
const seasons = await get('seasons?select=id,name')
const seasonByName = new Map(seasons.map(s => [s.name, s.id]))
const teamByName = new Map(teams.map(t => [t.name.toLowerCase(), t.id]))

// Проигрываем события по времени: "in" ставит игрока в команду, "out" снимает.
const state = new Map() // playerName|season -> team_id
const skipped = { noPlayer: 0, noTeam: 0, noSeason: 0 }
for (const e of [...memberships].sort((a, b) => a.at.localeCompare(b.at))) {
  const key = `${e.player_name}|${e.season || ''}`
  if (e.action === 'out') { state.delete(key); continue }
  const teamId = teamByName.get(String(e.team || '').toLowerCase())
  if (!e.player_id) { skipped.noPlayer++; continue }
  if (!teamId) { skipped.noTeam++; continue }
  if (!seasonByName.has(e.season)) { skipped.noSeason++; continue }
  state.set(key, { player_id: e.player_id, team_id: teamId, season_id: seasonByName.get(e.season) })
}
// дедуп: один игрок в одной команде в одном сезоне
const uniq = new Map()
for (const v of state.values()) uniq.set(`${v.player_id}|${v.team_id}|${v.season_id}`, v)
const nMem = await insert('team_memberships', [...uniq.values()])
console.log(`4. team_memberships   -> ${nMem}`)
console.log(`   пропущено: игрок не найден ${skipped.noPlayer}, команда не найдена ${skipped.noTeam}, сезон удалён ${skipped.noSeason}`)

console.log(DRY ? '\n(dry run — в базу ничего не писалось)' : '\nГотово.')
