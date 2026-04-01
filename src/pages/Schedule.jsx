import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function getWeekBounds(offset = 0) {
  const now = new Date()
  const day = now.getDay() === 0 ? 6 : now.getDay() - 1 // Monday=0
  const mon = new Date(now)
  mon.setDate(now.getDate() - day + offset * 7)
  mon.setHours(0, 0, 0, 0)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  sun.setHours(23, 59, 59, 999)
  return { start: mon, end: sun }
}

function groupByDate(matches) {
  return matches.reduce((acc, match) => {
    const date = match.match_date
      ? new Date(match.match_date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
      : 'Дата не указана'
    if (!acc[date]) acc[date] = []
    acc[date].push(match)
    return acc
  }, {})
}

function MatchCard({ match, teams, showDate = false }) {
  const home = teams[match.home_team_id]
  const away = teams[match.away_team_id]
  const finished = match.status === 'finished'
  const homeWon = finished && match.home_sets > match.away_sets
  const awayWon = finished && match.away_sets > match.home_sets
  const sets = (match.set_scores || []).sort((a, b) => a.set_number - b.set_number)

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>

      {/* Time + venue */}
      <div style={{ width: 48, flexShrink: 0, overflow: 'hidden' }}>
        {match.match_date && (
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374DF5' }}>
            {new Date(match.match_date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        {showDate && match.match_date && (
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
            {new Date(match.match_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
          </div>
        )}
        {match.venue && (
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            📍 {match.venue}
          </div>
        )}
      </div>

      {/* Home */}
      <div style={{ flex: 1, textAlign: 'right', fontWeight: 600, fontSize: 13, color: homeWon ? '#fff' : finished ? 'rgba(255,255,255,0.4)' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {home?.name || '—'}
      </div>

      {/* Score */}
      <div style={{ textAlign: 'center', width: 60, flexShrink: 0 }}>
        {finished ? (
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.02em' }}>
              <span style={{ color: homeWon ? '#fff' : 'rgba(255,255,255,0.3)' }}>{match.home_sets}</span>
              <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 3px' }}>–</span>
              <span style={{ color: awayWon ? '#fff' : 'rgba(255,255,255,0.3)' }}>{match.away_sets}</span>
            </div>
            {sets.length > 0 && (
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2, lineHeight: 1.7 }}>
                {sets.map((s, i) => (
                  <div key={i}>{s.home_points}–{s.away_points}</div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.25)' }}>vs</span>
        )}
      </div>

      {/* Away */}
      <div style={{ flex: 1, fontWeight: 600, fontSize: 13, color: awayWon ? '#fff' : finished ? 'rgba(255,255,255,0.4)' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {away?.name || '—'}
      </div>

      {/* Status dot */}
      <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: finished ? '#5BB849' : '#374DF5', boxShadow: `0 0 5px ${finished ? '#5BB849' : '#374DF5'}` }} />
    </div>
  )
}

function WeekBlock({ title, icon, matches, teams, accent, emptyText }) {
  if (matches.length === 0) return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 0 }}>
        {icon}
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{title}</span>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 10 }}>{emptyText}</div>
    </div>
  )

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 3, height: 20, borderRadius: 2, background: accent }} />
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{title}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.07)', borderRadius: 6, padding: '2px 8px' }}>
          {matches.length} {matches.length === 1 ? 'игра' : matches.length < 5 ? 'игры' : 'игр'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matches.map(m => <MatchCard key={m.id} match={m} teams={teams} showDate={true} />)}
      </div>
    </div>
  )
}

export default function Schedule({ league }) {
  const [matches, setMatches] = useState([])
  const [teams, setTeams] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [{ data: matchesData, error: me }, { data: teamsData, error: te }] = await Promise.all([
          supabase.from('matches').select('id, league, home_team_id, away_team_id, match_date, venue, status, home_sets, away_sets').eq('league', league).order('match_date'),
          supabase.from('teams').select('*').eq('league', league),
        ])
        if (me || te) { console.error('Supabase error:', me || te); setLoading(false); return }

        const matchIds = (matchesData || []).map(m => m.id)
        const { data: setsData } = matchIds.length > 0
          ? await supabase.from('set_scores').select('*').in('match_id', matchIds)
          : { data: [] }

        const setsMap = (setsData || []).reduce((acc, s) => {
          if (!acc[s.match_id]) acc[s.match_id] = []
          acc[s.match_id].push(s)
          return acc
        }, {})

        const teamsMap = (teamsData || []).reduce((acc, t) => ({ ...acc, [t.id]: t }), {})
        setTeams(teamsMap)
        setMatches((matchesData || []).map(m => ({ ...m, set_scores: setsMap[m.id] || [] })))
      } catch(e) {
        console.error(e)
      }
      setLoading(false)
    }
    load()
  }, [league])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 32, height: 32, border: '2px solid #374DF5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (matches.length === 0) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>Игры не запланированы</div>
  )

  const thisWeek = getWeekBounds(0)
  const lastWeek = getWeekBounds(-1)

  const thisWeekMatches = matches.filter(m => {
    if (!m.match_date) return false
    const d = new Date(m.match_date)
    return d >= thisWeek.start && d <= thisWeek.end
  })

  const lastWeekMatches = matches.filter(m => {
    if (!m.match_date || m.status !== 'finished') return false
    const d = new Date(m.match_date)
    return d >= lastWeek.start && d <= lastWeek.end
  })

  const grouped = groupByDate(matches)

  return (
    <div>
      {/* This week */}
      <WeekBlock
        title="Игры на этой неделе"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="17" rx="3" stroke="#374DF5" strokeWidth="1.8"/>
            <path d="M3 9h18" stroke="#374DF5" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M8 2v4M16 2v4" stroke="#374DF5" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M8 13h8M8 17h5" stroke="#374DF5" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        }
        matches={thisWeekMatches}
        teams={teams}
        accent="#374DF5"
        emptyText="На этой неделе игр нет"
      />

      {/* Last week results */}
      <WeekBlock
        title="Результаты прошлой недели"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#5BB849" strokeWidth="1.8"/>
            <path d="M7.5 12l3 3 6-6" stroke="#5BB849" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }
        matches={lastWeekMatches}
        teams={teams}
        accent="#5BB849"
        emptyText="На прошлой неделе игр не было"
      />

      {/* All games section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 3, height: 20, borderRadius: 2, background: '#FF8C42' }} />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M4 6h16M4 10h16M4 14h10M4 18h7" stroke="#FF8C42" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Все игры</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.07)', borderRadius: 6, padding: '2px 8px' }}>
          {matches.length} {matches.length === 1 ? 'игра' : matches.length < 5 ? 'игры' : 'игр'}
        </span>
      </div>

      {/* Full schedule grouped by date */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {Object.entries(grouped).map(([date, dayMatches]) => (
          <div key={date}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize', letterSpacing: '0.05em' }}>{date}</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dayMatches.map(match => <MatchCard key={match.id} match={match} teams={teams} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
