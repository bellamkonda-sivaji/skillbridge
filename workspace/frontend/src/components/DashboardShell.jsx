import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function DashboardShell({ nav, active, onNav, title, children }) {
  const { user } = useAuth()
  return (
    <div className="layout">
      <aside className="sidebar">
        {nav.map((n) => (
          <a
            key={n.key}
            href="#"
            className={active === n.key ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); onNav(n.key) }}
          >
            <span style={{ fontSize: 17 }}>{n.icon}</span>
            <span>{n.label}</span>
          </a>
        ))}
      </aside>
      <main className="main">
        <h2 style={{ marginBottom: 20 }}>{title}</h2>
        {children}
      </main>
    </div>
  )
}
