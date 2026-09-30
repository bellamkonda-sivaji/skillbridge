import React, { useState } from 'react'
import Icon from '../../marketing/icons'
import { money, formatDate } from './api'

/**
 * The explainer strip at the top of each hiring screen, saying when the
 * employer normally lands here. Dismissed per-screen, remembered per browser.
 */
export function WhenBanner({ id, title = 'When does this screen appear?', children }) {
  const key = `sb_when_${id}`
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem(key) === '1' } catch { return false }
  })
  if (hidden) return null

  const dismiss = () => {
    setHidden(true)
    try { localStorage.setItem(key, '1') } catch { /* private mode */ }
  }

  return (
    <div className="emp-when">
      <span className="ic" aria-hidden="true"><Icon name="eye" size={14} /></span>
      <div className="bd">
        <div className="t">{title}</div>
        <div className="d">{children}</div>
      </div>
      <button className="x" onClick={dismiss} aria-label="Dismiss">
        <Icon name="close" size={14} />
      </button>
    </div>
  )
}

/** Horizontally scrollable table shell — these tables are wide on phones. */
export function DataTable({ head, children, empty }) {
  const wrapRef = React.useRef(null)
  const [scrolling, setScrolling] = React.useState(false)

  React.useEffect(() => {
    const el = wrapRef.current
    if (!el) return undefined
    const measure = () => setScrolling(el.scrollWidth > el.clientWidth + 2)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [children])

  return (
    <div ref={wrapRef} className={`emp-tablewrap${scrolling ? ' is-scrolling' : ''}`}>
      <table className="emp-table">
        <thead>
          <tr>{head.map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {React.Children.count(children) ? children : (
            <tr>
              <td colSpan={head.length} style={{ textAlign: 'center', color: 'var(--muted)', padding: '30px 12px' }}>
                {empty || 'Nothing here yet.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/** Read-only key/value summary, used by the offer preview. */
export function SummaryTable({ rows }) {
  return (
    <div className="emp-sum">
      {rows.filter(Boolean).map(([k, v]) => (
        <div className="r" key={k}>
          <span className="k">{k}</span>
          <span className="v">{v == null || v === '' ? '—' : v}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * The cost box. Figures are whatever the server returned — we never compute a
 * total here, and we say so, because the platform fee is configuration.
 */
export function EstimateBox({ workerPay, fee, total, heading = 'You will pay (Estimate)' }) {
  return (
    <div className="emp-estimate">
      <div className="hd">{heading}</div>
      <div className="r"><span>Worker pay</span><span className="num">{money(workerPay)}</span></div>
      {fee != null && (
        <div className="r"><span>JobOn fee</span><span className="num">{money(fee)}</span></div>
      )}
      <div className="r total"><span>Estimated total</span><span className="num">{money(total)}</span></div>
      <div className="note">Final amount may vary based on platform fee configuration.</div>
    </div>
  )
}

/** Joining timeline. Steps and their labels come from the server, since they
 *  differ between a one-day job and a monthly one. */
export function Timeline({ steps = [] }) {
  return (
    <div className="emp-timeline">
      {steps.map((s, i) => {
        const state = (s.state || 'PENDING').toLowerCase()
        return (
          <div className={`emp-step ${state}`} key={s.key || i}>
            <div className="rail">
              <span className="dot">
                {state === 'done' ? <Icon name="check" size={14} /> : i + 1}
              </span>
              <span className="line" />
            </div>
            <div className="bd">
              <div className="t">{s.label}</div>
              {(s.at || s.note) && (
                <div className="d">{s.at ? formatDate(s.at, true) : s.note}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Star distribution bars on the worker detail screen. */
export function RatingBars({ breakdown = {}, total = 0 }) {
  const max = Math.max(total, 1)
  return (
    <div className="emp-bars">
      {[5, 4, 3, 2, 1].map((star) => {
        const n = Number(breakdown[star] ?? breakdown[String(star)] ?? 0)
        return (
          <div className="emp-bar" key={star}>
            <span className="lbl">{star} ★</span>
            <span className="track"><span className="fill" style={{ width: `${(n / max) * 100}%` }} /></span>
            <span className="cnt">{n}</span>
          </div>
        )
      })}
    </div>
  )
}
