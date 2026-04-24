import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const CATEGORIES = [
  { id: 'mvp',     label: 'MVP',         emoji: '🏆', color: '#F5A623', field: 'mvp',          unit: '' },
  { id: 'attack',  label: 'Атакующий',   emoji: '⚡', color: '#FF495C', field: 'attack_pts',   unit: 'очк' },
  { id: 'setter',  label: 'Связующий',   emoji: '🤝', color: '#374DF5', field: 'assists',      unit: 'пас' },
  { id: 'server',  label: 'Подающий',    emoji: '🎯', color: '#FF8C42', field: 'aces',         unit: 'эйс' },
  { id: 'blocker', label: 'Блокирующий', emoji: '🛡', color: '#5BB849', field: 'blocks',       unit: 'бл' },
  { id: 'libero',  label: 'Либеро',      emoji: '🔵', color: '#55b8ff', field: 'reception_avg',unit: '%' },
]

function getWeekStart(dateStr) {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function StatsPage({ league, seasonId, leagueName, onBack, onSelectPlayer }) {
  const [rawStats, setRawStats] = useState([])
  const [mvpAwards, setMvpAwards] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('season')
  const [weeks, setWeeks] = useState([])
  const [selectedWeek, setSelectedWeek] = useState(null)

  useEffect(() => {
    if (seasonId) load()
  }, [league, seasonId])

  async function load() {
    setLoading(true)
    const [{ data: statsData }, { data: mvpAwardsData }] = await Promise.all([
      supabase
        .from('match_stats')
        .select('player_id, attack_pts, blocks, aces, assists, reception_pct, players(id, name, position), teams(name), matches!inner(match_date, league, season_id)')
        .eq('matches.league', league)
        .eq('matches.season_id', seasonId),
      supabase
        .from('awards')
        .select('player_id, match_date')
        .eq('league', league)
        .eq('season_id', seasonId)
        .eq('nomination', 'mvp'),
    ])

    const rows = statsData || []
    setRawStats(rows)

    setMvpAwards(mvpAwardsData || [])

    const weekSet = new Set()
    for (const r of rows) {
      if (r.matches?.match_date) weekSet.add(getWeekStart(r.matches.match_date).toISOString())
    }
    const sorted = [...weekSet].sort()
    const weekDates = sorted.map(w => new Date(w))
    setWeeks(weekDates)
    if (weekDates.length > 0) setSelectedWeek(weekDates[weekDates.length - 1])
    setLoading(false)
  }

  const filteredStats = viewMode === 'season' ? rawStats : rawStats.filter(s => {
    if (!s.matches?.match_date || !selectedWeek) return false
    return Math.abs(getWeekStart(s.matches.match_date) - selectedWeek) < 1000
  })

  const mvpCounts = {}
  const filteredMvpAwards = viewMode === 'season' ? mvpAwards : mvpAwards.filter(a => {
    if (!a.match_date || !selectedWeek) return false
    return Math.abs(getWeekStart(a.match_date) - selectedWeek) < 1000
  })
  for (const award of filteredMvpAwards) {
    if (!award.player_id) continue
    mvpCounts[award.player_id] = (mvpCounts[award.player_id] || 0) + 1
  }

  // Агрегируем по игроку
  const playerMap = {}
  for (const s of filteredStats) {
    const pid = s.player_id
    if (!playerMap[pid]) {
      playerMap[pid] = {
        player_id: pid,
        name: s.players?.name || '?',
        position: s.players?.position,
        team: s.teams?.name || '',
        attack_pts: 0, blocks: 0, aces: 0, assists: 0,
        reception_sum: 0, reception_count: 0,
      }
    }
    playerMap[pid].attack_pts += s.attack_pts || 0
    playerMap[pid].blocks += s.blocks || 0
    playerMap[pid].aces += s.aces || 0
    playerMap[pid].assists += s.assists || 0
    if (s.reception_pct != null) {
      playerMap[pid].reception_sum += s.reception_pct
      playerMap[pid].reception_count++
    }
  }

  const players = Object.values(playerMap).map(p => ({
    ...p,
    reception_avg: p.reception_count > 0 ? Math.round(p.reception_sum / p.reception_count * 10) / 10 : null,
    mvp: mvpCounts[p.player_id] || 0,
  }))

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 32, height: 32, border: '2px solid #374DF5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div>
      <button onClick={onBack} style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 14px', fontWeight: 600, marginBottom: 28, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        ← Назад
      </button>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          Статистика игроков
        </h1>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{leagueName}</div>
      </div>

      {/* Переключатель режима */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 3, gap: 2 }}>
          {[
            { id: 'season', label: 'За сезон' },
            { id: 'week',   label: 'По турам' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setViewMode(id)} style={{
              background: viewMode === id ? 'linear-gradient(135deg, #374DF5, #6366f1)' : 'transparent',
              color: viewMode === id ? '#fff' : 'rgba(255,255,255,0.45)',
              border: 'none', borderRadius: 7, padding: '7px 18px', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: viewMode === id ? '0 2px 10px rgba(55,77,245,0.4)' : 'none',
            }}>{label}</button>
          ))}
        </div>

        {viewMode === 'week' && weeks.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {weeks.map((w, i) => {
              const active = selectedWeek && Math.abs(w - selectedWeek) < 1000
              return (
                <button key={i} onClick={() => setSelectedWeek(w)} style={{
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  border: active ? '1px solid rgba(55,77,245,0.6)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: '6px 12px',
                  background: active ? 'rgba(55,77,245,0.2)' : 'rgba(255,255,255,0.05)',
                  color: active ? '#8b97ff' : 'rgba(255,255,255,0.5)',
                }}>
                  Тур {i + 1}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {players.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 56, color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>
          Статистика ещё не заполнена
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {CATEGORIES.map(cat => {
            const ranked = players
              .filter(p => { const v = p[cat.field]; return v != null && v > 0 })
              .sort((a, b) => (b[cat.field] || 0) - (a[cat.field] || 0))
              .slice(0, 5)

            if (ranked.length === 0) return null
            const maxVal = ranked[0][cat.field] || 1

            return (
              <div key={cat.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8, background: `${cat.color}0f` }}>
                  <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{cat.label}</span>
                  <div style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: cat.color, boxShadow: `0 0 6px ${cat.color}` }} />
                </div>

                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {ranked.map((p, idx) => {
                    const val = p[cat.field] || 0
                    const barPct = maxVal > 0 ? (val / maxVal) * 100 : 0
                    const valLabel = cat.id === 'libero' ? `${val}%` : cat.unit ? `${val} ${cat.unit}` : String(val)
                    return (
                      <div key={p.player_id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: idx === 0 ? cat.color : 'rgba(255,255,255,0.25)', width: 14, flexShrink: 0, textAlign: 'center' }}>
                            {idx + 1}
                          </span>
                          <span
                            onClick={() => onSelectPlayer && onSelectPlayer(p.player_id)}
                            style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#fff', cursor: onSelectPlayer ? 'pointer' : 'default', textDecoration: onSelectPlayer ? 'underline' : 'none', textDecorationColor: 'rgba(255,255,255,0.2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {p.name}
                          </span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.team}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: idx === 0 ? cat.color : 'rgba(255,255,255,0.7)', flexShrink: 0, minWidth: 40, textAlign: 'right' }}>
                            {valLabel}
                          </span>
                        </div>
                        <div style={{ marginLeft: 22, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
                          <div style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}99)`, width: `${barPct}%`, transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
