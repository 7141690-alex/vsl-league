// Доменная логика лиги.
//
// Раньше эти правила жили прямо в Standings.jsx и TeamPage.jsx, а тесты
// содержали собственные копии тех же функций — то есть проверяли копию,
// а не приложение. Теперь и страницы, и тесты используют этот модуль.

/** Очки за матч: 3:0 и 3:1 → 3 очка победителю и 0 проигравшему, 3:2 → 2 и 1. */
export function pointsForMatch(mySets, oppSets) {
  if (mySets > oppSets) return oppSets === 2 ? 2 : 3
  return mySets === 2 ? 1 : 0
}

/** Сыграл ли матч указанная команда. */
export function isTeamMatch(match, teamId) {
  return match.home_team_id === teamId || match.away_team_id === teamId
}

/** Сеты матча со стороны указанной команды: { mySets, oppSets }. */
export function setsFor(match, teamId) {
  const isHome = match.home_team_id === teamId
  return {
    mySets: isHome ? match.home_sets : match.away_sets,
    oppSets: isHome ? match.away_sets : match.home_sets,
  }
}

/** Победила ли команда в матче (без учёта статуса). */
export function isWin(match, teamId) {
  const { mySets, oppSets } = setsFor(match, teamId)
  return mySets > oppSets
}

/**
 * Строка турнирной таблицы для одной команды по списку сыгранных матчей.
 * Матчи должны быть уже отфильтрованы по status === 'finished'.
 */
export function buildTeamRow(team, finishedMatches) {
  const teamMatches = finishedMatches.filter(m => isTeamMatch(m, team.id))

  let wins = 0, losses = 0, setsWon = 0, setsLost = 0, points = 0

  for (const m of teamMatches) {
    const { mySets, oppSets } = setsFor(m, team.id)
    setsWon += mySets
    setsLost += oppSets
    if (mySets > oppSets) wins++
    else losses++
    points += pointsForMatch(mySets, oppSets)
  }

  return { ...team, played: teamMatches.length, wins, losses, setsWon, setsLost, points }
}

/**
 * Турнирная таблица: очки, затем победы, затем разница сетов.
 * Разница сетов — обычный третий критерий; без неё команды с равными
 * очками и победами вставали в произвольном порядке.
 */
export function buildStandings(teams, finishedMatches) {
  return teams
    .map(team => buildTeamRow(team, finishedMatches))
    .sort((a, b) =>
      b.points - a.points ||
      b.wins - a.wins ||
      (b.setsWon - b.setsLost) - (a.setsWon - a.setsLost) ||
      b.setsWon - a.setsWon
    )
}
