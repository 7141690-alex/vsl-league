import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import AwardBadge, { AWARD_CONFIG } from '../components/AwardBadge'

function SectionHeader({ icon, title, accent, count, countLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{ width: 3, height: 20, borderRadius: 2, background: accent, flexShrink: 0 }} />
      {icon}
      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{title}</span>
      {count !== undefined && (
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.07)', borderRadius: 6, padding: '2px 8px' }}>
          {count} {countLabel}
        </span>
      )}
    </div>
  )
}

function MatchRow({ match, teamId, teams }) {
  const isHome = match.home_team_id === teamId
  const opponent = teams[isHome ? match.away_team_id : match.home_team_id]
  const finished = match.status === 'finished'
  const mySets = isHome ? match.home_sets : match.away_sets
  const oppSets = isHome ? match.away_sets : match.home_sets
  const won = finished && mySets > oppSets
  const sets = (match.set_scores || []).sort((a, b) => a.set_number - b.set_number)

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      {/* Date/Time */}
      <div style={{ minWidth: 90, flexShrink: 0 }}>
        {match.match_date && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>
              {new Date(match.match_date).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374DF5', marginTop: 1 }}>
              {new Date(match.match_date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </>
        )}
      </div>

      {/* Opponent */}
      <div style={{ flex: 1, fontWeight: 600, fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {opponent?.name || '—'}
      </div>

      {/* Result or venue */}
      {finished ? (
        <div style={{ width: 72, flexShrink: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <span style={{ width: 20, textAlign: 'center', color: won ? '#5BB849' : '#FF495C' }}>{mySets}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>–</span>
            <span style={{ width: 20, textAlign: 'center', color: 'rgba(255,255,255,0.35)' }}>{oppSets}</span>
          </div>
          {sets.length > 0 && (
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 1 }}>
              {sets.map(s => isHome ? `${s.home_points}–${s.away_points}` : `${s.away_points}–${s.home_points}`).join(' ')}
            </div>
          )}
        </div>
      ) : match.venue ? (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>📍 {match.venue}</div>
      ) : null}

      {/* W/L circle */}
      {finished && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: won ? 'rgba(91,184,73,0.15)' : 'rgba(255,73,92,0.15)',
          border: `1px solid ${won ? 'rgba(91,184,73,0.4)' : 'rgba(255,73,92,0.4)'}`,
          fontSize: 11, fontWeight: 800,
          color: won ? '#5BB849' : '#FF495C',
        }}>
          {won ? 'В' : 'П'}
        </div>
      )}

      {/* Media icons */}
      {finished && (match.photo_url || match.video_url) && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {match.photo_url && (
            <a href={match.photo_url} target="_blank" rel="noopener noreferrer"
              style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
              title="Фотоотчёт">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="15" rx="3" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8"/>
                <circle cx="12" cy="12.5" r="3.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8"/>
                <path d="M8 5l1.5-2h5L16 5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinejoin="round"/>
              </svg>
            </a>
          )}
          {match.video_url && (
            <a href={match.video_url} target="_blank" rel="noopener noreferrer"
              style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,0,0,0.15)', border: '1px solid rgba(255,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
              title="Видеозапись">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="3" fill="rgba(255,50,50,0.8)"/>
                <path d="M10 9l6 3-6 3V9z" fill="#fff"/>
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default function TeamPage({ team, league, seasonId, onBack, onSelectPlayer }) {
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [teams, setTeams] = useState({})
  const [loading, setLoading] = useState(true)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [awardsMap, setAwardsMap] = useState({})

  useEffect(() => {
    async function load() {
      setLoading(true)

      let memberQuery = supabase.from('team_memberships')
        .select('id, jersey_number, is_captain, player_id, players(id, name, height, birth_date, gender)')
        .eq('team_id', team.id)
        .order('jersey_number', { ascending: true, nullsFirst: false })
      memberQuery = seasonId ? memberQuery.eq('season_id', seasonId) : memberQuery.is('left_at', null)

      let matchQuery = supabase.from('matches')
        .select('*, set_scores(*)')
        .eq('league', league)
        .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
        .order('match_date')
      if (seasonId) matchQuery = matchQuery.eq('season_id', seasonId)

      const [{ data: membershipsData }, { data: matchesData }, { data: teamsData }, { data: awardsData }] = await Promise.all([
        memberQuery,
        matchQuery,
        supabase.from('teams').select('*').eq('league', league),
        seasonId
          ? supabase.from('awards').select('player_id, nomination').eq('team_id', team.id).eq('season_id', seasonId)
          : supabase.from('awards').select('player_id, nomination').eq('team_id', team.id),
      ])
      setPlayers(membershipsData || [])
      setTeams((teamsData || []).reduce((acc, t) => ({ ...acc, [t.id]: t }), {}))
      setMatches(matchesData || [])
      const map = {}
      for (const a of (awardsData || [])) {
        if (!map[a.player_id]) map[a.player_id] = []
        map[a.player_id].push(a.nomination)
      }
      setAwardsMap(map)
      setLoading(false)
    }
    load()
  }, [team.id, league, seasonId])

  const pastMatches = matches
    .filter(m => m.status === 'finished')
    .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))

  const upcomingMatches = matches
    .filter(m => m.status === 'scheduled')
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))

  const wins = pastMatches.filter(m => {
    const isHome = m.home_team_id === team.id
    const my = isHome ? m.home_sets : m.away_sets
    const opp = isHome ? m.away_sets : m.home_sets
    return my > opp
  }).length

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 32, height: 32, border: '2px solid #374DF5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div>
      {/* Back */}
      <button
        onClick={onBack}
        style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 14px', fontWeight: 600, marginBottom: 28, display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        ← Назад к таблице
      </button>

      {/* Lightbox */}
      {photoOpen && team.photo_url && (
        <div
          onClick={() => setPhotoOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, cursor: 'zoom-out' }}
        >
          <img
            src={team.photo_url}
            alt={team.name}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12 }}
          />
        </div>
      )}

      {/* Team header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {team.photo_url && (
            <img
              src={team.photo_url}
              alt={team.name}
              onClick={() => setPhotoOpen(true)}
              style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', cursor: 'zoom-in', flexShrink: 0 }}
            />
          )}
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: '0 0 5px' }}>{team.name}</h1>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
              {league === 'male' ? '♂ Мужская лига' : '♀ Женская лига'}
            </div>
          </div>
        </div>
        {pastMatches.length > 0 && (
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ textAlign: 'center', background: 'rgba(91,184,73,0.1)', border: '1px solid rgba(91,184,73,0.2)', borderRadius: 10, padding: '10px 18px' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#5BB849', lineHeight: 1 }}>{wins}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>Побед</div>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(255,73,92,0.08)', border: '1px solid rgba(255,73,92,0.18)', borderRadius: 10, padding: '10px 18px' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FF495C', lineHeight: 1 }}>{pastMatches.length - wins}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>Поражений</div>
            </div>
          </div>
        )}
      </div>

      {/* Players */}
      <div style={{ marginBottom: 36 }}>
        <SectionHeader
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.5" stroke="#374DF5" strokeWidth="1.8"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#374DF5" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          }
          title="Состав команды"
          accent="#374DF5"
          count={players.length}
          countLabel={players.length === 1 ? 'игрок' : players.length < 5 ? 'игрока' : 'игроков'}
        />
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 90px', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ textAlign: 'center' }}>#</div>
            <div>Игрок</div>
            <div style={{ textAlign: 'center' }}>Рост</div>
          </div>
          {players.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
              Состав не заполнен
            </div>
          ) : (
            players.map((m, i) => {
              const p = m.players || {}
              return (
              <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '44px 1fr 90px', padding: '12px 16px', alignItems: 'center', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: m.jersey_number != null ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)' }}>
                  {m.jersey_number != null ? m.jersey_number : '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  <span
                    onClick={() => onSelectPlayer && onSelectPlayer(m.player_id)}
                    style={{ fontSize: 13, fontWeight: 600, color: '#fff', cursor: onSelectPlayer ? 'pointer' : 'default', borderBottom: onSelectPlayer ? '1px solid rgba(255,255,255,0.25)' : 'none', paddingBottom: 1 }}
                  >
                    {p.name}
                  </span>
                  {m.is_captain && (
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#F5A623', background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 4, padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                      C
                    </span>
                  )}
                  {(awardsMap[m.player_id] || []).map((nom, idx) => (
                    <AwardBadge key={idx} nomination={nom} size={16} />
                  ))}
                </div>
                <div style={{ textAlign: 'center' }}>
                  {p.height ? (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#374DF5', background: 'rgba(55,77,245,0.12)', borderRadius: 6, padding: '3px 10px' }}>
                      {p.height} см
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>—</span>
                  )}
                </div>
              </div>
              )
            })
          )}
        </div>
      </div>

      {/* Team nominations */}
      <TeamAwardsWidget teamId={team.id} seasonId={seasonId} />

      {/* Upcoming games */}
      {upcomingMatches.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <SectionHeader
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="17" rx="3" stroke="#374DF5" strokeWidth="1.8"/>
                <path d="M3 9h18" stroke="#374DF5" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M8 2v4M16 2v4" stroke="#374DF5" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            }
            title="Предстоящие игры"
            accent="#374DF5"
            count={upcomingMatches.length}
            countLabel={upcomingMatches.length === 1 ? 'игра' : upcomingMatches.length < 5 ? 'игры' : 'игр'}
          />
          {upcomingMatches.map(m => (
            <MatchRow key={m.id} match={m} teamId={team.id} teams={teams} />
          ))}
        </div>
      )}

      {/* Past results */}
      <div style={{ marginBottom: 36 }}>
        <SectionHeader
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#5BB849" strokeWidth="1.8"/>
              <path d="M7.5 12l3 3 6-6" stroke="#5BB849" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          title="Сыгранные игры"
          accent="#5BB849"
          count={pastMatches.length}
          countLabel={pastMatches.length === 1 ? 'игра' : pastMatches.length < 5 ? 'игры' : 'игр'}
        />
        {pastMatches.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '24px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
            Игр ещё не было
          </div>
        ) : (
          pastMatches.map(m => (
            <MatchRow key={m.id} match={m} teamId={team.id} teams={teams} />
          ))
        )}
      </div>
    </div>
  )
}

