// Возврат логотипов командам.
//
// Файлы в Storage уцелели (33 штуки), но имена у них обезличенные
// (timestamp-random.jpg), а photo_url команд был уничтожен вместе с teams.
// Связь восстанавливается по времени: админ загружал логотип и через
// несколько секунд сохранял карточку команды — значит первая правка команды
// после загрузки файла и есть его владелец.
//
// Запуск:  SUPABASE_SERVICE_KEY=... node scripts/restore-team-logos.mjs [--dry]

const API = 'https://gvkdumzyhdguupdhcqeb.supabase.co/rest/v1'
const PUB = 'https://gvkdumzyhdguupdhcqeb.supabase.co/storage/v1/object/public/team-logos/'
const KEY = process.env.SUPABASE_SERVICE_KEY
if (!KEY) { console.error('Нужен SUPABASE_SERVICE_KEY'); process.exit(1) }
const DRY = process.argv.includes('--dry')

const MGMT = process.env.SUPABASE_MGMT_TOKEN

async function rest(path) {
  const r = await fetch(`${API}/${path}`, { headers: { apikey: KEY } })
  const j = await r.json()
  if (!Array.isArray(j)) throw new Error(JSON.stringify(j))
  return j
}

// storage.objects недоступна через REST — тянем через Management API
async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/gvkdumzyhdguupdhcqeb/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${MGMT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const j = await r.json()
  if (!Array.isArray(j)) throw new Error(JSON.stringify(j))
  return j
}

const mapping = await sql(`
  with o as (select name, created_at from storage.objects where bucket_id='team-logos')
  select o.name as file,
         (select a.entity_name from activity_log a
           where a.entity_type='команда' and a.action in ('Изменено','Добавлено')
             and a.created_at > o.created_at
             and a.created_at < o.created_at + interval '60 seconds'
           order by a.created_at limit 1) as team_name
  from o
`)

const teams = await rest('teams?select=id,name,league,photo_url')
const byName = new Map()
for (const t of teams) {
  if (!byName.has(t.name)) byName.set(t.name, [])
  byName.get(t.name).push(t)
}

const updates = []
const ambiguous = []
const gone = []
for (const m of mapping) {
  if (!m.team_name) continue
  const cands = byName.get(m.team_name)
  if (!cands) { gone.push(m); continue }
  if (cands.length > 1) { ambiguous.push({ ...m, leagues: cands.map(c => c.league) }); continue }
  updates.push({ id: cands[0].id, name: cands[0].name, photo_url: PUB + m.file })
}

console.log(`логотипов              : ${mapping.length}`)
console.log(`  к проставлению       : ${updates.length}`)
console.log(`  имя неоднозначно     : ${ambiguous.length}  ${ambiguous.map(a => a.team_name).join(', ')}`)
console.log(`  команда удалена      : ${gone.length}`)

if (DRY) { console.log('\n(dry run)'); process.exit(0) }

let ok = 0
for (const u of updates) {
  const r = await fetch(`${API}/teams?id=eq.${u.id}`, {
    method: 'PATCH',
    headers: { apikey: KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ photo_url: u.photo_url }),
  })
  if (!r.ok) console.error(`  ошибка ${u.name}: ${r.status} ${await r.text()}`)
  else ok++
}
console.log(`\nпроставлено логотипов: ${ok}`)
