import React from 'react'

/**
 * Inline stroke icons for the marketing site.
 * Kept local (no icon dependency) so the public site ships nothing extra.
 * Every glyph is drawn on a 24x24 grid with a 1.7 stroke.
 */
const P = {
  check: <polyline points="20 6 9 17 4 12" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="16 9.5 11 15 8 12" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c0-3.6 3.4-5.6 7.5-5.6s7.5 2 7.5 5.6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 20c0-3.3 2.8-5.2 6.2-5.2s6.2 1.9 6.2 5.2" />
      <path d="M16.5 5.2a3.2 3.2 0 0 1 0 6" />
      <path d="M17.8 14.5c2.2.6 3.7 2.2 3.7 4.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7.5 3v5.6c0 4.6-3.1 7.9-7.5 9.4-4.4-1.5-7.5-4.8-7.5-9.4V6z" />
      <polyline points="9 12 11.3 14.2 15.2 10" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    </>
  ),
  doc: (
    <>
      <path d="M6.5 3h7l4.5 4.5V21h-11.5z" />
      <polyline points="13 3 13 8 18 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="16.5" x2="15" y2="16.5" />
    </>
  ),
  chat: (
    <>
      <path d="M4 5.5h16v10.5H10l-6 4.5z" />
      <line x1="8" y1="10.8" x2="16" y2="10.8" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
      <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" />
      <line x1="8" y1="3" x2="8" y2="6.5" />
      <line x1="16" y1="3" x2="16" y2="6.5" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2.4" />
      <path d="M3 10h18" />
      <circle cx="16.8" cy="14.5" r="1.3" />
    </>
  ),
  rupee: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.4 7.8h5.2M9.4 10.6h5.2M13.6 7.8c1.4 0 2 1 2 2.4s-.9 2.4-2.6 2.4H9.4l4.4 4" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7.5" width="18" height="12.5" rx="2.2" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
      <line x1="3" y1="12.5" x2="21" y2="12.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21.2C12 21.2 19 15.6 19 10.4A7 7 0 1 0 5 10.4c0 5.2 7 10.8 7 10.8z" />
      <circle cx="12" cy="10.2" r="2.6" />
    </>
  ),
  star: <polygon points="12 3.4 14.6 9 20.6 9.7 16.1 13.8 17.4 19.8 12 16.7 6.6 19.8 7.9 13.8 3.4 9.7 9.4 9" />,
  phone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.6" />
      <line x1="10.5" y1="18.6" x2="13.5" y2="18.6" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.2" />
      <polyline points="3.6 7 12 13 20.4 7" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 6.8 12 12.2 15.8 14.2" />
    </>
  ),
  arrowRight: (
    <>
      <line x1="4" y1="12" x2="19.5" y2="12" />
      <polyline points="13.5 6 19.5 12 13.5 18" />
    </>
  ),
  chevronRight: <polyline points="9.5 5.5 16 12 9.5 18.5" />,
  chevronLeft: <polyline points="14.5 5.5 8 12 14.5 18.5" />,
  chevronDown: <polyline points="5.5 9.5 12 16 18.5 9.5" />,
  menu: (
    <>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </>
  ),
  close: (
    <>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </>
  ),
  store: (
    <>
      <path d="M4 9.5V20h16V9.5" />
      <path d="M3 9.5l1.8-5h14.4L21 9.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),
  cup: (
    <>
      <path d="M5 4.5h11v7a5.5 5.5 0 0 1-11 0z" />
      <path d="M16 6.5h2.4a2.4 2.4 0 0 1 0 4.8H16" />
      <line x1="4" y1="20.5" x2="17" y2="20.5" />
    </>
  ),
  cross: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </>
  ),
  truck: (
    <>
      <path d="M2.5 6.5h11.5v9.5H2.5z" />
      <path d="M14 10h3.6l3.4 3.4V16H14z" />
      <circle cx="7" cy="18.4" r="1.9" />
      <circle cx="17.2" cy="18.4" r="1.9" />
    </>
  ),
  box: (
    <>
      <path d="M12 3l8.5 4.3v9.4L12 21l-8.5-4.3V7.3z" />
      <polyline points="3.5 7.3 12 11.6 20.5 7.3" />
      <line x1="12" y1="11.6" x2="12" y2="21" />
    </>
  ),
  broom: (
    <>
      <line x1="19" y1="4" x2="11.5" y2="11.5" />
      <path d="M12.5 10.5l3 3-5.5 5.5H4.5l2.5-5.5z" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6.5" cy="18" r="2.6" />
      <circle cx="17.5" cy="18" r="2.6" />
      <line x1="8.4" y1="16.2" x2="18.5" y2="4" />
      <line x1="15.6" y1="16.2" x2="5.5" y2="4" />
    </>
  ),
  car: (
    <>
      <path d="M3 15.5v-2l2-5h14l2 5v2" />
      <path d="M3 15.5h18V19h-3v-1.5H6V19H3z" />
      <line x1="6.5" y1="12" x2="17.5" y2="12" />
    </>
  ),
  hammer: (
    <>
      <path d="M13.5 4.5l6 6-2.5 2.5-6-6z" />
      <line x1="11" y1="9.5" x2="4" y2="16.5" />
      <path d="M3 18l2.5 2.5 2.5-2.5-2.5-2.5z" />
    </>
  ),
  wrench: (
    <>
      <path d="M20 5.5a5 5 0 0 1-6.6 6.6L6 19.5 4.5 18l7.4-7.4A5 5 0 0 1 18.5 4z" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
    </>
  ),
  heart: <path d="M12 20.3S3.8 15.3 3.8 9.9A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 8.2 2.3c0 5.4-8.2 10.4-8.2 10.4z" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.6" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 6.2 12 6.2 21.5 12 21.5 12 18 17.8 12 17.8 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <line x1="3.2" y1="9.5" x2="20.8" y2="9.5" />
      <line x1="3.2" y1="14.5" x2="20.8" y2="14.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4.2 1.5 5.5 1.5 5.5H5S6.5 14.2 6.5 10z" />
      <path d="M10.2 19a2 2 0 0 0 3.6 0" />
    </>
  ),
  trending: (
    <>
      <polyline points="3.5 16.5 9.5 10.5 13 14 20.5 6.5" />
      <polyline points="15.5 6.5 20.5 6.5 20.5 11.5" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3.5l1.7 4.3 4.3 1.7-4.3 1.7L12 15.5l-1.7-4.3L6 9.5l4.3-1.7z" />
      <path d="M18 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />
    </>
  ),
  play: <polygon points="7 4.5 19.5 12 7 19.5" />,
  apple: (
    <>
      <path d="M16.2 12.4c0-2.2 1.8-3.2 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.6.7 2.8.7c1.1 0 1.9-1 2.6-2.1.8-1.2 1.1-2.4 1.2-2.4-.1 0-2.3-.9-2.3-3.4z" />
      <path d="M14.2 5.9c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.5.6-1 1.6-.9 2.6 1 .1 2-.5 2.6-1.2z" />
    </>
  ),
  facebook: <path d="M14.5 8.5h2.2V5.6h-2.6c-2.2 0-3.6 1.4-3.6 3.7v1.9H8.2v3h2.3V21h3.2v-6.8h2.4l.4-3h-2.8v-1.5c0-.8.3-1.2 1.1-1.2z" />,
  twitter: <path d="M3.5 4h4.2l4.1 5.6L16.6 4h3.4l-6.1 7 6.6 9h-4.2l-4.5-6.1L6.4 20H3l6.6-7.6z" />,
  linkedin: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <line x1="8" y1="10.5" x2="8" y2="16.5" />
      <circle cx="8" cy="7.6" r="0.9" />
      <path d="M11.6 16.5v-6M11.6 12.6c0-1.3.9-2.2 2.2-2.2s2.4.9 2.4 2.6v3.5" />
    </>
  ),
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="16.9" cy="7.1" r="0.9" />
    </>
  ),
}

export default function Icon({ name, size = 20, strokeWidth = 1.7, className, style, ...rest }) {
  const glyph = P[name]
  if (!glyph) return null
  const filled = name === 'star' || name === 'play' || name === 'heart' ||
    name === 'apple' || name === 'facebook' || name === 'twitter' || name === 'instagram'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {glyph}
    </svg>
  )
}
