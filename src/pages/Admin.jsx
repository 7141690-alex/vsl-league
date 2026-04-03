import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import AwardBadge, { AWARD_CONFIG } from '../components/AwardBadge'

// ─── Стили ───────────────────────────────────────────────────────────────────

const inp = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#fff',
  fontSize: 13,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const card = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
  overflow: 'hidden',
}

const btnPrimary = {
  background: 'linear-gradient(135deg, #374DF5, #6366f1)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '10px 20px',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 2px 12px rgba(55,77,245,0.4)',
  flexShrink: 0,
}

const btnSecondary = {
  background: 'rgba(255,255,255,0.07)',
  color: 'rgba(255,255,255,0.6)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  padding: '10px 20px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  flexShrink: 0,
}

const labelStyle = {
  fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
}

// ─── Журнал действий ─────────────────────────────────────────────────────────

async function logAction(userEmail, action, entityType, entityName, details = {}) {
  try {
    await supabase.from('activity_log').insert({
      user_email: userEmail,
      action,
      entity_type: entityType,
      entity_name: entityName || '',
      details,
    })
  } catch {
    // не мешаем основной операции
  }
}

// ─── Вспомогательная функция ─────────────────────────────────────────────────

function getNextSunday() {
  const d = new Date()
  const day = d.getDay()
  const daysUntilSunday = day === 0 ? 7 : 7 - day
  d.setDate(d.getDate() + daysUntilSunday)
  d.setHours(12, 0, 0, 0)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ─── Основной компонент Admin ─────────────────────────────────────────────────

export default function Admin() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [teams, setTeams] = useState([])
  const [matches, setMatches] = useState([])
  const [leagues, setLeagues] = useState([])
  const [seasons, setSeasons] = useState([])
  const [adminSeason, setAdminSeason] = useState(null)
  const [activeTab, setActiveTab] = useState('teams')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) { loadTeams(); loadMatches(); loadLeagues(); loadSeasons() }
  }, [session])

  async function login(e) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setLoginError('Неверный email или пароль')
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  async function loadTeams() {
    const { data } = await supabase.from('teams').select('*').order('name')
    setTeams(data || [])
  }

  async function loadMatches() {
    const { data } = await supabase.from('matches').select('*, set_scores(*)').order('match_date')
    setMatches(data || [])
  }

  async function loadLeagues() {
    const { data } = await supabase.from('leagues').select('*').order('created_at')
    setLeagues(data || [])
  }

  async function loadSeasons() {
    const { data } = await supabase.from('seasons').select('*').order('created_at', { ascending: false })
    const list = data || []
    setSeasons(list)
    if (list.length > 0) {
      const current = list.find(s => s.is_current) || list[0]
      setAdminSeason(current)
    }
  }

  const userEmail = session?.user?.email || ''

  const TABS = [
    { id: 'teams',   label: 'Команды' },
    { id: 'matches', label: 'Игры' },
    { id: 'players', label: 'Игроки' },
    { id: 'awards',  label: '🏅 Награды' },
    { id: 'leagues', label: '🏆 Лиги' },
    { id: 'seasons', label: '🗓 Сезоны' },
    { id: 'log',     label: '📋 Журнал' },
  ]

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ ...card, padding: 32, width: '100%', maxWidth: 380 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>VSL</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
              Панель администратора
            </div>
          </div>
          <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
            <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} style={inp} />
            {loginError && <p style={{ color: '#FF495C', fontSize: 12, margin: 0 }}>{loginError}</p>}
            <button type="submit" style={{ ...btnPrimary, marginTop: 4, width: '100%', padding: '12px 20px' }}>Войти</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 896, margin: '0 auto', padding: '0 16px 64px' }}>
      {/* Panel header */}
      <div style={{ paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Панель администратора</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
              VSL — Volleyball Super League · {userEmail}
            </div>
          </div>
          <button
            onClick={logout}
            style={{ ...btnSecondary, padding: '8px 16px', fontSize: 12, color: '#FF495C', borderColor: 'rgba(255,73,92,0.2)', background: 'rgba(255,73,92,0.06)', flexShrink: 0 }}
          >
            Выйти
          </button>
        </div>
        {/* Season switcher */}
        {seasons.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Рабочий сезон:</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {seasons.map(s => (
                <button
                  key={s.id}
                  onClick={() => setAdminSeason(s)}
                  style={{
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', borderRadius: 8, padding: '5px 14px',
                    background: adminSeason?.id === s.id ? (s.is_current ? '#5BB849' : '#FF8C42') : 'rgba(255,255,255,0.08)',
                    color: adminSeason?.id === s.id ? '#fff' : 'rgba(255,255,255,0.45)',
                    boxShadow: adminSeason?.id === s.id ? `0 0 10px ${s.is_current ? '#5BB84966' : '#FF8C4266'}` : 'none',
                  }}
                >
                  {s.name}
                  {s.is_current && <span style={{ fontSize: 9, marginLeft: 6, background: 'rgba(255,255,255,0.25)', borderRadius: 4, padding: '1px 5px', verticalAlign: 'middle' }}>АКТИВНЫЙ</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: 2, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 3, marginBottom: 24, WebkitOverflowScrolling: 'touch' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={activeTab === t.id ? {
              background: 'linear-gradient(135deg, #374DF5, #6366f1)',
              color: '#fff', boxShadow: '0 2px 10px rgba(55,77,245,0.45)',
              borderRadius: 7, padding: '8px 20px', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
            } : {
              background: 'transparent', color: 'rgba(255,255,255,0.45)',
              borderRadius: 7, padding: '8px 20px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'teams'   && <TeamsAdmin   teams={teams}   leagues={leagues} userEmail={userEmail} onUpdate={loadTeams} adminSeason={adminSeason} />}
      {activeTab === 'matches' && <MatchesAdmin  matches={matches} teams={teams} leagues={leagues} userEmail={userEmail} onUpdate={loadMatches} adminSeason={adminSeason} />}
      {activeTab === 'players' && <PlayersAdmin  teams={teams}   userEmail={userEmail} adminSeason={adminSeason} />}
      {activeTab === 'awards'  && <AwardsAdmin   teams={teams}   leagues={leagues} userEmail={userEmail} adminSeason={adminSeason} />}
      {activeTab === 'leagues' && <LeaguesAdmin  userEmail={userEmail} onUpdate={loadLeagues} />}
      {activeTab === 'seasons' && <SeasonsAdmin  userEmail={userEmail} onUpdate={loadSeasons} />}
      {activeTab === 'log'     && <ActivityLog />}
    </div>
  )
}

// ─── Команды ─────────────────────────────────────────────────────────────────

function TeamsAdmin({ teams, leagues, userEmail, onUpdate, adminSeason }) {
  const [form, setForm] = useState({ name: '', league: 'male', photo_url: '', active: true })
  const [editingId, setEditingId] = useState(null)
  const [editingData, setEditingData] = useState({})
  const [showInactive, setShowInactive] = useState(false)
  const [seasonTeamIds, setSeasonTeamIds] = useState([])

  useEffect(() => {
    if (adminSeason?.id) {
      supabase.from('season_teams').select('team_id').eq('season_id', adminSeason.id)
        .then(({ data }) => setSeasonTeamIds((data || []).map(r => r.team_id)))
    } else {
      setSeasonTeamIds([])
    }
  }, [adminSeason?.id])

  async function toggleSeasonTeam(team) {
    if (!adminSeason?.id) return
    const inSeason = seasonTeamIds.includes(team.id)
    if (inSeason) {
      const { error } = await supabase.from('season_teams').delete().eq('season_id', adminSeason.id).eq('team_id', team.id)
      if (error) { alert('Ошибка: ' + error.message); return }
      setSeasonTeamIds(ids => ids.filter(id => id !== team.id))
    } else {
      const { error } = await supabase.from('season_teams').insert({ season_id: adminSeason.id, team_id: team.id })
      if (error) { alert('Ошибка: ' + error.message); return }
      setSeasonTeamIds(ids => [...ids, team.id])
    }
  }

  const leagueOptions = leagues.length > 0
    ? leagues
    : [{ name: 'male', display_name: 'Мужская' }, { name: 'female', display_name: 'Женская' }]

  async function addTeam(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    const insertData = {
      name: form.name.trim(),
      league: form.league,
      photo_url: form.photo_url.trim() || null,
    }
    // active может отсутствовать в старых БД — добавляем только если поле существует
    try {
      const { error } = await supabase.from('teams').insert({ ...insertData, active: form.active })
      if (error) {
        // Если ошибка из-за колонки active — пробуем без неё
        if (error.message?.includes('active')) {
          const { error: e2 } = await supabase.from('teams').insert(insertData)
          if (e2) { alert('Ошибка при добавлении команды: ' + e2.message); return }
        } else {
          alert('Ошибка при добавлении команды: ' + error.message)
          return
        }
      }
    } catch (err) {
      alert('Ошибка: ' + err.message)
      return
    }
    await logAction(userEmail, 'Добавлено', 'команда', form.name.trim(), { league: form.league })
    setForm({ name: '', league: form.league, photo_url: '', active: true })
    onUpdate()
  }

  async function deleteTeam(id, teamName) {
    if (!confirm(`Удалить команду «${teamName}»?`)) return
    await supabase.from('teams').delete().eq('id', id)
    await logAction(userEmail, 'Удалено', 'команда', teamName)
    onUpdate()
  }

  function startEdit(team) {
    setEditingId(team.id)
    setEditingData({ name: team.name, league: team.league, photo_url: team.photo_url || '', active: team.active !== false })
  }

  async function saveEdit(id) {
    if (!editingData.name?.trim()) return
    await supabase.from('teams').update({
      name: editingData.name.trim(),
      league: editingData.league,
      photo_url: editingData.photo_url?.trim() || null,
      active: editingData.active,
    }).eq('id', id)
    await logAction(userEmail, 'Изменено', 'команда', editingData.name.trim())
    setEditingId(null)
    onUpdate()
  }

  // Группируем по лиге
  const grouped = {}
  teams.forEach(t => {
    const key = t.league || 'other'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(t)
  })

  const leagueLabel = (name) => {
    const l = leagues.find(l => l.name === name)
    return l ? l.display_name : name
  }

  function renderTeam(team, i) {
    const isActive = team.active !== false
    if (!showInactive && !isActive) return null

    if (editingId === team.id) {
      return (
        <div key={team.id} style={{ padding: '14px 16px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', background: 'rgba(55,77,245,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={labelStyle}>Название</div>
              <input value={editingData.name} onChange={e => setEditingData(d => ({ ...d, name: e.target.value }))} autoFocus style={{ ...inp, padding: '8px 12px', fontSize: 13 }} onKeyDown={e => { if (e.key === 'Enter') saveEdit(team.id); if (e.key === 'Escape') setEditingId(null) }} />
            </div>
            <div>
              <div style={labelStyle}>Лига</div>
              <select value={editingData.league} onChange={e => setEditingData(d => ({ ...d, league: e.target.value }))} style={{ ...inp, padding: '8px 12px', fontSize: 13 }}>
                {leagueOptions.map(l => <option key={l.name} value={l.name}>{l.display_name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={labelStyle}>Фото (путь, напр. /teams/Unity.jpg)</div>
            <input value={editingData.photo_url} onChange={e => setEditingData(d => ({ ...d, photo_url: e.target.value }))} placeholder="/teams/TeamName.jpg" style={{ ...inp, padding: '8px 12px', fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={editingData.active} onChange={e => setEditingData(d => ({ ...d, active: e.target.checked }))} style={{ accentColor: '#5BB849', width: 15, height: 15 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Активна в текущем сезоне</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => saveEdit(team.id)} style={{ ...btnPrimary, padding: '7px 16px', fontSize: 12 }}>Сохранить</button>
              <button onClick={() => setEditingId(null)} style={{ ...btnSecondary, padding: '7px 16px', fontSize: 12 }}>Отмена</button>
            </div>
          </div>
        </div>
      )
    }

    const inSeason = seasonTeamIds.includes(team.id)
    return (
      <div key={team.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', opacity: isActive ? 1 : 0.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#5BB849' : 'rgba(255,255,255,0.2)', boxShadow: isActive ? '0 0 5px #5BB849' : 'none', flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{team.name}</span>
            {team.photo_url && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>{team.photo_url}</span>}
          </div>
          {!isActive && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '2px 6px' }}>неактивна</span>}
          {adminSeason && (
            <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '2px 8px', cursor: 'pointer', background: inSeason ? 'rgba(91,184,73,0.15)' : 'rgba(255,255,255,0.05)', color: inSeason ? '#5BB849' : 'rgba(255,255,255,0.25)', border: `1px solid ${inSeason ? 'rgba(91,184,73,0.3)' : 'rgba(255,255,255,0.1)'}` }}
              onClick={() => toggleSeasonTeam(team)}>
              {inSeason ? '✓ в сезоне' : '+ сезон'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => startEdit(team)} style={{ fontSize: 12, color: '#374DF5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>Изменить</button>
          <button onClick={() => deleteTeam(team.id, team.name)} style={{ fontSize: 12, color: '#FF495C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>Удалить</button>
        </div>
      </div>
    )
  }

  const inactiveCount = teams.filter(t => t.active === false).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Форма создания */}
      <div style={{ ...card, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
          Создать команду
        </div>
        <form onSubmit={addTeam} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={labelStyle}>Название команды</div>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Название команды" style={inp} />
            </div>
            <div>
              <div style={labelStyle}>Лига</div>
              <select value={form.league} onChange={e => setForm(f => ({ ...f, league: e.target.value }))} style={inp}>
                {leagueOptions.map(l => <option key={l.name} value={l.name}>{l.display_name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div style={labelStyle}>Фото команды (путь, напр. /teams/Unity.jpg)</div>
            <input value={form.photo_url} onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))} placeholder="/teams/TeamName.jpg" style={inp} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} style={{ accentColor: '#5BB849', width: 15, height: 15 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Участвует в текущем сезоне</span>
            </label>
            <button type="submit" style={btnPrimary}>Создать команду</button>
          </div>
        </form>
      </div>

      {/* Переключатель неактивных */}
      {inactiveCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowInactive(v => !v)}
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}
          >
            {showInactive ? 'Скрыть неактивные' : `Показать неактивные (${inactiveCount})`}
          </button>
        </div>
      )}

      {/* Списки по лигам — все лиги из таблицы leagues + лиги у которых есть команды */}
      {[
        ...leagueOptions.map(l => l.name),
        ...Object.keys(grouped).filter(k => !leagueOptions.find(l => l.name === k)),
      ].map(lgName => {
        const lgTeams = grouped[lgName] || []
        return (
        <div key={lgName}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: '#374DF5' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{leagueLabel(lgName)}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '2px 8px' }}>{lgTeams.filter(t => t.active !== false).length}</span>
          </div>
          <div style={card}>
            {lgTeams.length === 0
              ? <div style={{ padding: '16px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Нет команд</div>
              : lgTeams.map((team, i) => renderTeam(team, i))
            }
          </div>
        </div>
        )
      })}
    </div>
  )
}

// ─── Игры ─────────────────────────────────────────────────────────────────────

function MatchesAdmin({ matches, teams, leagues, userEmail, onUpdate, adminSeason }) {
  const [form, setForm] = useState({
    league: 'male', home_team_id: '', away_team_id: '',
    match_date: getNextSunday(), venue: '', status: 'scheduled',
    home_sets: 0, away_sets: 0, photo_url: '', video_url: ''
  })
  const [sets, setSets] = useState([])
  const [editId, setEditId] = useState(null)

  // Filter matches by admin season
  const visibleMatches = adminSeason
    ? matches.filter(m => m.season_id === adminSeason.id)
    : matches

  const leagueOptions = leagues.length > 0
    ? leagues
    : [{ name: 'male', display_name: 'Мужская лига' }, { name: 'female', display_name: 'Женская лига' }]

  const leagueTeams = teams.filter(t => t.league === form.league)
  const teamsMap = teams.reduce((acc, t) => ({ ...acc, [t.id]: t }), {})
  const knownVenues = [...new Set(matches.map(m => m.venue).filter(Boolean))].sort()

  async function saveMatch(e) {
    e.preventDefault()
    const matchData = {
      league: form.league,
      home_team_id: form.home_team_id || null,
      away_team_id: form.away_team_id || null,
      match_date: form.match_date || null,
      venue: form.venue || null,
      status: form.status,
      home_sets: parseInt(form.home_sets) || 0,
      away_sets: parseInt(form.away_sets) || 0,
      photo_url: form.photo_url || null,
      video_url: form.video_url || null,
      ...(adminSeason && !editId ? { season_id: adminSeason.id } : {}),
    }

    const home = teamsMap[form.home_team_id]?.name || '?'
    const away = teamsMap[form.away_team_id]?.name || '?'
    const matchName = `${home} vs ${away}`

    let matchId = editId
    if (editId) {
      await supabase.from('matches').update(matchData).eq('id', editId)
      await logAction(userEmail, 'Изменено', 'игра', matchName, matchData)
    } else {
      const { data } = await supabase.from('matches').insert(matchData).select().single()
      matchId = data?.id
      await logAction(userEmail, 'Добавлено', 'игра', matchName, matchData)
    }

    if (matchId && sets.length > 0) {
      await supabase.from('set_scores').delete().eq('match_id', matchId)
      const setData = sets.map((s, i) => ({
        match_id: matchId, set_number: i + 1,
        home_points: parseInt(s.home) || 0, away_points: parseInt(s.away) || 0,
      }))
      await supabase.from('set_scores').insert(setData)
    }

    resetForm()
    onUpdate()
  }

  function resetForm() {
    setForm({ league: 'male', home_team_id: '', away_team_id: '', match_date: getNextSunday(), venue: '', status: 'scheduled', home_sets: 0, away_sets: 0, photo_url: '', video_url: '' })
    setSets([])
    setEditId(null)
  }

  function startEdit(match) {
    setForm({
      league: match.league,
      home_team_id: match.home_team_id || '',
      away_team_id: match.away_team_id || '',
      match_date: match.match_date ? match.match_date.slice(0, 16) : '',
      venue: match.venue || '',
      status: match.status,
      home_sets: match.home_sets,
      away_sets: match.away_sets,
      photo_url: match.photo_url || '',
      video_url: match.video_url || '',
    })
    setSets((match.set_scores || []).sort((a, b) => a.set_number - b.set_number).map(s => ({ home: s.home_points, away: s.away_points })))
    setEditId(match.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteMatch(id, home, away) {
    if (!confirm('Удалить игру?')) return
    await supabase.from('matches').delete().eq('id', id)
    await logAction(userEmail, 'Удалено', 'игра', `${home} vs ${away}`)
    onUpdate()
  }

  const totalSets = parseInt(form.home_sets) + parseInt(form.away_sets)

  function updateSetsCount(home, away) {
    const total = parseInt(home) + parseInt(away)
    if (total !== totalSets) {
      setSets(Array.from({ length: total }, (_, i) => sets[i] || { home: '', away: '' }))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Форма */}
      <div style={{ ...card, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: editId ? '#374DF5' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>
          {editId ? '✎ Редактировать игру' : '+ Добавить игру'}
        </div>

        <form onSubmit={saveMatch} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={labelStyle}>Лига</div>
              <select value={form.league} onChange={e => setForm(f => ({ ...f, league: e.target.value }))} style={inp}>
                {leagueOptions.map(l => <option key={l.name} value={l.name}>{l.display_name}</option>)}
              </select>
            </div>
            <div>
              <div style={labelStyle}>Дата и время</div>
              <input type="datetime-local" value={form.match_date} onChange={e => setForm(f => ({ ...f, match_date: e.target.value }))} style={{ ...inp, colorScheme: 'dark' }} />
            </div>
          </div>

          <div>
            <div style={labelStyle}>Зал</div>
            <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Название зала" list="venues-datalist" style={inp} />
            <datalist id="venues-datalist">{knownVenues.map(v => <option key={v} value={v} />)}</datalist>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={labelStyle}>Хозяева</div>
              <select value={form.home_team_id} onChange={e => setForm(f => ({ ...f, home_team_id: e.target.value }))} style={inp}>
                <option value="">— выберите —</option>
                {leagueTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <div style={labelStyle}>Гости</div>
              <select value={form.away_team_id} onChange={e => setForm(f => ({ ...f, away_team_id: e.target.value }))} style={inp}>
                <option value="">— выберите —</option>
                {leagueTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div style={labelStyle}>Статус</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ ...inp, width: 'auto', flexShrink: 0 }}>
                <option value="scheduled">Запланирован</option>
                <option value="finished">Завершён</option>
              </select>
              {form.status === 'finished' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Счёт:</span>
                  <input type="number" min="0" max="3" value={form.home_sets}
                    onChange={e => { setForm(f => ({ ...f, home_sets: e.target.value })); updateSetsCount(e.target.value, form.away_sets) }}
                    style={{ ...inp, width: 60, textAlign: 'center', padding: '10px 8px' }} />
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>:</span>
                  <input type="number" min="0" max="3" value={form.away_sets}
                    onChange={e => { setForm(f => ({ ...f, away_sets: e.target.value })); updateSetsCount(form.home_sets, e.target.value) }}
                    style={{ ...inp, width: 60, textAlign: 'center', padding: '10px 8px' }} />
                </div>
              )}
            </div>
          </div>

          {form.status === 'finished' && sets.length > 0 && (
            <div>
              <div style={labelStyle}>Счёт по сетам</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sets.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', width: 48, flexShrink: 0 }}>Сет {i + 1}</span>
                    <input type="number" value={s.home} onChange={e => setSets(ss => ss.map((x, j) => j === i ? { ...x, home: e.target.value } : x))} placeholder="0" style={{ ...inp, width: 64, textAlign: 'center', padding: '8px' }} />
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>:</span>
                    <input type="number" value={s.away} onChange={e => setSets(ss => ss.map((x, j) => j === i ? { ...x, away: e.target.value } : x))} placeholder="0" style={{ ...inp, width: 64, textAlign: 'center', padding: '8px' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {form.status === 'finished' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={labelStyle}>📷 Фотоотчёт (ссылка)</div>
                <input value={form.photo_url} onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))} placeholder="https://photos.google.com/..." style={inp} />
              </div>
              <div>
                <div style={labelStyle}>▶ Видеозапись (YouTube)</div>
                <input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." style={inp} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="submit" style={btnPrimary}>{editId ? 'Сохранить' : 'Добавить'}</button>
            {editId && <button type="button" onClick={resetForm} style={btnSecondary}>Отмена</button>}
          </div>
        </form>
      </div>

      {/* Список игр */}
      <div style={card}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Игры</span>
          {adminSeason && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '2px 8px' }}>{adminSeason.name}</span>}
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '2px 8px' }}>{visibleMatches.length}</span>
        </div>
        {visibleMatches.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Нет игр</div>
        )}
        {visibleMatches.map((match, i) => {
          const home = teamsMap[match.home_team_id]
          const away = teamsMap[match.away_team_id]
          const finished = match.status === 'finished'
          return (
            <div key={match.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: finished ? '#5BB849' : '#374DF5', boxShadow: `0 0 4px ${finished ? '#5BB849' : '#374DF5'}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                    {home?.name || '?'} <span style={{ color: 'rgba(255,255,255,0.3)' }}>vs</span> {away?.name || '?'}
                  </span>
                  {finished && <span style={{ fontSize: 12, fontWeight: 700, color: '#5BB849' }}>{match.home_sets}:{match.away_sets}</span>}
                </div>
                {match.match_date && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', paddingLeft: 13 }}>
                    {new Date(match.match_date).toLocaleString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => startEdit(match)} style={{ fontSize: 12, color: '#374DF5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>Изменить</button>
                <button onClick={() => deleteMatch(match.id, home?.name, away?.name)} style={{ fontSize: 12, color: '#FF495C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>Удалить</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Игроки ───────────────────────────────────────────────────────────────────

function PlayersAdmin({ teams, userEmail, adminSeason }) {
  const today = new Date().toISOString().slice(0, 10)
  const [players, setPlayers] = useState([])
  const [memberships, setMemberships] = useState({})
  const [newForm, setNewForm] = useState({ name: '', gender: 'male', height: '', birth_date: '' })
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})
  const [addTeamId, setAddTeamId] = useState(null)
  const [memberForm, setMemberForm] = useState({ team_id: '', jersey_number: '', is_captain: false, joined_at: today })

  async function load() {
    let memberQuery = supabase.from('team_memberships').select('*, teams(name, league)')
    if (adminSeason?.id) {
      memberQuery = memberQuery.eq('season_id', adminSeason.id)
    } else {
      memberQuery = memberQuery.is('left_at', null)
    }
    const [{ data: pData }, { data: mData }] = await Promise.all([
      supabase.from('players').select('*').order('name'),
      memberQuery,
    ])
    setPlayers(pData || [])
    const map = {}
    for (const m of (mData || [])) map[m.player_id] = m
    setMemberships(map)
  }

  useEffect(() => { load() }, [adminSeason?.id])

  async function createPlayer(e) {
    e.preventDefault()
    if (!newForm.name.trim()) return
    await supabase.from('players').insert({ name: newForm.name.trim(), gender: newForm.gender, height: parseInt(newForm.height) || null, birth_date: newForm.birth_date || null })
    await logAction(userEmail, 'Добавлено', 'игрок', newForm.name.trim(), { gender: newForm.gender })
    setNewForm({ name: '', gender: 'male', height: '', birth_date: '' })
    load()
  }

  async function saveEdit(id) {
    if (!editData.name?.trim()) return
    await supabase.from('players').update({ name: editData.name.trim(), gender: editData.gender, height: parseInt(editData.height) || null, birth_date: editData.birth_date || null }).eq('id', id)
    await logAction(userEmail, 'Изменено', 'игрок', editData.name.trim())
    setEditId(null)
    load()
  }

  async function deletePlayer(id, name) {
    if (!confirm(`Удалить игрока «${name}»? Все его членства и номинации будут удалены.`)) return
    await supabase.from('players').delete().eq('id', id)
    await logAction(userEmail, 'Удалено', 'игрок', name)
    load()
  }

  async function addToTeam(playerId, playerName) {
    if (!memberForm.team_id) return
    if (memberForm.is_captain) {
      let capQuery = supabase.from('team_memberships').select('id').eq('team_id', memberForm.team_id).eq('is_captain', true)
      capQuery = adminSeason?.id ? capQuery.eq('season_id', adminSeason.id) : capQuery.is('left_at', null)
      const { data: existing } = await capQuery
      if (existing?.length) await supabase.from('team_memberships').update({ is_captain: false }).in('id', existing.map(x => x.id))
    }
    const teamName = teams.find(t => t.id === memberForm.team_id)?.name || memberForm.team_id
    const insertData = {
      player_id: playerId, team_id: memberForm.team_id,
      jersey_number: parseInt(memberForm.jersey_number) || null,
      is_captain: memberForm.is_captain,
      joined_at: memberForm.joined_at || today,
      ...(adminSeason?.id ? { season_id: adminSeason.id } : {}),
    }
    await supabase.from('team_memberships').insert(insertData)
    await logAction(userEmail, 'Добавлен в команду', 'игрок', playerName, { team: teamName, season: adminSeason?.name })
    setAddTeamId(null)
    setMemberForm({ team_id: '', jersey_number: '', is_captain: false, joined_at: today })
    load()
  }

  async function removeFromTeam(membershipId, playerName) {
    await supabase.from('team_memberships').delete().eq('id', membershipId)
    await logAction(userEmail, 'Убран из команды', 'игрок', playerName, { season: adminSeason?.name })
    load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Форма создания */}
      <div style={{ ...card, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Создать игрока</div>
        <form onSubmit={createPlayer} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={labelStyle}>Имя</div>
              <input value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} placeholder="Фамилия Имя" style={inp} />
            </div>
            <div>
              <div style={labelStyle}>Пол</div>
              <select value={newForm.gender} onChange={e => setNewForm(f => ({ ...f, gender: e.target.value }))} style={inp}>
                <option value="male">♂ Мужской</option>
                <option value="female">♀ Женский</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={labelStyle}>Дата рождения</div>
              <input type="date" value={newForm.birth_date} onChange={e => setNewForm(f => ({ ...f, birth_date: e.target.value }))} style={{ ...inp, colorScheme: 'dark' }} />
            </div>
            <div>
              <div style={labelStyle}>Рост (см)</div>
              <input type="number" value={newForm.height} onChange={e => setNewForm(f => ({ ...f, height: e.target.value }))} placeholder="185" style={inp} />
            </div>
          </div>
          <button type="submit" style={{ ...btnPrimary, alignSelf: 'flex-start' }}>Создать</button>
        </form>
      </div>

      {/* Список игроков */}
      <div style={card}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Все игроки</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '2px 8px' }}>{players.length}</span>
        </div>

        {players.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Нет игроков</div>
        ) : players.map((player, i) => {
          const membership = memberships[player.id]
          const isEditing = editId === player.id
          const isAddingTeam = addTeamId === player.id
          const genderTeams = teams.filter(t => t.league === (player.gender === 'female' ? 'female' : 'male'))

          return (
            <div key={player.id} style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              {isEditing ? (
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><div style={labelStyle}>Имя</div><input value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} autoFocus style={{ ...inp, padding: '8px 12px', fontSize: 13 }} /></div>
                    <div><div style={labelStyle}>Пол</div>
                      <select value={editData.gender} onChange={e => setEditData(d => ({ ...d, gender: e.target.value }))} style={{ ...inp, padding: '8px 12px', fontSize: 13 }}>
                        <option value="male">♂ Мужской</option>
                        <option value="female">♀ Женский</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><div style={labelStyle}>Дата рождения</div><input type="date" value={editData.birth_date} onChange={e => setEditData(d => ({ ...d, birth_date: e.target.value }))} style={{ ...inp, colorScheme: 'dark', padding: '8px 12px', fontSize: 13 }} /></div>
                    <div><div style={labelStyle}>Рост (см)</div><input type="number" value={editData.height} onChange={e => setEditData(d => ({ ...d, height: e.target.value }))} style={{ ...inp, padding: '8px 12px', fontSize: 13 }} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => saveEdit(player.id)} style={{ ...btnPrimary, padding: '7px 16px', fontSize: 12 }}>Сохранить</button>
                    <button onClick={() => setEditId(null)} style={{ ...btnSecondary, padding: '7px 16px', fontSize: 12 }}>Отмена</button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span style={{ fontSize: 14, color: player.gender === 'female' ? '#f472b6' : '#60a5fa', flexShrink: 0 }}>
                      {player.gender === 'female' ? '♀' : '♂'}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{player.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                        {player.height ? `${player.height} см` : ''}
                      </div>
                    </div>
                    {membership ? (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#5BB849', background: 'rgba(91,184,73,0.1)', border: '1px solid rgba(91,184,73,0.25)', borderRadius: 6, padding: '2px 8px', flexShrink: 0 }}>
                        {membership.teams?.name}{membership.jersey_number != null ? ` #${membership.jersey_number}` : ''}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>Без команды</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {membership ? (
                      <button onClick={() => removeFromTeam(membership.id, player.name)} style={{ fontSize: 11, color: '#FF8C42', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>Убрать из команды</button>
                    ) : (
                      <button onClick={() => { setAddTeamId(player.id); setMemberForm({ team_id: '', jersey_number: '', is_captain: false, joined_at: today }) }} style={{ fontSize: 11, color: '#5BB849', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>+ Команда</button>
                    )}
                    <button onClick={() => { setEditId(player.id); setEditData({ name: player.name, gender: player.gender || 'male', height: player.height || '', birth_date: player.birth_date || '' }) }} style={{ fontSize: 11, color: '#374DF5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>Изменить</button>
                    <button onClick={() => deletePlayer(player.id, player.name)} style={{ fontSize: 11, color: '#FF495C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>Удалить</button>
                  </div>
                </div>
              )}

              {isAddingTeam && (
                <div style={{ padding: '12px 16px 16px', background: 'rgba(91,184,73,0.05)', borderTop: '1px solid rgba(91,184,73,0.15)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Добавить в команду</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: 8, marginBottom: 10 }}>
                    <select value={memberForm.team_id} onChange={e => setMemberForm(f => ({ ...f, team_id: e.target.value }))} style={{ ...inp, padding: '8px 10px', fontSize: 12 }}>
                      <option value="">— команда —</option>
                      {genderTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <input type="number" value={memberForm.jersey_number} onChange={e => setMemberForm(f => ({ ...f, jersey_number: e.target.value }))} placeholder="№" style={{ ...inp, padding: '8px 10px', fontSize: 12 }} />
                    <input type="date" value={memberForm.joined_at} onChange={e => setMemberForm(f => ({ ...f, joined_at: e.target.value }))} style={{ ...inp, colorScheme: 'dark', padding: '8px 6px', fontSize: 12 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="checkbox" checked={memberForm.is_captain} onChange={e => setMemberForm(f => ({ ...f, is_captain: e.target.checked }))} style={{ accentColor: '#F5A623', width: 15, height: 15 }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Капитан</span>
                    </label>
                    <button onClick={() => addToTeam(player.id, player.name)} style={{ ...btnPrimary, padding: '7px 16px', fontSize: 12 }}>Добавить</button>
                    <button onClick={() => setAddTeamId(null)} style={{ ...btnSecondary, padding: '7px 14px', fontSize: 12 }}>Отмена</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Награды ──────────────────────────────────────────────────────────────────

function AwardsAdmin({ teams, leagues, userEmail, adminSeason }) {
  const [form, setForm] = useState({ league: 'male', team_id: '', player_id: '', nomination: 'setter', match_date: '', stat_value: '' })
  const [players, setPlayers] = useState([])
  const [awards, setAwards] = useState([])

  const leagueOptions = leagues.length > 0
    ? leagues
    : [{ name: 'male', display_name: 'Мужская лига' }, { name: 'female', display_name: 'Женская лига' }]

  const leagueTeams = teams.filter(t => t.league === form.league)

  useEffect(() => { loadAwards() }, [adminSeason?.id])

  useEffect(() => {
    if (form.team_id) {
      let q = supabase.from('team_memberships')
        .select('player_id, players(id, name)')
        .eq('team_id', form.team_id)
      q = adminSeason?.id ? q.eq('season_id', adminSeason.id) : q.is('left_at', null)
      q.then(({ data }) => {
        const ps = (data || []).map(m => m.players).filter(Boolean)
        ps.sort((a, b) => a.name.localeCompare(b.name))
        setPlayers(ps)
      })
    } else {
      setPlayers([])
      setForm(f => ({ ...f, player_id: '' }))
    }
  }, [form.team_id])

  useEffect(() => { setForm(f => ({ ...f, team_id: '', player_id: '' })) }, [form.league])

  async function loadAwards() {
    const { data } = await supabase.from('awards').select('*, players(name), teams(name)').order('match_date', { ascending: false })
    const all = data || []
    setAwards(adminSeason ? all.filter(a => a.season_id === adminSeason.id) : all)
  }

  async function addAward(e) {
    e.preventDefault()
    if (!form.player_id || !form.match_date) return
    await supabase.from('awards').insert({
      player_id: form.player_id,
      team_id: form.team_id,
      league: form.league,
      nomination: form.nomination,
      match_date: form.match_date,
      stat_value: parseFloat(form.stat_value) || null,
      ...(adminSeason ? { season_id: adminSeason.id } : {}),
    })
    const playerName = players.find(p => p.id === form.player_id)?.name || form.player_id
    await logAction(userEmail, 'Добавлено', 'награда', `${playerName} — ${AWARD_CONFIG[form.nomination]?.label}`, { nomination: form.nomination })
    setForm(f => ({ ...f, player_id: '', match_date: '', stat_value: '' }))
    loadAwards()
  }

  async function deleteAward(id, awardInfo) {
    if (!confirm('Удалить награду?')) return
    await supabase.from('awards').delete().eq('id', id)
    await logAction(userEmail, 'Удалено', 'награда', awardInfo)
    loadAwards()
  }

  const statPlaceholder = { setter: 'Кол-во пасов', server: 'Кол-во эйсов', attacker: 'Кол-во очков', libero: 'Процент (%)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ ...card, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>Выдать награду</div>
        <form onSubmit={addAward} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={labelStyle}>Лига</div>
              <select value={form.league} onChange={e => setForm(f => ({ ...f, league: e.target.value }))} style={inp}>
                {leagueOptions.map(l => <option key={l.name} value={l.name}>{l.display_name}</option>)}
              </select>
            </div>
            <div>
              <div style={labelStyle}>Номинация</div>
              <select value={form.nomination} onChange={e => setForm(f => ({ ...f, nomination: e.target.value }))} style={inp}>
                {Object.entries(AWARD_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={labelStyle}>Команда</div>
              <select value={form.team_id} onChange={e => setForm(f => ({ ...f, team_id: e.target.value }))} style={inp}>
                <option value="">— выберите —</option>
                {leagueTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <div style={labelStyle}>Игрок</div>
              <select value={form.player_id} onChange={e => setForm(f => ({ ...f, player_id: e.target.value }))} style={inp} disabled={!form.team_id}>
                <option value="">— выберите —</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: form.nomination === 'mvp' ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <div style={labelStyle}>Дата игры</div>
              <input type="date" value={form.match_date} onChange={e => setForm(f => ({ ...f, match_date: e.target.value }))} style={{ ...inp, colorScheme: 'dark' }} />
            </div>
            {form.nomination !== 'mvp' && (
              <div>
                <div style={labelStyle}>{AWARD_CONFIG[form.nomination]?.label}</div>
                <input type="number" value={form.stat_value} onChange={e => setForm(f => ({ ...f, stat_value: e.target.value }))} placeholder={statPlaceholder[form.nomination]} style={inp} />
              </div>
            )}
          </div>
          <button type="submit" style={{ ...btnPrimary, alignSelf: 'flex-start' }}>Выдать награду</button>
        </form>
      </div>

      <div style={card}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Все награды
        </div>
        {awards.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Нет наград</div>
        ) : awards.map((a, i) => {
          const cfg = AWARD_CONFIG[a.nomination]
          const stat = a.stat_value != null ? `${a.stat_value}${a.nomination === 'libero' ? '%' : ` ${cfg?.statLabel}`}` : '—'
          const awardInfo = `${a.players?.name || '?'} — ${cfg?.label}`
          return (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AwardBadge nomination={a.nomination} size={22} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{a.players?.name || '—'}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                    {a.teams?.name} · {cfg?.label} · {stat} · {a.match_date}
                  </div>
                </div>
              </div>
              <button onClick={() => deleteAward(a.id, awardInfo)} style={{ fontSize: 12, color: '#FF495C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px', flexShrink: 0 }}>Удалить</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Лиги ─────────────────────────────────────────────────────────────────────

function LeaguesAdmin({ userEmail, onUpdate }) {
  const [leagues, setLeagues] = useState([])
  const [form, setForm] = useState({ name: '', display_name: '', gender: 'male' })
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})

  async function load() {
    const { data } = await supabase.from('leagues').select('*').order('created_at')
    setLeagues(data || [])
  }

  useEffect(() => { load() }, [])

  async function addLeague(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.display_name.trim()) return
    const slug = form.name.trim().toLowerCase().replace(/\s+/g, '_')
    const { error } = await supabase.from('leagues').insert({ name: slug, display_name: form.display_name.trim(), gender: form.gender })
    if (error) { alert('Ошибка: ' + (error.message || 'возможно, лига с таким именем уже существует')); return }
    await logAction(userEmail, 'Добавлено', 'лига', form.display_name.trim(), { name: slug, gender: form.gender })
    setForm({ name: '', display_name: '', gender: 'male' })
    load()
    onUpdate()
  }

  async function saveEdit(id) {
    if (!editData.display_name?.trim()) return
    await supabase.from('leagues').update({ display_name: editData.display_name.trim(), gender: editData.gender, active: editData.active }).eq('id', id)
    await logAction(userEmail, 'Изменено', 'лига', editData.display_name.trim())
    setEditId(null)
    load()
    onUpdate()
  }

  async function deleteLeague(id, name) {
    if (!confirm(`Удалить лигу «${name}»?\n\nКоманды и игры с league="${name}" останутся в БД, но лига исчезнет из переключателя.`)) return
    await supabase.from('leagues').delete().eq('id', id)
    await logAction(userEmail, 'Удалено', 'лига', name)
    load()
    onUpdate()
  }

  const GENDER_LABELS = { male: '♂ Мужская', female: '♀ Женская', mixed: '⚥ Смешанная' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Подсказка */}
      <div style={{ background: 'rgba(55,77,245,0.08)', border: '1px solid rgba(55,77,245,0.2)', borderRadius: 12, padding: '14px 16px', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
        <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Как работают лиги:</strong><br />
        Системное имя (slug) используется как идентификатор в командах и играх. После создания лиги назначайте командам и играм это имя в поле «Лига».<br />
        Пример: slug <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4 }}>beach_male</code> → отображаемое название «Пляжная мужская».
      </div>

      {/* Форма создания */}
      <div style={{ ...card, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Создать лигу</div>
        <form onSubmit={addLeague} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={labelStyle}>Системное имя (slug)</div>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="beach_male" style={inp} />
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Только латиница и _, без пробелов</div>
            </div>
            <div>
              <div style={labelStyle}>Отображаемое название</div>
              <input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Пляжная мужская" style={inp} />
            </div>
          </div>
          <div>
            <div style={labelStyle}>Тип</div>
            <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} style={{ ...inp, width: 'auto' }}>
              <option value="male">♂ Мужская</option>
              <option value="female">♀ Женская</option>
              <option value="mixed">⚥ Смешанная</option>
            </select>
          </div>
          <button type="submit" style={{ ...btnPrimary, alignSelf: 'flex-start' }}>Создать лигу</button>
        </form>
      </div>

      {/* Список лиг */}
      <div style={card}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Все лиги
        </div>
        {leagues.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Нет лиг</div>
        ) : leagues.map((lg, i) => {
          if (editId === lg.id) {
            return (
              <div key={lg.id} style={{ padding: '14px 16px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', background: 'rgba(55,77,245,0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={labelStyle}>Отображаемое название</div>
                    <input value={editData.display_name} onChange={e => setEditData(d => ({ ...d, display_name: e.target.value }))} autoFocus style={{ ...inp, padding: '8px 12px', fontSize: 13 }} />
                  </div>
                  <div>
                    <div style={labelStyle}>Тип</div>
                    <select value={editData.gender} onChange={e => setEditData(d => ({ ...d, gender: e.target.value }))} style={{ ...inp, padding: '8px 12px', fontSize: 13 }}>
                      <option value="male">♂ Мужская</option>
                      <option value="female">♀ Женская</option>
                      <option value="mixed">⚥ Смешанная</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={editData.active !== false} onChange={e => setEditData(d => ({ ...d, active: e.target.checked }))} style={{ accentColor: '#5BB849', width: 15, height: 15 }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Активна (показывать в переключателе)</span>
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => saveEdit(lg.id)} style={{ ...btnPrimary, padding: '7px 16px', fontSize: 12 }}>Сохранить</button>
                    <button onClick={() => setEditId(null)} style={{ ...btnSecondary, padding: '7px 16px', fontSize: 12 }}>Отмена</button>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div key={lg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', opacity: lg.active === false ? 0.5 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: lg.active !== false ? '#5BB849' : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{lg.display_name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    slug: <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>{lg.name}</code>
                    {' · '}
                    {GENDER_LABELS[lg.gender] || lg.gender}
                    {lg.active === false && ' · неактивна'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setEditId(lg.id); setEditData({ display_name: lg.display_name, gender: lg.gender, active: lg.active !== false }) }} style={{ fontSize: 12, color: '#374DF5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>Изменить</button>
                <button onClick={() => deleteLeague(lg.id, lg.display_name)} style={{ fontSize: 12, color: '#FF495C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>Удалить</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Сезоны ───────────────────────────────────────────────────────────────────

function SeasonsAdmin({ userEmail, onUpdate }) {
  const [seasons, setSeasons] = useState([])
  const [form, setForm] = useState({ name: '', is_current: false })
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})

  async function load() {
    const { data } = await supabase.from('seasons').select('*').order('created_at', { ascending: false })
    setSeasons(data || [])
  }

  useEffect(() => { load() }, [])

  async function addSeason(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (form.is_current) {
      await supabase.from('seasons').update({ is_current: false }).eq('is_current', true)
    }
    const { error } = await supabase.from('seasons').insert({ name: form.name.trim(), is_current: form.is_current })
    if (error) { alert('Ошибка: ' + error.message); return }
    await logAction(userEmail, 'Добавлено', 'сезон', form.name.trim())
    setForm({ name: '', is_current: false })
    load()
    onUpdate()
  }

  async function saveEdit(id) {
    if (!editData.name?.trim()) return
    if (editData.is_current) {
      await supabase.from('seasons').update({ is_current: false }).neq('id', id)
    }
    await supabase.from('seasons').update({ name: editData.name.trim(), is_current: editData.is_current }).eq('id', id)
    await logAction(userEmail, 'Изменено', 'сезон', editData.name.trim())
    setEditId(null)
    load()
    onUpdate()
  }

  async function deleteSeason(id, name) {
    if (!confirm(`Удалить сезон «${name}»?\n\nИгры и награды, привязанные к этому сезону, останутся в БД.`)) return
    await supabase.from('seasons').delete().eq('id', id)
    await logAction(userEmail, 'Удалено', 'сезон', name)
    load()
    onUpdate()
  }

  async function setCurrent(id) {
    await supabase.from('seasons').update({ is_current: false }).neq('id', id)
    await supabase.from('seasons').update({ is_current: true }).eq('id', id)
    load()
    onUpdate()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Подсказка */}
      <div style={{ background: 'rgba(55,77,245,0.08)', border: '1px solid rgba(55,77,245,0.2)', borderRadius: 12, padding: '14px 16px', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
        <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Как работают сезоны:</strong><br />
        Активный сезон (флаг «Активный») — это то, что видят посетители по умолчанию. Только один сезон может быть активным. Переключатель рабочего сезона в шапке панели определяет, в какой сезон попадают новые игры и награды.
      </div>

      {/* Форма создания */}
      <div style={{ ...card, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Создать сезон</div>
        <form onSubmit={addSeason} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={labelStyle}>Название сезона</div>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Сезон 2025–2026" style={inp} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_current} onChange={e => setForm(f => ({ ...f, is_current: e.target.checked }))} style={{ accentColor: '#5BB849', width: 15, height: 15 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Активный сезон (виден посетителям по умолчанию)</span>
            </label>
            <button type="submit" style={btnPrimary}>Создать сезон</button>
          </div>
        </form>
      </div>

      {/* Список сезонов */}
      <div style={card}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Все сезоны
        </div>
        {seasons.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Нет сезонов</div>
        ) : seasons.map((s, i) => {
          if (editId === s.id) {
            return (
              <div key={s.id} style={{ padding: '14px 16px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', background: 'rgba(55,77,245,0.05)' }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={labelStyle}>Название</div>
                  <input value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} autoFocus style={{ ...inp, padding: '8px 12px', fontSize: 13 }} onKeyDown={e => { if (e.key === 'Escape') setEditId(null) }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={editData.is_current} onChange={e => setEditData(d => ({ ...d, is_current: e.target.checked }))} style={{ accentColor: '#5BB849', width: 15, height: 15 }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Активный сезон</span>
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => saveEdit(s.id)} style={{ ...btnPrimary, padding: '7px 16px', fontSize: 12 }}>Сохранить</button>
                    <button onClick={() => setEditId(null)} style={{ ...btnSecondary, padding: '7px 16px', fontSize: 12 }}>Отмена</button>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.is_current ? '#5BB849' : 'rgba(255,255,255,0.2)', boxShadow: s.is_current ? '0 0 5px #5BB849' : 'none', flexShrink: 0 }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{s.name}</span>
                    {s.is_current && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#5BB849', background: 'rgba(91,184,73,0.15)', border: '1px solid rgba(91,184,73,0.3)', borderRadius: 5, padding: '1px 7px' }}>АКТИВНЫЙ</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                    {new Date(s.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {!s.is_current && (
                  <button onClick={() => setCurrent(s.id)} style={{ fontSize: 12, color: '#5BB849', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>Сделать активным</button>
                )}
                <button onClick={() => { setEditId(s.id); setEditData({ name: s.name, is_current: s.is_current }) }} style={{ fontSize: 12, color: '#374DF5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>Изменить</button>
                <button onClick={() => deleteSeason(s.id, s.name)} style={{ fontSize: 12, color: '#FF495C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>Удалить</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Журнал действий ──────────────────────────────────────────────────────────

const ACTION_COLORS = {
  'Добавлено': '#5BB849',
  'Изменено': '#374DF5',
  'Удалено': '#FF495C',
  'Добавлен в команду': '#F5A623',
  'Убран из команды': '#FF8C42',
}

function ActivityLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState('all')

  useEffect(() => {
    supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data }) => { setLogs(data || []); setLoading(false) })
  }, [])

  const actionTypes = ['all', ...Object.keys(ACTION_COLORS)]
  const filtered = filterAction === 'all' ? logs : logs.filter(l => l.action === filterAction)

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 32, height: 32, border: '2px solid #374DF5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Заголовок */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Журнал действий</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Последние {logs.length} записей</div>
        </div>
        {/* Фильтр по типу */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {actionTypes.map(a => (
            <button
              key={a}
              onClick={() => setFilterAction(a)}
              style={{
                fontSize: 11, fontWeight: filterAction === a ? 700 : 600,
                color: filterAction === a ? '#fff' : 'rgba(255,255,255,0.35)',
                background: filterAction === a ? (ACTION_COLORS[a] ? `${ACTION_COLORS[a]}33` : 'rgba(255,255,255,0.12)') : 'rgba(255,255,255,0.05)',
                border: `1px solid ${filterAction === a ? (ACTION_COLORS[a] || 'rgba(255,255,255,0.3)') + '55' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 7, padding: '5px 12px', cursor: 'pointer',
              }}
            >
              {a === 'all' ? 'Все' : a}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ ...card, padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Нет записей</div>
      ) : (
        <div style={card}>
          {filtered.map((log, i) => {
            const color = ACTION_COLORS[log.action] || 'rgba(255,255,255,0.4)'
            const dt = new Date(log.created_at)
            const dateStr = dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
            const timeStr = dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            return (
              <div
                key={log.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '10px 16px',
                  borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}
              >
                {/* Цветная полоска действия */}
                <div style={{ width: 3, minHeight: 36, borderRadius: 2, background: color, flexShrink: 0, marginTop: 2 }} />

                {/* Основная инфо */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color, background: `${color}1a`, border: `1px solid ${color}33`, borderRadius: 5, padding: '1px 8px', flexShrink: 0 }}>
                      {log.action}
                    </span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                      {log.entity_type}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.entity_name}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>
                    {log.user_email}
                  </div>
                </div>

                {/* Время */}
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'right', flexShrink: 0 }}>
                  <div>{dateStr}</div>
                  <div>{timeStr}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
