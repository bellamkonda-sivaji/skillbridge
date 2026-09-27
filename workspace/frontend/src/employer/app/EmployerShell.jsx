import React, { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { SITE } from '../../marketing/content'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import { useStomp } from '../../hooks/useStomp'
import '../../worker/worker.css'
import '../employer.css'

const NAV = [
  { to: '/employer', end: true, icon: 'grid', label: 'Dashboard' },
  { to: '/employer/post-job', icon: 'sparkles', label: 'Post a Job' },
  { to: '/employer/jobs', icon: 'briefcase', label: 'My Jobs' },
  { to: '/employer/applications', icon: 'doc', label: 'Applications' },
  { to: '/employer/find-workers', icon: 'search', label: 'Find Workers' },
  { to: '/employer/interviews', icon: 'calendar', label: 'Interviews' },
  { to: '/employer/offers', icon: 'doc', label: 'Offers' },
  { to: '/employer/attendance', icon: 'checkCircle', label: 'Attendance' },
  { to: '/employer/payments', icon: 'wallet', label: 'Payments' },
  { to: '/employer/reviews', icon: 'star', label: 'Reviews' },
  { to: '/employer/profile', icon: 'store', label: 'Business Profile' },
  { to: '/employer/settings', icon: 'target', label: 'Settings' },
]

export default function EmployerShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const [unread, setUnread] = useState(0)
  const [business, setBusiness] = useState('')

  useEffect(() => { setOpen(false); setMenu(false) }, [location.pathname])

  const loadUnread = () =>
    api.get('/notifications/unread-count').then((r) => setUnread(r.data?.count || 0)).catch(() => {})

  useEffect(() => {
    loadUnread()
    api.get('/employer/profile')
      .then((r) => setBusiness(r.data?.businessName || ''))
      .catch(() => {})
  }, [])
  useStomp(() => loadUnread())

  const initials = (user?.name || 'E')
    .split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

  return (
    <div className="mk emp">
      <div className="wk">
        <header className="wk-top">
          <button className="wk-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            <Icon name={open ? 'close' : 'menu'} size={19} />
          </button>

          <Link to="/employer" className="mk-brand" style={{ marginRight: 0 }}>
            <span className="mk-brand-mark" aria-hidden="true">SB</span>
            {SITE.name}
          </Link>

          {business && (
            <Link to="/employer/profile" className="emp-biz-chip" title="Business profile">
              <Icon name="store" size={14} />
              <span className="nm">{business}</span>
              <Icon name="chevronDown" size={13} />
            </Link>
          )}

          <span className="spacer" />

          <Link to="/employer/applications" className="wk-bell" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
            <Icon name="bell" size={18} />
            {unread > 0 && <span className="dot">{unread > 9 ? '9+' : unread}</span>}
          </Link>

          <div style={{ position: 'relative' }}>
            <button className="wk-me" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
              <span className="mk-avatar" style={{ width: 30, height: 30, background: '#2563eb', fontSize: 12 }} aria-hidden="true">
                {initials}
              </span>
              <span className="txt">
                <span className="nm" style={{ display: 'block' }}>{user?.name || 'Employer'}</span>
                <span className="rl">Owner</span>
              </span>
              <Icon name="chevronDown" size={14} />
            </button>
            {menu && (
              <>
                <div className="wk-menu-scrim" onClick={() => setMenu(false)} aria-hidden="true" />
                <div className="wk-card" style={{ position: 'absolute', right: 0, top: 46, width: 200, padding: 6, zIndex: 60, boxShadow: 'var(--shadow-lg)' }}>
                  <Link to="/employer/profile" style={item} onClick={() => setMenu(false)}>Business Profile</Link>
                  <Link to="/employer/settings" style={item} onClick={() => setMenu(false)}>Settings</Link>
                  <button
                    style={{ ...item, width: '100%', textAlign: 'left', border: 0, background: 'transparent', font: 'inherit', cursor: 'pointer', color: '#b91c1c' }}
                    onClick={() => { logout(); navigate('/') }}
                  >
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="wk-body">
          {open && <div className="wk-scrim" onClick={() => setOpen(false)} />}

          <aside className={`wk-side${open ? ' open' : ''}`}>
            <nav className="wk-nav">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                  <Icon name={n.icon} size={17} />
                  <span>{n.label}</span>
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
            <div className="wk-wrap"><Outlet /></div>
          </main>
        </div>
      </div>
    </div>
  )
}

const item = { display: 'block', padding: '9px 11px', borderRadius: 8, fontSize: 14, color: '#0f172a' }
