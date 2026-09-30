import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Avatar, useDocumentTitle } from '../../marketing/components'
import { listApplications, formatDate, num, OUTCOME_LABEL, OUTCOME_TONE } from '../api'
import { usePagedList } from '../hooks'
import { DataTable, Pager, Filters, Select, PageHead, ErrorNote, Badge, Phone } from '../components'

const STATUSES = ['APPLIED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN']
const CONTACTED = [{ value: 'true', label: 'Contacted' }, { value: 'false', label: 'Not contacted' }]

export default function Applications() {
  useDocumentTitle('Applications')
  const [params] = useSearchParams()
  const list = usePagedList(listApplications, {
    status: params.get('status') || '',
    contacted: params.get('contacted') || '',
    jobId: params.get('jobId') || '',
    employerId: params.get('employerId') || '',
  })

  return (
    <>
      <PageHead title="Applications" sub="Who applied for what, and whether anyone has followed up" />

      <Filters q={list.filters.q} onQ={(v) => list.setFilter('q', v)} placeholder="Worker, job or company…" onReset={list.reset}>
        <Select value={list.filters.status} onChange={(v) => list.setFilter('status', v)}
          options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ').toLowerCase() }))}
          all="Any status" ariaLabel="Status" />
        <Select value={list.filters.contacted} onChange={(v) => list.setFilter('contacted', v)}
          options={CONTACTED} all="Contacted or not" ariaLabel="Contacted" />
      </Filters>

      <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>

      <div className="wk-card pad-lg">
        <DataTable
          loading={list.loading}
          cols={['Worker', 'Phone', 'Job', 'Company', 'Applied', 'Status', 'Contact', '']}
          empty="No applications match these filters."
        >
          {list.rows.map((a) => (
            <tr key={a.applicationId}>
              <td>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={a.name || a.workerName || '?'} size={32} />
                  <Link className="nm wk-link" to={`/admin/applications/${a.applicationId}`}>
                    {a.name || a.workerName}
                  </Link>
                </span>
              </td>
              <td><Phone number={a.phone || a.workerPhone} /></td>
              <td><Link className="wk-link" to={`/admin/jobs/${a.jobId}`}>{a.jobTitle}</Link></td>
              <td><Link className="wk-link" to={`/admin/companies/${a.employerId}`}>{a.businessName}</Link></td>
              <td className="num">{formatDate(a.appliedAt)}</td>
              <td><Badge tone="viewed">{String(a.status || '').replace(/_/g, ' ').toLowerCase()}</Badge></td>
              <td>
                {a.lastContactAt ? (
                  <>
                    <Badge tone={OUTCOME_TONE[a.lastContactOutcome] || 'viewed'}>
                      {OUTCOME_LABEL[a.lastContactOutcome] || a.lastContactOutcome}
                    </Badge>
                    <div className="sb">{num(a.contactCount)}× · {formatDate(a.lastContactAt)}</div>
                  </>
                ) : <span className="ad-warn">Not contacted</span>}
              </td>
              <td>
                <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/admin/applications/${a.applicationId}`}>History</Link>
              </td>
            </tr>
          ))}
        </DataTable>
        <Pager {...list.meta} onPage={list.setPage} />
      </div>
    </>
  )
}
