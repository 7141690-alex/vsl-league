import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import Standings from './pages/Standings'
import Schedule from './pages/Schedule'
import Admin from './pages/Admin'
import TeamPage from './pages/TeamPage'
import PlayerPage from './pages/PlayerPage'
import AwardsPage from './pages/AwardsPage'

const IconStandings = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }}>
    <rect x="1" y="9" width="3" height="6" rx="1" fill="currentColor" opacity="0.6"/>
    <rect x="6" y="5" width="3" height="10" rx="1" fill="currentColor" opacity="0.8"/>
    <rect x="11" y="1" width="3" height="14" rx="1" fill="currentColor"/>
  </svg>
)

const IconCalendar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }}>
    <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M3 9h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="8" cy="14" r="1.2" fill="currentColor"/>
    <circle cx="12" cy="14" r="1.2" fill="currentColor"/>
    <circle cx="16" cy="14" r="1.2" fill="currentColor"/>
    <circle cx="8" cy="18" r="1.2" fill="currentColor"/>
    <circle cx="12" cy="18" r="1.2" fill="currentColor"/>
  </svg>
)

const tabs = [
  { id: 'standings', label: 'Таблица', Icon: IconStandings },
  { id: 'schedule', label: 'Расписание', Icon: IconCalendar },
]

const GENDER_ICON = { male: '♂', female: '♀', mixed: '⚥' }

// Fallback лиги пока DB не загрузилась
const DEFAULT_LEAGUES = [
  { name: 'male', display_name: 'Мужская', gender: 'male' },
  { name: 'female', display_name: 'Женская', gender: 'female' },
]

function InstallBanner() {
  const [show, setShow] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const standalone = window.navigator.standalone === true
    if (ios && !standalone) { setIsIos(true); setShow(true) }

    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    })
  }, [])

  if (!show) return null

  async function install() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setShow(false)
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 100, background: 'rgba(15,17,27,0.97)', border: '1px solid rgba(55,77,245,0.4)', borderRadius: 14, padding: '14px 16px', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 26, lineHeight: 1 }}>🏐</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Установить приложение</div>
          {isIos ? (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
              Нажмите <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 4, padding: '1px 5px', fontSize: 13 }}>⎋</span> внизу экрана и выберите<br/>
              <span style={{ color: '#fff', fontWeight: 600 }}>«На экран "Домой"»</span>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Добавить VSL на главный экран</div>
          )}
        </div>
        {!isIos && (
          <button onClick={install} style={{ background: 'linear-gradient(135deg, #374DF5, #6366f1)', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
            Установить
          </button>
        )}
        <button onClick={() => setShow(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 16, padding: '6px 10px', flexShrink: 0, borderRadius: 8 }}>✕</button>
      </div>
    </div>
  )
}

