// Резервная копия базы в JSON.
//
// После атаки 22.09.2026 данные восстанавливали из activity_log и из журнала
// посещений — то есть бэкапа не было вовсе. Этот скрипт снимает полную копию
// содержательных таблиц; на бесплатном тарифе Supabase другого механизма нет.
//
// Запуск:
//   SUPABASE_SERVICE_KEY=... node scripts/backup.mjs
//   SUPABASE_SERVICE_KEY=... node scripts/backup.mjs --out /path/to/backups
//   SUPABASE_SERVICE_KEY=... node scripts/backup.mjs --with-analytics
//
// Держать копии вне сервера (внешний диск, облако) — смысл бэкапа в том,
// чтобы он пережил компрометацию самой базы.

import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const API = 'https://gvkdumzyhdguupdhcqeb.supabase.co/rest/v1'
const KEY = process.env.SUPABASE_SERVICE_KEY
if (!KEY) {
  console.error('Нужен SUPABASE_SERVICE_KEY (Supabase Dashboard → Settings → API → service_role)')
  process.exit(1)
}

const TABLES = [
  'leagues',
  'seasons',
  'teams',
  'season_teams',
  'players',
  'team_memberships',
  'matches',
  'set_scores',
  'match_stats',
  'awards',
  'admin_users',
  'activity_log',
]

const args = process.argv.slice(2)
const outFlag = args.indexOf('--out')
const baseDir = outFlag !== -1 ? args[outFlag + 1] : 'backups'
const withAnalytics = args.includes('--with-analytics')

if (withAnalytics) TABLES.push('site_visit_events')

const PAGE = 1000

async function fetchPage(table, orderBy, from) {
  const order = orderBy ? `&order=${orderBy}` : ''
  const url = `${API}/${table}?select=*${order}&limit=${PAGE}&offset=${from}`
  return fetch(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
}

async function fetchTable(table) {
  // Порядок нужен для устойчивой постраничной выгрузки. Колонка id есть не
  // у всех таблиц (составные ключи) — тогда выгружаем без сортировки.
  let orderBy = 'id'
  const probe = await fetchPage(table, orderBy, 0)
  if (!probe.ok) orderBy = null

  const rows = []
  for (let from = 0; ; from += PAGE) {
    const res = await fetchPage(table, orderBy, from)
    if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`)
    const chunk = await res.json()
    rows.push(...chunk)
    if (chunk.length < PAGE) break
  }
  return rows
}

const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
const dir = join(baseDir, stamp)
mkdirSync(dir, { recursive: true })

const manifest = { created_at: new Date().toISOString(), tables: {} }
let failed = 0

for (const table of TABLES) {
  try {
    const rows = await fetchTable(table)
    writeFileSync(join(dir, `${table}.json`), JSON.stringify(rows, null, 2))
    manifest.tables[table] = rows.length
    console.log(`${table.padEnd(20)} ${rows.length}`)
  } catch (e) {
    failed++
    manifest.tables[table] = { error: e.message }
    console.error(`${table.padEnd(20)} ОШИБКА: ${e.message}`)
  }
}

writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`\nКопия: ${dir}`)

if (failed > 0) {
  console.error(`Таблиц с ошибкой: ${failed} — копия неполная.`)
  process.exit(1)
}
