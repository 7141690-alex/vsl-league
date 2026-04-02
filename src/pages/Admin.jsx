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
  const today = new Date().toISOString().slice(0, 10)
  const [players, setPlayers] = useState([])
  const [memberships, setMemberships] = useState({}) // player_id → membership
  const [newForm, setNewForm] = useState({ name: '', gender: 'male', height: '', birth_date: '' })
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})
  const [addTeamId, setAddTeamId] = useState(null) // player_id expanding add-to-team form
  const [memberForm, setMemberForm] = useState({ team_id: '', jersey_number: '', is_captain: false, joined_at: today })
  const labelStyle = { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }

  async function load() {
    const [{ data: pData }, { data: mData }] = await Promise.all([
      supabase.from('players').select('*').order('name'),
      supabase.from('team_memberships').select('*, teams(name, league)').is('left_at', null),
    ])
    setPlayers(pData || [])
    const map = {}
    for (const m of (mData || [])) map[m.player_id] = m
    setMemberships(map)
  }

  useEffect(() => { load() }, [])

  async function createPlayer(e) {
    e.preventDefault()
    if (!newForm.name.trim()) return
    await supabase.from('players').insert({ name: newForm.name.trim(), gender: newForm.gender, height: parseInt(newForm.height) || null, birth_date: newForm.birth_date || null })
    setNewForm({ name: '', gender: 'male', height: '', birth_date: '' })
    load()
  }

  async function saveEdit(id) {
    if (!editData.name?.trim()) return
    await supabase.from('players').update({ name: editData.name.trim(), gender: editData.gender, height: parseInt(editData.height) || null, birth_date: editData.birth_date || null }).eq('id', id)
    setEditId(null)
    load()
  }

  async function deletePlayer(id) {
    if (!confirm('Удалить игрока? Все его членства и номинации будут удалены.')) return
    await supabase.from('players').delete().eq('id', id)
    load()
  }

  async function addToTeam(playerId) {
    if (!memberForm.team_id) return
    // Снять капитанство в команде если нужно
    if (memberForm.is_captain) {
      const { data: existing } = await supabase.from('team_memberships').select('id').eq('team_id', memberForm.team_id).eq('is_captain', true).is('left_at', null)
      if (existing?.length) await supabase.from('team_memberships').update({ is_captain: false }).in('id', existing.map(x => x.id))
    }
    await supabase.from('team_memberships').insert({ player_id: playerId, team_id: memberForm.team_id, jersey_number: parseInt(memberForm.jersey_number) || null, is_captain: memberForm.is_captain, joined_at: memberForm.joined_at || today })
    setAddTeamId(null)
    setMemberForm({ team_id: '', jersey_number: '', is_captain: false, joined_at: today })
    load()
  }

  async function removeFromTeam(membershipId) {
    await supabase.from('team_memberships').update({ left_at: today }).eq('id', membershipId)
    load()
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Create player */}
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

      {/* Players list */}
      <div style={card}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Все игроки</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '2px 8px' }}>{players.length}</span>
          </div>
        </div>

        {players.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Нет игроков</div>
        ) : players.map((player, i) => {
          const membership = memberships[player.id]
          const isEditing = editId === player.id
          const isAddingTeam = addTeamId === player.id
          const genderTeams = teams.filter(t => t.league === (player.gender === 'female' ? 'female' : 'male'))
          const age = player.birth_date ? Math.floor((new Date() - new Date(player.birth_date)) / (365.25 * 24 * 3600 * 1000)) : null

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
                        {age ? `${age} лет` : ''}
                        {age && player.height ? ' · ' : ''}
                        {player.height ? `${player.height} см` : ''}
                      </div>
                    </div>
                    {membership ? (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#5BB849', background: 'rgba(91,184,73,0.1)', border: '1px solid rgba(91,184,73,0.25)', borderRadius: 6, padding: '2px 8px', flexShrink: 0 }}>
                        {membership.teams?.name}
                        {membership.jersey_number != null ? ` #${membership.jersey_number}` : ''}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>Без команды</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {membership ? (
                      <button onClick={() => removeFromTeam(membership.id)} style={{ fontSize: 11, color: '#FF8C42', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>Убрать из команды</button>
                    ) : (
                      <button onClick={() => { setAddTeamId(player.id); setMemberForm({ team_id: '', jersey_number: '', is_captain: false, joined_at: today }) }} style={{ fontSize: 11, color: '#5BB849', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>+ Команда</button>
                    )}
                    <button onClick={() => { setEditId(player.id); setEditData({ name: player.name, gender: player.gender || 'male', height: player.height || '', birth_date: player.birth_date || '' }) }} style={{ fontSize: 11, color: '#374DF5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>Изменить</button>
                    <button onClick={() => deletePlayer(player.id)} style={{ fontSize: 11, color: '#FF495C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>Удалить</button>
                  </div>
                </div>
              )}

              {/* Add to team form */}
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
                    <button onClick={() => addToTeam(player.id)} style={{ ...btnPrimary, padding: '7px 16px', fontSize: 12 }}>Добавить</button>
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

function AwardsAdmin({ teams }) {
  const [form, setForm] = useState({ league: 'male', team_id: '', player_id: '', nomination: 'setter', match_date: '', stat_value: '' })
  const [players, setPlayers] = useState([])
  const [awards, setAwards] = useState([])

  const labelStyle = { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }

  const leagueTeams = teams.filter(t => t.league === form.league)

  useEffect(() => { loadAwards() }, [])

  useEffect(() => {
    if (form.team_id) {
      supabase.from('team_memberships')
        .select('player_id, players(id, name)')
        .eq('team_id', form.team_id)
        .is('left_at', null)
        .then(({ data }) => {
          const ps = (data || []).map(m => m.players).filter(Boolean)
          ps.sort((a, b) => a.name.localeCompare(b.name))
          setPlayers(ps)
        })
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
          <div style={{ display: 'grid', gridTemplateColumns: form.nomination === 'mvp' ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <div style={labelStyle}>Дата игры</div>
              <input type="date" value={form.match_date} onChange={e => setForm(f => ({ ...f, match_date: e.target.value }))} style={{ ...inp, colorScheme: 'dark' }} />
            </div>
            {form.nomination !== 'mvp' && (
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
            )}
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
