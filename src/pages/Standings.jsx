import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import CalendarWidget from '../components/CalendarWidget'
import AwardBadge, { AWARD_CONFIG } from '../components/AwardBadge'

export default function Standings({ league, seasonId, onSelectTeam, onShowAwards }) {
  const [teams, setTeams] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)

      // Команды: если есть сезон — получаем team_id из season_teams, затем загружаем команды по id
      let teamsPromise
      if (seasonId) {
        const { data: stData } = await supabase.from('season_teams').select('team_id').eq('season_id', seasonId)
        const teamIds = (stData || []).map(r => r.team_id)
        teamsPromise = teamIds.length > 0
          ? supabase.from('teams').select('*').in('id', teamIds).eq('league', league)
          : Promise.resolve({ data: [] })
      } else {
        teamsPromise = supabase.from('teams').select('*').eq('league', league)
      }

      // Матчи фильтруем по сезону если есть
      let matchQuery = supabase.from('matches').select('*').eq('league', league).eq('status', 'finished')
      if (seasonId) matchQuery = matchQuery.eq('season_id', seasonId)

      const [{ data: teamsData }, { data: matchesData }] = await Promise.all([teamsPromise, matchQuery])
      setTeams(teamsData || [])
      setMatches(matchesData || [])
      setLoading(false)
    }
    load()
  }, [league, seasonId])

  const standings = teams.map(team => {
    const teamMatches = matches.filter(
      m => m.home_team_id === team.id || m.away_team_id === team.id
    )
    let wins = 0, losses = 0, setsWon = 0, setsLost = 0, points = 0

    teamMatches.forEach(m => {
      const isHome = m.home_team_id === team.id
      const mySets = isHome ? m.home_sets : m.away_sets
      const oppSets = isHome ? m.away_sets : m.home_sets
      setsWon += mySets
      setsLost += oppSets
      const won = mySets > oppSets
      if (won) {
        wins++
        points += oppSets === 2 ? 2 : 3
      } else {
        losses++
        points += mySets === 2 ? 1 : 0
      }
    })

    return { ...team, played: teamMatches.length, wins, losses, setsWon, setsLost, points }
  }).sort((a, b) => b.points - a.points || b.wins - a.wins)

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (standings.length === 0) return (
    <div className="text-center py-20 text-white/40">Команды не добавлены</div>
  )

  const zoneColor = (i) => {
    if (i < 3) return '#374DF5'
    if (i >= standings.length - 2) return '#FF495C'
    return 'transparent'
  }

  return (
    <>
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden', width: '100%' }}>
      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '4px 28px 1fr 28px 28px 28px 38px 38px 46px', width: '100%', padding: '12px 10px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.35)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div></div>
        <div style={{ textAlign: 'center' }}>#</div>
        <div>Команда</div>
        <div style={{ textAlign: 'center' }}>И</div>
        <div style={{ textAlign: 'center' }}>В</div>
        <div style={{ textAlign: 'center' }}>П</div>
        <div style={{ textAlign: 'center' }}>СВ</div>
        <div style={{ textAlign: 'center' }}>СП</div>
        <div style={{ textAlign: 'center' }}>Очки</div>
      </div>

      {standings.map((team, i) => (
        <div
          key={team.id}
          onClick={() => onSelectTeam && onSelectTeam(team)}
          style={{
            display: 'grid', gridTemplateColumns: '4px 28px 1fr 28px 28px 28px 38px 38px 46px',
            width: '100%', padding: '12px 10px', alignItems: 'center', position: 'relative',
            borderBottom: i < standings.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            background: i === 0 ? 'rgba(55,77,245,0.08)' : 'transparent',
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = i === 0 ? 'rgba(55,77,245,0.08)' : 'transparent'}
        >
          {/* Zone bar */}
          <div style={{ width: 3, height: '60%', borderRadius: 2, background: zoneColor(i), position: 'absolute', left: 0, top: '20%' }} />

          {/* Zone bar spacing cell */}
          <div />

          {/* Rank */}
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 13, color: i === 0 ? '#374DF5' : 'rgba(255,255,255,0.4)' }}>
            {i + 1}
          </div>

          {/* Team name */}
          <div style={{ fontWeight: 600, fontSize: 13, paddingLeft: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {i === 0 && <span style={{ marginRight: 6 }}>🏆</span>}
            <span style={{ color: i < 3 ? '#fff' : 'rgba(255,255,255,0.75)', borderBottom: '1px solid rgba(255,255,255,0.18)', paddingBottom: 1 }}>{team.name}</span>
          </div>

          <div className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{team.played}</div>
          <div className="text-center text-sm font-semibold" style={{ color: '#5BB849' }}>{team.wins}</div>
          <div className="text-center text-sm" style={{ color: '#FF495C' }}>{team.losses}</div>
          <div className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{team.setsWon}</div>
          <div className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{team.setsLost}</div>

          {/* Points */}
          <div className="text-center">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-sm font-black"
              style={i === 0
                ? { background: '#374DF5', color: '#fff', boxShadow: '0 0 12px rgba(55,77,245,0.6)' }
                : { background: 'rgba(255,255,255,0.1)', color: '#fff' }
              }>
              {team.points}
            </span>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex gap-4 px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <div className="w-2 h-2 rounded-full bg-blue-500" /> Зона плей-офф
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <div className="w-2 h-2 rounded-full bg-red-500" /> Зона вылета
        </div>
      </div>
    </div>

    <AwardsWidget league={league} seasonId={seasonId} onShowAwards={onShowAwards} />
    <CalendarWidget league={league} />
    </>
  )
}

function AwardsWidget({ league, seasonId, onShowAwards }) {
  const [awards, setAwards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase
        .from('awards')
        .select('*, players(name), teams(name)')
        .eq('league', league)
        .order('match_date', { ascending: false })
      if (seasonId) query = query.eq('season_id', seasonId)
      const { data } = await query
      setAwards(data || [])
      setLoading(false)
    }
    load()
  }, [league, seasonId])

  if (loading || awards.length === 0) return null

  return (
    <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div
        onClick={onShowAwards}
        style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: onShowAwards ? 'pointer' : 'default', transition: 'background 0.15s' }}
        onMouseEnter={e => { if (onShowAwards) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🏅</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Номинации</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '2px 8px' }}>{awards.length}</span>
        </div>
        {onShowAwards && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Все →</span>
        )}
      </div>

      {/* Scrollable list */}
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {awards.map((a, i) => {
          const cfg = AWARD_CONFIG[a.nomination]
          const stat = a.stat_value != null
            ? `${a.stat_value}${a.nomination === 'libero' ? '%' : ` ${cfg?.statLabel}`}`
            : null
          return (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px',
              borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <AwardBadge nomination={a.nomination} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.players?.name || '—'}
                  </span>
                  {stat && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: cfg?.mid, background: `${cfg?.mid}22`, borderRadius: 6, padding: '1px 7px', flexShrink: 0 }}>
                      {stat}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{cfg?.label}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>·</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{a.teams?.name}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>·</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                    {new Date(a.match_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
