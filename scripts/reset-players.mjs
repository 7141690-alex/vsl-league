import { createClient } from '@supabase/supabase-js'
const s = createClient('https://gvkdumzyhdguupdhcqeb.supabase.co', process.env.SUPABASE_SERVICE_KEY)

const { data: awards } = await s.from('awards').select('id')
console.log('Наград в БД:', awards?.length)
if (awards?.length > 0) {
  const { error } = await s.from('awards').delete().in('id', awards.map(a => a.id))
  console.log('Удаление наград:', error?.message || 'ОК')
}

const { data: players } = await s.from('players').select('id')
console.log('Игроков в БД:', players?.length)
if (players?.length > 0) {
  const { error } = await s.from('players').delete().in('id', players.map(p => p.id))
  console.log('Удаление игроков:', error?.message || 'ОК')
}
