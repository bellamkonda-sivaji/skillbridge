import React, { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../marketing/icons'
import { SITE } from '../marketing/content'
import { useAuth } from '../context/AuthContext'
import { usePermissions } from './components'
import { ROLE_LABEL } from './api'
import '../worker/worker.css'
import './admin.css'
import Logo from '../marketing/Logo'

/**
 * Sidebar. `perm` hides a section the signed-in role cannot use at all —
 * the server enforces it regardless, this just avoids offering dead ends.
 */
const NAV = [
  { to: '/admin', end: true, icon: 'grid', label: 'Overview' },
  { to: '/admin/call-list', icon: 'phone', label: 'Call list' },
  { to: '/admin/enquiries', icon: 'chat', label: 'Enquiries' },
  { to: '/admin/support', icon: 'chat', label: 'Help desk' },
  { to: '/admin/attendance', icon: 'checkCircle', label: 'Attendance' },
  { to: '/admin/jobs', icon: 'briefcase', label: 'Jobs' },
  { to: '/admin/applications', icon: 'doc', label: 'Applications' },
  { to: '/admin/companies', icon: 'store', label: 'Companies' },
  { to: '/admin/skills', icon: 'target', label: 'Skills Registry' },
  { to: '/admin/analytics', icon: 'trending', label: 'Analytics', perm: 'VIEW_REPORTS' },
  { to: '/admin/interviews', icon: 'calendar', label: 'Calls & visits' },
  { to: '/admin/payments', icon: 'wallet', label: 'Payments', perm: 'VIEW_PAYMENTS' },
  { to: '/admin/finance', icon: 'rupee', label: 'Finance', perm: 'VIEW_PAYMENTS' },
  { to: '/admin/verifications', icon: 'shield', label: 'Verifications', perm: 'VERIFY_ACCOUNTS' },
  { to: '/admin/reports', icon: 'trending', label: 'Daily Report' },
  { to: '/admin/team', icon: 'users', label: 'Admin Team', superOnly: true },
  { to: '/admin/audit', icon: 'eye', label: 'Audit Log' },
]

export default function AdminShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { can, isSuperAdmin, role } = usePermissions()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)

  useEffect(() => { setOpen(false); setMenu(false) }, [location.pathname])

  const initials = (user?.name || 'A')
    .split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

  /* A permission the server has not sent yet should not blank the whole menu,
     so an item is hidden only when we positively know the role lacks it. */
  const visible = NAV.filter((n) => {
    if (n.superOnly) return isSuperAdmin
    if (n.perm && Array.isArray(user?.permissions)) return can(n.perm)
    return true
  })

  return (
    <div className="mk ad">
      <div className="wk">
        <header className="wk-top">
          <button className="wk-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            <Icon name={open ? 'close' : 'menu'} size={19} />
          </button>

          <Link to="/admin" className="mk-brand" style={{ marginRight: 0 }}>
            <Logo size={30} />
          </Link>

          <span className="ad-whoami" title={`Signed in as ${ROLE_LABEL[role] || role || 'Admin'}`}>
            <Icon name="shield" size={13} />
            <span className="txt">{ROLE_LABEL[role] || 'Admin'}</span>
          </span>

          <span className="spacer" />

          <div style={{ position: 'relative' }}>
            <button className="wk-me" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
              <span className="mk-avatar" style={{ width: 30, height: 30, background: '#2563eb', fontSize: 12 }} aria-hidden="true">
                {initials}
              </span>
              <span className="txt">
                <span className="nm" style={{ display: 'block' }}>{user?.name || 'Admin'}</span>
                <span className="rl">{ROLE_LABEL[role] || 'Admin'}</span>
              </span>
              <Icon name="chevronDown" size={14} />
            </button>
            {menu && (
              <>
                <div className="wk-menu-scrim" onClick={() => setMenu(false)} aria-hidden="true" />
                <div className="wk-card" style={{ position: 'absolute', right: 0, top: 46, width: 210, padding: 6, zIndex: 60, boxShadow: 'var(--shadow-lg)' }}>
                  <div style={{ padding: '8px 11px', borderBottom: '1px solid var(--line)', marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{user?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{user?.email}</div>
                  </div>
                  {isSuperAdmin && (
                    <Link to="/admin/team" style={item} onClick={() => setMenu(false)}>Admin Team</Link>
                  )}
                  <button
                    style={{ ...item, width: '100%', textAlign: 'left', border: 0, background: 'transparent', font: 'inherit', cursor: 'pointer', color: '#b91c1c' }}
                    onClick={() => { logout(); navigate('/admin/login') }}
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
              {visible.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                  <Icon name={n.icon} size={17} />
                  <span>{n.label}</span>
                </NavLink>
              ))}
            </nav>
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
