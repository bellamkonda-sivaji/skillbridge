import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../../marketing/components'
import { listInterviews, getInterviewCalendar, formatDate, isoDaysAgo, todayIso, num } from '../api'
import { usePagedList, useResource } from '../hooks'
import {
  DataTable, Pager, Filters, Select, PageHead, ErrorNote, Badge, Phone, Card, Empty,
} from '../components'

const STATUSES = ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
const TONE = { COMPLETED: 'accepted', CONFIRMED: 'shortlisted', SCHEDULED: 'interview', CANCELLED: 'rejected', NO_SHOW: 'rejected' }

export default function Interviews() {
  useDocumentTitle('Interviews')
  const [view, setView] = useState('list')
  const [range] = useState({ from: isoDaysAgo(30), to: isoDaysAgo(-30) })
  const list = usePagedList(listInterviews, { status: '', from: '', to: '' })
  const cal = useResource(() => getInterviewCalendar(range.from, range.to), [range.from, range.to])

  return (
    <>
      <PageHead title="Interviews" sub="When each interview is, who is being seen and by whom">
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={`mk-btn mk-btn-sm ${view === 'list' ? 'mk-btn-primary' : 'mk-btn-outline'}`} onClick={() => setView('list')}>List</button>
          <button className={`mk-btn mk-btn-sm ${view === 'calendar' ? 'mk-btn-primary' : 'mk-btn-outline'}`} onClick={() => setView('calendar')}>Calendar</button>
        </div>
      </PageHead>

      {view === 'list' ? (
        <>
          <Filters q={list.filters.q} onQ={(v) => list.setFilter('q', v)} placeholder="Worker, job or company…" onReset={list.reset}>
            <Select value={list.filters.status} onChange={(v) => list.setFilter('status', v)}
              options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ').toLowerCase() }))}
              all="Any status" ariaLabel="Status" />
            <input className="ad-select" type="date" value={list.filters.from || ''} onChange={(e) => list.setFilter('from', e.target.value)} aria-label="From" />
            <input className="ad-select" type="date" value={list.filters.to || ''} onChange={(e) => list.setFilter('to', e.target.value)} aria-label="To" />
          </Filters>

          <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>

          <div className="wk-card pad-lg">
            <DataTable
              loading={list.loading}
              cols={['When', 'Worker', 'Phone', 'Job', 'Company', 'Mode', 'Interviewer', 'Status', 'Result', '']}
              empty="No interviews match these filters."
            >
              {list.rows.map((i) => (
                <tr key={i.id}>
                  <td className="num">
                    <span className="nm">{formatDate(i.scheduledAt)}</span>
                    <div className="sb">{new Date(i.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="nm">{i.workerName}</td>
                  <td><Phone number={i.workerPhone} /></td>
                  <td><Link className="wk-link" to={`/admin/jobs/${i.jobId}`}>{i.jobTitle}</Link></td>
                  <td><Link className="wk-link" to={`/admin/companies/${i.employerId}`}>{i.businessName}</Link></td>
                  <td>
                    {String(i.mode || '').replace(/_/g, ' ').toLowerCase()}
                    {i.location && <div className="sb">{i.location}</div>}
                  </td>
                  <td>
                    {i.interviewerName || '—'}
                    {i.interviewerPhone && <div className="sb">{i.interviewerPhone}</div>}
                  </td>
                  <td><Badge tone={TONE[i.status] || 'viewed'}>{String(i.status || '').replace(/_/g, ' ').toLowerCase()}</Badge></td>
                  <td>
                    {i.result ? <Badge tone="shortlisted">{String(i.result).replace(/_/g, ' ').toLowerCase()}</Badge> : '—'}
                    {i.feedback && <div className="sb" style={{ whiteSpace: 'normal', maxWidth: 200 }}>{i.feedback}</div>}
                  </td>
                  <td>
                    {i.applicationId && (
                      <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/admin/applications/${i.applicationId}`}>History</Link>
                    )}
                  </td>
                </tr>
              ))}
            </DataTable>
            <Pager {...list.meta} onPage={list.setPage} />
          </div>
        </>
      ) : (
        <Card title="Interview calendar" extra={<span className="wk-sub" style={{ marginTop: 0 }}>{range.from} → {range.to}</span>}>
          <ErrorNote onRetry={cal.reload}>{cal.error}</ErrorNote>
          {cal.loading ? <div className="ad-skel" style={{ height: 200 }} />
            : cal.data?.length ? (
              <div style={{ display: 'grid', gap: 14 }}>
                {cal.data.map((day) => (
                  <div key={day.date}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                      <strong style={{ fontSize: 14, color: 'var(--ink)' }}>{formatDate(day.date)}</strong>
                      <span className="wk-sub" style={{ marginTop: 0 }}>{num(day.count)} interview{day.count === 1 ? '' : 's'}</span>
                    </div>
                    <div style={{ display: 'grid', gap: 7 }}>
                      {(day.items || []).map((i) => (
                        <Link
                          key={i.id}
                          className="ad-task-item"
                          style={{ border: '1px solid var(--line)', borderRadius: 10 }}
                          to={i.applicationId ? `/admin/applications/${i.applicationId}` : `/admin/jobs/${i.jobId}`}
                        >
                          <span className="num" style={{ fontWeight: 700, minWidth: 64 }}>
                            {new Date(i.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="grow">
                            <span className="p">{i.workerName}</span>
                            <span className="s" style={{ display: 'block' }}>{i.jobTitle} · {i.businessName}</span>
                          </span>
                          <Badge tone={TONE[i.status] || 'viewed'}>{String(i.status || '').toLowerCase()}</Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : <Empty icon="calendar" title="Nothing scheduled" text="Interviews booked by employers will appear here." />}
        </Card>
      )}
    </>
  )
}
