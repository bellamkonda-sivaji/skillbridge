import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDocumentTitle } from '../../marketing/components'
import { Avatar } from '../../marketing/components'
import { getJobDetail, pay, formatDate, num, money, OUTCOME_LABEL, OUTCOME_TONE } from '../api'
import { useResource } from '../hooks'
import {
  DataTable, PageHead, ErrorNote, Card, Badge, StatGrid, StatTile, Phone, Empty,
} from '../components'
import { Count } from './Jobs'

const Row = ({ k, v }) => (
  <div className="r"><span className="k">{k}</span><span className="v">{v == null || v === '' ? '—' : v}</span></div>
)

/**
 * One job, end to end: who posted it, who applied, who has been contacted and
 * what came of it. Every applicant row links into the full tracking history.
 */
export default function JobDetail() {
  const { jobId } = useParams()
  const { data, error, loading, reload } = useResource(() => getJobDetail(jobId), [jobId])
  useDocumentTitle(data?.job?.title || 'Job')

  if (error && !data) return <ErrorNote onRetry={reload}>{error}</ErrorNote>
  if (loading && !data) return <div className="wk-card pad-lg"><div className="ad-skel" style={{ height: 180 }} /></div>

  const job = data?.job || {}
  const emp = data?.employer || {}
  const st = data?.stats || {}
  const notes = data?.notes || {}
  const applicants = data?.applicants || []

  return (
    <>
      <PageHead
        title={job.title || 'Job'}
        sub={`${emp.businessName || ''}${job.location ? ` · ${job.location}` : ''}`}
        back={{ to: '/admin/jobs', label: 'Back to jobs' }}
      >
        <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/admin/companies/${emp.id}`}>View company</Link>
      </PageHead>

      <ErrorNote onRetry={reload}>{error}</ErrorNote>

      <StatGrid>
        <StatTile icon="users" tone="blue" label="Applicants" value={st.applicantCount} />
        <StatTile icon="phone" tone="green" label="Contacted" value={st.contactedCount}
          sub={`${num(notes.responded || 0)} responded`} />
        <StatTile icon="clock" tone="rose" label="Not contacted yet" value={st.notContactedCount}
          sub={notes.awaitingResponse ? `${num(notes.awaitingResponse)} awaiting reply` : undefined} />
        <StatTile icon="star" tone="amber" label="Shortlisted" value={st.shortlistedCount} />
        <StatTile icon="calendar" tone="violet" label="Interviewed" value={st.interviewedCount} />
        <StatTile icon="checkCircle" tone="green" label="Hired" value={st.hiredCount}
          sub={st.offeredCount ? `${num(st.offeredCount)} offered` : undefined} />
      </StatGrid>

      <div className="ad-side">
        <Card title={`Applicants (${applicants.length})`}>
          <DataTable
            cols={['Worker', 'Phone', 'Applied', 'Status', 'Last contact', 'Interview', 'Offer', 'Paid', '']}
            empty="Nobody has applied to this job yet."
          >
            {applicants.map((a) => (
              <tr key={a.applicationId}>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={a.name || '?'} size={32} />
                    <span>
                      <Link className="nm wk-link" to={`/admin/applications/${a.applicationId}`}>{a.name}</Link>
                      <span className="sb" style={{ display: 'block' }}>
                        {[a.rating ? `${Number(a.rating).toFixed(1)}★` : null,
                          a.distanceKm != null ? `${Number(a.distanceKm).toFixed(1)} km` : null,
                          a.matchScore != null ? `${Math.round(a.matchScore)}% match` : null]
                          .filter(Boolean).join(' · ')}
                      </span>
                    </span>
                  </span>
                </td>
                <td><Phone number={a.phone} /></td>
                <td className="num">{formatDate(a.appliedAt)}</td>
                <td><Badge tone="viewed">{String(a.status || '').replace(/_/g, ' ').toLowerCase()}</Badge></td>
                <td>
                  {a.lastContactAt ? (
                    <>
                      <Badge tone={OUTCOME_TONE[a.lastContactOutcome] || 'viewed'}>
                        {OUTCOME_LABEL[a.lastContactOutcome] || a.lastContactOutcome}
                      </Badge>
                      <div className="sb">{formatDate(a.lastContactAt, true)} · {num(a.contactCount)}×</div>
                    </>
                  ) : <span className="ad-warn">Not contacted</span>}
                </td>
                <td className="num">{a.interviewAt ? formatDate(a.interviewAt, true) : '—'}</td>
                <td>{a.offerStatus ? <Badge tone="offered">{a.offerStatus.toLowerCase()}</Badge> : '—'}</td>
                <td>{a.paid ? <span className="ad-ok">Paid</span> : a.hired ? <span className="ad-warn">Unpaid</span> : '—'}</td>
                <td>
                  <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/admin/applications/${a.applicationId}`}>
                    History
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>

        <div style={{ display: 'grid', gap: 14 }}>
          <Card title="Job details">
            <div className="ad-kv">
              <Row k="Status" v={<Badge tone="viewed">{job.status}</Badge>} />
              <Row k="Duration" v={job.engagementModel} />
              <Row k="Work pattern" v={job.workPattern} />
              <Row k="Pay" v={job.salary != null ? pay(job.salary, job.salaryUnit) : null} />
              <Row k="Vacancies" v={job.vacancies} />
              <Row k="Posted" v={formatDate(job.postedAt, true)} />
              <Row k="Work date" v={job.workDate ? formatDate(job.workDate) : null} />
              <Row k="Start / end" v={[job.startDate, job.endDate].filter(Boolean).map((d) => formatDate(d)).join(' – ') || null} />
              <Row k="Hiring method" v={job.hiringMethod} />
              <Row k="Location" v={job.location} />
            </div>
          </Card>

          <Card title="Posted by">
            <div className="ad-kv">
              <Row k="Company" v={<Link className="wk-link" to={`/admin/companies/${emp.id}`}>{emp.businessName}</Link>} />
              <Row k="Contact" v={emp.contactName} />
              <Row k="Phone" v={<Phone number={emp.phone} />} />
              <Row k="Email" v={emp.email} />
              <Row k="Verified" v={emp.verified ? <span className="ad-ok">Verified</span> : <span className="ad-warn">Not verified</span>} />
            </div>
          </Card>

          <Card title="Outreach">
            <div className="ad-kv">
              <Row k="Contacted" v={<Count n={notes.contacted} />} />
              <Row k="Not contacted" v={<Count n={notes.notContacted} warnWhenPositive />} />
              <Row k="Responded" v={<Count n={notes.responded} />} />
              <Row k="Awaiting response" v={<Count n={notes.awaitingResponse} warnWhenPositive />} />
            </div>
            <p className="wk-sub">
              Log a call from any applicant’s history screen — the counts here follow from those logs.
            </p>
          </Card>
        </div>
      </div>
    </>
  )
}
