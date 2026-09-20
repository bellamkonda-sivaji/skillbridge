import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { getApplications, timeAgo, pay, EMPLOYMENT_LABEL } from '../api'
import { JobArt, StatusBadge, Bookmark, Loading, Empty, ErrorNote, PillTabs, PageHead } from '../components'

/** Tab -> which statuses it contains. */
const GROUPS = {
  all: null,
  pending: ['APPLIED', 'VIEWED'],
  shortlisted: ['SHORTLISTED'],
  interview: ['INTERVIEW_SCHEDULED'],
  offered: ['OFFERED'],
  rejected: ['REJECTED', 'WITHDRAWN'],
}

export default function MyApplications() {
  useDocumentTitle('My Applications')
  const [apps, setApps] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')

  const load = () => {
    setApps(null); setError('')
    getApplications()
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

  const tabs = [
    { value: 'all', label: 'All', count: count('all') },
    { value: 'pending', label: 'Pending', count: count('pending') },
    { value: 'shortlisted', label: 'Shortlisted', count: count('shortlisted') },
    { value: 'interview', label: 'Interview', count: count('interview') },
    { value: 'offered', label: 'Offers', count: count('offered') },
    { value: 'rejected', label: 'Closed', count: count('rejected') },
  ]

  return (
    <>
      <PageHead title="My Applications" sub="Track your job applications" />

      <PillTabs tabs={tabs} value={tab} onChange={setTab} />

      <div style={{ marginTop: 16 }}>
        <ErrorNote onRetry={load}>{error}</ErrorNote>

        {!apps && !error ? (
          <Loading rows={3} />
        ) : shown.length ? (
          <div className="wk-list">
            {shown.map((a) => {
              const job = a.job || {}
              return (
                <div className="wk-card wk-clicky" key={a.id}>
                  <Link to={`/worker/applications/${a.id}`} className="wk-overlay" aria-label={job.title || 'Application details'} />
                  <div className="wk-job">
                    <JobArt job={job} />
                    <div className="meta" style={{ paddingRight: 0 }}>
                      <div className="wk-row" style={{ alignItems: 'flex-start' }}>
                        <div className="grow">
                          <div className="ttl">{job.title}</div>
                          <div className="biz">{job.businessName}</div>
                        </div>
                        <StatusBadge status={a.status} />
                      </div>
                      <div className="where">
                        <Icon name="clock" size={12} /> Applied {timeAgo(a.appliedAt)}
                      </div>
                      <div className="chips">
                        {job.salary != null && <span className="wk-pay">{pay(job.salary, job.salaryUnit)}</span>}
                        {(job.employmentType || job.workType) && (
                          <span className="wk-chip">
                            {EMPLOYMENT_LABEL[job.employmentType || job.workType] || job.workType}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="act">
                      <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/worker/applications/${a.id}`}>
                        View
                      </Link>
                      {a.status === 'OFFERED' && a.offerId && (
                        <Link className="mk-btn mk-btn-primary mk-btn-sm" to={`/worker/offers/${a.offerId}`}>
                          See offer
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          !error && (
            <div className="wk-card">
              <Empty
                icon="doc"
                title={tab === 'all' ? 'No applications yet' : 'Nothing in this tab'}
                text={
                  tab === 'all'
                    ? 'Apply to a job and you can track its progress here.'
                    : 'Applications move between these tabs as employers respond.'
                }
              >
                <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/worker/jobs">Find jobs</Link>
              </Empty>
            </div>
          )
        )}
      </div>
    </>
  )
}
