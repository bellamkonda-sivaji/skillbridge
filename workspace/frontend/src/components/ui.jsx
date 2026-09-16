import React from 'react'

export function Stars({ rating, count }) {
  const r = rating || 0
  const full = Math.round(r)
  let s = ''
  for (let i = 0; i < 5; i++) s += i < full ? '★' : '☆'
  return (
    <span className="stars">{s}
      {count != null && <span className="muted"> ({count})</span>}
    </span>
  )
}

export function ScoreRing({ score, size = 56 }) {
  const cls = score >= 75 ? 'high' : score >= 55 ? 'mid' : 'low'
  return (
    <div className={`score-ring ${cls}`} style={{ width: size, height: size }}>
      {Math.round(score)}%
    </div>
  )
}

export function Badge({ type, children }) {
  const map = { green: 'badge-green', amber: 'badge-amber', red: 'badge-red', gray: 'badge-gray', blue: 'badge-blue' }
  return <span className={`badge ${map[type] || 'badge-gray'}`}>{children}</span>
}

export function SkillChips({ skills }) {
  return (
    <div className="skill-chips">
      {(skills || []).map((s, i) => <span key={i} className="tag">{s}</span>)}
    </div>
  )
}

export function EmptyState({ emoji = '📭', text }) {
  return (
    <div className="empty-state">
      <div className="big">{emoji}</div>
      <p>{text}</p>
    </div>
  )
}

export function Spinner() {
  return <div className="spinner" />
}
