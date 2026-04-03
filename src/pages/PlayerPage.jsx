import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import AwardBadge, { AWARD_CONFIG } from '../components/AwardBadge'

const POSITION_LABEL = { setter: 'Связующий', outside: 'Доигровщик', opposite: 'Диагональный', middle: 'Центральный блокирующий', libero: 'Либеро' }

function StatPill({ label, value, accent }) {
  return (
    <div style={{ background: accent ? 'rgba(55,77,245,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${accent ? 'rgba(55,77,245,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, padding: '8px 14px', textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: accent ? '#7b93ff' : '#fff' }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function PlayerPage({ playerId, onBack }) {
  const [player, setPlayer] = useState(null)
  const [memberships, setMemberships] = useState([])
  const [awards, setAwards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: p }, { data: m }, { data: a }] = await Promise.all([
        supabase.from('players').select('*').eq('id', playerId).single(),
        supabase.from('team_memberships').select('*, teams(name, league)').eq('player_id', playerId).order('joined_at', { ascending: false }),
        supabase.from('awards').select('*, teams(name), seasons(name)').eq('player_id', playerId).order('match_date', { ascending: false }),
      ])
      setPlayer(p)
      setMemberships(m || [])
      setAwards(a || [])
      setLoading(false)
    }
    load()
  }, [playerId])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 32, height: 32, border: '2px solid #374DF5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
  if (!player) return null

  const currentMembership = memberships.find(m => !m.left_at)
  const isFemale = player.gender === 'female'

  return (
    <div>
      {/* Back */}
      <button onClick={onBack} style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 14px', fontWeight: 600, marginBottom: 28, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        ← Назад
      </button>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
          {player.photo_url && (
            <img src={player.photo_url} alt={player.name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 18, color: isFemale ? '#f472b6' : '#60a5fa', fontWeight: 700, lineHeight: 1 }}>
                {isFemale ? '♀' : '♂'}
              </span>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
                {player.name}
              </h1>
            </div>
            {(player.position || player.position2) && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                {player.position && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#7b93ff', background: 'rgba(55,77,245,0.15)', border: '1px solid rgba(55,77,245,0.3)', borderRadius: 6, padding: '2px 8px' }}>
                    {POSITION_LABEL[player.position] || player.position}
                  </span>
                )}
                {player.position2 && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '2px 8px' }}>
                    {POSITION_LABEL[player.position2] || player.position2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Badges row */}
        {awards.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
            {awards.map((a, i) => <AwardBadge key={i} nomination={a.nomination} size={a.nomination === 'mvp' ? 36 : 20} />)}
          </div>
        )}

        {/* Stats pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {player.height && <StatPill label="Рост" value={`${player.height} см`} />}
          {currentMembership && <StatPill label="Команда" value={currentMembership.teams?.name} accent />}
          <StatPill label="Наград" value={awards.length} />
        </div>
      </div>

      {/* Awards */}
      {awards.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: '#d97706' }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Номинации</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.07)', borderRadius: 6, padding: '2px 8px' }}>{awards.length}</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
            {(() => {
              const rows = []
              let lastSeasonId = undefined
              awards.forEach((a, i) => {
                const cfg = AWARD_CONFIG[a.nomination]
                const stat = a.nomination !== 'mvp' && a.stat_value != null
                  ? `${a.stat_value}${a.nomination === 'libero' ? '%' : ` ${cfg?.statLabel}`}`
                  : null
                const seasonId = a.season_id || null
                const seasonName = a.seasons?.name || null

                if (seasonId !== lastSeasonId) {
                  lastSeasonId = seasonId
                  rows.push(
                    <div key={`season-${seasonId}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ width: 3, height: 12, borderRadius: 2, background: '#374DF5', flexShrink: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {seasonName || 'Без сезона'}
                      </span>
                    </div>
                  )
                }

                rows.push(
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <AwardBadge nomination={a.nomination} size={a.nomination === 'mvp' ? 36 : 22} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{cfg?.label}</span>
                        {stat && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: cfg?.mid, background: `${cfg?.mid}22`, borderRadius: 6, padding: '1px 7px' }}>{stat}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                        {a.teams?.name} · {new Date(a.match_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                )
              })
              return rows
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
