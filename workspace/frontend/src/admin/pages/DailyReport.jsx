import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { getDailyReport, money, num, formatDate, todayIso } from '../api'
import { useResource } from '../hooks'
import {
  PageHead, ErrorNote, Card, StatGrid, StatTile, DataTable, Badge, SeverityBadge, Empty,
} from '../components'

/** "APPLICATION:12" from the server becomes a route the admin can click. */
function linkFor(link) {
  if (!link || typeof link !== 'string') return null
  const [kind, id] = link.split(':')
  if (!id) return null
  const map = {
    APPLICATION: `/admin/applications/${id}`,
    JOB: `/admin/jobs/${id}`,
    EMPLOYER: `/admin/companies/${id}`,
    COMPANY: `/admin/companies/${id}`,
    INTERVIEW: '/admin/interviews',
    WORKER: '/admin/skills',
  }
  return map[kind] || null
}

export default function DailyReport() {
  useDocumentTitle('Daily report')
  const [date, setDate] = useState(todayIso())
  const { data, error, loading, reload } = useResource(() => getDailyReport(date), [date])

  const d = data || {}
  const c = d.counts || {}

  return (
    <>
      <PageHead title="Daily Report" sub="What happened, and what still needs doing">
        <input
          className="ad-select"
          type="date"
          value={date}
          max={todayIso()}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Report date"
        />
      </PageHead>

      <ErrorNote onRetry={reload}>{error}</ErrorNote>

      <StatGrid>
        <StatTile icon="briefcase" tone="amber" label="New jobs" value={c.newJobs} />
        <StatTile icon="doc" tone="blue" label="New applications" value={c.newApplications} />
        <StatTile icon="users" tone="slate" label="New workers" value={c.newWorkers} />
        <StatTile icon="store" tone="violet" label="New companies" value={c.newEmployers} />
        <StatTile icon="calendar" tone="blue" label="Interviews held" value={c.interviewsHeld}
          sub={`${num(c.interviewsScheduled || 0)} scheduled`} />
        <StatTile icon="checkCircle" tone="green" label="Hires" value={c.hires}
          sub={`${num(c.offersSent || 0)} offers sent`} />
        <StatTile icon="phone" tone="green" label="Contacts logged" value={c.contactsLogged} />
        <StatTile icon="wallet" tone="green" label="Released" value={money(c.amountReleased)}
          sub={`${num(c.paymentsReleased || 0)} payments`} />
      </StatGrid>

      <Card title="Tasks" extra={<span className="wk-sub" style={{ marginTop: 0 }}>Things waiting on someone</span>}>
        {loading ? <div className="ad-skel" style={{ height: 120 }} />
          : d.tasks?.length ? (
            <div>
              {d.tasks.map((t) => <Task key={t.type} task={t} />)}
            </div>
          ) : <Empty icon="checkCircle" title="Nothing outstanding" text="Every applicant has been contacted and no approvals are waiting." />}
      </Card>

      <div className="ad-two" style={{ marginTop: 14 }}>
        <Card title="Interviews on this day">
          <DataTable cols={['Time', 'Worker', 'Job', 'Company', 'Status']} empty="No interviews on this day.">
            {(d.interviewsToday || []).map((i) => (
              <tr key={i.id}>
                <td className="num">{i.scheduledAt ? new Date(i.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td className="nm">{i.workerName}</td>
                <td>{i.jobTitle}</td>
                <td>{i.businessName}</td>
                <td><Badge tone="viewed">{String(i.status || '').toLowerCase()}</Badge></td>
              </tr>
            ))}
          </DataTable>
        </Card>

        <Card title="Attendance on this day">
          <DataTable cols={['Worker', 'Company', 'Status', 'In', 'Out', 'Approved']} empty="No attendance recorded.">
            {(d.attendanceToday || []).map((a, i) => (
              <tr key={`${a.employmentId}-${i}`}>
                <td className="nm">{a.workerName}</td>
                <td>{a.businessName}</td>
                <td><Badge tone={a.status === 'PRESENT' ? 'accepted' : a.status === 'ABSENT' ? 'rejected' : 'pending'}>{String(a.status || '').toLowerCase()}</Badge></td>
                <td className="num">{a.checkIn || '—'}</td>
                <td className="num">{a.checkOut || '—'}</td>
                <td>{a.approved ? <span className="ad-ok">Yes</span> : <span className="ad-warn">Pending</span>}</td>
              </tr>
            ))}
          </DataTable>
        </Card>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card title="Admin activity" extra={<Link className="wk-link" to="/admin/audit">Full audit log</Link>}>
          <DataTable cols={['When', 'Admin', 'Action', 'On']} empty="No admin actions on this day.">
            {(d.adminActivity || []).map((a, i) => (
              <tr key={i}>
                <td className="num">{formatDate(a.at, true)}</td>
                <td className="nm">{a.adminName}</td>
                <td>{a.action}</td>
                <td>{a.entityType ? `${a.entityType} #${a.entityId}` : '—'}</td>
              </tr>
            ))}
          </DataTable>
        </Card>
      </div>
    </>
  )
}

function Task({ task }) {
  const [open, setOpen] = useState(task.severity === 'HIGH')
  return (
    <div className="ad-task">
      <button className="ad-task-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Icon name={open ? 'chevronDown' : 'chevronRight'} size={15} />
        <span className="t">{task.label}</span>
        <SeverityBadge severity={task.severity} />
        <span className="n">{num(task.count)}</span>
      </button>
      {open && (
        <div className="ad-task-body">
          {(task.items || []).length ? task.items.map((it, i) => {
            const to = linkFor(it.link)
            const body = (
              <>
                <span className="grow">
                  <span className="p">{it.primary}</span>
                  {it.secondary && <span className="s" style={{ display: 'block' }}>{it.secondary}</span>}
                </span>
                {it.at && <span className="s">{formatDate(it.at, true)}</span>}
                {to && <Icon name="chevronRight" size={14} />}
              </>
            )
            return to
              ? <Link className="ad-task-item" key={`${it.id}-${i}`} to={to}>{body}</Link>
              : <div className="ad-task-item" key={`${it.id}-${i}`}>{body}</div>
          }) : (
            <div className="ad-task-item"><span className="s">Nothing in this group.</span></div>
          )}
        </div>
      )}
    </div>
  )
}
