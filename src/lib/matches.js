// Фильтрация и сортировка матчей — общая для TeamPage, Schedule и календаря.

/** Сыгранные матчи, новые сверху. */
export function filterPast(matches) {
  return matches
    .filter(m => m.status === 'finished')
    .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))
}

/** Предстоящие матчи, ближайшие сверху. */
export function filterUpcoming(matches) {
  return matches
    .filter(m => m.status === 'scheduled')
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
}

/**
 * Матчи выбранного сезона. seasonId === null означает «без фильтра».
 * Три страницы делали это одинаковым inline-фильтром.
 */
export function filterBySeason(matches, seasonId) {
  if (!seasonId) return matches
  return matches.filter(m => m.season_id === seasonId)
}
