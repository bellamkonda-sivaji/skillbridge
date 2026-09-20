import React, { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Icon from './icons'
import { SITE, NAV_LINKS, FOOTER_NAV } from './content'
import './marketing.css'

/**
 * Languages the platform can actually render today. Telugu, Kannada, Tamil,
 * Malayalam and Marathi are planned — adding one means a new block in i18n.js
 * plus a translation of content.js, and it appears here automatically.
 */
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
]

const SOCIALS = [
  { icon: 'facebook', label: 'Facebook' },
  { icon: 'twitter', label: 'X' },
  { icon: 'linkedin', label: 'LinkedIn' },
  { icon: 'instagram', label: 'Instagram' },
]

function Brand({ className = 'mk-brand' }) {
  return (
    <Link to="/" className={className} aria-label={`${SITE.name} home`}>
      <span className="mk-brand-mark" aria-hidden="true">SB</span>
      {SITE.name}
    </Link>
  )
}

function TopNav() {
  const { user } = useAuth()
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // Close the mobile menu whenever the route changes.
  useEffect(() => { setOpen(false) }, [location.pathname])

  const changeLanguage = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('sb_lang', code)
  }

  const authLinks = user ? (
    <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/dashboard">Go to Dashboard</Link>
  ) : (
    <>
      <Link className="mk-btn mk-btn-ghost mk-btn-sm" to="/login">Log In</Link>
      <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/register">Sign Up</Link>
    </>
  )

  return (
    <nav className="mk-nav" aria-label="Main">
      <div className="mk-container mk-nav-inner">
        <Brand />

        <div className="mk-nav-links">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {l.t}
            </NavLink>
          ))}
        </div>

        <div className="mk-nav-actions">
          <select
            className="mk-lang"
            value={LANGUAGES.some((l) => l.code === i18n.language) ? i18n.language : 'en'}
            onChange={(e) => changeLanguage(e.target.value)}
            aria-label="Choose language"
          >
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          {authLinks}
        </div>

        <button
          className="mk-burger"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mk-mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          <Icon name={open ? 'close' : 'menu'} size={20} />
        </button>
      </div>

      {open && (
        <div className="mk-mobile-menu" id="mk-mobile-menu">
          <div className="mk-container">
            {NAV_LINKS.map((l) => <Link key={l.to} to={l.to}>{l.t}</Link>)}
            <Link to="/pricing">Pricing</Link>
            <Link to="/help">Help & Support</Link>
            <div className="mk-mobile-actions">
              <select
                className="mk-lang"
                value={LANGUAGES.some((l) => l.code === i18n.language) ? i18n.language : 'en'}
                onChange={(e) => changeLanguage(e.target.value)}
                aria-label="Choose language"
              >
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              {user ? (
                <Link className="mk-btn mk-btn-primary mk-btn-block" to="/dashboard">Go to Dashboard</Link>
              ) : (
                <>
                  <Link className="mk-btn mk-btn-outline mk-btn-block" to="/login">Log In</Link>
                  <Link className="mk-btn mk-btn-primary mk-btn-block" to="/register">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

function Footer() {
  return (
    <footer className="mk-footer">
      <div className="mk-container">
        <div className="mk-footer-top">
          <div>
            <Brand className="mk-brand" />
            <p className="mk-footer-tag">{SITE.tagline}</p>
            <p className="mk-footer-tag" style={{ marginTop: 8 }}>{SITE.promise}</p>
          </div>
          {FOOTER_NAV.map((col) => (
            <div className="mk-footer-col" key={col.h}>
              <h4>{col.h}</h4>
              {col.links.map((l) => <Link key={l.to + l.t} to={l.to}>{l.t}</Link>)}
            </div>
          ))}
        </div>

        <div className="mk-footer-bottom">
          <span>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</span>
          <div className="mk-social">
            {SOCIALS.map((s) => (
              <a key={s.icon} href={`#${s.icon}`} onClick={(e) => e.preventDefault()} aria-label={s.label}>
                <Icon name={s.icon} size={17} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

/** Public pages scroll back to the top on navigation. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function MarketingLayout() {
  return (
    <div className="mk">
      <ScrollToTop />
      <a className="mk-skip" href="#main">Skip to content</a>
      <TopNav />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
