import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { JobArt, Loading, Empty, ErrorNote, PillTabs, PageHead } from '../components'
import {
  getEmployments, getEmployment, acknowledgeJoining, getTodayShift, checkIn, checkOut,
  getAttendance, pay, formatDate, daysLabel, hhmm, timeOnly, EMPLOYMENT_LABEL,
} from '../api'

const mapsLink = (lat, lng, label) =>
  lat && lng
    ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(label || '')}`

/* ---------- 19. My Work ---------- */

export function MyWork() {
  useDocumentTitle('My Work')
  const [scope, setScope] = useState('CURRENT')
  const [lists, setLists] = useState({})
  const [error, setError] = useState('')

  const load = (s) => {
    setError('')
    getEmployments(s)
      .then((d) => setLists((l) => ({ ...l, [s]: Array.isArray(d) ? d : [] })))
      .catch(() => setError('We could not load your work history.'))
  }
  useEffect(() => { if (!lists[scope]) load(scope) }, [scope]) // eslint-disable-line react-hooks/exhaustive-deps

  const list = lists[scope]

  return (
    <>
      <PageHead title="My Work" sub="Your jobs, shifts and payslips in one place." />

      <PillTabs
        value={scope}
        onChange={setScope}
        tabs={[
          { value: 'CURRENT', label: 'Current', count: lists.CURRENT?.length },
          { value: 'PAST', label: 'Past', count: lists.PAST?.length },
        ]}
      />

      <div style={{ marginTop: 16 }}>
        <ErrorNote onRetry={() => load(scope)}>{error}</ErrorNote>
        {!list && !error ? <Loading rows={2} /> : list?.length ? (
          <div className="wk-list">
            {list.map((e) => <EmploymentCard key={e.id} e={e} current={scope === 'CURRENT'} />)}
          </div>
        ) : (
          !error && (
            <div className="wk-card">
              <Empty
                icon="briefcase"
                title={scope === 'CURRENT' ? 'You are not working anywhere yet' : 'No past jobs yet'}
                text="Once you accept an offer, your job appears here with its shifts and payslips."
              >
                <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/worker/jobs">Find jobs</Link>
              </Empty>
            </div>
          )
        )}
      </div>
    </>
  )
}

function EmploymentCard({ e, current }) {
  return (
    <div className="wk-card">
      <div className="wk-job" style={{ alignItems: 'center' }}>
        <JobArt job={{ title: e.jobTitle, businessName: e.businessName }} />
        <div className="meta" style={{ paddingRight: 0 }}>
          <Link to={`/worker/work/${e.id}`} className="ttl" style={{ color: 'inherit', display: 'block' }}>
            {e.jobTitle}
          </Link>
          <div className="biz">{e.businessName}</div>
        </div>
        <span className={`wk-badge ${e.status === 'ACTIVE' ? 'shortlisted' : e.status === 'COMPLETED' || e.status === 'ENDED' ? 'withdrawn' : 'interview'}`}>
          {e.status === 'ACTIVE' ? 'Active' : e.status === 'JOINING_CONFIRMED' ? 'Joining' : e.status === 'OFFER_ACCEPTED' ? 'Accepted' : 'Ended'}
        </span>
      </div>

      <div className="wk-facts" style={{ marginTop: 14 }}>
        <Fact icon="calendar" k="Joined On" v={formatDate(e.joiningDate) || '—'} />
        <Fact icon="briefcase" k="Employment Type" v={EMPLOYMENT_LABEL[e.employmentType] || '—'} />
        <Fact icon="rupee" k="Salary" v={e.salary ? pay(e.salary, e.salaryUnit) : '—'} />
        <Fact icon="clock" k="Shift" v={e.shiftLabel || '—'} />
        <Fact icon="calendar" k="Working Days" v={daysLabel(e.workingDays)} />
        <Fact icon="pin" k="Location" v={e.workLocation || '—'} />
      </div>

      {current && (
        <div className="wk-list" style={{ marginTop: 16, gap: 0 }}>
          <RowLink to="/worker/shift/today" icon="clock" t="Today's Shift" d="View current shift details" />
          <RowLink to={`/worker/work/${e.id}/attendance`} icon="checkCircle" t="Attendance" d="View attendance history" />
          <RowLink to="/worker/earnings" icon="wallet" t="Payslips" d="View salary slips" />
          <RowLink to="/worker/messages" icon="chat" t="Raise an Issue" d="Report any work related issue" />
        </div>
      )}
    </div>
  )
}

function RowLink({ to, icon, t, d }) {
  return (
    <Link className="wk-fact" to={to} style={{ border: 0, borderTop: '1px solid var(--line-soft)', borderRadius: 0, padding: '13px 2px' }}>
      <span className="ic"><Icon name={icon} size={15} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="v" style={{ display: 'block' }}>{t}</span>
        <span className="k">{d}</span>
      </span>
      <Icon name="chevronRight" size={16} style={{ color: 'var(--muted)' }} />
    </Link>
  )
}

/* ---------- 18. Joining instructions ---------- */

export function JoiningInstructions() {
  const { id } = useParams()
  const [e, setE] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useDocumentTitle('Joining instructions')

  const load = () => {
    setError('')
    getEmployment(id).then(setE).catch(() => setError('We could not load your joining details.'))
  }
  useEffect(load, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const acknowledge = async () => {
    setBusy(true)
    try { setE(await acknowledgeJoining(id)) }
    catch (err) { setError(err?.response?.data?.message || 'Could not save that.') }
    finally { setBusy(false) }
  }

  /** No PDF service yet — the browser's print dialog gives the worker a saveable copy. */
  const download = () => window.print()

  if (error && !e) return <ErrorNote onRetry={load}>{error}</ErrorNote>
  if (!e) return <Loading rows={2} />

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <Link className="wk-link" to="/worker/work" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
        <Icon name="chevronLeft" size={15} /> Back to My Work
      </Link>

      <ErrorNote>{error}</ErrorNote>

      <div className="wk-card pad-lg">
        <div className="wk-job" style={{ alignItems: 'center' }}>
          <JobArt job={{ title: e.jobTitle, businessName: e.businessName }} />
          <div className="meta" style={{ paddingRight: 0 }}>
            <div className="ttl">{e.jobTitle}</div>
            <div className="biz">{e.businessName}</div>
          </div>
        </div>

        <div className="mk-note" style={{ marginTop: 16 }}>
          <strong>Welcome to the team!</strong> Here are your joining details.
        </div>

        <div className="wk-kvlist" style={{ marginTop: 18 }}>
          <KV icon="calendar" k="Joining Date" v={formatDate(e.joiningDate) || '—'} />
          <KV icon="clock" k="Reporting Time" v={hhmm(e.reportingTime) || '—'} />
          <KV icon="user" k="Contact Person" v={
            <>
              {e.contactPersonName || '—'}
              {e.contactPersonPhone && <><br /><a href={`tel:${e.contactPersonPhone}`}>{e.contactPersonPhone}</a></>}
            </>
          } />
          <KV icon="pin" k="Work Location" v={
            <>
              {e.workLocation || '—'}
              {e.workLocation && (
                <> · <a href={mapsLink(e.latitude, e.longitude, e.workLocation)} target="_blank" rel="noreferrer">View on Map</a></>
              )}
            </>
          } />
        </div>

        {(e.documentsToCarry || []).length > 0 && (
          <>
            <h2 className="wk-h2" style={{ marginTop: 22 }}>Documents to Carry</h2>
            <ul className="wk-bullets" style={{ marginTop: 10 }}>
              {e.documentsToCarry.map((d) => <li key={d}>{d}</li>)}
            </ul>
          </>
        )}

        {e.dressCode && (
          <>
            <h2 className="wk-h2" style={{ marginTop: 22 }}>Dress Code</h2>
            <p style={{ fontSize: 14.5, color: 'var(--body)', marginTop: 8 }}>{e.dressCode}</p>
          </>
        )}

        <div style={{ display: 'grid', gap: 10, marginTop: 24 }}>
          {e.joiningAcknowledged ? (
            <div className="mk-success">You have confirmed these joining details.</div>
          ) : (
            <button className="mk-btn mk-btn-primary" onClick={acknowledge} disabled={busy}>
              {busy ? 'Saving…' : 'I Understand'}
            </button>
          )}
          <button className="mk-btn mk-btn-outline" onClick={download}>
            <Icon name="doc" size={16} /> Save a copy
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- 20. Today's shift ---------- */

export function TodayShift() {
  useDocumentTitle("Today's shift")
  const [s, setS] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  const load = () => {
    setError('')
    getTodayShift().then(setS).catch(() => setError('We could not load your shift.'))
  }
  useEffect(load, [])

  const act = async (kind) => {
    setBusy(kind); setError('')
    try {
      await (kind === 'in' ? checkIn(s.employmentId) : checkOut(s.employmentId))
      load()
    } catch (err) {
      setError(err?.response?.data?.message || `Could not check ${kind === 'in' ? 'in' : 'out'}.`)
    } finally { setBusy('') }
  }

  if (error && !s) return <ErrorNote onRetry={load}>{error}</ErrorNote>
  if (!s) return <Loading rows={2} />

  if (!s.hasShift) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="wk-card">
          <Empty icon="calendar" title="No shift today" text="Your next shift will appear here on the day.">
            <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/worker/work">My Work</Link>
          </Empty>
        </div>
      </div>
    )
  }

  const checkedIn = s.attendanceStatus === 'CHECKED_IN'
  const done = s.attendanceStatus === 'CHECKED_OUT'

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <div className="wk-row" style={{ marginBottom: 14 }}>
        <div className="grow">
          <h1 className="wk-h1">Today’s Shift</h1>
          <p className="wk-sub">{formatDate(s.workDate)}</p>
        </div>
      </div>

      <div className={done ? 'mk-success' : 'mk-note'} style={{ marginBottom: 14 }}>
        {done
          ? 'Shift complete. Thanks for the day’s work.'
          : checkedIn
            ? `You checked in at ${timeOnly(s.checkInAt)}.`
            : 'Your shift is scheduled for today.'}
      </div>

      <ErrorNote>{error}</ErrorNote>

      <div className="wk-card pad-lg">
        <div className="wk-job" style={{ alignItems: 'center' }}>
          <JobArt job={{ title: s.jobTitle, businessName: s.businessName }} />
          <div className="meta" style={{ paddingRight: 0 }}>
            <div className="ttl">{s.jobTitle}</div>
            <div className="biz">{s.businessName}</div>
          </div>
        </div>

        <div className="wk-facts" style={{ marginTop: 14 }}>
          <Fact icon="clock" k="Shift Time" v={`${hhmm(s.shiftStart)} – ${hhmm(s.shiftEnd)}`} />
          {s.breakStart && <Fact icon="cup" k="Break Time" v={`${hhmm(s.breakStart)} – ${hhmm(s.breakEnd)}`} />}
          <Fact icon="pin" k="Location" v={
            <>
              {s.workLocation || '—'}
              {s.workLocation && (
                <> · <a href={mapsLink(s.latitude, s.longitude, s.workLocation)} target="_blank" rel="noreferrer">Map</a></>
              )}
            </>
          } />
          <Fact icon="user" k="Contact Person" v={
            <>
              {s.contactPersonName || '—'}
              {s.contactPersonPhone && <><br /><a href={`tel:${s.contactPersonPhone}`}>{s.contactPersonPhone}</a></>}
            </>
          } />
        </div>

        <h2 className="wk-h2" style={{ marginTop: 22 }}>Attendance</h2>
        <div className="wk-kvlist" style={{ marginTop: 10 }}>
          <KV icon={done || checkedIn ? 'checkCircle' : 'clock'} k="Status" v={
            done ? `Checked out at ${timeOnly(s.checkOutAt)}`
              : checkedIn ? `Checked in at ${timeOnly(s.checkInAt)}`
                : 'Not checked in yet'
          } />
        </div>

        <div style={{ marginTop: 20 }}>
          {done ? (
            <Link className="mk-btn mk-btn-outline mk-btn-block" to="/worker/work">Back to My Work</Link>
          ) : checkedIn ? (
            <>
              <button className="mk-btn mk-btn-primary mk-btn-block" onClick={() => act('out')} disabled={!!busy}>
                <Icon name="checkCircle" size={17} /> {busy ? 'Checking out…' : 'Check Out'}
              </button>
              <p className="wk-sub" style={{ textAlign: 'center' }}>Check out when you finish for the day.</p>
            </>
          ) : (
            <>
              <button className="mk-btn mk-btn-primary mk-btn-block" onClick={() => act('in')} disabled={!!busy || !s.canCheckIn}>
                <Icon name="calendar" size={17} /> {busy ? 'Checking in…' : 'Check In'}
              </button>
              <p className="wk-sub" style={{ textAlign: 'center' }}>Please check in when you reach the workplace.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- attendance history ---------- */

export function AttendanceHistory() {
  const { id } = useParams()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  useDocumentTitle('Attendance')

  const load = () => {
    setError('')
    getAttendance(id)
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setError('We could not load your attendance.'))
  }
  useEffect(load, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const present = (rows || []).filter((r) => r.status === 'CHECKED_OUT' || r.status === 'CHECKED_IN').length

  return (
    <>
      <Link className="wk-link" to="/worker/work" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
        <Icon name="chevronLeft" size={15} /> Back to My Work
      </Link>
      <PageHead title="Attendance" sub={rows ? `${present} of ${rows.length} days marked present` : 'Your attendance record'} />

      <ErrorNote onRetry={load}>{error}</ErrorNote>
      {!rows && !error ? <Loading rows={3} /> : rows?.length ? (
        <div className="wk-list">
          {rows.map((r) => (
            <div className="wk-card" key={r.id}>
              <div className="wk-row">
                <span className="mk-icon-box sm" style={{
                  width: 34, height: 34, marginBottom: 0,
                  background: r.status === 'ABSENT' ? '#fee2e2' : '#d1fae5',
                  color: r.status === 'ABSENT' ? '#b91c1c' : '#047857',
                }}>
                  <Icon name={r.status === 'ABSENT' ? 'close' : 'check'} size={15} strokeWidth={3} />
                </span>
                <div className="grow">
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{formatDate(r.workDate)}</div>
                  <div className="wk-sub" style={{ marginTop: 2 }}>
                    {r.checkInAt ? `${timeOnly(r.checkInAt)}${r.checkOutAt ? ` – ${timeOnly(r.checkOutAt)}` : ''}` : 'Not marked'}
                  </div>
                </div>
                {r.minutesWorked > 0 && (
                  <span className="wk-chip">{Math.floor(r.minutesWorked / 60)}h {r.minutesWorked % 60}m</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !error && (
          <div className="wk-card">
            <Empty icon="calendar" title="No attendance yet" text="Your check-ins appear here once you start work." />
          </div>
        )
      )}
    </>
  )
}

/* ---------- shared ---------- */

function Fact({ icon, k, v }) {
  return (
    <div className="wk-fact">
      <span className="ic"><Icon name={icon} size={15} /></span>
      <span style={{ minWidth: 0 }}>
        <span className="v" style={{ display: 'block' }}>{v}</span>
        <span className="k">{k}</span>
      </span>
    </div>
  )
}

function KV({ icon, k, v }) {
  return (
    <div className="r">
      <span className="ic"><Icon name={icon} size={14} /></span>
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  )
}
