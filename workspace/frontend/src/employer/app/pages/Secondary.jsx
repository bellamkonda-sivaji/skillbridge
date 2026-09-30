import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { Avatar, useDocumentTitle } from '../../../marketing/components'
import { useAuth } from '../../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import {
  Loading, Empty, ErrorNote, PageHead, PillTabs, Stars, Verified,
} from '../../../worker/components'
import api from '../../../api'
import { LANGUAGE_OPTIONS as LANGUAGES } from '../../../i18n'
import {
  allApplications, listJobs, money, km, timeAgo, formatDate, pay,
  APPLICANT_STATUS_LABEL, APPLICANT_STATUS_TONE,
} from '../api'

/* ---------- Applications across every job ---------- */

const GROUPS = {
  ALL: null,
  NEW: ['APPLIED', 'VIEWED'],
  SHORTLISTED: ['SHORTLISTED'],
  INTERVIEW: ['INTERVIEW_SCHEDULED'],
  OFFERED: ['OFFERED', 'ACCEPTED'],
  REJECTED: ['REJECTED', 'WITHDRAWN'],
}

export function Applications() {
  useDocumentTitle('Applications')
  const [apps, setApps] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('ALL')

  const load = () => {
    setApps(null); setError('')
    allApplications()
      .then((d) => setApps(Array.isArray(d) ? d : []))
      .catch(() => setError('We could not load your applications.'))
  }
  useEffect(load, [])

  const count = (key) => {
    if (!apps) return undefined
    const g = GROUPS[key]
    return g ? apps.filter((a) => g.includes(a.status)).length : apps.length
  }

  const shown = useMemo(() => {
    if (!apps) return []
    const g = GROUPS[tab]
    return g ? apps.filter((a) => g.includes(a.status)) : apps
  }, [apps, tab])

  return (
    <>
      <PageHead title="Applications" sub="Everyone who applied, across all your jobs." />

      <PillTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'ALL', label: 'All', count: count('ALL') },
          { value: 'NEW', label: 'New', count: count('NEW') },
          { value: 'SHORTLISTED', label: 'Shortlisted', count: count('SHORTLISTED') },
          { value: 'INTERVIEW', label: 'Interview', count: count('INTERVIEW') },
          { value: 'OFFERED', label: 'Offers', count: count('OFFERED') },
          { value: 'REJECTED', label: 'Closed', count: count('REJECTED') },
        ]}
      />

      <div style={{ marginTop: 16 }}>
        <ErrorNote onRetry={load}>{error}</ErrorNote>
        {!apps && !error ? <Loading rows={3} /> : shown.length ? (
          <div className="wk-list">
            {shown.map((a) => (
              <div className="wk-card wk-clicky" key={a.id || a.applicationId}>
                <Link to={a.workerId ? `/employer/workers/${a.workerId}` : '/employer/applications'} className="wk-overlay" aria-label={a.workerName || a.name || 'Application details'} />
                <div className="emp-app-row">
                  <Avatar name={a.workerName || a.name || 'Applicant'} size={42} />
                  <span className="meta">
                    <span className="nm" style={{ display: 'block' }}>{a.workerName || a.name}</span>
                    <span className="sb">{a.jobTitle || a.job?.title}</span>
                    <span className="sb">Applied {timeAgo(a.appliedAt)}</span>
                  </span>
                  <span className={`wk-badge ${APPLICANT_STATUS_TONE[a.status] || 'viewed'}`}>
                    {APPLICANT_STATUS_LABEL[a.status] || a.status}
                  </span>
                  {a.workerId && (
                    <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/employer/workers/${a.workerId}`}>
                      View
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          !error && (
            <div className="wk-card">
              <Empty icon="doc" title="Nothing here yet" text="Applications appear as workers apply to your jobs.">
                <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/employer/post-job">Post a Job</Link>
              </Empty>
            </div>
          )
        )}
      </div>
    </>
  )
}

/* ---------- Find workers (public search) ---------- */

export function FindWorkers() {
  useDocumentTitle('Find Workers')
  const [workers, setWorkers] = useState(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [city, setCity] = useState('')

  const load = () => {
    setWorkers(null); setError('')
    api.get('/workers', { params: { q: q || undefined, city: city || undefined } })
      .then((r) => setWorkers((r.data || []).filter((w) => w.profileCompleted)))
      .catch(() => setError('We could not load workers just now.'))
  }
  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageHead title="Find Workers" sub="Search verified workers near your business." />

      <div className="emp-toolbar">
        <div className="wk-bar grow">
          <Icon name="search" size={16} style={{ color: '#64748b', flexShrink: 0 }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Skill, role or name…"
            aria-label="Search workers" onKeyDown={(e) => e.key === 'Enter' && load()} />
        </div>
        <input className="wk-input" style={{ maxWidth: 180 }} value={city} placeholder="City"
          onChange={(e) => setCity(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
        <button className="mk-btn mk-btn-primary mk-btn-sm" onClick={load}>Search</button>
      </div>

      <ErrorNote onRetry={load}>{error}</ErrorNote>

      {!workers && !error ? <Loading rows={3} /> : workers?.length ? (
        <div className="wk-list">
          {workers.map((w) => (
            <div className="wk-card wk-clicky" key={w.id}>
              <Link to={`/employer/workers/${w.userId || w.id}`} className="wk-overlay" aria-label={w.name || 'Worker profile'} />
              <div className="emp-app-row">
                <Avatar name={w.name || 'Worker'} size={44} />
                <span className="meta">
                  <span className="nm" style={{ display: 'block' }}>{w.name}</span>
                  <span className="sb">
                    {[w.jobTitle, `${w.experienceYears || 0} yrs exp`, [w.area, w.city].filter(Boolean).join(', ')]
                      .filter(Boolean).join(' · ')}
                  </span>
                  {(w.skills || []).length > 0 && (
                    <span className="mk-chips" style={{ marginTop: 8 }}>
                      {w.skills.slice(0, 3).map((s) => <span className="mk-tag" key={s}>{s}</span>)}
                    </span>
                  )}
                </span>
                {w.verificationStatus === 'VERIFIED' && <Verified label="Verified" />}
                <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/employer/workers/${w.userId || w.id}`}>
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !error && (
          <div className="wk-card">
            <Empty icon="users" title="No workers match that search" text="Try a broader skill or clear the city filter." />
          </div>
        )
      )}
    </>
  )
}

/* ---------- Payments ---------- */

export function Payments() {
  useDocumentTitle('Payments')
  const [wallet, setWallet] = useState(null)
  const [error, setError] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    setWallet(null); setError('')
    api.get('/wallet').then((r) => setWallet(r.data)).catch(() => setError('We could not load your wallet.'))
  }
  useEffect(load, [])

  const fund = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/wallet/fund', { amount: Number(amount) })
      setAmount('')
      load()
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not add funds.')
    } finally { setBusy(false) }
  }

  const txns = wallet?.transactions || []

  return (
    <>
      <PageHead title="Payments" sub="Fund your wallet and track every wage you have paid." />
      <ErrorNote onRetry={load}>{error}</ErrorNote>

      {!wallet && !error ? <Loading rows={2} /> : wallet && (
        <>
          <div className="wk-card pad-lg" style={{ background: 'linear-gradient(120deg,#eff6ff,#dbeafe)', borderColor: 'var(--blue-100)' }}>
            <div className="wk-sub" style={{ marginTop: 0 }}>Wallet balance</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>
              {money(wallet.balance)}
            </div>
            <form onSubmit={fund} style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <input className="wk-input" style={{ maxWidth: 180 }} type="number" min={1} placeholder="Amount (₹)"
                value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Amount to add" />
              <button className="mk-btn mk-btn-primary mk-btn-sm" disabled={busy || !amount}>
                {busy ? 'Adding…' : 'Add funds'}
              </button>
            </form>
            <p className="wk-sub">
              Wages are held from this balance when you make an offer, and released to the
              worker once the work is confirmed.
            </p>
          </div>

          <h2 className="wk-h2" style={{ marginTop: 24, marginBottom: 12 }}>Transactions</h2>
          {txns.length ? (
            <div className="wk-list">
              {txns.map((t) => (
                <div className="wk-card" key={t.id}>
                  <div className="wk-row">
                    <span style={{
                      width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center',
                      background: t.type === 'CREDIT' ? '#d1fae5' : '#fee2e2',
                      color: t.type === 'CREDIT' ? '#047857' : '#b91c1c',
                    }}>
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
              <Empty icon="wallet" title="No transactions yet" text="Funding and wage payments appear here." />
            </div>
          )}
        </>
      )}
    </>
  )
}

/* ---------- Reviews about this business ---------- */

export function Reviews() {
  useDocumentTitle('Reviews')
  const { user } = useAuth()
  const [reviews, setReviews] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    if (!user?.id) return
    setReviews(null); setError('')
    api.get(`/reviews/target/EMPLOYER/${user.id}`)
      .then((r) => setReviews(Array.isArray(r.data) ? r.data : []))
      .catch(() => setError('We could not load your reviews.'))
  }
  useEffect(load, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageHead title="Reviews" sub="What workers said about working for you." />
      <ErrorNote onRetry={load}>{error}</ErrorNote>
      {!reviews && !error ? <Loading rows={2} /> : reviews?.length ? (
        <div className="wk-list">
          {reviews.map((r) => (
            <div className="wk-card" key={r.id}>
              <div className="wk-row">
                <div className="grow">
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{r.authorName || 'Worker'}</div>
                  <Stars rating={r.rating} />
                </div>
                <span className="wk-sub" style={{ marginTop: 0 }}>{formatDate(r.createdAt)}</span>
              </div>
              {r.comment && <p style={{ fontSize: 14, color: 'var(--body)', marginTop: 8 }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      ) : (
        !error && (
          <div className="wk-card">
            <Empty icon="star" title="No reviews yet" text="Workers can review your business after completing a job." />
          </div>
        )
      )}
    </>
  )
}

/* ---------- Attendance (not built yet — say so honestly) ---------- */

export function Attendance() {
  useDocumentTitle('Attendance')
  const [jobs, setJobs] = useState(null)

  useEffect(() => {
    listJobs('ALL').then((d) => setJobs(Array.isArray(d) ? d : [])).catch(() => setJobs([]))
  }, [])

  return (
    <>
      <PageHead title="Attendance" sub="Track who turned up, and for how long." />
      <div className="wk-card pad-lg">
        <span className="mk-icon-box amber"><Icon name="calendar" size={20} /></span>
        <h2 className="wk-h2">Attendance tracking is coming next</h2>
        <p className="wk-sub">
          Shift check-in and check-out, daily and monthly attendance records, and the link
          from attendance to wage release are the next thing we are building. Until then,
          wages are released when you accept a worker’s offer.
        </p>
        {jobs?.length > 0 && (
          <p className="wk-sub">
            You have {jobs.filter((j) => j.status === 'OPEN' || j.status === 'ACTIVE').length} active
            {' '}job{jobs.length === 1 ? '' : 's'} that will appear here once it ships.
          </p>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          <Link className="mk-btn mk-btn-outline mk-btn-sm" to="/employer/payments">Go to Payments</Link>
          <Link className="mk-btn mk-btn-outline mk-btn-sm" to="/employer/jobs">My Jobs</Link>
        </div>
      </div>
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
      <PageHead title="Settings" sub="Your account and preferences." />

      <div className="wk-card pad-lg">
        <h2 className="wk-h2">Account</h2>
        <div className="emp-kv-grid" style={{ marginTop: 12 }}>
          <div className="r"><span className="k">Name</span><span className="v">{user?.name || '—'}</span></div>
          <div className="r"><span className="k">Mobile</span><span className="v">{user?.phone ? `+91 ${user.phone}` : '—'}</span></div>
          <div className="r"><span className="k">Email</span><span className="v">{user?.email || 'Not added'}</span></div>
          <div className="r">
            <span className="k">Verification</span>
            <span className="v">{user?.phoneVerified ? 'Mobile verified' : 'Not verified'}</span>
          </div>
        </div>
        <Link className="mk-btn mk-btn-outline mk-btn-sm" to="/employer/profile" style={{ marginTop: 16 }}>
          Edit business profile
        </Link>
      </div>

      <div className="wk-card pad-lg" style={{ marginTop: 14 }}>
        <h2 className="wk-h2">Language</h2>
        <select
          className="wk-select"
          style={{ marginTop: 12, maxWidth: 260 }}
          value={LANGUAGES.some((l) => l.code === i18n.language) ? i18n.language : 'en'}
          onChange={(e) => setLang(e.target.value)}
        >
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
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
