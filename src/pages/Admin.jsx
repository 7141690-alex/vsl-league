import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import AwardBadge, { AWARD_CONFIG } from '../components/AwardBadge'

function getNextSunday() {
  const d = new Date()
  const day = d.getDay()
  const daysUntilSunday = day === 0 ? 7 : 7 - day
  d.setDate(d.getDate() + daysUntilSunday)
  d.setHours(12, 0, 0, 0)
  // format as datetime-local value
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

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

export default function Admin() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [teams, setTeams] = useState([])
  const [matches, setMatches] = useState([])
  const [activeTab, setActiveTab] = useState('teams')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) { loadTeams(); loadMatches() }
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
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inp}
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inp}
            />
            {loginError && <p style={{ color: '#FF495C', fontSize: 12, margin: 0 }}>{loginError}</p>}
            <button type="submit" style={{ ...btnPrimary, marginTop: 4, width: '100%', padding: '12px 20px' }}>
              Войти
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 896, margin: '0 auto', padding: '0 16px 64px' }}>
      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Панель администратора</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>VSL — Volleyball Super League</div>
        </div>
        <button
          onClick={logout}
          style={{ ...btnSecondary, padding: '8px 16px', fontSize: 12, color: '#FF495C', borderColor: 'rgba(255,73,92,0.2)', background: 'rgba(255,73,92,0.06)' }}
        >
          Выйти
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 3, gap: 2, marginBottom: 24 }}>
        {[{ id: 'teams', label: 'Команды' }, { id: 'matches', label: 'Игры' }, { id: 'players', label: 'Игроки' }, { id: 'awards', label: '🏅 Награды' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={activeTab === t.id ? {
              background: 'linear-gradient(135deg, #374DF5, #6366f1)',
              color: '#fff', boxShadow: '0 2px 10px rgba(55,77,245,0.45)',
              borderRadius: 7, padding: '8px 24px', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
            } : {
              background: 'transparent', color: 'rgba(255,255,255,0.45)',
              borderRadius: 7, padding: '8px 24px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'teams' && <TeamsAdmin teams={teams} onUpdate={loadTeams} />}
      {activeTab === 'matches' && <MatchesAdmin matches={matches} teams={teams} onUpdate={loadMatches} />}
      {activeTab === 'players' && <PlayersAdmin teams={teams} />}
      {activeTab === 'awards' && <AwardsAdmin teams={teams} />}
    </div>
  )
}

function TeamsAdmin({ teams, onUpdate }) {
  const [name, setName] = useState('')
  const [league, setLeague] = useState('male')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  async function addTeam(e) {
    e.preventDefault()
    if (!name.trim()) return
    await supabase.from('teams').insert({ name: name.trim(), league })
    setName('')
    onUpdate()
  }

  async function deleteTeam(id) {
    if (!confirm('Удалить команду?')) return
    await supabase.from('teams').delete().eq('id', id)
    onUpdate()
  }

  function startEdit(team) {
    setEditingId(team.id)
    setEditingName(team.name)
  }

  async function saveEdit(id) {
    if (!editingName.trim()) return
    await supabase.from('teams').update({ name: editingName.trim() }).eq('id', id)
    setEditingId(null)
    setEditingName('')
    onUpdate()
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingName('')
  }

  const maleTeams = teams.filter(t => t.league === 'male')
  const femaleTeams = teams.filter(t => t.league === 'female')

  function renderTeamList(list) {
    if (list.length === 0) return (
      <div style={{ padding: '16px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Нет команд</div>
    )
    return list.map((team, i) => (
      <div key={team.id} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 16px',
        borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}>
        {editingId === team.id ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <input
              value={editingName}
              onChange={e => setEditingName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveEdit(team.id); if (e.key === 'Escape') cancelEdit() }}
              autoFocus
              style={{ ...inp, padding: '6px 12px', fontSize: 13, flex: 1 }}
            />
            <button onClick={() => saveEdit(team.id)} style={{ ...btnPrimary, padding: '6px 14px', fontSize: 12 }}>
              Сохранить
            </button>
            <button onClick={cancelEdit} style={{ ...btnSecondary, padding: '6px 14px', fontSize: 12 }}>
              Отмена
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#374DF5', boxShadow: '0 0 5px #374DF5', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{team.name}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => startEdit(team)} style={{ fontSize: 12, color: '#374DF5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>
                Изменить
              </button>
              <button onClick={() => deleteTeam(team.id)} style={{ fontSize: 12, color: '#FF495C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>
                Удалить
              </button>
            </div>
          </>
        )}
      </div>
    ))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Add team form */}
      <div style={{ ...card, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          Добавить команду
        </div>
        <form onSubmit={addTeam} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Название команды"
            style={{ ...inp, flex: 1, minWidth: 180 }}
          />
          <select
            value={league}
            onChange={e => setLeague(e.target.value)}
            style={{ ...inp, width: 'auto', flexShrink: 0 }}
          >
            <option value="male">Мужская</option>
            <option value="female">Женская</option>
          </select>
          <button type="submit" style={btnPrimary}>Добавить</button>
        </form>
      </div>

      {/* Male teams */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 3, height: 16, borderRadius: 2, background: '#374DF5' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Мужская лига</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '2px 8px' }}>
            {maleTeams.length}
          </span>
        </div>
        <div style={card}>{renderTeamList(maleTeams)}</div>
      </div>

      {/* Female teams */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 3, height: 16, borderRadius: 2, background: '#FF8C42' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Женская лига</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '2px 8px' }}>
            {femaleTeams.length}
          </span>
        </div>
        <div style={card}>{renderTeamList(femaleTeams)}</div>
      </div>
    </div>
  )
}

function MatchesAdmin({ matches, teams, onUpdate }) {
  const [form, setForm] = useState({
    league: 'male', home_team_id: '', away_team_id: '',
    match_date: getNextSunday(), venue: '', status: 'scheduled',
    home_sets: 0, away_sets: 0, photo_url: '', video_url: ''
  })
  const [sets, setSets] = useState([])
  const [editId, setEditId] = useState(null)

  const leagueTeams = teams.filter(t => t.league === form.league)

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
    }

    let matchId = editId
    if (editId) {
      await supabase.from('matches').update(matchData).eq('id', editId)
    } else {
      const { data } = await supabase.from('matches').insert(matchData).select().single()
      matchId = data?.id
    }

    if (matchId && sets.length > 0) {
      await supabase.from('set_scores').delete().eq('match_id', matchId)
      const setData = sets.map((s, i) => ({
        match_id: matchId,
        set_number: i + 1,
        home_points: parseInt(s.home) || 0,
        away_points: parseInt(s.away) || 0,
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

  async function deleteMatch(id) {
    if (!confirm('Удалить игру?')) return
    await supabase.from('matches').delete().eq('id', id)
    onUpdate()
  }

  const totalSets = parseInt(form.home_sets) + parseInt(form.away_sets)

  function updateSetsCount(home, away) {
    const total = parseInt(home) + parseInt(away)
    if (total !== totalSets) {
      setSets(Array.from({ length: total }, (_, i) => sets[i] || { home: '', away: '' }))
    }
  }

  const teamsMap = teams.reduce((acc, t) => ({ ...acc, [t.id]: t }), {})
  const knownVenues = [...new Set(matches.map(m => m.venue).filter(Boolean))].sort()

  const labelStyle = { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Form */}
      <div style={{ ...card, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: editId ? '#374DF5' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>
          {editId ? '✎ Редактировать игру' : '+ Добавить игру'}
        </div>

        <form onSubmit={saveMatch} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* League + Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={labelStyle}>Лига</div>
              <select value={form.league} onChange={e => setForm(f => ({ ...f, league: e.target.value }))} style={inp}>
                <option value="male">Мужская лига</option>
                <option value="female">Женская лига</option>
              </select>
            </div>
            <div>
              <div style={labelStyle}>Дата и время</div>
              <input type="datetime-local" value={form.match_date} onChange={e => setForm(f => ({ ...f, match_date: e.target.value }))} style={{ ...inp, colorScheme: 'dark' }} />
            </div>
          </div>

          {/* Venue */}
          <div>
            <div style={labelStyle}>Зал</div>
            <input
              value={form.venue}
              onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
              placeholder="Название зала"
              list="venues-datalist"
              style={inp}
            />
            <datalist id="venues-datalist">
              {knownVenues.map(v => <option key={v} value={v} />)}
            </datalist>
          </div>

          {/* Teams */}
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

          {/* Status + set score */}
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

          {/* Per-set scores */}
          {form.status === 'finished' && sets.length > 0 && (
            <div>
              <div style={labelStyle}>Счёт по сетам</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sets.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', width: 48, flexShrink: 0 }}>Сет {i + 1}</span>
                    <input type="number" value={s.home} onChange={e => setSets(ss => ss.map((x, j) => j === i ? { ...x, home: e.target.value } : x))}
                      placeholder="0" style={{ ...inp, width: 64, textAlign: 'center', padding: '8px' }} />
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>:</span>
                    <input type="number" value={s.away} onChange={e => setSets(ss => ss.map((x, j) => j === i ? { ...x, away: e.target.value } : x))}
                      placeholder="0" style={{ ...inp, width: 64, textAlign: 'center', padding: '8px' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo & Video URLs */}
          {form.status === 'finished' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={labelStyle}>📷 Фотоотчёт (ссылка)</div>
                <input
                  value={form.photo_url}
                  onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))}
                  placeholder="https://photos.google.com/..."
                  style={inp}
                />
              </div>
              <div>
                <div style={labelStyle}>▶ Видеозапись (YouTube)</div>
                <input
                  value={form.video_url}
                  onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                  style={inp}
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="submit" style={btnPrimary}>
              {editId ? 'Сохранить' : 'Добавить'}
            </button>
            {editId && (
              <button type="button" onClick={resetForm} style={btnSecondary}>Отмена</button>
            )}
          </div>
        </form>
      </div>

      {/* Matches list */}
      <div style={card}>
        {matches.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Нет игр</div>
        )}
        {matches.map((match, i) => {
          const home = teamsMap[match.home_team_id]
          const away = teamsMap[match.away_team_id]
          const finished = match.status === 'finished'
          return (
            <div key={match.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px',
              borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: finished ? '#5BB849' : '#374DF5', boxShadow: `0 0 4px ${finished ? '#5BB849' : '#374DF5'}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                    {home?.name || '?'} <span style={{ color: 'rgba(255,255,255,0.3)' }}>vs</span> {away?.name || '?'}
                  </span>
                  {finished && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#5BB849' }}>
                      {match.home_sets}:{match.away_sets}
                    </span>
                  )}
                </div>
                {match.match_date && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', paddingLeft: 13 }}>
                    {new Date(match.match_date).toLocaleString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => startEdit(match)} style={{ fontSize: 12, color: '#374DF5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>
                  Изменить
                </button>
                <button onClick={() => deleteMatch(match.id)} style={{ fontSize: 12, color: '#FF495C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>
                  Удалить
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PlayersAdmin({ teams }) {
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [players, setPlayers] = useState([])
  const [name, setName] = useState('')
  const [height, setHeight] = useState('')
  const [jerseyNumber, setJerseyNumber] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingData, setEditingData] = useState({ name: '', height: '', jersey_number: '', is_captain: false })

  useEffect(() => {
    if (selectedTeamId) loadPlayers()
    else setPlayers([])
  }, [selectedTeamId])

  async function loadPlayers() {
    const { data } = await supabase.from('players').select('*').eq('team_id', selectedTeamId).order('jersey_number', { ascending: true, nullsFirst: false })
    setPlayers(data || [])
  }

  const hasCaptain = players.some(p => p.is_captain)

  async function addPlayer(e) {
    e.preventDefault()
    if (!name.trim() || !selectedTeamId) return
    await supabase.from('players').insert({ team_id: selectedTeamId, name: name.trim(), height: parseInt(height) || null, jersey_number: parseInt(jerseyNumber) || null, is_captain: false })
    setName('')
    setHeight('')
    setJerseyNumber('')
    loadPlayers()
  }

  async function deletePlayer(id) {
    if (!confirm('Удалить игрока?')) return
    await supabase.from('players').delete().eq('id', id)
    loadPlayers()
  }

  function startEdit(player) {
    setEditingId(player.id)
    setEditingData({ name: player.name, height: player.height || '', jersey_number: player.jersey_number || '', is_captain: player.is_captain || false })
  }

  async function saveEdit(id) {
    if (!editingData.name.trim()) return
    const isSettingCaptain = editingData.is_captain
    const currentPlayer = players.find(p => p.id === id)
    // if assigning captain, first remove it from others
    if (isSettingCaptain && !currentPlayer?.is_captain) {
      await supabase.from('players').update({ is_captain: false }).eq('team_id', selectedTeamId)
    }
    await supabase.from('players').update({ name: editingData.name.trim(), height: parseInt(editingData.height) || null, jersey_number: parseInt(editingData.jersey_number) || null, is_captain: editingData.is_captain }).eq('id', id)
    setEditingId(null)
    loadPlayers()
  }

  const maleTeams = teams.filter(t => t.league === 'male')
  const femaleTeams = teams.filter(t => t.league === 'female')
  const selectedTeam = teams.find(t => t.id === selectedTeamId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Team selector */}
      <div style={{ ...card, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Выберите команду
        </div>
        <select value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)} style={inp}>
          <option value="">— выберите команду —</option>
          {maleTeams.length > 0 && (
            <optgroup label="Мужская лига">
              {maleTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </optgroup>
          )}
          {femaleTeams.length > 0 && (
            <optgroup label="Женская лига">
              {femaleTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </optgroup>
          )}
        </select>
      </div>

      {selectedTeamId && (
        <>
          {/* Add player form */}
          <div style={{ ...card, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Добавить игрока — {selectedTeam?.name}
            </div>
            <form onSubmit={addPlayer} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                type="number"
                value={jerseyNumber}
                onChange={e => setJerseyNumber(e.target.value)}
                placeholder="№"
                style={{ ...inp, width: 72 }}
              />
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Имя игрока"
                style={{ ...inp, flex: 1, minWidth: 160 }}
              />
              <input
                type="number"
                value={height}
                onChange={e => setHeight(e.target.value)}
                placeholder="Рост (см)"
                style={{ ...inp, width: 120 }}
              />
              <button type="submit" style={btnPrimary}>Добавить</button>
            </form>
          </div>

          {/* Players list */}
          <div style={card}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{selectedTeam?.name}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '2px 8px' }}>
                {players.length} {players.length === 1 ? 'игрок' : players.length < 5 ? 'игрока' : 'игроков'}
              </span>
            </div>
            {players.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                Нет игроков
              </div>
            ) : (
              players.map((player, i) => (
                <div key={player.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  {editingId === player.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                      <input
                        type="number"
                        value={editingData.jersey_number}
                        onChange={e => setEditingData(d => ({ ...d, jersey_number: e.target.value }))}
                        placeholder="№"
                        style={{ ...inp, width: 72, padding: '6px 10px', fontSize: 13 }}
                      />
                      <input
                        value={editingData.name}
                        onChange={e => setEditingData(d => ({ ...d, name: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(player.id); if (e.key === 'Escape') setEditingId(null) }}
                        autoFocus
                        style={{ ...inp, flex: 1, minWidth: 140, padding: '6px 12px', fontSize: 13 }}
                      />
                      <input
                        type="number"
                        value={editingData.height}
                        onChange={e => setEditingData(d => ({ ...d, height: e.target.value }))}
                        placeholder="Рост"
                        style={{ ...inp, width: 90, padding: '6px 10px', fontSize: 13 }}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: (!editingData.is_captain && hasCaptain) ? 'not-allowed' : 'pointer', opacity: (!editingData.is_captain && hasCaptain) ? 0.4 : 1, flexShrink: 0 }}>
                        <input
                          type="checkbox"
                          checked={editingData.is_captain}
                          disabled={!editingData.is_captain && hasCaptain}
                          onChange={e => setEditingData(d => ({ ...d, is_captain: e.target.checked }))}
                          style={{ accentColor: '#F5A623', width: 16, height: 16 }}
                        />
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Капитан</span>
                      </label>
                      <button onClick={() => saveEdit(player.id)} style={{ ...btnPrimary, padding: '6px 14px', fontSize: 12 }}>Сохранить</button>
                      <button onClick={() => setEditingId(null)} style={{ ...btnSecondary, padding: '6px 14px', fontSize: 12 }}>Отмена</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#374DF5', boxShadow: '0 0 5px #374DF5', flexShrink: 0 }} />
                        {player.jersey_number != null && (
                          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', minWidth: 20, textAlign: 'center' }}>#{player.jersey_number}</span>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{player.name}</span>
                        {player.is_captain && (
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#F5A623', background: 'rgba(245,166,35,0.15)', borderRadius: 5, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Капитан
                          </span>
                        )}
                        {player.height && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#374DF5', background: 'rgba(55,77,245,0.1)', borderRadius: 5, padding: '2px 8px' }}>
                            {player.height} см
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => startEdit(player)} style={{ fontSize: 12, color: '#374DF5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>Изменить</button>
                        <button onClick={() => deletePlayer(player.id)} style={{ fontSize: 12, color: '#FF495C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>Удалить</button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

function AwardsAdmin({ teams }) {
  const [form, setForm] = useState({ league: 'male', team_id: '', player_id: '', nomination: 'setter', match_date: '', stat_value: '' })
  const [players, setPlayers] = useState([])
  const [awards, setAwards] = useState([])

  const labelStyle = { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }

  const leagueTeams = teams.filter(t => t.league === form.league)

  useEffect(() => { loadAwards() }, [])

  useEffect(() => {
    if (form.team_id) {
      supabase.from('players').select('*').eq('team_id', form.team_id).order('name').then(({ data }) => setPlayers(data || []))
    } else {
      setPlayers([])
      setForm(f => ({ ...f, player_id: '' }))
    }
  }, [form.team_id])

  useEffect(() => {
    setForm(f => ({ ...f, team_id: '', player_id: '' }))
  }, [form.league])

  async function loadAwards() {
    const { data } = await supabase
      .from('awards')
      .select('*, players(name), teams(name)')
      .order('match_date', { ascending: false })
    setAwards(data || [])
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
    })
    setForm(f => ({ ...f, player_id: '', match_date: '', stat_value: '' }))
    loadAwards()
  }

  async function deleteAward(id) {
    if (!confirm('Удалить награду?')) return
    await supabase.from('awards').delete().eq('id', id)
    loadAwards()
  }

  const statPlaceholder = { setter: 'Кол-во пасов', server: 'Кол-во эйсов', attacker: 'Кол-во очков', libero: 'Процент (%)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Form */}
      <div style={{ ...card, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>
          Выдать награду
        </div>
        <form onSubmit={addAward} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* League + Nomination */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={labelStyle}>Лига</div>
              <select value={form.league} onChange={e => setForm(f => ({ ...f, league: e.target.value }))} style={inp}>
                <option value="male">Мужская лига</option>
                <option value="female">Женская лига</option>
              </select>
            </div>
            <div>
              <div style={labelStyle}>Номинация</div>
              <select value={form.nomination} onChange={e => setForm(f => ({ ...f, nomination: e.target.value }))} style={inp}>
                {Object.entries(AWARD_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Team + Player */}
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

          {/* Date + Stat */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={labelStyle}>Дата игры</div>
              <input type="date" value={form.match_date} onChange={e => setForm(f => ({ ...f, match_date: e.target.value }))} style={{ ...inp, colorScheme: 'dark' }} />
            </div>
            <div>
              <div style={labelStyle}>{AWARD_CONFIG[form.nomination]?.label}</div>
              <input
                type="number"
                value={form.stat_value}
                onChange={e => setForm(f => ({ ...f, stat_value: e.target.value }))}
                placeholder={statPlaceholder[form.nomination]}
                style={inp}
              />
            </div>
          </div>

          <button type="submit" style={{ ...btnPrimary, alignSelf: 'flex-start' }}>Выдать награду</button>
        </form>
      </div>

      {/* Awards list */}
      <div style={card}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Все награды
        </div>
        {awards.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Нет наград</div>
        ) : (
          awards.map((a, i) => {
            const cfg = AWARD_CONFIG[a.nomination]
            const stat = a.stat_value != null ? `${a.stat_value}${a.nomination === 'libero' ? '%' : ` ${cfg?.statLabel}`}` : '—'
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
                <button onClick={() => deleteAward(a.id)} style={{ fontSize: 12, color: '#FF495C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px', flexShrink: 0 }}>
                  Удалить
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
