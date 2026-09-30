import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { Loading, Empty, ErrorNote, PageHead } from '../components'
import { formatDate } from '../api'
import {
  getToday, checkIn, checkOut, myRequests, raiseRequest, cancelRequest,
  REQUEST_TYPES, REQUEST_TYPE_LABEL, REQUEST_STATUS, APPROVAL, minutesLabel, timeOnly,
} from '../attendanceApi'
import { SpeakButton, useSimple } from '../../a11y/SimpleMode'

/** The API sends "09:00:00"; nobody wants to read the seconds. */
const hhmm = (t) => (t ? String(t).slice(0, 5) : '')

/**
 * Addresses arrive as a full postal line. On a phone that wraps to three rows and pushes the
 * button off screen, so we show the part that actually helps someone find the place - the
 * street and area - and keep the whole thing in the tooltip.
 */
const shortPlace = (place) => {
  const parts = String(place).split(',').map((x) => x.trim()).filter(Boolean)
  if (parts.length <= 2) return parts.join(', ')
  return parts.slice(-2).join(', ').replace(/\s\d{6}$/, '')
}

/** Local calendar day — `toISOString()` would shift to UTC and lose a day. */
const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
import '../../a11y/a11y.css'
import './attendance.css'

/**
 * Punching in and out.
 *
 * Deliberately one screen and one button. A worker on a building site with wet
 * hands and a cracked screen should be able to start and finish work without
 * reading anything: the button is the whole interface, and its colour says
 * which half of the day they are in. Everything else is confirmation.
 */
