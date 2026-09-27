import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { Avatar, useDocumentTitle } from '../../../marketing/components'
import { Loading, ErrorNote, PageHead, PillTabs } from '../../../worker/components'
import { WhenBanner, DataTable } from '../hiring'
import {
  getInterviewResults, setInterviewResult, getJob,
  RESULT_LABEL, formatDate, timeRange, km,
} from '../api'

const TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'INTERVIEWED', label: 'Interviewed' },
  { value: 'SELECTED', label: 'Selected' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'REJECTED', label: 'Rejected' },
]

const RESULTS = ['INTERVIEWED', 'SHORTLISTED', 'SELECTED', 'ON_HOLD', 'REJECTED']

/**
 * Screen 21 — Interview Result.
 *
 * A one-day job never has a separate interview round: the employer talks to the
 * worker and hires. So for short jobs we drop the interview columns and show the
 * work date and working time instead, which is what actually matters there.
 */
export default function InterviewResults() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [rows, setRows] = useState(null)
  const [tab, setTab] = useState('ALL')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  useDocumentTitle('Interview Result')

  const load = () => {
    setRows(null); setError('')
    Promise.all([getInterviewResults(jobId), getJob(jobId).catch(() => null)])
      .then(([r, j]) => { setRows(Array.isArray(r) ? r : []); setJob(j) })
      .catch(() => setError('We could not load the candidates for this job.'))
  }
  useEffect(load, [jobId]) // eslint-disable-line react-hooks/exhaustive-deps

  const shortJob = ['ONE_DAY', 'FEW_DAYS', 'FEW_WEEKS'].includes(job?.engagementModel)
  /* Timings live on `dayTimes` when the job varies by weekday, and on `shifts`
     otherwise — a one-day job only ever has the latter. */
  const slot = (job?.dayTimes || [])[0] || (job?.shifts || [])[0]
  const jobTime = timeRange(slot?.startTime, slot?.endTime)

  const counts = useMemo(() => {
    const c = {}
    for (const r of rows || []) c[r.result] = (c[r.result] || 0) + 1
    return c
  }, [rows])

  const shown = (rows || []).filter((r) => tab === 'ALL' || r.result === tab)

  const mark = async (row, result) => {
    setBusy(row.applicationId)
    const before = rows
    setRows((l) => l.map((r) => (r.applicationId === row.applicationId ? { ...r, result } : r)))
    try {
      await setInterviewResult(row.applicationId, result)
    } catch {
      setRows(before)
      setError('We could not save that result. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const title = shortJob && job
    ? `${job.title} (${job.engagementModel === 'ONE_DAY' ? '1 Day' : 'Short job'})`
    : 'Interview Result'

  const head = shortJob
    ? ['Candidate', 'Work Date', 'Working Time', 'Status', 'Result', 'Action']
    : ['Candidate', 'Interview Date', 'Type', 'Status', 'Result', 'Feedback', 'Action']

  return (
    <>
      <Link className="wk-link" to={`/employer/jobs/${jobId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
        <Icon name="chevronLeft" size={15} /> Back to job
      </Link>

      <WhenBanner id="interview-results">
        {shortJob
          ? 'After you talk to the applicants for a short job, you land here to mark who you want and move straight to a work confirmation.'
          : 'After interviews are held, you come here to record each candidate’s result and move the selected ones on to an offer.'}
      </WhenBanner>

      <PageHead title={title} sub={job ? job.businessName || 'Candidates and their results' : 'Candidates and their results'}>
        <div className="wk-row" style={{ gap: 8 }}>
          {!shortJob && (
            <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/employer/interviews/schedule?jobId=${jobId}`}>
              <Icon name="calendar" size={14} /> Add Interview
            </Link>
          )}
          <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={() => window.print()}>
            <Icon name="doc" size={14} /> Download Report
          </button>
        </div>
      </PageHead>

      <ErrorNote onRetry={load}>{error}</ErrorNote>

      <div style={{ margin: '4px 0 16px' }}>
        <PillTabs
          tabs={TABS.map((t) => ({
            ...t,
            label: t.value === 'ALL'
              ? `All (${rows?.length ?? 0})`
              : `${t.label} (${counts[t.value] || 0})`,
          }))}
          value={tab}
          onChange={setTab}
        />
      </div>

      {!rows && !error ? <Loading rows={3} /> : (
        <div className="wk-card pad-lg">
          <DataTable head={head} empty={tab === 'ALL' ? 'No candidates for this job yet.' : `No candidates marked ${RESULT_LABEL[tab] || tab}.`}>
            {shown.map((r) => (
              <tr key={r.applicationId}>
                <td>
                  <div className="emp-app-row">
                    <Avatar name={r.name || '?'} size={36} />
                    <div className="meta">
                      <div className="nm">{r.name}</div>
                      <div className="sb">
                        {[r.rating ? `${Number(r.rating).toFixed(1)} ★` : null, km(r.distanceKm)].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>
                </td>

                {shortJob ? (
                  <>
                    <td className="num">{formatDate(job?.workDate || job?.startDate) || '—'}</td>
                    <td className="num">{jobTime || '—'}</td>
                  </>
                ) : (
                  <>
                    <td className="num">{r.interviewAt ? formatDate(r.interviewAt, true) : 'Not scheduled'}</td>
                    <td>{r.interviewMode ? r.interviewMode.replace(/_/g, ' ').toLowerCase() : '—'}</td>
                  </>
                )}

                <td>
                  <span className={`wk-badge ${r.status === 'ACCEPTED' ? 'accepted' : 'viewed'}`}>
                    {r.status ? r.status.replace(/_/g, ' ').toLowerCase() : '—'}
                  </span>
                </td>

                <td>
                  <select
                    className="wk-select"
                    style={{ minWidth: 140, padding: '6px 9px', fontSize: 13 }}
                    value={r.result || ''}
                    disabled={busy === r.applicationId}
                    onChange={(e) => mark(r, e.target.value)}
                  >
                    <option value="" disabled>Set result…</option>
                    {RESULTS.map((v) => <option key={v} value={v}>{RESULT_LABEL[v]}</option>)}
                  </select>
                </td>

                {!shortJob && (
                  <td style={{ maxWidth: 220, whiteSpace: 'normal' }}>
                    {r.feedback || <span style={{ color: 'var(--muted)' }}>No feedback</span>}
                  </td>
                )}

                <td>
                  <div className="acts">
                    <Link className="mk-btn mk-btn-ghost mk-btn-sm" to={`/employer/workers/${r.workerId}?jobId=${jobId}`}>
                      View
                    </Link>
                    {r.result !== 'REJECTED' && (
                      <button
                        className="mk-btn mk-btn-primary mk-btn-sm"
                        onClick={() => navigate(`/employer/applications/${r.applicationId}/offer`)}
                      >
                        {shortJob ? 'Confirm Work' : 'Create Offer'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}
    </>
  )
}
