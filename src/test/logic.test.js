import { describe, it, expect } from 'vitest'

// ─── Helpers (extracted from TeamPage logic) ──────────────────────────────────

function isWin(match, teamId) {
  const isHome = match.home_team_id === teamId
  const my = isHome ? match.home_sets : match.away_sets
  const opp = isHome ? match.away_sets : match.home_sets
  return my > opp
}

function filterPast(matches) {
  return matches
    .filter(m => m.status === 'finished')
    .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))
}

function filterUpcoming(matches) {
  return matches
    .filter(m => m.status === 'scheduled')
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
}

function countWins(matches, teamId) {
  return filterPast(matches).filter(m => isWin(m, teamId)).length
}

function sortPlayersByJersey(players) {
  return [...players].sort((a, b) => {
    if (a.jersey_number == null && b.jersey_number == null) return 0
    if (a.jersey_number == null) return 1
    if (b.jersey_number == null) return -1
    return a.jersey_number - b.jersey_number
  })
}

function hasCaptain(players) {
  return players.some(p => p.is_captain)
}

function canSetCaptain(players, playerId) {
  const player = players.find(p => p.id === playerId)
  if (!player) return false
  if (player.is_captain) return true // already captain, can unset
  return !hasCaptain(players)        // can only set if no one else is captain
}

// ─── Match result logic ───────────────────────────────────────────────────────

describe('Match win/loss detection', () => {
  const TEAM = 'team-1'

  it('home team wins when home_sets > away_sets', () => {
    const match = { home_team_id: TEAM, away_team_id: 'team-2', home_sets: 3, away_sets: 1 }
    expect(isWin(match, TEAM)).toBe(true)
  })

  it('home team loses when home_sets < away_sets', () => {
    const match = { home_team_id: TEAM, away_team_id: 'team-2', home_sets: 0, away_sets: 3 }
    expect(isWin(match, TEAM)).toBe(false)
  })

  it('away team wins when away_sets > home_sets', () => {
    const match = { home_team_id: 'team-2', away_team_id: TEAM, home_sets: 1, away_sets: 3 }
    expect(isWin(match, TEAM)).toBe(true)
  })

  it('away team loses when away_sets < home_sets', () => {
    const match = { home_team_id: 'team-2', away_team_id: TEAM, home_sets: 3, away_sets: 0 }
    expect(isWin(match, TEAM)).toBe(false)
  })

  it('handles tie (3:3 — technically impossible in volleyball, but code must not crash)', () => {
    const match = { home_team_id: TEAM, away_team_id: 'team-2', home_sets: 3, away_sets: 3 }
    expect(isWin(match, TEAM)).toBe(false)
  })
})

// ─── Match filtering ──────────────────────────────────────────────────────────

describe('Match filtering (past / upcoming)', () => {
  const matches = [
    { id: 1, status: 'finished',  match_date: '2025-03-01T12:00:00', home_team_id: 'a', away_team_id: 'b', home_sets: 3, away_sets: 1 },
    { id: 2, status: 'finished',  match_date: '2025-04-01T12:00:00', home_team_id: 'a', away_team_id: 'b', home_sets: 0, away_sets: 3 },
    { id: 3, status: 'scheduled', match_date: '2025-06-10T12:00:00', home_team_id: 'a', away_team_id: 'b', home_sets: 0, away_sets: 0 },
    { id: 4, status: 'scheduled', match_date: '2025-05-05T12:00:00', home_team_id: 'a', away_team_id: 'b', home_sets: 0, away_sets: 0 },
  ]

  it('filterPast returns only finished matches', () => {
    const past = filterPast(matches)
    expect(past.every(m => m.status === 'finished')).toBe(true)
    expect(past).toHaveLength(2)
  })

  it('filterPast sorts newest first', () => {
    const past = filterPast(matches)
    expect(past[0].id).toBe(2)
    expect(past[1].id).toBe(1)
  })

  it('filterUpcoming returns only scheduled matches', () => {
    const upcoming = filterUpcoming(matches)
    expect(upcoming.every(m => m.status === 'scheduled')).toBe(true)
    expect(upcoming).toHaveLength(2)
  })

  it('filterUpcoming sorts earliest first', () => {
    const upcoming = filterUpcoming(matches)
    expect(upcoming[0].id).toBe(4)
    expect(upcoming[1].id).toBe(3)
  })
})

// ─── Win counter ──────────────────────────────────────────────────────────────

describe('Win counter', () => {
  const TEAM = 'team-a'
  const matches = [
    { status: 'finished', match_date: '2025-01-01', home_team_id: TEAM, away_team_id: 'x', home_sets: 3, away_sets: 0 },
    { status: 'finished', match_date: '2025-01-08', home_team_id: TEAM, away_team_id: 'x', home_sets: 1, away_sets: 3 },
    { status: 'finished', match_date: '2025-01-15', home_team_id: 'x', away_team_id: TEAM, home_sets: 0, away_sets: 3 },
    { status: 'scheduled', match_date: '2025-02-01', home_team_id: TEAM, away_team_id: 'x', home_sets: 0, away_sets: 0 },
  ]

  it('counts wins correctly (ignores scheduled)', () => {
    expect(countWins(matches, TEAM)).toBe(2)
  })

  it('returns 0 when no finished matches', () => {
    const noFinished = matches.filter(m => m.status === 'scheduled')
    expect(countWins(noFinished, TEAM)).toBe(0)
  })
})

