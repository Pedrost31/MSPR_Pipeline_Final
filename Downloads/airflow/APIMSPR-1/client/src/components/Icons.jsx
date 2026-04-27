function Svg({ size, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', flexShrink: 0 }}
    >
      {children}
    </svg>
  )
}

export function IconDashboard({ size = 18 }) {
  return (
    <Svg size={size}>
      <rect x="3" y="14" width="5" height="7" rx="1"/>
      <rect x="9.5" y="9" width="5" height="12" rx="1"/>
      <rect x="16" y="4" width="5" height="17" rx="1"/>
    </Svg>
  )
}

export function IconUsers({ size = 18 }) {
  return (
    <Svg size={size}>
      <circle cx="9" cy="7" r="4"/>
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      <path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
    </Svg>
  )
}

export function IconFood({ size = 18 }) {
  return (
    <Svg size={size}>
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20"/>
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7"/>
    </Svg>
  )
}

export function IconUser({ size = 18 }) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="7" r="4"/>
      <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/>
    </Svg>
  )
}

export function IconActivity({ size = 18 }) {
  return (
    <Svg size={size}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </Svg>
  )
}

export function IconHome({ size = 18 }) {
  return (
    <Svg size={size}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </Svg>
  )
}

export function IconBowl({ size = 18 }) {
  return (
    <Svg size={size}>
      <path d="M3 11c0 4.4 4 8 9 8s9-3.6 9-8H3z"/>
      <line x1="2" x2="22" y1="11" y2="11"/>
      <path d="M12 3v3"/>
      <path d="M9.5 4.5l.8 2"/>
      <path d="M14.5 4.5l-.8 2"/>
    </Svg>
  )
}

export function IconTrend({ size = 18 }) {
  return (
    <Svg size={size}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </Svg>
  )
}

export function IconEmpty({ size = 40 }) {
  return (
    <Svg size={size}>
      <path d="M22 12h-6l-2 4h-4l-2-4H2"/>
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </Svg>
  )
}

/* ── Icônes pour les cartes Bilan Global ─────────────────── */

export function IconNutrition({ size = 18 }) {
  return (
    <Svg size={size}>
      <path d="M12 2a5 5 0 0 1 5 5c0 6-5 13-5 13S7 13 7 7a5 5 0 0 1 5-5z"/>
      <circle cx="12" cy="7" r="2"/>
    </Svg>
  )
}

export function IconRun({ size = 18 }) {
  return (
    <Svg size={size}>
      <circle cx="13" cy="4" r="2"/>
      <path d="M7 22l3-6 2 2 3-7"/>
      <path d="M17 22l-3-6"/>
      <path d="M5 12l2-3 4 1 3-4"/>
    </Svg>
  )
}

export function IconScale({ size = 18 }) {
  return (
    <Svg size={size}>
      <path d="M12 3v18"/>
      <path d="M3 9l4-4 5 3 5-3 4 4"/>
      <path d="M5 16a3 3 0 1 0 6 0l-3-7-3 7z"/>
      <path d="M13 16a3 3 0 1 0 6 0l-3-7-3 7z"/>
    </Svg>
  )
}

export function IconBmi({ size = 18 }) {
  return (
    <Svg size={size}>
      <path d="M3 3v18h18"/>
      <path d="m7 16 4-8 4 4 4-6"/>
    </Svg>
  )
}

export function IconLink({ size = 18 }) {
  return (
    <Svg size={size}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </Svg>
  )
}

export function IconCalendar({ size = 18 }) {
  return (
    <Svg size={size}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </Svg>
  )
}

export function IconProtein({ size = 18 }) {
  return (
    <Svg size={size}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </Svg>
  )
}

export function IconGrain({ size = 18 }) {
  return (
    <Svg size={size}>
      <path d="M2 22 16 8"/>
      <path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94z"/>
      <path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94z"/>
      <path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94z"/>
      <path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4z"/>
      <path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0z"/>
    </Svg>
  )
}
