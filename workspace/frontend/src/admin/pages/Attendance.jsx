import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { Avatar, useDocumentTitle } from '../../marketing/components'
import {
  listAttendance, attendanceSummary, listAttendanceRequests,
  approveAttendanceRequest, rejectAttendanceRequest, overrideAttendance,
  formatDate, num,
} from '../api'
import { usePagedList, useResource } from '../hooks'
import {
  PageHead, ErrorNote, Card, Badge, DataTable, Pager, Filters, Select,
  StatGrid, StatTile, Empty, Modal, Phone, usePermissions,
} from '../components'
import {
  minutesLabel, timeOnly, REQUEST_TYPE_LABEL, REQUEST_STATUS, APPROVAL, ATT_STATUS,
} from '../../worker/attendanceApi'
import '../../worker/pages/attendance.css'

const APPROVALS = [
  { value: 'PENDING', label: 'Waiting for the shop owner' },
  { value: 'APPROVED', label: 'Counted' },
  { value: 'AUTO_APPROVED', label: 'Counted automatically' },
  { value: 'REJECTED', label: 'Not counted' },
]
const REQ_STATUS = Object.entries(REQUEST_STATUS).map(([value, v]) => ({ value, label: v.label }))

/**
 * Attendance in the back office.
 *
 * Two jobs: see every day across every employer, and settle the corrections
 * workers have asked for when the shop owner does not answer. A decision made
 * here is the same decision the employer would have made, so it lands on the
 * worker's and the employer's screens immediately.
 */