// ─── Captain logic ────────────────────────────────────────────────────────────

describe('Captain assignment rules', () => {
  it('hasCaptain returns false when no player is captain', () => {
    const players = [
      { id: 1, name: 'Иванов', is_captain: false },
      { id: 2, name: 'Петров', is_captain: false },
    ]
    expect(hasCaptain(players)).toBe(false)
  })

  it('hasCaptain returns true when one player is captain', () => {
    const players = [
      { id: 1, name: 'Иванов', is_captain: true },
      { id: 2, name: 'Петров', is_captain: false },
    ]
    expect(hasCaptain(players)).toBe(true)
  })

  it('can set captain when no one is captain yet', () => {
    const players = [
      { id: 1, name: 'Иванов', is_captain: false },
      { id: 2, name: 'Петров', is_captain: false },
    ]
    expect(canSetCaptain(players, 1)).toBe(true)
  })

  it('cannot set captain for another player when captain already exists', () => {
    const players = [
      { id: 1, name: 'Иванов', is_captain: true },
      { id: 2, name: 'Петров', is_captain: false },
    ]
    expect(canSetCaptain(players, 2)).toBe(false)
  })

  it('current captain can unset himself (is already captain)', () => {
    const players = [
      { id: 1, name: 'Иванов', is_captain: true },
      { id: 2, name: 'Петров', is_captain: false },
    ]
    expect(canSetCaptain(players, 1)).toBe(true)
  })

  it('returns false for unknown player id', () => {
    const players = [{ id: 1, name: 'Иванов', is_captain: false }]
    expect(canSetCaptain(players, 999)).toBe(false)
  })
})

// ─── Player jersey number sorting ─────────────────────────────────────────────

describe('Player sorting by jersey number', () => {
  it('sorts players by jersey_number ascending', () => {
    const players = [
      { id: 1, name: 'Петров',  jersey_number: 10 },
      { id: 2, name: 'Иванов',  jersey_number: 3 },
      { id: 3, name: 'Сидоров', jersey_number: 7 },
    ]
    const sorted = sortPlayersByJersey(players)
    expect(sorted.map(p => p.jersey_number)).toEqual([3, 7, 10])
  })

  it('players without jersey number go to the end', () => {
    const players = [
      { id: 1, name: 'Петров',  jersey_number: null },
      { id: 2, name: 'Иванов',  jersey_number: 5 },
      { id: 3, name: 'Сидоров', jersey_number: null },
    ]
    const sorted = sortPlayersByJersey(players)
    expect(sorted[0].jersey_number).toBe(5)
    expect(sorted[1].jersey_number).toBeNull()
    expect(sorted[2].jersey_number).toBeNull()
  })

  it('does not mutate original array', () => {
    const players = [
      { id: 1, jersey_number: 9 },
      { id: 2, jersey_number: 1 },
    ]
    const original = [...players]
    sortPlayersByJersey(players)
    expect(players).toEqual(original)
  })

  it('handles empty array', () => {
    expect(sortPlayersByJersey([])).toEqual([])
  })

  it('handles single player', () => {
    const players = [{ id: 1, jersey_number: 7 }]
    expect(sortPlayersByJersey(players)).toHaveLength(1)
  })
})

// ─── Set score display ────────────────────────────────────────────────────────

describe('Set score display from perspective of a team', () => {
  const TEAM = 'team-a'

  it('shows correct set score from home perspective', () => {
    const match = {
      home_team_id: TEAM, away_team_id: 'team-b',
      home_sets: 3, away_sets: 1,
      set_scores: [
        { set_number: 1, home_points: 25, away_points: 20 },
        { set_number: 2, home_points: 22, away_points: 25 },
        { set_number: 3, home_points: 25, away_points: 18 },
        { set_number: 4, home_points: 25, away_points: 23 },
      ]
    }
    const isHome = match.home_team_id === TEAM
    const sets = match.set_scores.sort((a, b) => a.set_number - b.set_number)
    const display = sets.map(s => isHome ? `${s.home_points}–${s.away_points}` : `${s.away_points}–${s.home_points}`)
    expect(display).toEqual(['25–20', '22–25', '25–18', '25–23'])
  })

  it('shows correct set score from away perspective', () => {
    const match = {
      home_team_id: 'team-b', away_team_id: TEAM,
      home_sets: 1, away_sets: 3,
      set_scores: [
        { set_number: 1, home_points: 20, away_points: 25 },
        { set_number: 2, home_points: 25, away_points: 22 },
        { set_number: 3, home_points: 18, away_points: 25 },
        { set_number: 4, home_points: 23, away_points: 25 },
      ]
    }
    const isHome = match.home_team_id === TEAM
    const sets = match.set_scores.sort((a, b) => a.set_number - b.set_number)
    const display = sets.map(s => isHome ? `${s.home_points}–${s.away_points}` : `${s.away_points}–${s.home_points}`)
    expect(display).toEqual(['25–20', '22–25', '25–18', '25–23'])
  })
})
