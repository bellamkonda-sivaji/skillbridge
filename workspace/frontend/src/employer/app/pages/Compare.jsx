import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { Avatar, useDocumentTitle } from '../../../marketing/components'
import { Loading, Empty, ErrorNote, PageHead } from '../../../worker/components'
import { compareWorkers, decideApplication, inviteWorker, km, money, pay } from '../api'

const yrs = (n) => `${n} yr${n === 1 ? '' : 's'}`

function salaryRange(w) {
  if (w.expectedSalaryMin != null && w.expectedSalaryMax != null) {
    return `${money(w.expectedSalaryMin)} – ${money(w.expectedSalaryMax)}`
  }
  if (w.expectedSalary != null) return pay(w.expectedSalary, w.salaryUnit)
  return '—'
}

function MatchBar({ score }) {
  if (score == null) return <span>—</span>
  const pct = Math.max(0, Math.min(100, Math.round(score)))
  return (
    <span style={{ display: 'grid', gap: 5, justifyItems: 'center' }}>
      <span
        aria-hidden="true"
        style={{ width: 84, height: 6, borderRadius: 999, background: 'var(--soft)', overflow: 'hidden', display: 'block' }}
      >
        <span style={{ display: 'block', width: `${pct}%`, height: '100%', background: 'var(--blue)' }} />
      </span>
      <span style={{ fontWeight: 700 }}>{pct}%</span>
    </span>
  )
}

export default function Compare() {
  const [params] = useSearchParams()
  useDocumentTitle('Compare Candidates')

  const jobId = params.get('jobId') || ''
  const idsParam = params.get('workerIds') || ''
  const workerIds = useMemo(
    () => idsParam.split(',').map((s) => s.trim()).filter(Boolean)
      .map((id) => (/^\d+$/.test(id) ? Number(id) : id)),
    [idsParam]
  )

  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState({})
  const [busy, setBusy] = useState(null)

  const load = () => {
    setRows(null); setError('')
    if (!workerIds.length) { setRows([]); return }
    compareWorkers(workerIds, jobId || undefined)
      .then((d) => setRows(Array.isArray(d) ? d : Array.isArray(d?.workers) ? d.workers : []))
      .catch(() => setError('We could not load this comparison.'))
  }
  useEffect(load, [idsParam, jobId]) // eslint-disable-line react-hooks/exhaustive-deps

  const shortlist = (w) => {
    setBusy(w.workerId)
    const p = w.applicationId
      ? decideApplication(w.applicationId, { status: 'SHORTLISTED' })
      : jobId ? inviteWorker(jobId, w.workerId) : Promise.reject(new Error('no job'))
    p.then(() => setDone((d) => ({ ...d, [w.workerId]: true })))
      .catch(() => setError('That action did not go through. Please try again.'))
      .finally(() => setBusy(null))
  }

  const backTo = jobId ? `/employer/jobs/${jobId}/shortlist` : '/employer/applications'

  return (
    <>
      <PageHead
        title="Compare Candidates"
        sub="Compare skills, experience and key details side by side."
        back={{ to: backTo, label: 'Back to shortlist' }}
      />

      <ErrorNote onRetry={load}>{error}</ErrorNote>

      {!rows && !error ? (
        <Loading rows={2} />
      ) : rows && rows.length ? (
        <div className="wk-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="emp-compare-wrap">
            <table className="emp-compare">
              <thead>
                <tr>
                  <th scope="col"><span className="wk-sub" style={{ marginTop: 0 }}>Candidate</span></th>
                  {rows.map((w) => (
                    <th scope="col" key={w.workerId}>
                      <span className="who">
                        <Avatar name={w.name || '?'} size={40} />
                        <Link className="nm" to={`/employer/workers/${w.workerId}?jobId=${jobId}`} style={{ color: 'inherit' }}>
                          {w.name}
                        </Link>
                        {w.jobTitle && <span className="wk-sub" style={{ marginTop: 0 }}>{w.jobTitle}</span>}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Match Score</th>
                  {rows.map((w) => <td key={w.workerId}><MatchBar score={w.matchScore} /></td>)}
                </tr>
                <tr>
                  <th scope="row">Experience</th>
                  {rows.map((w) => (
                    <td key={w.workerId}>
                      {(w.totalExperienceYears ?? w.experienceYears) != null
                        ? yrs(w.totalExperienceYears ?? w.experienceYears)
                        : '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Location</th>
                  {rows.map((w) => <td key={w.workerId}>{km(w.distanceKm) || '—'}</td>)}
                </tr>
                <tr>
                  <th scope="row">Expected Salary</th>
                  {rows.map((w) => <td key={w.workerId}>{salaryRange(w)}</td>)}
                </tr>
                <tr>
                  <th scope="row">Available From</th>
                  {rows.map((w) => <td key={w.workerId}>{w.availabilityLabel || w.availability || '—'}</td>)}
                </tr>
                <tr>
                  <th scope="row">Key Skills</th>
                  {rows.map((w) => (
                    <td key={w.workerId}>
                      {w.skills?.length ? (
                        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                          {w.skills.slice(0, 6).map((s) => <span className="mk-tag" key={s}>{s}</span>)}
                        </span>
                      ) : '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Languages</th>
                  {rows.map((w) => <td key={w.workerId}>{w.languages?.length ? w.languages.join(', ') : '—'}</td>)}
                </tr>
                <tr>
                  <th scope="row">Verified</th>
                  {rows.map((w) => (
                    <td key={w.workerId}>
                      {w.verified || w.idVerified ? (
                        <span role="img" aria-label="Verified" style={{ color: '#047857', display: 'inline-flex' }}>
                          <Icon name="checkCircle" size={17} />
                        </span>
                      ) : '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Action</th>
                  {rows.map((w) => (
                    <td key={w.workerId}>
                      <button
                        className="mk-btn mk-btn-primary mk-btn-sm"
                        onClick={() => shortlist(w)}
                        disabled={busy === w.workerId || done[w.workerId] || (!w.applicationId && !jobId)}
                      >
                        {done[w.workerId] ? 'Done' : w.applicationId ? 'Shortlist' : 'Invite'}
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !error && (
          <div className="wk-card">
            <Empty
              icon="users"
              title="Nothing to compare"
              text="Pick two or more shortlisted candidates to see them side by side."
            >
              <Link className="mk-btn mk-btn-primary mk-btn-sm" to={backTo}>Back to shortlist</Link>
            </Empty>
          </div>
        )
      )}
    </>
  )
}
