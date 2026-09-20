import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { getApplications, getUserReviews, money, formatDate, pay } from '../api'
import { JobArt, Stars, StatusBadge, Loading, Empty, ErrorNote, PageHead } from '../components'
import api from '../../api'

/* ---------- My Work: jobs actually accepted ---------- */

export function MyWork() {
  useDocumentTitle('My Work')
  const [apps, setApps] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    setApps(null); setError('')
    getApplications()
      .then((d) => setApps((Array.isArray(d) ? d : []).filter((a) => a.status === 'ACCEPTED')))
      .catch(() => setError('We could not load your work history.'))
  }
  useEffect(load, [])

  return (
    <>
      <PageHead title="My Work" sub="Jobs you were hired for" />
      <ErrorNote onRetry={load}>{error}</ErrorNote>
      {!apps && !error ? <Loading rows={2} /> : apps?.length ? (
        <div className="wk-list">
          {apps.map((a) => (
            <div className="wk-card" key={a.id}>
              <div className="wk-job" style={{ alignItems: 'center' }}>
                <JobArt job={a.job || {}} />
                <div className="meta" style={{ paddingRight: 0 }}>
                  <div className="ttl">{a.job?.title}</div>
                  <div className="biz">{a.job?.businessName}</div>
                  <div className="chips">
                    {a.job?.salary != null && <span className="wk-pay">{pay(a.job.salary, a.job.salaryUnit)}</span>}
                    <span className="wk-chip">Hired {formatDate(a.decidedAt || a.appliedAt)}</span>
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        !error && (
          <div className="wk-card">
            <Empty icon="briefcase" title="No completed work yet" text="Jobs you are hired for will appear here with their payment record.">
              <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/worker/jobs">Find jobs</Link>
            </Empty>
          </div>
        )
      )}
    </>
  )
}

/* ---------- Earnings ---------- */

export function Earnings() {
  useDocumentTitle('Earnings')
  const [wallet, setWallet] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    setWallet(null); setError('')
    api.get('/wallet').then((r) => setWallet(r.data)).catch(() => setError('We could not load your earnings.'))
  }
  useEffect(load, [])

  const txns = wallet?.transactions || []

  return (
    <>
      <PageHead title="Earnings" sub="What you have earned through SkillBridge" />
      <ErrorNote onRetry={load}>{error}</ErrorNote>
      {!wallet && !error ? <Loading rows={2} /> : wallet && (
        <>
          <div className="wk-card pad-lg" style={{ background: 'linear-gradient(120deg,#eff6ff,#dbeafe)', borderColor: 'var(--blue-100)' }}>
            <div className="wk-sub" style={{ marginTop: 0 }}>Available balance</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>
              {money(wallet.balance)}
            </div>
          </div>

          <h2 className="wk-h2" style={{ marginTop: 24, marginBottom: 12 }}>Transactions</h2>
          {txns.length ? (
            <div className="wk-list">
              {txns.map((t) => (
                <div className="wk-card" key={t.id}>
                  <div className="wk-row">
                    <span
                      className="ic"
                      style={{
                        width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center',
                        background: t.type === 'CREDIT' ? '#d1fae5' : '#fee2e2',
                        color: t.type === 'CREDIT' ? '#047857' : '#b91c1c',
                      }}
                    >
                      <Icon name={t.type === 'CREDIT' ? 'trending' : 'wallet'} size={16} />
                    </span>
                    <div className="grow">
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                        {t.description || t.reference}
                      </div>
                      <div className="wk-sub" style={{ marginTop: 2 }}>{formatDate(t.createdAt, true)}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: t.type === 'CREDIT' ? '#047857' : '#b91c1c' }}>
                      {t.type === 'CREDIT' ? '+' : '−'}{money(t.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="wk-card">
              <Empty icon="wallet" title="No transactions yet" text="Your wages appear here once an employer releases payment." />
            </div>
          )}
        </>
      )}
    </>
  )
}

/* ---------- Reviews about me ---------- */

export function Reviews() {
  useDocumentTitle('Reviews')
  const { user } = useAuth()
  const [reviews, setReviews] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    if (!user?.id) return
    setReviews(null); setError('')
    getUserReviews('WORKER', user.id)
      .then((d) => setReviews(Array.isArray(d) ? d : []))
      .catch(() => setError('We could not load your reviews.'))
  }
  useEffect(load, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageHead title="Reviews" sub="What employers said about your work" />
      <ErrorNote onRetry={load}>{error}</ErrorNote>
      {!reviews && !error ? <Loading rows={2} /> : reviews?.length ? (
        <div className="wk-list">
          {reviews.map((r) => (
            <div className="wk-card" key={r.id}>
              <div className="wk-row">
                <div className="grow">
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{r.authorName || 'Employer'}</div>
                  <Stars rating={r.rating} />
                </div>
                <span className="wk-sub" style={{ marginTop: 0 }}>{formatDate(r.createdAt)}</span>
              </div>
              {r.comment && <p style={{ fontSize: 14, color: 'var(--body)', marginTop: 8 }}>{r.comment}</p>}
              {r.jobTitle && <p className="wk-sub">for {r.jobTitle}</p>}
            </div>
          ))}
        </div>
      ) : (
        !error && (
          <div className="wk-card">
            <Empty icon="star" title="No reviews yet" text="Employers can review you after you complete a job." />
          </div>
        )
      )}
    </>
  )
}

/* ---------- Settings ---------- */

export function Settings() {
  useDocumentTitle('Settings')
  const { user, logout } = useAuth()
  const { i18n } = useTranslation()

  const setLang = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('sb_lang', code)
  }

  return (
    <>
      <PageHead title="Settings" sub="Your account and preferences" />

      <div className="wk-card pad-lg">
        <h2 className="wk-h2">Account</h2>
        <div className="wk-kvlist">
          <KV icon="user" k="Name" v={user?.name || '—'} />
          <KV icon="phone" k="Mobile" v={user?.phone ? `+91 ${user.phone}` : '—'} />
          <KV icon="mail" k="Email" v={user?.email || 'Not added'} />
          <KV
            icon="shield"
            k="Verification"
            v={user?.phoneVerified ? 'Mobile verified' : 'Not verified'}
          />
        </div>
        <Link className="mk-btn mk-btn-outline mk-btn-sm" to="/worker/profile" style={{ marginTop: 16 }}>
          Edit profile
        </Link>
      </div>

      <div className="wk-card pad-lg" style={{ marginTop: 14 }}>
        <h2 className="wk-h2">Language</h2>
        <p className="wk-sub">Choose the language you want to use SkillBridge in.</p>
        <select
          className="wk-select"
          style={{ marginTop: 12, maxWidth: 260 }}
          value={['en', 'hi'].includes(i18n.language) ? i18n.language : 'en'}
          onChange={(e) => setLang(e.target.value)}
        >
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
        </select>
        <p className="wk-sub">
          Telugu, Kannada, Tamil, Malayalam and Marathi are on the way.
        </p>
      </div>

      <div className="wk-card pad-lg" style={{ marginTop: 14 }}>
        <h2 className="wk-h2">Help &amp; policies</h2>
        <div className="wk-kvlist">
          <div className="r"><span className="ic"><Icon name="chat" size={14} /></span><Link to="/help">Help centre</Link></div>
          <div className="r"><span className="ic"><Icon name="shield" size={14} /></span><Link to="/safety">Safety &amp; verification</Link></div>
          <div className="r"><span className="ic"><Icon name="doc" size={14} /></span><Link to="/legal">Terms &amp; policies</Link></div>
        </div>
      </div>

      <button
        className="mk-btn"
        style={{ marginTop: 14, background: '#fff', color: '#b91c1c', border: '1px solid #fecaca' }}
        onClick={logout}
      >
        Log out
      </button>
    </>
  )
}

function KV({ icon, k, v }) {
  return (
    <div className="r">
      <span className="ic"><Icon name={icon} size={14} /></span>
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  )
}
