import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://gvkdumzyhdguupdhcqeb.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
)

const { data: teams } = await supabase.from('teams').select('id, name').eq('league', 'female')

// Маппинг имя команды → файл фото
const photoMap = {
  "Block'N'Roll": '/teams/Blocknroll.jpg',
  'Hangovers':    '/teams/Hangovers.jpg',
  'Matonat':      '/teams/Matonat_W.jpg',
  'Немолодежка':  '/teams/NeNomolodezhka.jpg',
  'Toshkent':     '/teams/Toshkent.jpg',
  'Unity':        '/teams/Unity.jpg',
  'Valkyrie':     '/teams/Valkyrie.jpg',
}

for (const team of teams) {
  const photo = photoMap[team.name]
  if (!photo) { console.log(`⚠️  Нет фото для: ${team.name}`); continue }

  const { error } = await supabase.from('teams').update({ photo_url: photo }).eq('id', team.id)
  if (error) console.error(`❌ ${team.name}:`, error.message)
  else console.log(`✅ ${team.name} → ${photo}`)
}
