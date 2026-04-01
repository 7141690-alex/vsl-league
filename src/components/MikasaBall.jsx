export default function MikasaBall({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ballGrad" cx="38%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </radialGradient>
        <clipPath id="circle">
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>

      {/* Base white ball */}
      <circle cx="50" cy="50" r="48" fill="#f0f0f0" />

      {/* Mikasa panel colors - Blue panels */}
      <g clipPath="url(#circle)">
        {/* Top blue panel */}
        <path d="M50 2 Q65 15 70 35 Q60 40 50 38 Q40 40 30 35 Q35 15 50 2Z" fill="#1a5cff" />
        {/* Bottom blue panel */}
        <path d="M50 98 Q35 85 30 65 Q40 60 50 62 Q60 60 70 65 Q65 85 50 98Z" fill="#1a5cff" />
        {/* Left yellow panel */}
        <path d="M2 50 Q15 35 35 30 Q40 40 38 50 Q40 60 35 70 Q15 65 2 50Z" fill="#ffd700" />
        {/* Right yellow panel */}
        <path d="M98 50 Q85 65 65 70 Q60 60 62 50 Q60 40 65 30 Q85 35 98 50Z" fill="#ffd700" />
        {/* Top-right blue accent */}
        <path d="M70 35 Q82 28 88 18 Q78 8 65 5 Q60 18 50 22 Q58 28 70 35Z" fill="#0033cc" />
        {/* Bottom-left blue accent */}
        <path d="M30 65 Q18 72 12 82 Q22 92 35 95 Q40 82 50 78 Q42 72 30 65Z" fill="#0033cc" />
        {/* Center white cross areas */}
        <path d="M38 50 Q40 40 50 38 Q60 40 62 50 Q60 60 50 62 Q40 60 38 50Z" fill="#f5f5f5" />
      </g>

      {/* Panel lines */}
      <g clipPath="url(#circle)" fill="none" stroke="#ccc" strokeWidth="0.8" opacity="0.6">
        <path d="M50 2 Q65 15 70 35" />
        <path d="M50 2 Q35 15 30 35" />
        <path d="M50 98 Q65 85 70 65" />
        <path d="M50 98 Q35 85 30 65" />
        <path d="M30 35 Q40 40 38 50" />
        <path d="M70 35 Q60 40 62 50" />
        <path d="M38 50 Q40 60 30 65" />
        <path d="M62 50 Q60 60 70 65" />
      </g>

      {/* Shine */}
      <ellipse cx="36" cy="30" rx="10" ry="6" fill="white" opacity="0.25" transform="rotate(-30 36 30)" />

      {/* Border */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />

      {/* Overlay gradient for 3D */}
      <circle cx="50" cy="50" r="48" fill="url(#ballGrad)" />
    </svg>
  )
}