export default function Attendance() {
  useDocumentTitle('My work today')
  const { t } = useTranslation()
  const [today, setToday] = useState(null)
  const [requests, setRequests] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const [asking, setAsking] = useState(null)
  const [tick, setTick] = useState(0)

  const load = () => {
    setError('')
    Promise.all([getToday(), myRequests().catch(() => [])])
      .then(([d, r]) => {
        setToday(Array.isArray(d) ? d : [])
        setRequests(Array.isArray(r) ? r : [])
      })
      .catch(() => setError('We could not load your work for today.'))
  }
  useEffect(load, [])

  // Keeps "3 hours 20 minutes so far" moving while someone is checked in.
  useEffect(() => {
    const anyOpen = (today || []).some((d) => d.status === 'CHECKED_IN')
    if (!anyOpen) return undefined
    const id = setInterval(() => setTick((n) => n + 1), 60000)
    return () => clearInterval(id)
  }, [today])

  const punch = async (row, kind) => {
    setBusy(row.employmentId); setError('')
    try {
      await (kind === 'IN' ? checkIn(row.employmentId) : checkOut(row.employmentId))
      load()
    } catch (e) {
      setError(e?.response?.data?.message || 'That did not go through. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const pending = requests.filter((r) => r.status === 'PENDING')

  if (!today && !error) return <><PageHead title="My work today" /><Loading rows={2} /></>

  return (
    <>
      <PageHead title={t('a11y.attendance.title', 'My work today')} sub={formatDate(new Date().toISOString())} />
      <ErrorNote onRetry={load}>{error}</ErrorNote>

      {today?.length ? (
        <div className="at-cards">
          {today.map((row) => (
            <PunchCard
              key={row.employmentId}
              row={row}
              busy={busy === row.employmentId}
              onPunch={punch}
              onAsk={() => setAsking(row)}
              tick={tick}
            />
          ))}
        </div>
      ) : (
        !error && (
          <div className="wk-card">
            <Empty icon="briefcase" title={t('a11y.attendance.noWork')}
              text={t('a11y.attendance.noWorkText')}>
              <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/worker/jobs">Find work</Link>
            </Empty>
          </div>
        )
      )}

      {pending.length > 0 && (
        <div className="wk-card pad-lg" style={{ marginTop: 16 }}>
          <h2 className="wk-h2">{t('a11y.attendance.waiting')}</h2>
          <div className="at-req-list">
            {pending.map((r) => (
              <div className="at-req" key={r.id}>
                <span className="ic"><Icon name="clock" size={16} /></span>
                <div className="grow">
                  <div className="t">{t(`a11y.reason.${r.type}`, REQUEST_TYPE_LABEL[r.type] || r.type)}</div>
                  <div className="d">{formatDate(r.workDate)} · {r.businessName}</div>
                </div>
                <button
                  className="mk-btn mk-btn-outline mk-btn-sm"
                  onClick={() => cancelRequest(r.id).then(load).catch(() => {})}
                >
                  {t('a11y.attendance.cancel')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="wk-row" style={{ marginTop: 16, gap: 10 }}>
        <Link className="mk-btn mk-btn-outline" to="/worker/attendance/history">
          <Icon name="calendar" size={16} /> {t('a11y.attendance.myDays')}
        </Link>
      </div>

      {asking && (
        <AskDialog row={asking} onClose={() => setAsking(null)} onDone={() => { setAsking(null); load() }} />
      )}
    </>
  )
}

/** One job's card: the button, and only what confirms it. */
function PunchCard({ row, busy, onPunch, onAsk, tick }) {
  const { simple } = useSimple()

  // In the first minute after punching in there is genuinely nothing to count yet, and
  // minutesLabel renders a bare dash for zero. "Just started" is the honest reading.
  const minutesIn = row.status === 'CHECKED_IN' && row.checkInAt
    ? Math.round((Date.now() - new Date(row.checkInAt).getTime()) / 60000)
    : null
  const live = minutesIn === null ? null : (minutesIn < 1 ? 'Just started' : minutesLabel(minutesIn))

  const spoken = [
    row.jobTitle, `at ${row.businessName}`,
    row.nextActionLabel,
    live ? `You have worked ${live}` : null,
  ].filter(Boolean).join('. ')

  const approval = APPROVAL[row.approvalStatus]

  return (
    <div className="at-card">
      <div className="at-head">
        <div className="grow">
          <div className="job">{row.jobTitle}</div>
          <div className="shop">{row.businessName}</div>
        </div>
        <SpeakButton text={spoken} size={20} />
      </div>

      {/* The shift, the place and the person to ring. The API already returns all three and
          they are what a worker standing outside a gate actually needs. */}
      <div className="at-meta">
        {row.shiftStart && (
          <span className="bit">
            <Icon name="clock" size={14} /> {hhmm(row.shiftStart)} – {hhmm(row.shiftEnd)}
          </span>
        )}
        {row.location && (
          <span className="bit" title={row.location}>
            <Icon name="pin" size={14} /> {shortPlace(row.location)}
          </span>
        )}
        {row.employerPhone && (
          <a className="bit call" href={`tel:${row.employerPhone}`}>
            <Icon name="phone" size={14} /> Call
          </a>
        )}
      </div>

      {/* One clear action, sized like a button rather than a banner. */}
      {row.nextAction === 'CHECK_IN' && (
        <div className="at-action">
          <button className="at-punch start" disabled={busy} onClick={() => onPunch(row, 'IN')}>
            <Icon name="play" size={22} />
            <span className="lbl">{busy ? 'Please wait…' : 'Start work'}</span>
          </button>
          <span className="at-hint">{row.nextActionLabel}</span>
        </div>
      )}

      {row.nextAction === 'CHECK_OUT' && (
        <>
          <div className="at-live">
            <span className="dot" aria-hidden="true" />
            <div>
              <div className="k">You started at {timeOnly(row.checkInAt)}</div>
              <div className="v">{live || row.workedLabel}</div>
            </div>
          </div>
          <div className="at-action">
            <button className="at-punch stop" disabled={busy} onClick={() => onPunch(row, 'OUT')}>
              <Icon name="checkCircle" size={22} />
              <span className="lbl">{busy ? 'Please wait…' : 'Finish work'}</span>
            </button>
            <span className="at-hint">{row.nextActionLabel}</span>
          </div>
        </>
      )}

      {(row.nextAction === 'DONE' || row.nextAction === 'NONE') && (
        <div className={`at-done${row.approvalStatus === 'REJECTED' ? ' bad' : ''}`}>
          <span className="ic" aria-hidden="true">
            <Icon name={row.approvalStatus === 'REJECTED' ? 'close' : 'checkCircle'} size={30} />
          </span>
          <div>
            <div className="t">{row.nextActionLabel || 'Done for today'}</div>
            {row.checkInAt && (
              <div className="d">
                {timeOnly(row.checkInAt)} – {timeOnly(row.checkOutAt)} · {row.workedLabel || minutesLabel(row.minutesWorked)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Whether today counts, and the way out if it does not. One line, since neither is
          the main action and stacking them made the card look longer than it is. */}
      <div className="at-foot">
        {approval && row.status !== 'NOT_CHECKED_IN' && (
          <span className={`at-approval ${approval.tone}`}>
            <Icon name={row.approvalStatus === 'PENDING' ? 'clock' : 'checkCircle'} size={15} />
            {row.approvalLabel || approval.label}
          </span>
        )}
        <button className="at-wrong" onClick={onAsk}>
          <Icon name="chat" size={15} /> Something is wrong
        </button>
      </div>
    </div>
  )
}

/**
 * Raising a correction.
 *
 * Reasons are taps, not a text box — describing the problem in writing is the
 * hardest thing we could ask here. The note is optional and always last.
 */
function AskDialog({ row, onClose, onDone }) {
  const [type, setType] = useState('')
  const [form, setForm] = useState({
    workDate: todayIso(),
    requestedCheckIn: row.shiftStart || '09:00',
    requestedCheckOut: row.shiftEnd || '18:00',
    reason: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const picked = REQUEST_TYPES.find((r) => r.value === type)

  const send = async () => {
    setBusy(true); setError('')
    try {
      await raiseRequest({
        employmentId: row.employmentId,
        workDate: form.workDate,
        type,
        requestedCheckIn: picked?.needsIn ? form.requestedCheckIn : undefined,
        requestedCheckOut: picked?.needsOut ? form.requestedCheckOut : undefined,
        reason: form.reason || undefined,
      })
      onDone()
    } catch (e) {
      setError(e?.response?.data?.message || 'We could not send that. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="ad-scrim" onClick={onClose} aria-hidden="true" />
      <div className="ad-modal" role="dialog" aria-modal="true" aria-label="Something is wrong">
        <div className="ad-modal-head">
          <h2 className="wk-h2 grow" style={{ margin: 0 }}>What is wrong?</h2>
          <button className="ad-x" onClick={onClose} aria-label="Close"><Icon name="close" size={16} /></button>
        </div>
        <div className="ad-modal-body">
          {error && <div className="ad-error"><Icon name="shield" size={15} /><span>{error}</span></div>}

          <div className="at-reasons">
            {REQUEST_TYPES.map((r) => (
              <button
                key={r.value}
                className={`at-reason${type === r.value ? ' on' : ''}`}
                onClick={() => setType(r.value)}
              >
                <span className="ic"><Icon name={r.icon} size={18} /></span>
                <span className="lbl">{r.label}</span>
                {type === r.value && <span className="tick"><Icon name="check" size={14} /></span>}
              </button>
            ))}
          </div>

          {type && (
            <>
              <label className="wk-field" style={{ marginTop: 18 }}>
                <span className="lb">Which day?</span>
                <input className="wk-input" type="date" max={todayIso()}
                  value={form.workDate}
                  onChange={(e) => setForm((f) => ({ ...f, workDate: e.target.value }))} />
              </label>

              <div className="wk-form" style={{ marginTop: 14 }}>
                {picked?.needsIn && (
                  <label className="wk-field">
                    <span className="lb">What time did you start?</span>
                    <input className="wk-input" type="time" value={form.requestedCheckIn}
                      onChange={(e) => setForm((f) => ({ ...f, requestedCheckIn: e.target.value }))} />
                  </label>
                )}
                {picked?.needsOut && (
                  <label className="wk-field">
                    <span className="lb">What time did you finish?</span>
                    <input className="wk-input" type="time" value={form.requestedCheckOut}
                      onChange={(e) => setForm((f) => ({ ...f, requestedCheckOut: e.target.value }))} />
                  </label>
                )}
              </div>

              <label className="wk-field" style={{ marginTop: 14 }}>
                <span className="lb">Anything to add? (not needed)</span>
                <textarea className="wk-input" rows={2}
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
              </label>

              <p className="wk-sub">
                {row.businessName} will see this and can fix it. JobOn can also help if they do not answer.
              </p>
            </>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button className="mk-btn mk-btn-outline" onClick={onClose} disabled={busy}>Close</button>
            <button className="mk-btn mk-btn-primary" onClick={send} disabled={!type || busy}>
              {busy ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
