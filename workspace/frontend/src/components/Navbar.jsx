import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { useStomp } from '../hooks/useStomp'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  const loadNotifs = () => {
    api.get('/notifications').then((res) => setNotifs(res.data)).catch(() => {})
    api.get('/notifications/unread-count').then((res) => setUnread(res.data.count)).catch(() => {})
  }

  useStomp((msg) => {
    if (msg.type === 'notification') {
      setNotifs((prev) => [msg.payload, ...prev])
      setUnread((u) => u + 1)
    }
    if (msg.type === 'chat') {
      loadNotifs()
    }
  })

  useEffect(() => {
    if (user) loadNotifs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const changeLang = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('sb_lang', lng)
  }

  const markAllRead = async () => {
    await api.patch('/notifications/read-all')
    setUnread(0)
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const clickNotif = async (n) => {
    if (!n.read) {
      await api.patch(`/notifications/${n.id}/read`)
      setUnread((u) => Math.max(0, u - 1))
      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    }
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  const doLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="container">
        <Link className="brand" to="/">
          <span>SkillBridge</span>
        </Link>
        <div className="nav-links">
          {!user && (
            <>
              <Link to="/jobs" onClick={(e) => e.preventDefault()}>{t('nav.jobs')}</Link>
              <Link to="/workers" onClick={(e) => e.preventDefault()}>{t('nav.workers')}</Link>
            </>
          )}
          {user && user.role === 'WORKER' && (
            <>
              <NavLink to="/dashboard" end>{t('nav.dashboard')}</NavLink>
              <NavLink to="/chat">{t('nav.chat')}</NavLink>
            </>
          )}
          {user && user.role === 'EMPLOYER' && (
            <>
              <NavLink to="/dashboard" end>{t('nav.dashboard')}</NavLink>
              <NavLink to="/chat">{t('nav.chat')}</NavLink>
            </>
          )}
          {user && user.role === 'ADMIN' && (
            <NavLink to="/admin">{t('nav.admin')}</NavLink>
          )}
        </div>
        <div className="nav-right">
          <select
            className="lang-select"
            value={i18n.language}
            onChange={(e) => changeLang(e.target.value)}
          >
            <option value="en">English</option>
            <option value="sw">Kiswahili</option>
            <option value="hi">हिन्दी</option>
          </select>
          {user && (
            <div style={{ position: 'relative' }} ref={panelRef}>
              <button className="bell" onClick={() => setOpen(!open)}>🔔
                {unread > 0 && <span className="bell-badge">{unread}</span>}
              </button>
              {open && (
                <div className="notif-panel">
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between' }}>
                    <b>{t('notifications.title')}</b>
                    {unread > 0 && (
                      <button className="btn btn-sm btn-outline" onClick={markAllRead}>
                        {t('notifications.markAll')}
                      </button>
                    )}
                  </div>
                  {notifs.length === 0 && <div className="empty">{t('notifications.empty')}</div>}
                  {notifs.map((n) => (
                    <div key={n.id} className={`item ${n.read ? '' : 'unread'}`} onClick={() => clickNotif(n)}>
                      <div className="t">{n.title}</div>
                      <div className="b">{n.body}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!user && (
            <>
              <Link to="/login"><button className="btn btn-outline btn-sm">{t('nav.login')}</button></Link>
              <Link to="/register"><button className="btn btn-primary btn-sm">{t('nav.register')}</button></Link>
            </>
          )}
          {user && (
            <button className="btn btn-outline btn-sm" onClick={doLogout}>{t('nav.logout')}</button>
          )}
        </div>
      </div>
    </nav>
  )
}
