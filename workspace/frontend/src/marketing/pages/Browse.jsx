import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import Icon from '../icons'
import {
  Section, Card, IconBox, Btn, Avatar, Stars, PageHead, useDocumentTitle,
} from '../components'

const UNIT_LABEL = { DAILY: '/day', PER_WEEK: '/week', MONTHLY: '/month' }
const WORK_TYPES = ['All', 'DAILY', 'WEEKLY', 'MONTHLY', 'PERMANENT']
const TYPE_LABEL = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly', PERMANENT: 'Permanent' }

const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

function Loading() {
  return <p className="mk-sub mk-center" style={{ padding: 40 }}>Loading…</p>
}

function Unavailable({ what }) {
  return (
    <Card className="mk-center" style={{ padding: 40, maxWidth: 520, margin: '0 auto' }}>
      <IconBox name="bell" tone="amber" size={20} />
      <h3 className="mk-h3">{what} are not available right now</h3>
      <p className="mk-mt-8">
        We could not reach the platform. Please try again shortly, or create an account
        to be notified as soon as new listings appear.
      </p>
      <div className="mk-cta-row center">
        <Btn to="/register" size="sm">Create an account</Btn>
      </div>
    </Card>
  )
}

/* ============================ Find Jobs ============================ */

export function FindJobs() {
  useDocumentTitle('Find Jobs')
  const [jobs, setJobs] = useState(null)
  const [failed, setFailed] = useState(false)
  const [q, setQ] = useState('')
  const [type, setType] = useState('All')

  useEffect(() => {
    api.get('/jobs')
      .then((res) => setJobs(Array.isArray(res.data) ? res.data : []))
      .catch(() => setFailed(true))
  }, [])

  const results = useMemo(() => {
    if (!jobs) return []
    const term = q.trim().toLowerCase()
    return jobs.filter((j) => {
      if (type !== 'All' && j.workType !== type) return false
      if (!term) return true
      const hay = [j.title, j.businessName, j.city, j.area, (j.requiredSkills || []).join(' ')]
        .join(' ').toLowerCase()
      return hay.includes(term)
    })
  }, [jobs, q, type])

  return (
    <>
      <PageHead
        eyebrow="Find jobs"
        title="Local jobs open right now"
        sub="Browse what businesses near you are hiring for. Create a free account to apply."
      >
        <div style={{ maxWidth: 540, margin: '26px auto 0' }}>
          <div className="mk-search">
            <Icon name="search" size={18} style={{ color: '#64748b', flexShrink: 0 }} />
            <input
              type="search" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search by role, skill or area…" aria-label="Search jobs"
            />
          </div>
        </div>
        <div className="mk-chips" style={{ justifyContent: 'center', marginTop: 16 }}>
          {WORK_TYPES.map((t) => (
            <button key={t} className="mk-chip" aria-pressed={type === t} onClick={() => setType(t)}>
              {t === 'All' ? 'All types' : TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </PageHead>

      <Section style={{ paddingTop: 8 }}>
        {failed ? <Unavailable what="Jobs" /> : !jobs ? <Loading /> : (
          <>
            <p className="mk-sub mk-center" style={{ marginBottom: 24 }}>
              {results.length} {results.length === 1 ? 'job' : 'jobs'} open
            </p>
            <div className="mk-grid mk-grid-2">
              {results.map((j) => (
                <Card key={j.id} hover>
                  <div className="mk-job-head">
                    <div>
                      <h3 className="mk-h3">{j.title}</h3>
                      <p className="mk-sub mk-mt-0" style={{ marginTop: 4 }}>
                        {j.businessName || j.employerName}
                      </p>
                    </div>
                    {j.urgent && <span className="mk-tag urgent">Urgent</span>}
                  </div>

                  <div className="mk-job-meta">
                    <span><Icon name="rupee" size={15} />{money(j.salary)}{UNIT_LABEL[j.salaryUnit] || ''}</span>
                    <span><Icon name="pin" size={15} />{[j.area, j.city].filter(Boolean).join(', ') || 'Location on request'}</span>
                    <span><Icon name="clock" size={15} />{TYPE_LABEL[j.workType] || j.workType}</span>
                    <span><Icon name="users" size={15} />{j.workersNeeded} needed</span>
                  </div>

                  {(j.requiredSkills || []).length > 0 && (
                    <div className="mk-chips" style={{ marginTop: 14 }}>
                      {j.requiredSkills.slice(0, 4).map((s) => (
                        <span className="mk-tag" key={s}>{s}</span>
                      ))}
                    </div>
                  )}

                  <div className="mk-cta-row" style={{ marginTop: 18 }}>
                    <Btn to="/register?role=WORKER" size="sm">Sign up to apply</Btn>
                  </div>
                </Card>
              ))}
            </div>

            {results.length === 0 && (
              <Card className="mk-center" style={{ padding: 40, maxWidth: 520, margin: '0 auto' }}>
                <IconBox name="search" tone="slate" size={20} />
                <h3 className="mk-h3">No open jobs match that search</h3>
                <p className="mk-mt-8">
                  Create a free profile and we will alert you the moment a matching job is
                  posted near you.
                </p>
                <div className="mk-cta-row center">
                  <Btn to="/register?role=WORKER" size="sm">Get job alerts</Btn>
                </div>
              </Card>
            )}
          </>
        )}
      </Section>

      <Section tone="soft">
        <Card className="mk-center" style={{ padding: 36, maxWidth: 620, margin: '0 auto' }}>
          <h3 className="mk-h2" style={{ fontSize: 24 }}>Applying takes one tap</h3>
          <p className="mk-mt-8">
            Create a free worker profile once, and apply to any job without filling a form again.
          </p>
          <div className="mk-cta-row center">
            <Btn to="/register?role=WORKER">Create a Worker Account</Btn>
            <Btn to="/how-it-works" variant="outline">How it works</Btn>
          </div>
        </Card>
      </Section>
    </>
  )
}

/* ============================ Find Workers ============================ */

/** Public listings show a shortened name — contact details stay behind sign-in. */
function publicName(name = '') {
  const parts = name.trim().split(/\s+/)
  if (parts.length < 2) return parts[0] || 'Worker'
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

export function FindWorkers() {
  useDocumentTitle('Find Workers')
  const [workers, setWorkers] = useState(null)
  const [failed, setFailed] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => {
    api.get('/workers')
      .then((res) => setWorkers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setFailed(true))
  }, [])

  const results = useMemo(() => {
    if (!workers) return []
    const term = q.trim().toLowerCase()
    // Only profiles the worker has actually completed are worth showing publicly.
    const ready = workers.filter((w) => w.profileCompleted)
    if (!term) return ready
    return ready.filter((w) =>
      [w.jobTitle, w.city, w.area, (w.skills || []).join(' ')]
        .join(' ').toLowerCase().includes(term)
    )
  }, [workers, q])

  return (
    <>
      <PageHead
        eyebrow="Find workers"
        title="Verified workers near your business"
        sub="See who is available in your area. Create a free employer account to contact them."
      >
        <div style={{ maxWidth: 540, margin: '26px auto 0' }}>
          <div className="mk-search">
            <Icon name="search" size={18} style={{ color: '#64748b', flexShrink: 0 }} />
            <input
              type="search" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search by skill, role or area…" aria-label="Search workers"
            />
          </div>
        </div>
      </PageHead>

      <Section style={{ paddingTop: 8 }}>
        {failed ? <Unavailable what="Worker profiles" /> : !workers ? <Loading /> : (
          <>
            <p className="mk-sub mk-center" style={{ marginBottom: 24 }}>
              {results.length} {results.length === 1 ? 'worker' : 'workers'} available
            </p>
            <div className="mk-grid mk-grid-3">
              {results.map((w) => (
                <Card key={w.id} hover>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <Avatar name={w.name || 'Worker'} size={48} />
                    <div style={{ minWidth: 0 }}>
                      <h3 className="mk-h3" style={{ fontSize: 16 }}>{publicName(w.name)}</h3>
                      <p className="mk-sub mk-mt-0" style={{ marginTop: 2 }}>
                        {w.jobTitle || 'Available for work'}
                      </p>
                    </div>
                  </div>

                  <div className="mk-job-meta">
                    <span><Icon name="pin" size={15} />{[w.area, w.city].filter(Boolean).join(', ') || 'Nearby'}</span>
                    <span><Icon name="briefcase" size={15} />{w.experienceYears || 0} yr experience</span>
                  </div>

                  {(w.skills || []).length > 0 && (
                    <div className="mk-chips" style={{ marginTop: 14 }}>
                      {w.skills.slice(0, 3).map((s) => <span className="mk-tag" key={s}>{s}</span>)}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                    {w.ratingCount > 0 && <Stars rating={Math.round(w.avgRating)} />}
                    {w.verificationStatus === 'VERIFIED' && (
                      <span className="mk-tag blue">
                        <Icon name="check" size={11} strokeWidth={3} /> Verified
                      </span>
                    )}
                  </div>

                  <div className="mk-cta-row" style={{ marginTop: 16 }}>
                    <Btn to="/register?role=EMPLOYER" variant="outline" size="sm">Sign up to contact</Btn>
                  </div>
                </Card>
              ))}
            </div>

            {results.length === 0 && (
              <Card className="mk-center" style={{ padding: 40, maxWidth: 520, margin: '0 auto' }}>
                <IconBox name="users" tone="slate" size={20} />
                <h3 className="mk-h3">No matching profiles yet</h3>
                <p className="mk-mt-8">
                  Post your requirement anyway — workers are matched to new jobs as soon as
                  they join, and you will be notified.
                </p>
                <div className="mk-cta-row center">
                  <Btn to="/employer/login" size="sm">Post a job</Btn>
                </div>
              </Card>
            )}
          </>
        )}

        <div className="mk-note mk-mt-32">
          <strong>Privacy note.</strong> Public listings show only a shortened name and the
          skills a worker chose to publish. Contact details are shared with an employer
          after a hire is confirmed. <Link to="/legal/privacy">Read our privacy policy</Link>.
        </div>
      </Section>

      <Section tone="soft">
        <Card className="mk-center" style={{ padding: 36, maxWidth: 620, margin: '0 auto' }}>
          <h3 className="mk-h2" style={{ fontSize: 24 }}>Let the right people find you</h3>
          <p className="mk-mt-8">
            Post a requirement and we will rank nearby workers by skills, distance,
            availability and verified history.
          </p>
          <div className="mk-cta-row center">
            <Btn to="/employer/login">Post a Job</Btn>
            <Btn to="/for-employers" variant="outline">For Employers</Btn>
          </div>
        </Card>
      </Section>
    </>
  )
}