function TeamAwardsWidget({ teamId, seasonId }) {
  const [awards, setAwards] = useState([])

  useEffect(() => {
    let query = supabase
      .from('awards')
      .select('*, players(name)')
      .eq('team_id', teamId)
      .order('match_date', { ascending: false })
    if (seasonId) query = query.eq('season_id', seasonId)
    query.then(({ data }) => setAwards(data || []))
  }, [teamId, seasonId])

  if (awards.length === 0) return null

  return (
    <div style={{ marginBottom: 36, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 15 }}>🏅</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Номинации</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.07)', borderRadius: 6, padding: '2px 8px' }}>
          {awards.length}
        </span>
      </div>
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {awards.map((a, i) => {
          const cfg = AWARD_CONFIG[a.nomination]
          const stat = a.nomination !== 'mvp' && a.stat_value != null
            ? `${a.stat_value}${a.nomination === 'libero' ? '%' : ` ${cfg?.statLabel}`}`
            : null
          return (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <AwardBadge nomination={a.nomination} size={a.nomination === 'mvp' ? 36 : 22} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{a.players?.name || '—'}</span>
                  {stat && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: cfg?.mid, background: `${cfg?.mid}22`, borderRadius: 6, padding: '1px 7px', flexShrink: 0 }}>
                      {stat}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{cfg?.label}</span>
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
