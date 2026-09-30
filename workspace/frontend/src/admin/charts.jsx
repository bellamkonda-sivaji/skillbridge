import React, { useState } from 'react'
import Icon from '../marketing/icons'
import { num, pct, delta } from './api'

/**
 * Charts are hand-drawn SVG rather than a charting library: the shapes needed
 * here are simple, and this keeps the bundle and the theme under our control.
 */

/** A number with its change against the previous period. */
export function MetricCard({ label, value, previous, format = num, tone = 'blue', icon, suffix }) {
  const d = previous === undefined ? null : delta(value, previous)
  return (
    <div className="ad-stat">
      <div className="ad-stat-top">
        <span className={`ad-stat-ic ${tone}`} aria-hidden="true"><Icon name={icon} size={16} /></span>
        {d !== null && d !== undefined && (
          <span className={`ad-delta ${d > 0 ? 'up' : d < 0 ? 'down' : ''}`}>
            {d > 0 ? '▲' : d < 0 ? '▼' : '–'} {Math.abs(d)}%
          </span>
        )}
      </div>
      <div className="ad-stat-v">{format(value)}{suffix}</div>
      <div className="ad-stat-l">{label}</div>
      {previous !== undefined && (
        <div className="ad-stat-s">was {format(previous)}{suffix} last period</div>
      )}
    </div>
  )
}

/**
 * Multi-series line chart over time. Series can be toggled off by clicking the
 * legend, because plotting seven lines at once is unreadable.
 */
