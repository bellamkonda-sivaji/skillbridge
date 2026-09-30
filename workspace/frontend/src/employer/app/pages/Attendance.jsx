import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { Avatar, useDocumentTitle } from '../../../marketing/components'
import { Loading, Empty, ErrorNote, PageHead } from '../../../worker/components'
import { formatDate } from '../api'
import {
  minutesLabel, timeOnly, REQUEST_TYPE_LABEL, APPROVAL, ATT_STATUS,
} from '../../../worker/attendanceApi'
import {
  getDay, getCalendar, approveDay, rejectDay, approveAll,
  listRequests, approveRequest, rejectRequest, recentDays, todayIso, isoDay,
} from '../attendanceApi'
import '../../../worker/pages/attendance.css'

/**
 * Attendance for a shop owner.
 *
 * One day at a time, every worker on one screen, approve in a tap. The point
 * of comparison is a paper register, not a payroll system — so the default view
 * is today, the date picker is a strip of days you tap, and the only decision
 * offered is "yes they came" or "no they did not".
 */
export default function Attendance() {
  useDocumentTitle('Attendance')
  const [date, setDate] = useState(todayIso())
  const [day, setDay] = useState(null)
  const [cal, setCal] = useState([])
  const [requests, setRequests] = useState([])
  const [tab, setTab] = useState('day')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const [q, setQ] = useState('')

  const days = recentDays(14)

  const load = () => {
    setError('')
    Promise.all([
      getDay(date),
      getCalendar(days[0], todayIso()).catch(() => []),
      listRequests('PENDING').catch(() => []),
    ])
      .then(([d, c, r]) => {
        setDay(d)
        setCal(Array.isArray(c) ? c : [])
        setRequests(Array.isArray(r) ? r : [])
      })
      .catch(() => setError('We could not load attendance.'))
  }
  useEffect(load, [date]) // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (fn, id) => {
    setBusy(id); setError('')
    try { await fn(); load() }
    catch (e) { setError(e?.response?.data?.message || 'That did not save.') }
    finally { setBusy(null) }
  }

  const totals = day?.totals || {}
  const jobs = day?.jobs || []
  const pendingIds = jobs.flatMap((j) => (j.workers || []))
    .filter((w) => w.approvalStatus === 'PENDING')
    .map((w) => w.id)

  const filtered = (workers) => {
    if (!q.trim()) return workers
    const needle = q.trim().toLowerCase()
    return workers.filter((w) =>
      (w.workerName || '').toLowerCase().includes(needle)
      || (w.workerPhone || '').includes(needle))
  }

  const byDate = Object.fromEntries(cal.map((c) => [c.date, c]))

  return (
    <>
      <PageHead title="Attendance" sub="Who came in, and for how long">
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={`mk-btn mk-btn-sm ${tab === 'day' ? 'mk-btn-primary' : 'mk-btn-outline'}`} onClick={() => setTab('day')}>
            By day
          </button>
          <button className={`mk-btn mk-btn-sm ${tab === 'requests' ? 'mk-btn-primary' : 'mk-btn-outline'}`} onClick={() => setTab('requests')}>
            Corrections{requests.length ? ` (${requests.length})` : ''}
          </button>
        </div>
      </PageHead>

      <ErrorNote onRetry={load}>{error}</ErrorNote>

      {tab === 'day' ? (
        <>
          {/* Tap a day rather than typing a date. A dot shows which days have
              something on them, amber when somebody is waiting on you. */}
          <div className="at-strip">
            {days.map((d) => {
              const c = byDate[d] || {}
              const dt = new Date(d + 'T00:00:00')
              return (
                <button key={d} className={`at-day${d === date ? ' on' : ''}`} onClick={() => setDate(d)}>
                  <span className="dw">{dt.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                  <span className="dd">{dt.getDate()}</span>
                  <span className={`pip${c.pending ? ' warn' : c.present ? ' has' : ''}`} />
                </button>
              )
            })}
          </div>

          <div className="wk-row" style={{ gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <input
              className="wk-input"
              style={{ maxWidth: 260 }}
              placeholder="Find a worker by name or number"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <input className="wk-input" style={{ maxWidth: 170 }} type="date" value={date}
              max={todayIso()} onChange={(e) => setDate(e.target.value)} />
            <span className="grow" />
            {pendingIds.length > 0 && (
              <button className="at-ok" disabled={busy === 'all'}
                onClick={() => act(() => approveAll(pendingIds), 'all')}>
                <Icon name="check" size={16} />
                {busy === 'all' ? 'Saving…' : `Approve all ${pendingIds.length}`}
              </button>
            )}
          </div>

          <div className="at-day-totals">
            <div className="at-total"><div className="n">{totals.present ?? 0}</div><div className="l">Came in</div></div>
            <div className="at-total"><div className="n">{totals.absent ?? 0}</div><div className="l">Did not come</div></div>
            <div className={`at-total${totals.pending ? ' warn' : ''}`}>
              <div className="n">{totals.pending ?? 0}</div><div className="l">Waiting for you</div>
            </div>
            <div className="at-total"><div className="n">{totals.approved ?? 0}</div><div className="l">Counted</div></div>
          </div>

          {!day && !error ? <Loading rows={3} /> : jobs.length ? (
            jobs.map((j) => {
              const workers = filtered(j.workers || [])
              if (!workers.length) return null
              return (
                <div className="wk-card pad-lg" key={j.jobId} style={{ marginBottom: 14 }}>
                  <div className="wk-row" style={{ marginBottom: 12 }}>
                    <Link className="wk-h2 grow wk-link" style={{ margin: 0 }} to={`/employer/jobs/${j.jobId}`}>
                      {j.jobTitle}
                    </Link>
                    <span className="wk-sub" style={{ marginTop: 0 }}>{workers.length} worker{workers.length === 1 ? '' : 's'}</span>
                  </div>

                  {workers.map((w) => {
                    const st = ATT_STATUS[w.status] || { label: w.status, tone: 'viewed' }
                    const ap = APPROVAL[w.approvalStatus]
                    return (
                      <div className={`at-row${w.approvalStatus === 'PENDING' ? ' pending' : ''}`} key={w.id}>
                        <Avatar name={w.workerName || '?'} size={38} />
                        <div className="who">
                          <div className="nm">{w.workerName}</div>
                          <div className="sb">
                            {w.workerPhone ? `+91 ${w.workerPhone}` : ''}
                            {w.hasOpenRequest ? ' · asked for a correction' : ''}
                            {w.editedByAdmin ? ' · edited by JobOn' : ''}
                          </div>
                        </div>
                        <div>
                          <div className="times">
                            {w.checkInAt ? `${timeOnly(w.checkInAt)} – ${w.checkOutAt ? timeOnly(w.checkOutAt) : 'still working'}` : 'Not marked'}
                          </div>
                          <div className="worked">{w.workedLabel || minutesLabel(w.minutesWorked)}</div>
                        </div>
                        <span className={`wk-badge ${st.tone}`}>{w.statusLabel || st.label}</span>
                        {w.approvalStatus === 'PENDING' ? (
                          <div className="acts">
                            <button className="at-ok" disabled={busy === w.id}
                              onClick={() => act(() => approveDay(w.id), w.id)}>
                              <Icon name="check" size={16} /> Yes, they came
                            </button>
                            <button className="at-no" disabled={busy === w.id}
                              onClick={() => act(() => rejectDay(w.id), w.id)}>
                              No
                            </button>
                          </div>
                        ) : (
                          ap && <span className={`wk-badge ${ap.tone}`}>{w.approvalLabel || ap.label}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })
          ) : (
            !error && (
              <div className="wk-card">
                <Empty icon="calendar" title="Nobody worked on this day"
                  text="Pick another day, or hire someone and their attendance will show here." />
              </div>
            )
          )}
        </>
      ) : (
        <Requests requests={requests} busy={busy} onAct={act}
          approveRequest={approveRequest} rejectRequest={rejectRequest} />
      )}
    </>
  )
}

/** Corrections a worker has asked for. The employer can adjust the times first. */
function Requests({ requests, busy, onAct, approveRequest, rejectRequest }) {
  const [editing, setEditing] = useState(null)

  if (!requests.length) {
    return (
      <div className="wk-card">
        <Empty icon="checkCircle" title="Nothing to fix"
          text="When a worker says a day is wrong, it appears here for you to accept or refuse." />
      </div>
    )
  }

  return (
    <>
      <div className="at-req-list">
        {requests.map((r) => (
          <div className="wk-card pad-lg" key={r.id}>
            <div className="wk-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <Avatar name={r.workerName || '?'} size={40} />
              <div className="grow">
                <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)' }}>{r.workerName}</div>
                <div className="wk-sub" style={{ marginTop: 2 }}>
                  {r.jobTitle} · {formatDate(r.workDate)}
                </div>
                <div style={{ fontSize: 14.5, color: 'var(--body)', marginTop: 8, fontWeight: 600 }}>
                  “{REQUEST_TYPE_LABEL[r.type] || r.type}”
                </div>
                {r.reason && <div className="wk-sub" style={{ marginTop: 4 }}>{r.reason}</div>}
                {(r.requestedCheckIn || r.requestedCheckOut) && (
                  <div className="wk-sub" style={{ marginTop: 6 }}>
                    They say: {r.requestedCheckIn || '—'} to {r.requestedCheckOut || '—'}
                  </div>
                )}
              </div>
              <div className="acts" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="at-ok" disabled={busy === r.id}
                  onClick={() => onAct(() => approveRequest(r.id, {}), r.id)}>
                  <Icon name="check" size={16} /> That is right
                </button>
                <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={() => setEditing(r)}>
                  Change the time
                </button>
                <button className="at-no" disabled={busy === r.id}
                  onClick={() => onAct(() => rejectRequest(r.id, 'Not agreed'), r.id)}>
                  No
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <EditTimes request={editing} onClose={() => setEditing(null)}
          onSave={(body) => { onAct(() => approveRequest(editing.id, body), editing.id); setEditing(null) }} />
      )}
    </>
  )
}

function EditTimes({ request, onClose, onSave }) {
  const [inT, setIn] = useState(request.requestedCheckIn || '09:00')
  const [outT, setOut] = useState(request.requestedCheckOut || '18:00')
  const [note, setNote] = useState('')
  return (
    <>
      <div className="ad-scrim" onClick={onClose} aria-hidden="true" />
      <div className="ad-modal" role="dialog" aria-modal="true" aria-label="Change the time">
        <div className="ad-modal-head">
          <h2 className="wk-h2 grow" style={{ margin: 0 }}>Set the right times</h2>
          <button className="ad-x" onClick={onClose} aria-label="Close"><Icon name="close" size={16} /></button>
        </div>
        <div className="ad-modal-body">
          <p className="wk-sub" style={{ marginTop: 0 }}>
            {request.workerName} · {formatDate(request.workDate)}
          </p>
          <div className="wk-form">
            <label className="wk-field"><span className="lb">Started at</span>
              <input className="wk-input" type="time" value={inT} onChange={(e) => setIn(e.target.value)} /></label>
            <label className="wk-field"><span className="lb">Finished at</span>
              <input className="wk-input" type="time" value={outT} onChange={(e) => setOut(e.target.value)} /></label>
          </div>
          <label className="wk-field" style={{ marginTop: 14 }}>
            <span className="lb">Note (optional)</span>
            <input className="wk-input" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button className="mk-btn mk-btn-outline" onClick={onClose}>Cancel</button>
            <button className="mk-btn mk-btn-primary"
              onClick={() => onSave({ checkIn: inT, checkOut: outT, note: note || undefined })}>
              Save and approve
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
