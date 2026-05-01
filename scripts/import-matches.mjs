import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://gvkdumzyhdguupdhcqeb.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
)

const normalize = name => {
  const map = {
    'FENERBAHCE': 'Fenerbahçe',
    'TASHKENT': 'Toshkent',
    'НЕМОЛОДЁЖКА': 'Немолодежка',
    'НЕМОЛОДЕЖКА': 'Немолодежка',
    'HEAVENS': 'HEAVENS',
    'HAVENS': 'HEAVENS',
    'FLY FHIGH': 'FLY HIGH',
    'MATONT': 'MATONAT',
    'SECOND R.': 'SECOND ROOM',
    'AGMK K': 'AGMK KUKSICH',
    'AGMK K.': 'AGMK KUKSICH',
    'MATONAT-2': 'MATONAT 2',
  }
  return map[name] || name
}

const { data: teams } = await supabase.from('teams').select('*')

function findTeam(rawName, league = null) {
  const name = normalize(rawName)
  if (league) {
    return teams.find(t => t.name.toUpperCase() === name.toUpperCase() && t.league === league) || null
  }
  const matches = teams.filter(t => t.name.toUpperCase() === name.toUpperCase())
  if (matches.length === 1) return matches[0]
  return null
}

const rawMatches = [
  ['2026-03-01', 'DATEKO', 'LOKOMOTIV', 'https://www.youtube.com/watch?v=HswkeeDOGIk'],
  ['2026-03-01', 'HANGOVERS', 'AGMK K', 'https://www.youtube.com/watch?v=GQ7Z_G1z6as'],
  ['2026-03-01', 'SEOUL', 'KARASU', 'https://www.youtube.com/watch?v=SQtVcgSytUY'],
  ['2026-03-01', 'SOMNITIDE', 'RAGEBAIT', 'https://www.youtube.com/watch?v=IeIjHY7ZPCw'],
  ['2026-03-01', 'NUMA', 'AGMK K', 'https://www.youtube.com/watch?v=RoPMG0K1BbY'],
  ['2026-03-01', 'BEKTEMIR', 'MATONAT 1', 'https://www.youtube.com/watch?v=BPGVyMElAT8'],
  ['2026-03-01', 'ANGELS', 'BLEACH', 'https://www.youtube.com/watch?v=d94S2fmbGUA'],
  ['2026-03-01', 'НЕМОЛОДЁЖКА', 'TASHKENT', 'https://www.youtube.com/watch?v=0hfg_eyZbOs'],
  ['2026-03-01', 'UNITY', "BLOCK'N'ROLL", 'https://www.youtube.com/watch?v=wdUlXzm4CXs'],
  ['2026-03-01', 'FLY HIGH', 'ALNUR', 'https://www.youtube.com/watch?v=HlpMgliClSY'],
  ['2026-03-08', 'SEOUL', 'UNRAVEL', 'https://www.youtube.com/watch?v=MQMFTmSWb4k'],
  ['2026-03-08', 'ANGELS', 'LOKOMOTIV', 'https://www.youtube.com/watch?v=_8BO-Gke3J0'],
  ['2026-03-08', 'SECOND R.', 'RAGEBAIT', 'https://www.youtube.com/watch?v=V3zSCvmotDs'],
  ['2026-03-08', 'NUMA', 'MATONAT V.C.', 'https://www.youtube.com/watch?v=Nl5WrBPLPc0'],
  ['2026-03-08', 'KAMELIA', 'SOMNITIDE', 'https://www.youtube.com/watch?v=TOcKcBtFcrA'],
  ['2026-03-08', 'DINAMO', 'MATONAT 2', 'https://www.youtube.com/watch?v=WqJ6L12Ue_I'],
  ['2026-03-08', 'HANGOVERS', 'MATONAT', 'https://www.youtube.com/watch?v=ooeaL0rPpYc'],
  ['2026-03-08', 'AGMK', 'MATONAT 1', 'https://www.youtube.com/watch?v=Vq-NPTG90To'],
  ['2026-03-08', 'UMBRA', 'FENERBAHCE', 'https://www.youtube.com/watch?v=VQz7hiLsXQw'],
  ['2026-03-08', 'MIROBOD', 'TWIXOR', 'https://www.youtube.com/watch?v=VcNTaxiSS2Y'],
  ['2026-03-08', 'LOCHIN', 'FIBONACCI', 'https://www.youtube.com/watch?v=dpbzPa0bwRM'],
  ['2026-03-08', 'GUARDIANS', 'KARASU', 'https://www.youtube.com/watch?v=wPNIb7pMpgg'],
  ['2026-03-08', 'FLY HIGH', 'HANGOVERS', 'https://www.youtube.com/watch?v=HEobAmyLMEM'],
  ['2026-03-15', 'HAVENS', 'BLEACH', 'https://www.youtube.com/watch?v=rlHGr7R0HIA'],
  ['2026-03-15', 'ANGELS', 'HANGOVERS', 'https://www.youtube.com/watch?v=cdrdHok18NE'],
  ['2026-03-15', 'FENERBAHCE', 'TWIXOR', 'https://www.youtube.com/watch?v=dY9yldTtglU'],
  ['2026-03-15', 'KARASU', 'FIBONACCI', 'https://www.youtube.com/watch?v=9z3DfKX5LGs'],
  ['2026-03-15', 'UMBRA', 'ASURA', 'https://www.youtube.com/watch?v=ybK4xC-qSMk'],
  ['2026-03-15', 'UNRAVEL', 'GUARDIANS', 'https://www.youtube.com/watch?v=ijlaVyu_dhY'],
  ['2026-03-15', 'MATONAT 1', 'DINAMO', 'https://www.youtube.com/watch?v=cXCsQnBkmdE'],
  ['2026-03-15', 'ALNUR', 'HANGOVERS', 'https://www.youtube.com/watch?v=r-zcwZxyjTc'],
  ['2026-03-15', 'TASHKENT', 'MATONAT', 'https://www.youtube.com/watch?v=R1G2SDm1zb8'],
  ['2026-03-15', 'KAMELIA', 'SECOND ROOM', 'https://www.youtube.com/watch?v=koQS2KebKCM'],
  ['2026-03-15', 'AGMK K.', 'MATONAT V.C.', 'https://www.youtube.com/watch?v=xQVLVd0J0nc'],
  ['2026-03-15', 'MIROBOD', 'LOCHIN', 'https://www.youtube.com/watch?v=iGwEF2YvaqY'],
  ['2026-03-15', 'HANGOVERS', "BLOCK'N'ROLL", 'https://www.youtube.com/watch?v=MPI62gQMd-o'],
  ['2026-03-15', 'BEKTEMIR', 'BLAZE', 'https://www.youtube.com/watch?v=9EFSy5RFW58'],
  ['2026-03-22', 'LOCHIN', 'KARASU', 'https://www.youtube.com/watch?v=aI02SXlxJBQ'],
  ['2026-03-22', 'DATEKO', 'ANGELS', 'https://www.youtube.com/watch?v=kZlMlesnI-w'],
  ['2026-03-22', 'UNRAVEL', 'FIBONACCI', 'https://www.youtube.com/watch?v=mB9GoH9pGs8'],
  ['2026-03-22', 'HEAVENS', 'LOKOMOTIV', 'https://www.youtube.com/watch?v=0FFTMU-gk_4'],
  ['2026-03-22', 'MIROBOD', 'FENERBAHCE', 'https://www.youtube.com/watch?v=Jo4btJSojGA'],
  ['2026-03-22', 'BLAZE', 'AGMK', 'https://www.youtube.com/watch?v=n5vGDjOlCJs'],
  ['2026-03-22', 'TASHKENT', 'VALKYRIE', 'https://www.youtube.com/watch?v=QNJbeseiXZE'],
  ['2026-03-22', 'UMBRA', 'SEOUL', 'https://www.youtube.com/watch?v=6Y3Lc_t4PcM'],
  ['2026-03-22', 'RAGEBAIT', 'AGMK K', 'https://www.youtube.com/watch?v=z4bhauMRSrQ'],
  ['2026-03-22', 'MATONAT', 'GUARDIANS', 'https://www.youtube.com/watch?v=doRvGbTo-3E'],
  ['2026-03-22', 'TWIXOR', 'ASURA', 'https://www.youtube.com/watch?v=H57-awRMIKI'],
  ['2026-03-22', 'BLEACH', 'HANGOVERS', 'https://www.youtube.com/watch?v=IzJI589cVDI'],
  ['2026-03-22', 'BEKTEMIR', 'DINAMO', 'https://www.youtube.com/watch?v=WTkU3I8Xdx8'],
  ['2026-03-22', 'HANGOVERS', 'MATONAT 2', 'https://www.youtube.com/watch?v=z2X068MCfeE'],
  ['2026-03-22', 'UNITY', 'MATONAT', 'https://www.youtube.com/watch?v=PXUg-LSy0S4'],
  ['2026-03-22', 'НЕМОЛОДЕЖКА', "BLOCK'N'ROLL", 'https://www.youtube.com/watch?v=Am0Yym44DeY'],
  ['2026-03-29', 'BEKTEMIR', 'ALNUR', 'https://www.youtube.com/watch?v=t_3QV1SIUt4'],
  ['2026-03-29', 'VALKYRIE', 'MATONT', 'https://www.youtube.com/watch?v=ODr6e2NA2VY'],
  ['2026-03-29', 'BLAZE', 'DINAMO', 'https://www.youtube.com/watch?v=nwY0yF6kInE'],
  ['2026-03-29', 'AGMK', 'FLY FHIGH', 'https://www.youtube.com/watch?v=NwtjMP7JeFs'],
  ['2026-03-29', 'TASHKENT', "BLOCK'N'ROLL", 'https://www.youtube.com/watch?v=AekOZZR6bZg'],
  ['2026-03-29', 'HANGOVERS', 'UNITY', 'https://www.youtube.com/watch?v=ZYQeMQhAFqA'],
  ['2026-03-29', 'KAMELIA', 'AGMK KUKSICH', 'https://www.youtube.com/watch?v=RZVkKHg752E'],
  ['2026-03-29', 'SOMNITIDE', 'DINAMO TASHKENT', 'https://www.youtube.com/watch?v=aC8g0piHdaU'],
  ['2026-03-29', 'HANGOVERS', 'SECOND ROOM', 'https://www.youtube.com/watch?v=K_7TCDgIQfw'],
  ['2026-03-29', 'MATONAT-2', 'FLY HIGH', 'https://www.youtube.com/watch?v=TalLYG6vvwI'],
]

