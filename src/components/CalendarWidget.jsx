import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

export default function CalendarWidget({ league, seasonId }) {
  const [today] = useState(new Date())
  const [current, setCurrent] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() })
  const [matches, setMatches] = useState([])
  const [teams, setTeams] = useState({})
  const [activeDay, setActiveDay] = useState(null)
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })
  const popoverRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    async function load() {
      const [{ data: matchesData }, { data: teamsData }] = await Promise.all([
        supabase.from('matches').select('*, set_scores(*)').eq('league', league),
        supabase.from('teams').select('*').eq('league', league),
      ])
      const all = matchesData || []
      setMatches(seasonId ? all.filter(m => m.season_id === seasonId) : all)
      setTeams((teamsData || []).reduce((a, t) => ({ ...a, [t.id]: t }), {}))
    }
    load()
  }, [league, seasonId])

  // Group matches by date key "YYYY-MM-DD"
  const matchesByDay = matches.reduce((acc, m) => {
    if (!m.match_date) return acc
    const key = m.match_date.slice(0, 10)
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  // Build calendar grid
  const { year, month } = current
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  // Monday-first: 0=Mon..6=Sun
  const startOffset = (firstDay.getDay() + 6) % 7
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1
    if (dayNum < 1 || dayNum > lastDay.getDate()) return null
    return dayNum
  })

  const prevMonth = () => setCurrent(c => {
    const d = new Date(c.year, c.month - 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const nextMonth = () => setCurrent(c => {
    const d = new Date(c.year, c.month + 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const pad = n => String(n).padStart(2, '0')
  const dayKey = d => `${year}-${pad(month + 1)}-${pad(d)}`
  const isToday = d => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d

  function handleDayClick(d, e) {
    const key = dayKey(d)
    if (!matchesByDay[key]) return
    if (activeDay === key) { setActiveDay(null); return }
    setActiveDay(key)

    // Position popover relative to container
    const cell = e.currentTarget
    const container = containerRef.current
    if (!cell || !container) return
    const cellRect = cell.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    setPopoverPos({
      top: cellRect.bottom - containerRect.top + 8,
      left: Math.min(cellRect.left - containerRect.left, containerRect.width - 280),
    })
  }

  // Close popover on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target) &&
          containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveDay(null)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'visible', marginTop: 16, padding: '16px 20px 20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
        >‹</button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{MONTHS[month]}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{year}</div>
        </div>

        <button onClick={nextMonth} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
        >›</button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {WEEKDAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em', textTransform: 'uppercase', paddingBottom: 4 }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />

          const key = dayKey(d)
          const dayMatches = matchesByDay[key] || []
          const hasMatches = dayMatches.length > 0
          const hasFinished = dayMatches.some(m => m.status === 'finished')
          const hasScheduled = dayMatches.some(m => m.status === 'scheduled')
          const isActive = activeDay === key
          const todayDay = isToday(d)

          let bg = 'transparent'
          let borderColor = 'transparent'
          let dotColor = null

          if (isActive) { bg = 'rgba(55,77,245,0.35)'; borderColor = 'rgba(55,77,245,0.8)' }
          else if (todayDay) { bg = 'rgba(255,255,255,0.1)'; borderColor = 'rgba(255,255,255,0.3)' }
          else if (hasMatches) { bg = 'rgba(55,77,245,0.12)'; borderColor = 'rgba(55,77,245,0.3)' }

          if (hasFinished && hasScheduled) dotColor = '#ffd700'
          else if (hasFinished) dotColor = '#5BB849'
          else if (hasScheduled) dotColor = '#374DF5'

          return (
            <div
              key={i}
              onClick={hasMatches ? (e) => handleDayClick(d, e) : undefined}
              style={{
                position: 'relative', textAlign: 'center', borderRadius: 8,
                padding: '6px 2px 8px', background: bg,
                border: `1px solid ${borderColor}`,
                cursor: hasMatches ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (hasMatches && !isActive) { e.currentTarget.style.background = 'rgba(55,77,245,0.2)'; e.currentTarget.style.borderColor = 'rgba(55,77,245,0.5)' }}}
              onMouseLeave={e => { if (hasMatches && !isActive) { e.currentTarget.style.background = bg; e.currentTarget.style.borderColor = borderColor }}}
            >
              <div style={{ fontSize: 12, fontWeight: todayDay ? 700 : hasMatches ? 600 : 400, color: todayDay ? '#fff' : hasMatches ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)' }}>
                {d}
              </div>
              {dotColor && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: dotColor, margin: '2px auto 0', boxShadow: `0 0 4px ${dotColor}` }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 14, justifyContent: 'center' }}>
        {[['#5BB849', 'Сыграно'], ['#374DF5', 'Запланировано'], ['#ffd700', 'Смешанный']].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 4px ${color}` }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Popover */}
      {activeDay && matchesByDay[activeDay] && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute', top: popoverPos.top, left: 0, right: 0,
            zIndex: 50,
            background: 'rgba(12,18,38,0.98)', border: '1px solid rgba(55,77,245,0.45)',
            borderRadius: 10, padding: '10px 12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize' }}>
              {new Date(activeDay + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </div>
            <button onClick={() => setActiveDay(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 15, lineHeight: 1 }}>×</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {matchesByDay[activeDay].map(m => {
              const home = teams[m.home_team_id]
              const away = teams[m.away_team_id]
              const finished = m.status === 'finished'
              const homeWon = finished && m.home_sets > m.away_sets
              const awayWon = finished && m.away_sets > m.home_sets
              const sets = (m.set_scores || []).sort((a, b) => a.set_number - b.set_number)

              return (
                <div key={m.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px', border: `1px solid ${finished ? 'rgba(91,184,73,0.15)' : 'rgba(55,77,245,0.15)'}` }}>

                  {/* Meta row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    {m.match_date && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#374DF5' }}>
                        {new Date(m.match_date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {m.venue && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>📍 {m.venue}</span>}
                    <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 600, color: finished ? '#5BB849' : '#374DF5' }}>
                      {finished ? '✓ Завершён' : 'Запланирован'}
                    </span>
                  </div>

                  {/* Home team row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: homeWon ? '#fff' : finished ? 'rgba(255,255,255,0.4)' : '#fff' }}>
                      {homeWon && '🏆 '}{home?.name || '—'}
                    </span>
                    {finished && <span style={{ fontSize: 18, fontWeight: 900, color: homeWon ? '#fff' : 'rgba(255,255,255,0.25)' }}>{m.home_sets}</span>}
                  </div>

                  {/* Away team row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: awayWon ? '#fff' : finished ? 'rgba(255,255,255,0.4)' : '#fff' }}>
                      {awayWon && '🏆 '}{away?.name || '—'}
                    </span>
                    {finished && <span style={{ fontSize: 18, fontWeight: 900, color: awayWon ? '#fff' : 'rgba(255,255,255,0.25)' }}>{m.away_sets}</span>}
                  </div>

                  {/* Set scores */}
                  {finished && sets.length > 0 && (
                    <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {sets.map((s, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '2px 6px', textAlign: 'center' }}>
                          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>С{idx + 1}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{s.home_points}–{s.away_points}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
