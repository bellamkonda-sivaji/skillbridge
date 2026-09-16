import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Landing() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [stats, setStats] = useState({ workers: '—', jobs: '—', matches: '—' })

  useEffect(() => {
    api.get('/jobs').then((res) => setStats((s) => ({ ...s, jobs: res.data.length }))).catch(() => {})
    api.get('/workers').then((res) => setStats((s) => ({ ...s, workers: res.data.length }))).catch(() => {})
    api.get('/auth/health').then((res) => res).catch(() => {})
    if (localStorage.getItem('sb_token')) {
      api.get('/worker/matches').then((res) => setStats((s) => ({ ...s, matches: res.data.length }))).catch(() => {})
    }
  }, [])

  const target = user ? '/dashboard' : '/register'

  return (
    <div>
      <section className="hero">
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <h1>{t('home.heroTitle')}</h1>
          <p>{t('home.heroSub')}</p>
          <div className="cta">
            <Link to="/register"><button className="btn btn-light" style={{ background: '#fff', color: 'var(--primary-dark)' }}>{t('home.ctaWorker')}</button></Link>
            <Link to="/register"><button className="btn btn-ghost">{t('home.ctaEmployer')}</button></Link>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="stats-bar">
          <div className="stat"><div className="num">{stats.workers}</div><div className="lbl">{t('home.statsWorkers')}</div></div>
          <div className="stat"><div className="num">{stats.jobs}</div><div className="lbl">{t('home.statsJobs')}</div></div>
          <div className="stat"><div className="num">{stats.matches}</div><div className="lbl">{t('home.statsMatches')}</div></div>
          <div className="stat"><div className="num">🔒</div><div className="lbl">JWT Auth + Verified Profiles</div></div>
        </div>
      </div>

      <section className="features">
        <div className="container">
          <h2>{t('home.featuresTitle')}</h2>
          <div className="feature-grid">
            {[
              { icon: '🧠', t1: 'home.f1', t2: 'home.f1d' },
              { icon: '✅', t1: 'home.f2', t2: 'home.f2d' },
              { icon: '💬', t1: 'home.f3', t2: 'home.f3d' },
              { icon: '📍', t1: 'home.f4', t2: 'home.f4d' },
              { icon: '⭐', t1: 'home.f5', t2: 'home.f5d' },
              { icon: '🌐', t1: 'home.f6', t2: 'home.f6d' }
            ].map((f, i) => (
              <div className="feature" key={i}>
                <div className="icon">{f.icon}</div>
                <h4>{t(f.t1)}</h4>
                <p>{t(f.t2)}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to={target}>
              <button className="btn btn-primary" style={{ padding: '13px 30px', fontSize: 15 }}>{user ? t('nav.dashboard') : t('auth.register')}</button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
