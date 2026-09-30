import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDocumentTitle } from '../../marketing/components'
import { listCompanies, getCompany, money, num, formatDate, pay } from '../api'
import { usePagedList, useResource } from '../hooks'
import {
  DataTable, Pager, Filters, Select, PageHead, ErrorNote, Badge, Phone, Card, StatGrid, StatTile,
} from '../components'

const VERIFIED = [{ value: 'true', label: 'Verified' }, { value: 'false', label: 'Not verified' }]

const Row = ({ k, v }) => (
  <div className="r"><span className="k">{k}</span><span className="v">{v == null || v === '' ? '—' : v}</span></div>
)

export default function Companies() {
  useDocumentTitle('Companies')
  const list = usePagedList(listCompanies, { verified: '' })

  return (
    <>
      <PageHead title="Companies" sub="Every business registered on JobOn" />

      <Filters q={list.filters.q} onQ={(v) => list.setFilter('q', v)} placeholder="Company, contact or city…" onReset={list.reset}>
        <Select value={list.filters.verified} onChange={(v) => list.setFilter('verified', v)} options={VERIFIED} all="All" ariaLabel="Verified" />
      </Filters>

      <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>

      <div className="wk-card pad-lg">
        <DataTable
          loading={list.loading}
          cols={['Company', 'Contact', 'Phone', 'City', 'Registered', 'Jobs', 'Open', 'Applicants', 'Hired', 'Spend', '']}
          empty="No companies match these filters."
        >
          {list.rows.map((c) => (
            <tr key={c.employerId}>
              <td>
                <Link className="nm wk-link" to={`/admin/companies/${c.employerId}`}>{c.businessName}</Link>
                <div className="sb">
                  {c.businessType}{c.verified ? ' · ' : ''}
                  {c.verified && <span className="ad-ok">Verified</span>}
                </div>
              </td>
              <td>{c.contactName || '—'}</td>
              <td><Phone number={c.phone} /></td>
              <td>{[c.area, c.city].filter(Boolean).join(', ') || '—'}</td>
              <td className="num">{formatDate(c.registeredAt)}</td>
              <td className="num">{num(c.jobCount)}</td>
              <td className="num">{num(c.openJobCount)}</td>
              <td className="num">{num(c.applicantCount)}</td>
              <td className="num">{num(c.hiredCount)}</td>
              <td className="num">{money(c.totalSpend)}</td>
              <td><Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/admin/companies/${c.employerId}`}>Open</Link></td>
            </tr>
          ))}
        </DataTable>
        <Pager {...list.meta} onPage={list.setPage} />
      </div>
    </>
  )
}

/** One company: their jobs, who applied, interviews held and money moved. */
export function CompanyDetail() {
  const { employerId } = useParams()
  const { data, error, loading, reload } = useResource(() => getCompany(employerId), [employerId])
  useDocumentTitle(data?.businessName || 'Company')

  if (error && !data) return <ErrorNote onRetry={reload}>{error}</ErrorNote>
  if (loading && !data) return <div className="wk-card pad-lg"><div className="ad-skel" style={{ height: 180 }} /></div>

  const c = data || {}
  return (
    <>
      <PageHead
        title={c.businessName || 'Company'}
        sub={[c.businessType, [c.area, c.city].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
        back={{ to: '/admin/companies', label: 'Back to companies' }}
      />

      <ErrorNote onRetry={reload}>{error}</ErrorNote>

      <StatGrid>
        <StatTile icon="briefcase" tone="blue" label="Jobs posted" value={c.jobCount} sub={`${num(c.openJobCount || 0)} still open`} />
        <StatTile icon="users" tone="slate" label="Applicants" value={c.applicantCount} />
        <StatTile icon="calendar" tone="violet" label="Interviews" value={c.interviewCount} />
        <StatTile icon="checkCircle" tone="green" label="Hired" value={c.hiredCount} />
        <StatTile icon="wallet" tone="green" label="Total spend" value={money(c.totalSpend)} />
        <StatTile icon="rupee" tone="amber" label="Platform fees" value={money(c.platformFeesPaid)} />
      </StatGrid>

      <div className="ad-side">
        <div style={{ display: 'grid', gap: 14 }}>
          <Card title={`Jobs (${(c.jobs || []).length})`}>
            <DataTable cols={['Job', 'Status', 'Pay', 'Applicants', 'Not contacted', 'Hired', '']} empty="This company has not posted a job yet.">
              {(c.jobs || []).map((j) => (
                <tr key={j.id}>
                  <td>
                    <Link className="nm wk-link" to={`/admin/jobs/${j.id}`}>{j.title}</Link>
                    <div className="sb">{formatDate(j.postedAt)}</div>
                  </td>
                  <td><Badge tone="viewed">{j.status}</Badge></td>
                  <td className="num">{j.salary != null ? pay(j.salary, j.salaryUnit) : '—'}</td>
                  <td className="num">{num(j.applicantCount)}</td>
                  <td className="num">{j.notContactedCount ? <span className="ad-warn">{num(j.notContactedCount)}</span> : <span className="ad-zero">0</span>}</td>
                  <td className="num">{num(j.hiredCount)}</td>
                  <td><Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/admin/jobs/${j.id}`}>Open</Link></td>
                </tr>
              ))}
            </DataTable>
          </Card>

          <Card title="Recent applications">
            <DataTable cols={['Worker', 'Job', 'Applied', 'Status', '']} empty="No applications yet.">
              {(c.recentApplications || []).map((a) => (
                <tr key={a.applicationId}>
                  <td className="nm">{a.name || a.workerName}</td>
                  <td>{a.jobTitle}</td>
                  <td className="num">{formatDate(a.appliedAt)}</td>
                  <td><Badge tone="viewed">{String(a.status || '').replace(/_/g, ' ').toLowerCase()}</Badge></td>
                  <td><Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/admin/applications/${a.applicationId}`}>History</Link></td>
                </tr>
              ))}
            </DataTable>
          </Card>

          <Card title="Interviews">
            <DataTable cols={['When', 'Worker', 'Job', 'Mode', 'Status']} empty="No interviews scheduled.">
              {(c.interviews || []).map((i) => (
                <tr key={i.id}>
                  <td className="num">{formatDate(i.scheduledAt, true)}</td>
                  <td className="nm">{i.workerName}</td>
                  <td>{i.jobTitle}</td>
                  <td>{String(i.mode || '').replace(/_/g, ' ').toLowerCase()}</td>
                  <td><Badge tone="viewed">{String(i.status || '').toLowerCase()}</Badge></td>
                </tr>
              ))}
            </DataTable>
          </Card>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <Card title="Company details">
            <div className="ad-kv">
              <Row k="Contact person" v={c.contactName} />
              <Row k="Phone" v={<Phone number={c.phone} />} />
              <Row k="Email" v={c.email} />
              <Row k="Business type" v={c.businessType} />
              <Row k="Location" v={[c.area, c.city].filter(Boolean).join(', ')} />
              <Row k="Plan" v={c.plan} />
              <Row k="Registered" v={formatDate(c.registeredAt, true)} />
              <Row k="Last job posted" v={c.lastJobPostedAt ? formatDate(c.lastJobPostedAt) : null} />
              <Row k="Verified" v={c.verified ? <span className="ad-ok">Verified</span> : <span className="ad-warn">Not verified</span>} />
            </div>
          </Card>

          <Card title="Payments">
            <DataTable compact cols={['When', 'Amount', 'Reference']} empty="No payments recorded.">
              {(c.payments || []).map((p) => (
                <tr key={p.id}>
                  <td className="num">{formatDate(p.at)}</td>
                  <td className="num">{money(p.amount)}</td>
                  <td>{p.reference || p.description || '—'}</td>
                </tr>
              ))}
            </DataTable>
          </Card>
        </div>
      </div>
    </>
  )
}
