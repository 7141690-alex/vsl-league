// Временная заглушка на время восстановления данных после атаки 22.09.2026.
// Выключается одной строкой: MAINTENANCE = false в App.jsx

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="7" stroke="#5BB849" strokeWidth="1.6" opacity="0.5" />
    <path d="M5 8.2l2.2 2.2L11 6.6" stroke="#5BB849" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Spinner = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="7" stroke="#FF8C42" strokeWidth="1.6" opacity="0.25" />
    <path d="M8 1a7 7 0 016.6 4.7" stroke="#FF8C42" strokeWidth="1.8" strokeLinecap="round">
      <animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="1.4s" repeatCount="indefinite" />
    </path>
  </svg>
)

const Row = ({ icon, children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '11px 0' }}>
    {icon}
    <span style={{ fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.72)' }}>{children}</span>
  </div>
)

export default function Maintenance({ onAdmin }) {
  return (
    <div className="min-h-screen w-full" style={{ background: 'linear-gradient(160deg, #0b1120 0%, #0f2044 40%, #0b1120 100%)', position: 'relative', overflow: 'hidden' }}>

      {/* фон: свечение и сетка — как в шапке сайта */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 700, height: 320, maxWidth: '150%', background: 'radial-gradient(ellipse, rgba(55,77,245,0.32) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
      </div>

      <div style={{ position: 'relative', maxWidth: 620, margin: '0 auto', padding: '56px 20px 40px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 40 }}>
          <img src="/logo.png" alt="VSL" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>VSL</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em', marginTop: 2 }}>Volleyball Super League</div>
          </div>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 20,
          background: 'rgba(255,140,66,0.12)', border: '1px solid rgba(255,140,66,0.3)',
          borderRadius: 100, padding: '5px 13px',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF8C42', boxShadow: '0 0 6px #FF8C42', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#FF8C42', letterSpacing: '0.08em' }}>ВРЕМЕННО НЕ РАБОТАЕТ</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(26px, 6.5vw, 38px)', fontWeight: 900, color: '#fff',
          letterSpacing: '-0.03em', lineHeight: 1.12, margin: '0 0 18px',
        }}>
          VSL вышла на новый<br />уровень признания
        </h1>

        <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,0.62)', margin: '0 0 14px' }}>
          Нас взломали. 22 сентября кто-то решил, что любительская волейбольная лига
          из Ташкента — цель, достойная настоящей хакерской атаки, и уничтожил часть
          наших данных: турнирные таблицы, расписание и результаты матчей.
        </p>

        <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,0.62)', margin: '0 0 32px' }}>
          Внимание, конечно, лестное — не каждый день такое. Но теперь нам нужно
          немного времени: залатать дыры в безопасности и вернуть данные на место.
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14, padding: '6px 18px', marginBottom: 32,
        }}>
          <Row icon={<Check />}>Дыры в безопасности закрыты — повториться это не может</Row>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <Row icon={<Spinner />}>Восстанавливаем таблицы, расписание и результаты</Row>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <Row icon={<Check />}>Профили игроков не пострадали — все 1167 на месте</Row>
        </div>

        <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', fontWeight: 600, margin: '0 0 8px' }}>
          Скоро вернёмся. Спасибо, что вы с нами.
        </p>

        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.32)', margin: '0 0 44px', fontStyle: 'italic' }}>
          P.S. Хакеру: в следующий раз просто спросите — мы бы и так рассказали,
          кто лидер таблицы.
        </p>

        <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(55,77,245,0.4), transparent)' }} />
        <button
          onClick={onAdmin}
          style={{
            marginTop: 18, fontSize: 11, color: 'rgba(255,255,255,0.22)', cursor: 'pointer',
            background: 'none', border: 'none', padding: 0, letterSpacing: '0.08em', fontWeight: 600,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.22)' }}>
          ⚙ ADMIN
        </button>
      </div>
    </div>
  )
}