const toInsert = []

for (const [date, homeRaw, awayRaw, video] of rawMatches) {
  let home = findTeam(homeRaw)
  let away = findTeam(awayRaw)
  if (!home && away) home = findTeam(homeRaw, away.league)
  if (!away && home) away = findTeam(awayRaw, home.league)
  if (!home || !away || home.league !== away.league) continue

  toInsert.push({
    league: home.league,
    home_team_id: home.id,
    away_team_id: away.id,
    match_date: `${date}T00:00:00+00`,
    status: 'finished',
    video_url: video,
    _homeName: home.name,
    _awayName: away.name,
  })
}

// Добавляем вручную HANGOVERS vs MATONAT (female) — оба имени неоднозначны
const hangoversFemale = teams.find(t => t.name === 'Hangovers' && t.league === 'female')
const matonatFemale = teams.find(t => t.name === 'Matonat' && t.league === 'female')
toInsert.push({
  league: 'female',
  home_team_id: hangoversFemale.id,
  away_team_id: matonatFemale.id,
  match_date: '2026-03-08T00:00:00+00',
  status: 'finished',
  video_url: 'https://www.youtube.com/watch?v=ooeaL0rPpYc',
  _homeName: 'Hangovers',
  _awayName: 'Matonat',
})

// Проверяем существующие матчи
const { data: existing } = await supabase.from('matches').select('home_team_id, away_team_id, match_date')
const existingSet = new Set(existing.map(m => `${m.home_team_id}_${m.away_team_id}_${m.match_date?.slice(0,10)}`))

const newMatches = toInsert.filter(m => !existingSet.has(`${m.home_team_id}_${m.away_team_id}_${m.match_date.slice(0,10)}`))

console.log(`Найдено матчей: ${toInsert.length}, уже есть: ${toInsert.length - newMatches.length}, к вставке: ${newMatches.length}`)

if (newMatches.length === 0) { console.log('Нечего добавлять.'); process.exit(0) }

const insertData = newMatches.map(({ _homeName, _awayName, ...m }) => m)
const { data, error } = await supabase.from('matches').insert(insertData).select()

if (error) { console.error('Ошибка:', error); process.exit(1) }

console.log(`\n✅ Вставлено ${data.length} матчей:`)
for (const m of newMatches) {
  console.log(`  [${m.league}] ${m._homeName} vs ${m._awayName} — ${m.match_date.slice(0,10)}`)
}
