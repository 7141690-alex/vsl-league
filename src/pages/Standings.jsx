import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import CalendarWidget from '../components/CalendarWidget'
import AwardBadge, { AWARD_CONFIG } from '../components/AwardBadge'
import { buildStandings } from '../lib/standings'
import { filterBySeason } from '../lib/matches'

export default function Standings({ league, seasonId, seasonsReady = true, onSelectTeam, onShowAwards, onSelectPlayer }) {
  const [teams, setTeams] = useState([])
  const [matches, setMatches] = useState([])
  const [leagueConfig, setLeagueConfig] = useState(null)
  const [baseLoading, setBaseLoading] = useState(true)
  const [awardsDone, setAwardsDone] = useState(false)

  // Данные лиги не зависят от сезона — стартуют сразу, не дожидаясь ответа по сезонам.
  useEffect(() => {
    let cancelled = false
    async function load() {
      setBaseLoading(true)
      const [{ data: lgData }, { data: teamsData }, { data: matchesData }] = await Promise.all([
        supabase.from('leagues').select('playoff_spots, relegation_spots').eq('name', league).single(),
        supabase.from('teams').select('*, season_teams(season_id)').eq('league', league),
        supabase.from('matches').select('*').eq('league', league).eq('status', 'finished'),
      ])
      if (cancelled) return
      setLeagueConfig(lgData)
      setTeams(teamsData || [])
      setMatches(matchesData || [])
      setBaseLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [league])

  // Команды сезона — из встроенной связи season_teams (отдельный запрос ждал бы ответа по сезонам)
  const seasonTeams = seasonId
    ? teams.filter(t => t.season_teams?.some(st => st.season_id === seasonId))
    : teams
  const loading = baseLoading || !seasonsReady
  const seasonMatches = filterBySeason(matches, seasonId)

  const standings = buildStandings(seasonTeams, seasonMatches)

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (standings.length === 0) return (
    <div className="text-center py-20 text-white/40">Команды не добавлены</div>
  )

  const playoffSpots = leagueConfig?.playoff_spots ?? 3
  const relegationSpots = leagueConfig?.relegation_spots ?? 2

  const zoneColor = (i) => {
    if (i < playoffSpots) return '#374DF5'
    if (relegationSpots > 0 && i >= standings.length - relegationSpots) return '#FF495C'
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

    <AwardsWidget league={league} seasonId={seasonId} onShowAwards={onShowAwards} onSelectPlayer={onSelectPlayer} onDone={() => setAwardsDone(true)} />
    {/* Календарь ниже сгиба: монтируем после номинаций, иначе их появление сдвигает его (CLS) */}
    {awardsDone && <CalendarWidget league={league} seasonId={seasonId} />}
    </>
  )
}

function AwardsWidget({ league, seasonId, onShowAwards, onSelectPlayer, onDone }) {
  const [awards, setAwards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('awards')
        .select('*, players(name), teams(name)')
        .eq('league', league)
        .order('created_at', { ascending: false })
      const all = data || []
      setAwards(seasonId ? all.filter(a => a.season_id === seasonId) : all)
      setLoading(false)
      onDone?.()
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- onDone — одноразовый флаг, перезапуск загрузки не нужен
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
                  <span
                    onClick={() => onSelectPlayer && a.player_id && onSelectPlayer(a.player_id)}
                    style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: onSelectPlayer && a.player_id ? 'pointer' : 'default', borderBottom: onSelectPlayer && a.player_id ? '1px solid rgba(255,255,255,0.25)' : 'none', paddingBottom: 1 }}
                  >
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
