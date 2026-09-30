import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../marketing/icons'
import { useAuth } from '../context/AuthContext'
import { num, SEVERITY_TONE, ROLE_LABEL } from './api'

/**
 * Whether the signed-in admin holds a permission. The server is the real
 * gate — this only decides whether we bother showing a control, so that an
 * HR user is not offered buttons that would just 403.
 */
export function usePermissions() {
  const { user } = useAuth()
  const granted = new Set(user?.permissions || [])
  return {
    role: user?.role,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    can: (p) => granted.has(p),
    canAny: (...ps) => ps.some((p) => granted.has(p)),
  }
}

/**
 * Blocks a whole page when the signed-in role lacks the permission, so we never
 * fire a request the server is going to refuse. The server is still the real
 * gate — this exists so an HR user who types the URL gets a plain explanation
 * instead of a red "could not load" box.
 */
export function RequirePermission({ permission, superOnly, children }) {
  const { can, isSuperAdmin, role } = usePermissions()
  const allowed = superOnly ? isSuperAdmin : can(permission)
  if (allowed) return children
  return (
    <>
      <PageHead title="Not available to your role" />
      <div className="wk-card pad-lg">
        <Empty
          icon="lock"
          title={superOnly ? 'Super Admins only' : 'You do not have access to this'}
          text={
            superOnly
              ? `Managing the admin team is restricted to Super Admins. Your role is ${ROLE_LABEL[role] || role || 'Admin'}.`
              : `Your role (${ROLE_LABEL[role] || role || 'Admin'}) cannot view this section. Ask a Super Admin if you need it.`
          }
        />
      </div>
    </>
  )
}

/** A headline number. `to` makes the whole tile a link through to the detail. */
export function StatTile({ label, value, sub, tone = 'blue', icon, to }) {
  const body = (
    <>
      <div className="ad-stat-top">
        <span className={`ad-stat-ic ${tone}`} aria-hidden="true"><Icon name={icon} size={16} /></span>
        {to && <Icon name="chevronRight" size={15} style={{ color: 'var(--muted)' }} />}
      </div>
      <div className="ad-stat-v">{typeof value === 'number' ? num(value) : (value ?? '—')}</div>
      <div className="ad-stat-l">{label}</div>
      {sub && <div className="ad-stat-s">{sub}</div>}
    </>
  )
  return to
    ? <Link className="ad-stat linked" to={to}>{body}</Link>
    : <div className="ad-stat">{body}</div>
}

export function StatGrid({ children }) {
  return <div className="ad-stat-grid">{children}</div>
}

/**
 * The hiring funnel. Each step is drawn relative to the widest one so the
 * drop-off between stages is visible at a glance rather than needing arithmetic.
 */