export function LineChart({ points = [], series = [], height = 240 }) {
  const [hidden, setHidden] = useState(new Set())
  const [hover, setHover] = useState(null)
  const shown = series.filter((s) => !hidden.has(s.key))

  const W = 1000
  const H = height
  const PAD = { l: 44, r: 12, t: 12, b: 28 }
  const iw = W - PAD.l - PAD.r
  const ih = H - PAD.t - PAD.b

  const max = Math.max(...points.flatMap((p) => shown.map((s) => Number(p[s.key]) || 0)), 1)
  const n = points.length
  const x = (i) => PAD.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw)
  const y = (v) => PAD.t + ih - ((Number(v) || 0) / max) * ih

  const toggle = (k) => setHidden((h) => {
    const next = new Set(h)
    if (next.has(k)) next.delete(k); else next.add(k)
    return next
  })

  // A handful of horizontal guides, at whole numbers so the axis reads cleanly.
  const stepCount = 4
  const guides = Array.from({ length: stepCount + 1 }, (_, i) => Math.round((max / stepCount) * i))

  return (
    <div>
      <div className="ad-legend">
        {series.map((s) => (
          <button
            key={s.key}
            className={`ad-legend-btn${hidden.has(s.key) ? ' off' : ''}`}
            onClick={() => toggle(s.key)}
            aria-pressed={!hidden.has(s.key)}
          >
            <i style={{ background: s.color }} />{s.label}
          </button>
        ))}
      </div>

      {points.length === 0 ? (
        <div className="ad-chart-empty">No data in this period.</div>
      ) : (
        <div className="ad-svgwrap">
          <svg viewBox={`0 0 ${W} ${H}`} className="ad-svg" role="img" aria-label="Activity over time">
            {guides.map((g, i) => (
              <g key={i}>
                <line x1={PAD.l} x2={W - PAD.r} y1={y(g)} y2={y(g)} className="ad-grid" />
                <text x={PAD.l - 8} y={y(g) + 4} className="ad-axis" textAnchor="end">{num(g)}</text>
              </g>
            ))}

            {shown.map((s) => {
              const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p[s.key])}`).join(' ')
              const area = `${d} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`
              return (
                <g key={s.key}>
                  {shown.length === 1 && <path d={area} fill={s.color} opacity="0.1" />}
                  <path d={d} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                  {n <= 40 && points.map((p, i) => (
                    <circle key={i} cx={x(i)} cy={y(p[s.key])} r={hover === i ? 4 : 2.5} fill={s.color} />
                  ))}
                </g>
              )
            })}

            {/* invisible hit areas so hovering anywhere in a column works */}
            {points.map((p, i) => (
              <rect
                key={i}
                x={x(i) - iw / Math.max(n, 1) / 2}
                y={PAD.t}
                width={iw / Math.max(n, 1)}
                height={ih}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            ))}
            {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + ih} className="ad-cursor" />}
          </svg>

          {hover !== null && (
            <div className="ad-tip" style={{ left: `${(x(hover) / W) * 100}%` }}>
              <div className="dt">{points[hover].label || points[hover].date}</div>
              {shown.map((s) => (
                <div className="rw" key={s.key}>
                  <i style={{ background: s.color }} />
                  <span className="l">{s.label}</span>
                  <span className="v">{num(points[hover][s.key])}</span>
                </div>
              ))}
            </div>
          )}

          <div className="ad-chart-axis">
            <span>{points[0]?.label || points[0]?.date}</span>
            <span>{points[points.length - 1]?.label || points[points.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </div>
  )
}

/** Horizontal ranked bars — the shape that answers "which one has more". */
export function RankedBars({ rows = [], labelKey = 'label', valueKey = 'jobCount', format = num, color = '#2563eb', max: cap = 10, onRow }) {
  const top = rows.slice(0, cap)
  const max = Math.max(...top.map((r) => Number(r[valueKey]) || 0), 1)
  if (!top.length) return <div className="ad-chart-empty">Nothing to show yet.</div>
  return (
    <div className="ad-ranked">
      {top.map((r) => {
        const v = Number(r[valueKey]) || 0
        const body = (
          <>
            <span className="lbl" title={r[labelKey]}>{r[labelKey]}</span>
            <span className="track"><span className="fill" style={{ width: `${(v / max) * 100}%`, background: color }} /></span>
            <span className="val">{format(v)}</span>
          </>
        )
        return onRow
          ? <button className="ad-ranked-row clickable" key={r.key ?? r[labelKey]} onClick={() => onRow(r)}>{body}</button>
          : <div className="ad-ranked-row" key={r.key ?? r[labelKey]}>{body}</div>
      })}
    </div>
  )
}

/** A small sparkline for the signup/hire trends beside a metric block. */
export function Sparkline({ points = [], color = '#2563eb', height = 48 }) {
  if (!points.length) return <div className="ad-chart-empty" style={{ padding: 12 }}>No data.</div>
  const W = 300, H = height
  const max = Math.max(...points.map((p) => Number(p.count) || 0), 1)
  const x = (i) => (points.length <= 1 ? W / 2 : (i / (points.length - 1)) * W)
  const y = (v) => H - 2 - ((Number(v) || 0) / max) * (H - 6)
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.count)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ad-spark" preserveAspectRatio="none" role="img" aria-label="Trend">
      <path d={`${d} L${W},${H} L0,${H} Z`} fill={color} opacity="0.12" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

/** Share-of-total bars, used for plan and pay-band splits. */
export function ShareBar({ rows = [], valueKey = 'employerCount', colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#db2777', '#0891b2'] }) {
  const total = rows.reduce((s, r) => s + (Number(r[valueKey]) || 0), 0)
  if (!total) return <div className="ad-chart-empty">Nothing to show yet.</div>
  return (
    <div>
      <div className="ad-sharebar">
        {rows.map((r, i) => {
          const v = Number(r[valueKey]) || 0
          if (!v) return null
          return (
            <span
              key={r.key ?? r.label}
              style={{ width: `${(v / total) * 100}%`, background: colors[i % colors.length] }}
              title={`${r.label}: ${num(v)}`}
            />
          )
        })}
      </div>
      <div className="ad-legend" style={{ marginTop: 10 }}>
        {rows.map((r, i) => {
          const v = Number(r[valueKey]) || 0
          if (!v) return null
          return (
            <span key={r.key ?? r.label}>
              <i style={{ background: colors[i % colors.length] }} />
              {r.label} · {num(v)} ({pct(v / total)})
            </span>
          )
        })}
      </div>
    </div>
  )
}
