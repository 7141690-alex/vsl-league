import { createClient } from '@supabase/supabase-js'
const s = createClient('https://gvkdumzyhdguupdhcqeb.supabase.co', process.env.SUPABASE_SERVICE_KEY)
const { data, error } = await s.from('awards').select('*').limit(1)
console.log(error ? 'ERROR: ' + error.message : 'OK — таблица awards существует, структура: ' + JSON.stringify(data))