export function Funnel({ data = {} }) {
  const steps = [
    ['applied', 'Applied'], ['contacted', 'Contacted'], ['shortlisted', 'Shortlisted'],
    ['interviewed', 'Interviewed'], ['offered', 'Offered'], ['hired', 'Hired'], ['paid', 'Paid'],
  ]
  const max = Math.max(...steps.map(([k]) => Number(data[k]) || 0), 1)
  return (
    <div className="ad-funnel">
      {steps.map(([k, label], i) => {
        const v = Number(data[k]) || 0
        const prev = i === 0 ? null : Number(data[steps[i - 1][0]]) || 0
        const pct = prev ? Math.round((v / Math.max(prev, 1)) * 100) : null
        return (
          <div className="ad-funnel-row" key={k}>
            <span className="lbl">{label}</span>
            <span className="track">
              <span className="fill" style={{ width: `${(v / max) * 100}%` }} />
            </span>
            <span className="val">{num(v)}</span>
            <span className="pct">{pct === null ? '' : `${pct}%`}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Zero-filled daily trend drawn as bars — no chart library, no gaps. */
export function TrendChart({ data = [], series = [
  { key: 'applications', label: 'Applications', color: '#2563eb' },
  { key: 'jobs', label: 'Jobs', color: '#7c3aed' },
  { key: 'hires', label: 'Hires', color: '#059669' },
] }) {
  const max = Math.max(...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)), 1)
  return (
    <div>
      <div className="ad-legend">
        {series.map((s) => (
          <span key={s.key}><i style={{ background: s.color }} />{s.label}</span>
        ))}
      </div>
      <div className="ad-chart" role="img" aria-label="Daily activity">
        {data.map((d) => (
          <div className="ad-chart-col" key={d.date} title={`${d.date}: ${series.map((s) => `${s.label} ${d[s.key] || 0}`).join(', ')}`}>
            <div className="bars">
              {series.map((s) => (
                <span
                  key={s.key}
                  style={{ height: `${((Number(d[s.key]) || 0) / max) * 100}%`, background: s.color }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {data.length > 0 && (
        <div className="ad-chart-axis">
          <span>{data[0]?.date}</span>
          <span>{data[data.length - 1]?.date}</span>
        </div>
      )}
    </div>
  )
}

/** Wide table shell. `cols` are plain header strings. */
export function DataTable({ cols, children, empty = 'Nothing here yet.', loading, compact }) {
  const count = React.Children.count(children)
  const wrapRef = React.useRef(null)
  const [scrolling, setScrolling] = useState(false)

  /* The pinned last column casts a shadow only while there is something
     scrolling under it; otherwise it reads as a stray border. */
  React.useEffect(() => {
    const el = wrapRef.current
    if (!el) return undefined
    const measure = () => setScrolling(el.scrollWidth > el.clientWidth + 2)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [count, cols.length])

  /**
   * Pinning the last column only makes sense when it holds the row's actions. Tables that end
   * in data - the skills drill-down ends in "Hired" - had that column pinned too, so it sat on
   * top of the column before it and hid a real number.
   *
   * Action columns already declare themselves: most carry an empty header, and Verifications
   * labels its one "Actions". Both count, so no caller has to remember a new prop.
   */
  const lastCol = String(cols[cols.length - 1] || '').trim()
  const pinsLast = cols.length > 0 && (!lastCol || /^actions?$/i.test(lastCol))

  return (
    <div ref={wrapRef} className={`ad-tablewrap${scrolling ? ' is-scrolling' : ''}`}>
      {/* `compact` drops the min-width for tables living in a narrow column. */}
      <table className={`ad-table${compact ? ' compact' : ''}${pinsLast ? ' pin-last' : ''}`}>
        <thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>
          {loading ? (
            [0, 1, 2, 3].map((i) => (
              <tr key={i}>{cols.map((c) => <td key={c}><span className="ad-skel" /></td>)}</tr>
            ))
          ) : count ? children : (
            <tr><td colSpan={cols.length} className="ad-empty-cell">{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/** Page-number strip for the paged list endpoints. */
export function Pager({ page = 0, totalPages = 0, totalElements = 0, onPage }) {
  if (totalPages <= 1) {
    return totalElements ? <div className="ad-pager"><span className="ad-pager-info">{num(totalElements)} total</span></div> : null
  }
  const window = []
  for (let i = Math.max(0, page - 2); i <= Math.min(totalPages - 1, page + 2); i += 1) window.push(i)
  return (
    <div className="ad-pager">
      <span className="ad-pager-info">{num(totalElements)} total</span>
      <span className="grow" />
      <button className="mk-btn mk-btn-outline mk-btn-sm" disabled={page <= 0} onClick={() => onPage(page - 1)}>Prev</button>
      {window.map((i) => (
        <button
          key={i}
          className={`mk-btn mk-btn-sm ${i === page ? 'mk-btn-primary' : 'mk-btn-outline'}`}
          onClick={() => onPage(i)}
        >
          {i + 1}
        </button>
      ))}
      <button className="mk-btn mk-btn-outline mk-btn-sm" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  )
}

export function Badge({ tone = 'viewed', children }) {
  return <span className={`wk-badge ${tone}`}>{children}</span>
}

export function SeverityBadge({ severity }) {
  return <Badge tone={SEVERITY_TONE[severity] || 'viewed'}>{severity?.toLowerCase()}</Badge>
}

/** Filter bar: a search box plus any number of selects. */
export function Filters({ q, onQ, placeholder = 'Search…', children, onReset }) {
  return (
    <div className="ad-filters">
      <span className="ad-search">
        <Icon name="search" size={15} />
        <input value={q || ''} placeholder={placeholder} onChange={(e) => onQ(e.target.value)} />
        {q && <button onClick={() => onQ('')} aria-label="Clear search"><Icon name="close" size={13} /></button>}
      </span>
      {children}
      {onReset && <button className="mk-btn mk-btn-ghost mk-btn-sm" onClick={onReset}>Reset</button>}
    </div>
  )
}

export function Select({ value, onChange, options, all = 'All', ariaLabel }) {
  return (
    <select className="ad-select" value={value || ''} onChange={(e) => onChange(e.target.value)} aria-label={ariaLabel}>
      {all !== null && <option value="">{all}</option>}
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  )
}

export function PageHead({ title, sub, back, children }) {
  return (
    <div className="ad-head">
      <div className="grow">
        {back && (
          <Link className="wk-link ad-back" to={back.to}>
            <Icon name="chevronLeft" size={15} /> {back.label}
          </Link>
        )}
        <h1 className="wk-h1">{title}</h1>
        {sub && <p className="wk-sub" style={{ marginTop: 2 }}>{sub}</p>}
      </div>
      {children && <div className="ad-head-actions">{children}</div>}
    </div>
  )
}

export function ErrorNote({ children, onRetry }) {
  if (!children) return null
  return (
    <div className="ad-error">
      <Icon name="shield" size={15} />
      <span className="grow">{children}</span>
      {onRetry && <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={onRetry}>Try again</button>}
    </div>
  )
}

export function Empty({ icon = 'search', title, text, children }) {
  return (
    <div className="ad-empty">
      <span className="ic" aria-hidden="true"><Icon name={icon} size={22} /></span>
      <div className="t">{title}</div>
      {text && <div className="d">{text}</div>}
      {children}
    </div>
  )
}

export function Card({ title, extra, children, pad = true }) {
  return (
    <div className={`wk-card${pad ? ' pad-lg' : ''}`}>
      {(title || extra) && (
        <div className="ad-card-head">
          <h2 className="wk-h2 grow" style={{ margin: 0 }}>{title}</h2>
          {extra}
        </div>
      )}
      {children}
    </div>
  )
}

/** Simple modal used by the contact log and the team editor. */
export function Modal({ title, onClose, children, wide }) {
  return (
    <>
      <div className="ad-scrim" onClick={onClose} aria-hidden="true" />
      <div className={`ad-modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="ad-modal-head">
          <h2 className="wk-h2 grow" style={{ margin: 0 }}>{title}</h2>
          <button className="ad-x" onClick={onClose} aria-label="Close"><Icon name="close" size={16} /></button>
        </div>
        <div className="ad-modal-body">{children}</div>
      </div>
    </>
  )
}

/** Copy-to-clipboard phone number — the back office rings these constantly. */
export function Phone({ number }) {
  const [copied, setCopied] = useState(false)
  if (!number) return <span style={{ color: 'var(--muted)' }}>—</span>
  const copy = () => {
    navigator.clipboard?.writeText(number).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    }).catch(() => {})
  }
  return (
    <span className="ad-phone">
      <a href={`tel:+91${number}`}>+91 {number}</a>
      <button onClick={copy} aria-label="Copy number">
        <Icon name={copied ? 'check' : 'doc'} size={12} />
      </button>
    </span>
  )
}
