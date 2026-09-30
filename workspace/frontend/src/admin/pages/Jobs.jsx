import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDocumentTitle } from '../../marketing/components'
import { listJobs, pay, formatDate, num } from '../api'
import { usePagedList } from '../hooks'
import { DataTable, Pager, Filters, Select, PageHead, ErrorNote, Badge } from '../components'

const STATUSES = ['OPEN', 'ACTIVE', 'PAUSED', 'FILLED', 'CLOSED', 'DRAFT', 'CANCELLED']
const MODELS = [
  { value: 'ONE_DAY', label: 'One day' },
  { value: 'FEW_DAYS', label: 'A few days' },
  { value: 'FEW_WEEKS', label: 'A few weeks' },
  { value: 'MONTHS', label: 'Months' },
  { value: 'PERMANENT', label: 'Permanent' },
]
const STATUS_TONE = {
  OPEN: 'shortlisted', ACTIVE: 'shortlisted', PAUSED: 'pending', FILLED: 'accepted',
  CLOSED: 'withdrawn', DRAFT: 'withdrawn', CANCELLED: 'rejected',
}

/** A count that means "someone still has to do something" reads red. */
export function Count({ n, warnWhenPositive }) {
  const v = Number(n) || 0
  if (!v) return <span className="ad-zero">0</span>
  return <span className={warnWhenPositive ? 'ad-warn' : ''}>{num(v)}</span>
}

export default function Jobs() {
  useDocumentTitle('Jobs')
  const [params] = useSearchParams()
  const list = usePagedList(listJobs, {
    status: params.get('status') || '',
    engagementModel: '',
    employerId: params.get('employerId') || '',
  })

  return (
    <>
      <PageHead title="Jobs" sub="Every job posted on the platform, and how far each one has got" />

      <Filters q={list.filters.q} onQ={(v) => list.setFilter('q', v)} placeholder="Job title or company…" onReset={list.reset}>
        <Select value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={STATUSES} all="All statuses" ariaLabel="Status" />
        <Select value={list.filters.engagementModel} onChange={(v) => list.setFilter('engagementModel', v)} options={MODELS} all="Any duration" ariaLabel="Duration" />
      </Filters>

      <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>

      <div className="wk-card pad-lg">
        <DataTable
          loading={list.loading}
          cols={['Job', 'Company', 'Duration', 'Pay', 'Status', 'Applicants', 'Contacted', 'Not contacted', 'Interviewed', 'Hired', '']}
          empty="No jobs match these filters."
        >
          {list.rows.map((j) => (
            <tr key={j.id}>
              <td>
                <Link className="nm wk-link" to={`/admin/jobs/${j.id}`}>{j.title}</Link>
                <div className="sb">{j.location} · posted {formatDate(j.postedAt)}</div>
              </td>
              <td>
                <Link className="wk-link" to={`/admin/companies/${j.employerId}`}>{j.businessName}</Link>
              </td>
              <td>{(MODELS.find((m) => m.value === j.engagementModel) || {}).label || j.engagementModel || '—'}</td>
              <td className="num">{j.salary != null ? pay(j.salary, j.salaryUnit) : '—'}</td>
              <td><Badge tone={STATUS_TONE[j.status] || 'viewed'}>{j.status}</Badge></td>
              <td className="num">{num(j.applicantCount)}</td>
              <td className="num"><Count n={j.contactedCount} /></td>
              <td className="num"><Count n={j.notContactedCount} warnWhenPositive /></td>
              <td className="num">{num(j.interviewedCount)}</td>
              <td className="num">{num(j.hiredCount)}</td>
              <td>
                <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/admin/jobs/${j.id}`}>Open</Link>
              </td>
            </tr>
          ))}
        </DataTable>

        <Pager {...list.meta} onPage={list.setPage} />
      </div>
    </>
  )
}
