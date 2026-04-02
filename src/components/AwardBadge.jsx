export const AWARD_CONFIG = {
  setter:   { label: 'Лучший пассующий', statLabel: 'пасов',  dark: '#1e3a8a', mid: '#2563eb', light: '#93c5fd', sym: 'П' },
  server:   { label: 'Лучший подающий',  statLabel: 'эйсов',  dark: '#78350f', mid: '#d97706', light: '#fde68a', sym: 'С' },
  attacker: { label: 'Лучший атакующий', statLabel: 'очков',  dark: '#7f1d1d', mid: '#dc2626', light: '#fca5a5', sym: 'А' },
  libero:   { label: 'Лучший либеро',    statLabel: '%',      dark: '#064e3b', mid: '#059669', light: '#6ee7b7', sym: 'Л' },
}

export default function AwardBadge({ nomination, size = 20 }) {
  const c = AWARD_CONFIG[nomination] || AWARD_CONFIG.setter
  const cx = 10, cy = 19

  // 8-pointed star
  const star = Array.from({ length: 16 }, (_, i) => {
    const angle = (i * 22.5 - 90) * Math.PI / 180
    const r = i % 2 === 0 ? 8.8 : 7
    return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`
  }).join(' ')

  const h = Math.round(size * 1.35)

  return (
    <svg width={size} height={h} viewBox="0 0 20 27" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ribbon */}
      <rect x="8" y="0" width="4" height="11" rx="1.5" fill={c.dark} />
      <rect x="9" y="0" width="2" height="11" rx="0.8" fill={c.mid} />
      <rect x="9.5" y="1" width="1" height="9" rx="0.3" fill={c.light} opacity="0.4" />

      {/* 8-pointed star (order shape) */}
      <polygon points={star} fill={c.dark} />
      <polygon points={star} fill="none" stroke={c.light} strokeWidth="0.5" opacity="0.8" />

      {/* Medal body */}
      <circle cx={cx} cy={cy} r="6.8" fill={c.mid} />
      <circle cx={cx} cy={cy} r="6.8" fill="none" stroke={c.light} strokeWidth="1.1" />

      {/* Inner decorative ring */}
      <circle cx={cx} cy={cy} r="5.1" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />

      {/* Subtle shine */}
      <circle cx="8.5" cy="16.5" r="2" fill="rgba(255,255,255,0.1)" />

      {/* Symbol */}
      <text
        x={cx} y={cy + 2.7}
        textAnchor="middle"
        fontSize="6.5"
        fontWeight="900"
        fill="white"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        {c.sym}
      </text>
    </svg>
  )
}
