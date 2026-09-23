import { describe, it, expect } from 'vitest'
// Важно: тесты импортируют тот же код, который выполняется в приложении.
// Раньше здесь лежали копии функций, и рефактор страниц тесты не замечали.
import { isWin, setsFor, pointsForMatch, buildTeamRow, buildStandings } from '../lib/standings'
import { filterPast, filterUpcoming, filterBySeason } from '../lib/matches'

describe('Определение победителя матча', () => {
  const TEAM = 'team-1'

  it('хозяева выигрывают при home_sets > away_sets', () => {
    expect(isWin({ home_team_id: TEAM, away_team_id: 'team-2', home_sets: 3, away_sets: 1 }, TEAM)).toBe(true)
  })

  it('хозяева проигрывают при home_sets < away_sets', () => {
    expect(isWin({ home_team_id: TEAM, away_team_id: 'team-2', home_sets: 0, away_sets: 3 }, TEAM)).toBe(false)
  })

  it('гости выигрывают при away_sets > home_sets', () => {
    expect(isWin({ home_team_id: 'team-2', away_team_id: TEAM, home_sets: 1, away_sets: 3 }, TEAM)).toBe(true)
  })

  it('гости проигрывают при away_sets < home_sets', () => {
    expect(isWin({ home_team_id: 'team-2', away_team_id: TEAM, home_sets: 3, away_sets: 0 }, TEAM)).toBe(false)
  })

  it('ничья (невозможна в волейболе) не роняет расчёт', () => {
    expect(isWin({ home_team_id: TEAM, away_team_id: 'team-2', home_sets: 3, away_sets: 3 }, TEAM)).toBe(false)
  })

  it('setsFor разворачивает счёт со стороны гостей', () => {
    expect(setsFor({ home_team_id: 'x', away_team_id: TEAM, home_sets: 1, away_sets: 3 }, TEAM))
      .toEqual({ mySets: 3, oppSets: 1 })
  })
})

describe('Начисление очков', () => {
  it('3:0 — 3 очка победителю', () => expect(pointsForMatch(3, 0)).toBe(3))
  it('3:1 — 3 очка победителю', () => expect(pointsForMatch(3, 1)).toBe(3))
  it('3:2 — 2 очка победителю', () => expect(pointsForMatch(3, 2)).toBe(2))
  it('2:3 — 1 очко проигравшему', () => expect(pointsForMatch(2, 3)).toBe(1))
  it('1:3 — 0 очков проигравшему', () => expect(pointsForMatch(1, 3)).toBe(0))
  it('0:3 — 0 очков проигравшему', () => expect(pointsForMatch(0, 3)).toBe(0))
})

describe('Строка турнирной таблицы', () => {
  const TEAM = { id: 'a', name: 'Команда А' }
  const matches = [
    { home_team_id: 'a', away_team_id: 'b', home_sets: 3, away_sets: 0 }, // +3
    { home_team_id: 'c', away_team_id: 'a', home_sets: 2, away_sets: 3 }, // +2 (3:2)
    { home_team_id: 'a', away_team_id: 'b', home_sets: 2, away_sets: 3 }, // +1
    { home_team_id: 'b', away_team_id: 'c', home_sets: 3, away_sets: 0 }, // чужой матч
  ]

  it('считает только матчи этой команды', () => {
    expect(buildTeamRow(TEAM, matches).played).toBe(3)
  })

  it('суммирует очки по правилам лиги', () => {
    expect(buildTeamRow(TEAM, matches).points).toBe(6) // 3 + 2 + 1
  })

  it('считает победы, поражения и сеты', () => {
    const row = buildTeamRow(TEAM, matches)
    expect(row.wins).toBe(2)
    expect(row.losses).toBe(1)
    expect(row.setsWon).toBe(8)
    expect(row.setsLost).toBe(5)
  })

  it('команда без матчей получает нули, а не NaN', () => {
    const row = buildTeamRow({ id: 'zzz' }, matches)
    expect(row).toMatchObject({ played: 0, wins: 0, losses: 0, points: 0, setsWon: 0, setsLost: 0 })
  })

  it('сохраняет поля команды', () => {
    expect(buildTeamRow(TEAM, matches).name).toBe('Команда А')
  })
})

