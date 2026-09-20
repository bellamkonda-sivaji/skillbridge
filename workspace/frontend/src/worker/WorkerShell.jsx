import React, { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../marketing/icons'
import { SITE } from '../marketing/content'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { useStomp } from '../hooks/useStomp'
import './worker.css'

const NAV = [
  { to: '/worker', end: true, icon: 'grid', label: 'Dashboard' },
  { to: '/worker/jobs', icon: 'search', label: 'Find Jobs' },
  { to: '/worker/applications', icon: 'doc', label: 'My Applications' },
  { to: '/worker/work', icon: 'briefcase', label: 'My Work' },
  { to: '/worker/interviews', icon: 'calendar', label: 'Interviews' },
  { to: '/worker/messages', icon: 'chat', label: 'Messages', badge: 'messages' },
  { to: '/worker/earnings', icon: 'wallet', label: 'Earnings' },
  { to: '/worker/reviews', icon: 'star', label: 'Reviews' },
  { to: '/worker/profile', icon: 'user', label: 'My Profile' },
  { to: '/worker/settings', icon: 'target', label: 'Settings' },
]

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
]

export default function WorkerShell() {
  const { user, logout } = useAuth()
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [menu, setMenu] = useState(false)

  useEffect(() => { setOpen(false); setMenu(false) }, [location.pathname])

  const loadUnread = () =>
    api.get('/notifications/unread-count')
      .then((r) => setUnread(r.data?.count || 0))
      .catch(() => {})

  useEffect(() => { loadUnread() }, [])
  useStomp(() => loadUnread())

  const changeLanguage = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('sb_lang', code)
  }

  const initials = (user?.name || 'W')
    .split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

  return (
    <div className="mk">
      <div className="wk">
        {/* ---------- top bar ---------- */}
        <header className="wk-top">
          <button className="wk-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            <Icon name={open ? 'close' : 'menu'} size={19} />
          </button>

          <Link to="/worker" className="mk-brand" style={{ marginRight: 0 }}>
            <span className="mk-brand-mark" aria-hidden="true">SB</span>
            {SITE.name}
          </Link>

          <span className="spacer" />

          <select
            className="mk-lang"
            value={LANGUAGES.some((l) => l.code === i18n.language) ? i18n.language : 'en'}
            onChange={(e) => changeLanguage(e.target.value)}
            aria-label="Language"
          >
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>

          <Link to="/worker/messages" className="wk-bell" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
            <Icon name="bell" size={18} />
            {unread > 0 && <span className="dot">{unread > 9 ? '9+' : unread}</span>}
          </Link>

          <div style={{ position: 'relative' }}>
            <button className="wk-me" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
              <span
                className="mk-avatar"
                style={{ width: 30, height: 30, background: '#2563eb', fontSize: 12 }}
                aria-hidden="true"
              >
                {initials}
              </span>
              <span className="txt">
                <span className="nm" style={{ display: 'block' }}>{user?.name || 'Worker'}</span>
                <span className="rl">Worker</span>
              </span>
              <Icon name="chevronDown" size={14} />
            </button>
            {menu && (
              <>
                <div className="wk-menu-scrim" onClick={() => setMenu(false)} aria-hidden="true" />
                <div
                  className="wk-card"
                  style={{ position: 'absolute', right: 0, top: 46, width: 190, padding: 6, zIndex: 60, boxShadow: 'var(--shadow-lg)' }}
                >
                  <Link className="wk-nav-item" to="/worker/profile" style={itemStyle} onClick={() => setMenu(false)}>My Profile</Link>
                  <Link className="wk-nav-item" to="/worker/settings" style={itemStyle} onClick={() => setMenu(false)}>Settings</Link>
                  <button
                    style={{ ...itemStyle, width: '100%', textAlign: 'left', border: 0, background: 'transparent', font: 'inherit', cursor: 'pointer', color: '#b91c1c' }}
                    onClick={() => { logout(); navigate('/') }}
                  >
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* ---------- body ---------- */}
        <div className="wk-body">
          {open && <div className="wk-scrim" onClick={() => setOpen(false)} />}

          <aside className={`wk-side${open ? ' open' : ''}`}>
            <nav className="wk-nav">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) => (isActive ? 'active' : undefined)}
                >
                  <Icon name={n.icon} size={17} />
                  <span>{n.label}</span>
                  {n.badge === 'messages' && unread > 0 && <span className="ct">{unread}</span>}
                </NavLink>
              ))}
            </nav>

            <div className="wk-help">
              <div className="t">Need Help?</div>
              <div className="d">Contact Support</div>
              <Link className="mk-btn mk-btn-outline mk-btn-sm" to="/help" style={{ marginTop: 10, width: '100%' }}>
                Get help
              </Link>
            </div>
          </aside>

          <main className="wk-main">
            <div className="wk-wrap">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

const itemStyle = {
  display: 'block',
  padding: '9px 11px',
  borderRadius: 8,
  fontSize: 14,
  color: '#0f172a',
}