export default function Attendance() {
  useDocumentTitle('Attendance')
  const [tab, setTab] = useState('requests')
  const summary = useResource(() => attendanceSummary({}), [])
  const s = summary.data || {}

  return (
    <>
      <PageHead title="Attendance" sub="Every day worked, and every correction asked for" />
      <ErrorNote onRetry={summary.reload}>{summary.error}</ErrorNote>

      <StatGrid>
        <StatTile icon="calendar" tone="blue" label="Days recorded" value={s.totalDays} />
        <StatTile icon="checkCircle" tone="green" label="Counted" value={s.approved} />
        <StatTile icon="clock" tone="amber" label="Waiting on employers" value={s.pendingApproval} />
        <StatTile icon="chat" tone="rose" label="Corrections open" value={s.openRequests} />
        <StatTile icon="close" tone="slate" label="Not counted" value={s.rejected} />
        <StatTile icon="wallet" tone="amber" label="Approved but unpaid" value={s.unpaidApprovedDays} />
      </StatGrid>

      <div className="ad-tabs" role="tablist">
        {[['requests', `Corrections${s.openRequests ? ` (${s.openRequests})` : ''}`], ['days', 'All days']].map(([v, label]) => (
          <button key={v} className="ad-tab" role="tab" aria-selected={tab === v} onClick={() => setTab(v)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'requests' ? <Requests onChanged={summary.reload} /> : <Days onChanged={summary.reload} />}
    </>
  )
}

/* ------------------------------------------------------------- corrections */

function Requests({ onChanged }) {
  const { can } = usePermissions()
  const list = usePagedList(listAttendanceRequests, { status: 'PENDING' })
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')

  const act = async (fn, id) => {
    setBusy(id); setError('')
    try { await fn(); list.reload(); onChanged?.() }
    catch (e) { setError(e?.response?.data?.message || 'That did not save.') }
    finally { setBusy(null) }
  }

  return (
    <>
      <Filters q={list.filters.q} onQ={(v) => list.setFilter('q', v)} placeholder="Worker, company or job…" onReset={list.reset}>
        <Select value={list.filters.status} onChange={(v) => list.setFilter('status', v)}
          options={REQ_STATUS} all="Any status" ariaLabel="Status" />
      </Filters>

      <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>
      {error && <div className="ad-error"><Icon name="shield" size={15} /><span>{error}</span></div>}

      {list.loading && !list.rows.length ? (
        <div className="wk-card pad-lg"><div className="ad-skel" style={{ height: 150 }} /></div>
      ) : list.rows.length ? (
        <div className="cq-list">
          {list.rows.map((r) => {
            const st = REQUEST_STATUS[r.status] || { label: r.status, tone: 'viewed' }
            const open = r.status === 'PENDING'
            return (
              <div className={`cq-row${open ? ' high' : ''}`} key={r.id}>
                <span className="cq-ic pending" aria-hidden="true"><Icon name="clock" size={17} /></span>
                <div className="cq-body">
                  <div className="cq-top">
                    <span className="who">{r.workerName}</span>
                    <Badge tone={st.tone}>{st.label}</Badge>
                    <span className="wk-sub" style={{ marginTop: 0 }}>{formatDate(r.workDate)}</span>
                  </div>
                  <div className="cq-why">“{REQUEST_TYPE_LABEL[r.type] || r.type}”</div>
                  {r.reason && <div className="cq-meta"><span>{r.reason}</span></div>}
                  <div className="cq-meta">
                    <Link className="wk-link" to={`/admin/jobs/${r.jobId}`}>{r.jobTitle}</Link>
                    <span>· {r.businessName}</span>
                    {(r.requestedCheckIn || r.requestedCheckOut) && (
                      <span>· says {r.requestedCheckIn || '—'} to {r.requestedCheckOut || '—'}</span>
                    )}
                  </div>
                  {r.decidedByName && (
                    <div className="cq-next">
                      {st.label} by {r.decidedByName} ({r.decidedByType?.toLowerCase()})
                      {r.decisionNote ? ` — ${r.decisionNote}` : ''}
                    </div>
                  )}
                  {open && (
                    <div className="cq-next">
                      The shop owner has not answered. You can settle it here.
                    </div>
                  )}
                </div>
                <div className="cq-acts">
                  {r.workerPhone && (
                    <a className="cq-call" href={`tel:+91${r.workerPhone}`}>
                      <Icon name="phone" size={18} /><span>{r.workerPhone}</span>
                    </a>
                  )}
                  {open && can('MANAGE_APPLICATIONS') && (
                    <>
                      <button className="at-ok" disabled={busy === r.id}
                        onClick={() => act(() => approveAttendanceRequest(r.id, {}), r.id)}>
                        <Icon name="check" size={15} /> Approve
                      </button>
                      <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={() => setEditing(r)}>
                        Set times
                      </button>
                      <button className="at-no" disabled={busy === r.id}
                        onClick={() => act(() => rejectAttendanceRequest(r.id, 'Not accepted'), r.id)}>
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="wk-card pad-lg">
          <Empty icon="checkCircle" title="No corrections waiting"
            text="When a worker says a day is wrong and the employer has not answered, it lands here." />
        </div>
      )}

      <Pager {...list.meta} onPage={list.setPage} />

      {editing && (
        <SetTimes request={editing} onClose={() => setEditing(null)}
          onSave={(body) => { act(() => approveAttendanceRequest(editing.id, body), editing.id); setEditing(null) }} />
      )}
    </>
  )
}

function SetTimes({ request, onClose, onSave }) {
  const [inT, setIn] = useState(request.requestedCheckIn || '09:00')
  const [outT, setOut] = useState(request.requestedCheckOut || '18:00')
  const [note, setNote] = useState('')
  return (
    <Modal title="Set the times and approve" onClose={onClose}>
      <p className="wk-sub" style={{ marginTop: 0 }}>
        {request.workerName} · {request.jobTitle} · {formatDate(request.workDate)}
      </p>
      <div className="wk-form">
        <label className="ad-field"><span>Started at</span>
          <input className="ad-input" type="time" value={inT} onChange={(e) => setIn(e.target.value)} /></label>
        <label className="ad-field"><span>Finished at</span>
          <input className="ad-input" type="time" value={outT} onChange={(e) => setOut(e.target.value)} /></label>
      </div>
      <label className="ad-field" style={{ marginTop: 14 }}>
        <span>Why are you settling this?</span>
        <input className="ad-input" placeholder="Rang the shop, they confirmed"
          value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <p className="wk-sub">
        This is recorded against your name and both sides will see the corrected day straight away.
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="mk-btn mk-btn-outline" onClick={onClose}>Cancel</button>
        <button className="mk-btn mk-btn-primary"
          onClick={() => onSave({ checkIn: inT, checkOut: outT, note: note || undefined })}>
          Approve
        </button>
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------- every day */

function Days({ onChanged }) {
  const { can } = usePermissions()
  const list = usePagedList(listAttendance, { approvalStatus: '', from: '', to: '' })
  const [editing, setEditing] = useState(null)

  return (
    <>
      <Filters q={list.filters.q} onQ={(v) => list.setFilter('q', v)} placeholder="Worker, company or job…" onReset={list.reset}>
        <Select value={list.filters.approvalStatus} onChange={(v) => list.setFilter('approvalStatus', v)}
          options={APPROVALS} all="Any" ariaLabel="Approval" />
        <input className="ad-select" type="date" value={list.filters.from || ''}
          onChange={(e) => list.setFilter('from', e.target.value)} aria-label="From" />
        <input className="ad-select" type="date" value={list.filters.to || ''}
          onChange={(e) => list.setFilter('to', e.target.value)} aria-label="To" />
      </Filters>

      <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>

      <div className="wk-card pad-lg">
        <DataTable
          loading={list.loading}
          cols={['Day', 'Worker', 'Phone', 'Job', 'Company', 'In', 'Out', 'Worked', 'Status', 'Counted?', '']}
          empty="No attendance matches these filters."
        >
          {list.rows.map((a) => {
            const st = ATT_STATUS[a.status] || { label: a.status, tone: 'viewed' }
            const ap = APPROVAL[a.approvalStatus] || { label: a.approvalStatus, tone: 'viewed' }
            return (
              <tr key={a.id}>
                <td className="num">{formatDate(a.workDate)}</td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Avatar name={a.workerName || '?'} size={30} />
                    <span className="nm">{a.workerName}</span>
                  </span>
                  {a.editedByAdmin && <div className="sb">edited by JobOn</div>}
                </td>
                <td><Phone number={a.workerPhone} /></td>
                <td><Link className="wk-link" to={`/admin/jobs/${a.jobId}`}>{a.jobTitle}</Link></td>
                <td>{a.employerId ? <Link className="wk-link" to={`/admin/companies/${a.employerId}`}>{a.businessName}</Link> : a.businessName}</td>
                <td className="num">{timeOnly(a.checkInAt) || '—'}</td>
                <td className="num">{timeOnly(a.checkOutAt) || '—'}</td>
                <td className="num">{a.workedLabel || minutesLabel(a.minutesWorked)}</td>
                <td><Badge tone={st.tone}>{a.statusLabel || st.label}</Badge></td>
                <td>
                  <Badge tone={ap.tone}>{a.approvalLabel || ap.label}</Badge>
                  {a.hasOpenRequest && <div className="sb ad-warn">correction asked</div>}
                </td>
                <td>
                  {can('MANAGE_APPLICATIONS') && (
                    <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={() => setEditing(a)}>Edit</button>
                  )}
                </td>
              </tr>
            )
          })}
        </DataTable>
        <Pager {...list.meta} onPage={list.setPage} />
      </div>

      {editing && (
        <Override row={editing} onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); list.reload(); onChanged?.() }} />
      )}
    </>
  )
}

function Override({ row, onClose, onSaved }) {
  const [form, setForm] = useState({
    checkIn: timeOnly(row.checkInAt) ? row.checkInAt?.slice(11, 16) : '09:00',
    checkOut: row.checkOutAt ? row.checkOutAt.slice(11, 16) : '18:00',
    approvalStatus: row.approvalStatus === 'PENDING' ? 'APPROVED' : row.approvalStatus,
    note: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setBusy(true); setError('')
    try {
      await overrideAttendance(row.id, form)
      onSaved()
    } catch (e) {
      setError(e?.response?.data?.message || 'That did not save.')
    } finally { setBusy(false) }
  }

  return (
    <Modal title={`Fix ${row.workerName}'s day`} onClose={onClose}>
      {error && <div className="ad-error"><Icon name="shield" size={15} /><span>{error}</span></div>}
      <p className="wk-sub" style={{ marginTop: 0 }}>
        {row.jobTitle} · {row.businessName} · {formatDate(row.workDate)}
      </p>
      <div className="wk-form">
        <label className="ad-field"><span>Started at</span>
          <input className="ad-input" type="time" value={form.checkIn}
            onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value }))} /></label>
        <label className="ad-field"><span>Finished at</span>
          <input className="ad-input" type="time" value={form.checkOut}
            onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))} /></label>
      </div>
      <label className="ad-field" style={{ marginTop: 14 }}>
        <span>Does this day count?</span>
        <select className="ad-input" value={form.approvalStatus}
          onChange={(e) => setForm((f) => ({ ...f, approvalStatus: e.target.value }))}>
          {APPROVALS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </label>
      <label className="ad-field" style={{ marginTop: 14 }}>
        <span>Why?</span>
        <input className="ad-input" placeholder="Rang both sides, agreed the times"
          value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
      </label>
      <p className="wk-sub">Recorded against your name, and visible to the worker and the employer at once.</p>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="mk-btn mk-btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="mk-btn mk-btn-primary" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  )
}
