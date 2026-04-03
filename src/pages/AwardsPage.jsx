import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import AwardBadge, { AWARD_CONFIG } from '../components/AwardBadge'

const NOMINATIONS = [
  { key: 'all', label: 'Все' },
  ...Object.entries(AWARD_CONFIG).map(([key, cfg]) => ({ key, label: cfg.label })),
]

export default function AwardsPage({ league, seasonId, leagueName, onBack, onSelectPlayer }) {
  const [awards, setAwards] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('awards')
        .select('*, players(name), teams(name)')
        .eq('league', league)
        .order('match_date', { ascending: false })
      const all = data || []
      setAwards(seasonId ? all.filter(a => a.season_id === seasonId) : all)
      setLoading(false)
    }
    load()
  }, [league, seasonId])

  const filtered = filter === 'all' ? awards : awards.filter(a => a.nomination === filter)

  // Group by nomination for summary
  const countByNom = {}
  awards.forEach(a => { countByNom[a.nomination] = (countByNom[a.nomination] || 0) + 1 })

  return (
    <div>
      {/* Back */}
      <button
        onClick={onBack}
        style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 14px', fontWeight: 600, marginBottom: 28, display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        ← Назад
      </button>

      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 22 }}>🏅</span>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
            Номинации
          </h1>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginLeft: 32 }}>
          {leagueName} · {awards.length} наград
        </div>
      </div>

      {/* Summary pills */}
      {awards.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {Object.entries(AWARD_CONFIG).map(([key, cfg]) => {
            if (!countByNom[key]) return null
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px' }}>
                <AwardBadge nomination={key} size={key === 'mvp' ? 28 : 16} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{countByNom[key]}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {NOMINATIONS.map(n => {
          const active = filter === n.key
          return (
            <button
              key={n.key}
              onClick={() => setFilter(n.key)}
              style={{
                fontSize: 12, fontWeight: active ? 700 : 600,
                color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                background: active ? 'rgba(55,77,245,0.25)' : 'rgba(255,255,255,0.05)',
                border: active ? '1px solid rgba(55,77,245,0.5)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: '6px 14px', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {n.label}
              {n.key !== 'all' && countByNom[n.key] ? (
                <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.6 }}>({countByNom[n.key]})</span>
              ) : null}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '2px solid #374DF5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
          Нет наград
        </div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
          {filtered.map((a, i) => {
            const cfg = AWARD_CONFIG[a.nomination]
            const stat = a.stat_value != null
              ? `${a.stat_value}${a.nomination === 'libero' ? '%' : ` ${cfg?.statLabel}`}`
              : null
            return (
              <div
                key={a.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 16px',
                  borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                <AwardBadge nomination={a.nomination} size={a.nomination === 'mvp' ? 38 : 24} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      onClick={() => onSelectPlayer && a.player_id && onSelectPlayer(a.player_id)}
                      style={{ fontSize: 14, fontWeight: 800, color: '#fff', cursor: onSelectPlayer && a.player_id ? 'pointer' : 'default', borderBottom: onSelectPlayer && a.player_id ? '1px solid rgba(255,255,255,0.25)' : 'none', paddingBottom: 1 }}
                    >
                      {a.players?.name || '—'}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cfg?.mid, background: `${cfg?.mid}22`, border: `1px solid ${cfg?.mid}44`, borderRadius: 6, padding: '1px 8px', flexShrink: 0 }}>
                      {cfg?.label}
                    </span>
                    {stat && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: cfg?.mid, background: `${cfg?.mid}22`, borderRadius: 6, padding: '1px 7px', flexShrink: 0 }}>
                        {stat}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                      {a.teams?.name}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>·</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                      {new Date(a.match_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