export default function App() {
  const [leagues, setLeagues] = useState(DEFAULT_LEAGUES)
  const [league, setLeague] = useState('male')
  const [leagueDropdownOpen, setLeagueDropdownOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const leagueBtnRef = useRef(null)
  const [tab, setTab] = useState('standings')
  const [showAdmin, setShowAdmin] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [showAwards, setShowAwards] = useState(false)

  useEffect(() => {
    supabase
      .from('leagues')
      .select('*')
      .eq('active', true)
      .order('created_at')
      .then(({ data }) => {
        if (data && data.length > 0) setLeagues(data)
      })
  }, [])

  function resetNav() {
    setSelectedTeam(null)
    setSelectedPlayer(null)
    setShowAwards(false)
  }

  const currentLeague = leagues.find(l => l.name === league) || leagues[0]

  if (showAdmin) {
    return (
      <div className="min-h-screen w-full" style={{ background: 'linear-gradient(160deg, #0b1120 0%, #0f2044 40%, #0b1120 100%)' }}>
        <div style={{ maxWidth: 896, margin: '0 auto', padding: '20px 16px 0' }}>
          <button
            onClick={() => setShowAdmin(false)}
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 14px', fontWeight: 600, marginBottom: 24 }}
          >
            ← На сайт
          </button>
        </div>
        <Admin />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full" style={{ background: 'linear-gradient(160deg, #0b1120 0%, #0f2044 40%, #0b1120 100%)' }}>

      {/* Header */}
      <header style={{ position: 'relative', width: '100%' }}>

        {/* Background effects */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 600, height: 260, background: 'radial-gradient(ellipse, rgba(55,77,245,0.3) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        </div>

        <div style={{ position: 'relative', maxWidth: 768, margin: '0 auto', padding: '20px 16px 0' }}>

          {/* Top row: logo + admin */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>

            {/* Logo + title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/logo.png" alt="VSL" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  VSL
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em', marginTop: 1 }}>
                  Volleyball Super League
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#5BB849', boxShadow: '0 0 5px #5BB849', display: 'inline-block' }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Сезон 2026</span>
                </div>
              </div>
            </div>

            {/* Admin button */}
            <button
              onClick={() => setShowAdmin(true)}
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', letterSpacing: '0.08em', fontWeight: 600 }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            >
              ⚙ ADMIN
            </button>
          </div>

          {/* League + Tabs row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, gap: 8, flexWrap: 'nowrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>

            {/* League dropdown — только кнопка, само меню рендерится в конце App */}
            <div style={{ flexShrink: 0 }}>
              <button
                ref={leagueBtnRef}
                onClick={() => {
                  if (!leagueDropdownOpen && leagueBtnRef.current) {
                    const r = leagueBtnRef.current.getBoundingClientRect()
                    setDropdownPos({ top: r.bottom + 6, left: r.left })
                  }
                  setLeagueDropdownOpen(v => !v)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 10, padding: '7px 12px', cursor: 'pointer', transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  {GENDER_ICON[currentLeague?.gender] || ''} {currentLeague?.display_name || 'Лига'}
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: 'transform 0.2s', transform: leagueDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                  <path d="M2 4l4 4 4-4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Tab buttons */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {tabs.map(({ id, label, Icon }) => (
                <button key={id} onClick={() => { setTab(id); resetNav() }}
                  style={tab === id ? {
                    background: 'rgba(55,77,245,0.25)', color: '#fff',
                    border: '1px solid rgba(55,77,245,0.6)',
                    boxShadow: '0 2px 12px rgba(55,77,245,0.3)',
                    borderRadius: 9, padding: '7px 14px',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
                  } : {
                    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 9, padding: '7px 14px',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { if (tab !== id) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}}
                  onMouseLeave={e => { if (tab !== id) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}}
                >
                  <Icon />{label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(55,77,245,0.5) 40%, rgba(55,77,245,0.5) 60%, transparent)' }} />
      </header>

      {/* Content */}
      <main style={{ maxWidth: 768, margin: '0 auto', padding: '32px 16px' }}>
        {selectedPlayer ? (
          <PlayerPage playerId={selectedPlayer} onBack={() => setSelectedPlayer(null)} />
        ) : selectedTeam ? (
          <TeamPage team={selectedTeam} league={league} onBack={() => setSelectedTeam(null)} onSelectPlayer={setSelectedPlayer} />
        ) : showAwards ? (
          <AwardsPage
            league={league}
            leagueName={`${GENDER_ICON[currentLeague?.gender] || ''} ${currentLeague?.display_name || league}`}
            onBack={() => setShowAwards(false)}
          />
        ) : (
          <>
            {tab === 'standings' && (
              <Standings
                league={league}
                onSelectTeam={setSelectedTeam}
                onShowAwards={() => setShowAwards(true)}
              />
            )}
            {tab === 'schedule' && <Schedule league={league} />}
          </>
        )}
      </main>

      <div style={{ paddingBottom: 48 }} />
      <InstallBanner />

      {/* League dropdown menu — рендерится последним, поверх всего */}
      {leagueDropdownOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            onClick={() => setLeagueDropdownOpen(false)}
          />
          <div style={{
            position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999,
            background: 'rgb(13,18,38)', border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 12, overflow: 'hidden', minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          }}>
            {leagues.map((l, i) => {
              const active = l.name === league
              return (
                <button
                  key={l.name}
                  onClick={() => { setLeague(l.name); resetNav(); setLeagueDropdownOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '11px 16px', cursor: 'pointer',
                    background: active ? 'rgba(55,77,245,0.25)' : 'rgb(13,18,38)',
                    border: 'none',
                    borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'rgb(13,18,38)' }}
                >
                  <span style={{ fontSize: 14 }}>{GENDER_ICON[l.gender] || '🏐'}</span>
                  <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                    {l.display_name}
                  </span>
                  {active && (
                    <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#374DF5', boxShadow: '0 0 6px #374DF5', flexShrink: 0 }} />
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
