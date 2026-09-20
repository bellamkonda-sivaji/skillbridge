import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './icons'
import { SITE } from './content'

/* ---------- hooks ---------- */

export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} — ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`
    return () => { document.title = previous }
  }, [title])
}

/** Returns true while the media query matches. Used to size carousels. */
export function useMedia(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  )
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/* ---------- layout ---------- */

export function Section({ tone, children, id, style }) {
  return (
    <section className={`mk-section${tone ? ' ' + tone : ''}`} id={id} style={style}>
      <div className="mk-container">{children}</div>
    </section>
  )
}

export function SectionHead({ eyebrow, title, sub, align = 'center' }) {
  return (
    <div className={`mk-section-head${align === 'left' ? ' left' : ''}`}>
      {eyebrow && <div className="mk-eyebrow">{eyebrow}</div>}
      <h2 className="mk-h2" style={eyebrow ? { marginTop: 10 } : undefined}>{title}</h2>
      {sub && <p className="mk-lead">{sub}</p>}
    </div>
  )
}

export function PageHead({ eyebrow, title, sub, children }) {
  return (
    <header className="mk-page-head">
      <div className="mk-container">
        {eyebrow && <div className="mk-eyebrow">{eyebrow}</div>}
        <h1 className="mk-h1" style={{ marginTop: eyebrow ? 12 : 0 }}>{title}</h1>
        {sub && <p className="mk-lead">{sub}</p>}
        {children}
      </div>
    </header>
  )
}

export function Card({ className = '', hover, children, ...rest }) {
  return (
    <div className={`mk-card${hover ? ' hover' : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function IconBox({ name, tone = '', size = 22, small }) {
  return (
    <div className={`mk-icon-box ${tone}${small ? ' sm' : ''}`}>
      <Icon name={name} size={size} />
    </div>
  )
}

/* ---------- buttons ---------- */

export function Btn({ to, href, variant = 'primary', size, children, icon, className = '', ...rest }) {
  // className is merged, never allowed to replace the button classes.
  const cls = `mk-btn mk-btn-${variant}${size ? ' mk-btn-' + size : ''}${className ? ' ' + className : ''}`
  const inner = (
    <>
      {children}
      {icon && <Icon name={icon} size={17} />}
    </>
  )
  if (to) return <Link className={cls} to={to} {...rest}>{inner}</Link>
  if (href) return <a className={cls} href={href} {...rest}>{inner}</a>
  return <button className={cls} type="button" {...rest}>{inner}</button>
}

/* ---------- small pieces ---------- */

const AVATAR_TONES = ['#2563eb', '#0f766e', '#b45309', '#be123c', '#6d28d9', '#0369a1', '#4d7c0f', '#be185d']

export function Avatar({ name = '?', size = 44 }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  const bg = AVATAR_TONES[hash % AVATAR_TONES.length]
  return (
    <div
      className="mk-avatar"
      style={{ width: size, height: size, background: bg, fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}

export function Stars({ rating = 5 }) {
  return (
    <span className="mk-stars" aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(rating)}
      <span style={{ color: '#e2e8f0' }}>{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

export function StatBar({ stats }) {
  return (
    <div className="mk-stats">
      {stats.map((s) => (
        <div className="mk-stat" key={s.lbl}>
          <div className="num">{s.num}</div>
          <div className="lbl">{s.lbl}</div>
        </div>
      ))}
    </div>
  )
}

export function CheckList({ items, tone = '' }) {
  return (
    <div className="mk-checks">
      {items.map((it) => (
        <div className="mk-check" key={it.title || it}>
          <span className={`ico ${tone}`}><Icon name="check" size={15} strokeWidth={2.4} /></span>
          <span className="txt">
            {it.title ? <><strong>{it.title}</strong>{it.text}</> : it}
          </span>
        </div>
      ))}
    </div>
  )
}

export function Steps({ steps }) {
  return (
    <div className="mk-steps">
      {steps.map((s, i) => (
        <div className="mk-step" key={s.title}>
          <div className="mk-step-num">{i + 1}</div>
          <div className="mk-step-ico"><Icon name={s.icon} size={20} /></div>
          <h3 className="mk-h3">{s.title}</h3>
          <p>{s.text}</p>
        </div>
      ))}
    </div>
  )
}

export function CategoryTile({ cat, to = '/jobs' }) {
  return (
    <Link to={to} className="mk-card hover mk-cat" state={{ category: cat.id }}>
      <IconBox name={cat.icon} tone={cat.tone} small size={19} />
      <span>
        <span className="nm">{cat.name}</span>
        {cat.roles && <span className="ct" style={{ display: 'block' }}>{cat.roles}</span>}
      </span>
    </Link>
  )
}

export function Quote({ item }) {
  return (
    <Card className="mk-quote">
      <Stars rating={item.rating} />
      <p className="body" style={{ marginTop: 12 }}>“{item.quote}”</p>
      <div className="who">
        <Avatar name={item.name} />
        <span>
          <span className="name" style={{ display: 'block' }}>{item.name}</span>
          <span className="role">{item.role}</span>
        </span>
      </div>
    </Card>
  )
}

/**
 * Paginated carousel. perView follows the viewport so the dots always match
 * the number of pages actually shown.
 */
export function Carousel({ items, render, label = 'Carousel' }) {
  const wide = useMedia('(min-width: 900px)')
  const medium = useMedia('(min-width: 640px)')
  const perView = wide ? 3 : medium ? 2 : 1
  const pages = Math.max(1, Math.ceil(items.length / perView))
  const [page, setPage] = useState(0)

  useEffect(() => { setPage((p) => Math.min(p, pages - 1)) }, [pages])

  const go = useCallback((next) => setPage((p) => (p + next + pages) % pages), [pages])
  const visible = items.slice(page * perView, page * perView + perView)

  return (
    <div role="group" aria-roledescription="carousel" aria-label={label}>
      <div className={`mk-grid mk-grid-${perView === 1 ? '2' : perView}`} style={{ alignItems: 'stretch' }}>
        {visible.map(render)}
      </div>
      {pages > 1 && (
        <div className="mk-carousel-nav">
          <button className="mk-round-btn" onClick={() => go(-1)} aria-label="Previous">
            <Icon name="chevronLeft" size={17} />
          </button>
          <span className="mk-dots">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                className="mk-dot"
                aria-current={i === page}
                aria-label={`Page ${i + 1} of ${pages}`}
                onClick={() => setPage(i)}
              />
            ))}
          </span>
          <button className="mk-round-btn" onClick={() => go(1)} aria-label="Next">
            <Icon name="chevronRight" size={17} />
          </button>
        </div>
      )}
    </div>
  )
}

export function Accordion({ items }) {
  const [open, setOpen] = useState(null)
  return (
    <div className="mk-list">
      {items.map((it, i) => {
        const isOpen = open === i
        return (
          <div key={it.q}>
            <button
              className="mk-list-row"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span className="t">{it.q}</span>
              <span className="arrow" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .18s ease' }}>
                <Icon name="chevronDown" size={18} />
              </span>
            </button>
            {isOpen && <div className="mk-acc-panel"><p>{it.a}</p></div>}
          </div>
        )
      })}
    </div>
  )
}

export function CtaBand({ title, sub, primary, secondary }) {
  return (
    <Section>
      <div className="mk-cta-band">
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
        <div className="mk-cta-row center" style={{ marginTop: 26 }}>
          {primary && <Btn to={primary.to} variant="light" size="lg">{primary.label}</Btn>}
          {secondary && (
            <Btn
              to={secondary.to}
              variant="outline"
              size="lg"
              style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,.45)' }}
            >
              {secondary.label}
            </Btn>
          )}
        </div>
      </div>
    </Section>
  )
}

/* ---------- app-store pieces ---------- */

export function StoreButtons() {
  return (
    <div className="mk-store-btns">
      <a className="mk-store-btn" href="#app-store" onClick={(e) => e.preventDefault()} aria-label="Download on the App Store (coming soon)">
        <Icon name="apple" size={24} />
        <span>
          <span className="sm" style={{ display: 'block' }}>Download on the</span>
          <span className="lg">App Store</span>
        </span>
      </a>
      <a className="mk-store-btn" href="#play-store" onClick={(e) => e.preventDefault()} aria-label="Get it on Google Play (coming soon)">
        <Icon name="play" size={22} />
        <span>
          <span className="sm" style={{ display: 'block' }}>GET IT ON</span>
          <span className="lg">Google Play</span>
        </span>
      </a>
    </div>
  )
}

/** Two small phone frames showing a worker job feed and an earnings screen. */
export function PhoneMockups() {
  return (
    <div className="mk-phones">
      <div className="mk-phone" aria-hidden="true">
        <div className="mk-phone-screen">
          <div className="mk-phone-top">
            <div style={{ opacity: 0.85, fontSize: 10 }}>Jobs near you</div>
            <div style={{ fontSize: 14, marginTop: 2 }}>18 within 3 km</div>
          </div>
          <div className="mk-phone-body">
            {[
              ['Store Helper', '₹700/day · 1.2 km'],
              ['Kitchen Helper', '₹650/day · 2.4 km'],
              ['Delivery Partner', '₹800/day · 3.0 km'],
            ].map(([nm, sb]) => (
              <div className="mk-phone-row" key={nm}>
                <span className="mk-icon-box sm" style={{ width: 26, height: 26, borderRadius: 8 }}>
                  <Icon name="briefcase" size={13} />
                </span>
                <span>
                  <span className="nm" style={{ display: 'block' }}>{nm}</span>
                  <span className="sb">{sb}</span>
                </span>
              </div>
            ))}
            <div style={{ background: '#2563eb', color: '#fff', borderRadius: 9, padding: '7px 0', textAlign: 'center', fontSize: 11, fontWeight: 700 }}>
              Apply Now
            </div>
          </div>
        </div>
      </div>

      <div className="mk-phone tall" aria-hidden="true">
        <div className="mk-phone-screen">
          <div className="mk-phone-top">
            <div style={{ opacity: 0.85, fontSize: 10 }}>This month</div>
            <div style={{ fontSize: 18, marginTop: 2, fontWeight: 800 }}>₹14,200</div>
            <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>8 shifts · 100% attendance</div>
          </div>
          <div className="mk-phone-body">
            {[
              ['Green Mart', '₹700 · Paid'],
              ['Bloom Cafe', '₹650 · Paid'],
              ['City Warehouse', '₹800 · Paid'],
              ['Sri Medicals', '₹700 · Paid'],
            ].map(([nm, sb]) => (
              <div className="mk-phone-row" key={nm}>
                <span className="mk-icon-box sm green" style={{ width: 26, height: 26, borderRadius: 8 }}>
                  <Icon name="check" size={13} strokeWidth={2.4} />
                </span>
                <span>
                  <span className="nm" style={{ display: 'block' }}>{nm}</span>
                  <span className="sb">{sb}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Hero collage: a preview of the real product rather than stock artwork. */
export function HeroCollage() {
  const people = [
    { name: 'Ramesh K', role: 'Store Helper · Verified', pay: '₹700', dist: '1.2 km away' },
    { name: 'Lakshmi D', role: 'Housekeeping · Verified', pay: '₹600', dist: '2.0 km away' },
    { name: 'Venkat S', role: 'Warehouse Helper', pay: '₹750', dist: '3.4 km away' },
  ]
  return (
    <div className="mk-collage">
      {people.map((p, i) => (
        <div className={`mk-mini-card${i === 1 ? ' offset' : ''}`} key={p.name}>
          <Avatar name={p.name} size={42} />
          <span className="meta">
            <span className="name" style={{ display: 'block' }}>{p.name}</span>
            <span className="role">{p.role}</span>
          </span>
          <span className="tail">
            <span className="pay" style={{ display: 'block' }}>{p.pay}/day</span>
            <span className="dist">{p.dist}</span>
          </span>
        </div>
      ))}
      <div className="mk-float-note">
        <span className="hl"><Icon name="pin" size={16} /> Real people, real work</span>
        <span>Matched by skills, distance and availability — in your area.</span>
      </div>
    </div>
  )
}