describe('Сортировка турнирной таблицы', () => {
  it('сортирует по очкам', () => {
    const teams = [{ id: 'a' }, { id: 'b' }]
    const matches = [{ home_team_id: 'b', away_team_id: 'a', home_sets: 3, away_sets: 0 }]
    expect(buildStandings(teams, matches).map(t => t.id)).toEqual(['b', 'a'])
  })

  it('при равных очках выше тот, у кого больше побед', () => {
    // a: три победы 3:2 по 2 очка = 6 очков, 3 победы
    // b: две победы 3:0 по 3 очка  = 6 очков, 2 победы
    const teams = [{ id: 'a' }, { id: 'b' }]
    const matches = [
      { home_team_id: 'a', away_team_id: 'c', home_sets: 3, away_sets: 2 },
      { home_team_id: 'a', away_team_id: 'c', home_sets: 3, away_sets: 2 },
      { home_team_id: 'a', away_team_id: 'c', home_sets: 3, away_sets: 2 },
      { home_team_id: 'b', away_team_id: 'c', home_sets: 3, away_sets: 0 },
      { home_team_id: 'b', away_team_id: 'c', home_sets: 3, away_sets: 0 },
    ]
    const rows = buildStandings(teams, matches)
    expect(rows[0].points).toBe(rows[1].points)
    expect(rows[0].id).toBe('a')
  })

  it('при равных очках и победах решает разница сетов', () => {
    const teams = [{ id: 'a' }, { id: 'b' }]
    const matches = [
      { home_team_id: 'a', away_team_id: 'c', home_sets: 3, away_sets: 2 }, // +1 разница
      { home_team_id: 'b', away_team_id: 'c', home_sets: 3, away_sets: 2 },
      { home_team_id: 'b', away_team_id: 'd', home_sets: 3, away_sets: 2 },
      { home_team_id: 'b', away_team_id: 'e', home_sets: 2, away_sets: 3 },
    ]
    const rows = buildStandings(teams, matches)
    expect(rows.map(r => r.id)).toEqual(['b', 'a'])
  })

  it('не мутирует входной массив команд', () => {
    const teams = [{ id: 'a' }, { id: 'b' }]
    const matches = [{ home_team_id: 'b', away_team_id: 'a', home_sets: 3, away_sets: 0 }]
    buildStandings(teams, matches)
    expect(teams.map(t => t.id)).toEqual(['a', 'b'])
  })
})

describe('Фильтрация матчей', () => {
  const matches = [
    { id: 1, status: 'finished',  match_date: '2026-03-01T12:00:00', season_id: 's1' },
    { id: 2, status: 'finished',  match_date: '2026-04-01T12:00:00', season_id: 's2' },
    { id: 3, status: 'scheduled', match_date: '2026-06-10T12:00:00', season_id: 's1' },
    { id: 4, status: 'scheduled', match_date: '2026-05-05T12:00:00', season_id: null },
  ]

  it('filterPast возвращает только сыгранные', () => {
    expect(filterPast(matches).map(m => m.id)).toEqual([2, 1])
  })

  it('filterUpcoming возвращает только предстоящие, ближайшие сверху', () => {
    expect(filterUpcoming(matches).map(m => m.id)).toEqual([4, 3])
  })

  it('filterBySeason оставляет матчи выбранного сезона', () => {
    expect(filterBySeason(matches, 's1').map(m => m.id)).toEqual([1, 3])
  })

  it('filterBySeason без сезона возвращает всё', () => {
    expect(filterBySeason(matches, null)).toHaveLength(4)
  })

  it('матчи без season_id отсекаются при выбранном сезоне', () => {
    expect(filterBySeason(matches, 's1').some(m => m.season_id === null)).toBe(false)
  })

  it('фильтры не мутируют исходный массив', () => {
    filterPast(matches)
    filterUpcoming(matches)
    expect(matches.map(m => m.id)).toEqual([1, 2, 3, 4])
  })
})
