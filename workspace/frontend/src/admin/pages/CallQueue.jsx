import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import {
  getCallQueue, getCallQueueSummary, logContact, num,
  queueLook, waitingLabel, CHANNELS, OUTCOMES, OUTCOME_TONE, OUTCOME_LABEL, formatDate,
} from '../api'
import { usePagedList, useResource } from '../hooks'
import { PageHead, ErrorNote, Badge, Empty, Modal, Card, usePermissions } from '../components'

/**
 * The screen a back-office operator lives in.
 *
 * Not a report — a worklist. Every row is one person to ring, why they are
 * waiting, and the number to dial. Logging what happened takes the row off the
 * list, so the queue empties as the day goes on.
 */
export default function CallQueue() {
  useDocumentTitle('Call list')
  const { can } = usePermissions()
  const [logging, setLogging] = useState(null)
  const list = usePagedList(getCallQueue, { type: '' }, { size: 30 })
  const summary = useResource(getCallQueueSummary, [])

  const s = summary.data || {}
  const types = s.byType || []

  const refresh = () => { list.reload(); summary.reload() }

  return (
    <>
      <PageHead title="Call list" sub="Who to ring next, and why">
        <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={refresh}>
          <Icon name="trending" size={14} /> Refresh
        </button>
      </PageHead>

      <ErrorNote onRetry={refresh}>{list.error || summary.error}</ErrorNote>

      {/* A filter strip that doubles as the count of what is outstanding. */}
      <div className="ad-filters" style={{ gap: 7 }}>
        <button
          className={`cq-chip${!list.filters.type ? ' on' : ''}`}
          onClick={() => list.setFilter('type', '')}
        >
          Everything <b>{num(s.total)}</b>
        </button>
        {types.map((t) => (
          <button
            key={t.type}
            className={`cq-chip${list.filters.type === t.type ? ' on' : ''}`}
            onClick={() => list.setFilter('type', list.filters.type === t.type ? '' : t.type)}
          >
            {t.label} <b>{num(t.count)}</b>
          </button>
        ))}
      </div>

      {list.loading && !list.rows.length ? (
        <div className="wk-card pad-lg"><div className="ad-skel" style={{ height: 180 }} /></div>
      ) : list.rows.length ? (
        <div className="cq-list">
          {list.rows.map((r) => {
            const look = queueLook(r.type)
            const callingWorker = r.nextAction === 'CALL_WORKER'
            const phone = callingWorker ? r.personPhone : (r.counterpartPhone || r.personPhone)
            const who = callingWorker ? r.personName : (r.counterpartName || r.personName)
            return (
              <div className={`cq-row ${r.priority?.toLowerCase()}`} key={r.id}>
                <span className={`cq-ic ${look.tone}`} aria-hidden="true">
                  <Icon name={look.icon} size={17} />
                </span>

                <div className="cq-body">
                  <div className="cq-top">
                    <span className="who">{who}</span>
                    <Badge tone={r.priority === 'HIGH' ? 'rejected' : 'pending'}>
                      {waitingLabel(r.waitingHours)}
                    </Badge>
                  </div>
                  <div className="cq-why">{r.reasonLabel}</div>
                  <div className="cq-meta">
                    {r.jobTitle && (
                      <Link className="wk-link" to={`/admin/jobs/${r.jobId}`}>{r.jobTitle}</Link>
                    )}
                    {r.counterpartName && callingWorker && <span>· {r.counterpartName}</span>}
                    {r.contactCount > 0 && (
                      <span>· tried {num(r.contactCount)}×
                        {r.lastContactOutcome ? ` (${OUTCOME_LABEL[r.lastContactOutcome] || r.lastContactOutcome})` : ''}
                      </span>
                    )}
                  </div>
                  <div className="cq-next">{r.nextActionLabel}</div>
                </div>

                <div className="cq-acts">
                  {phone && (
                    <a className="cq-call" href={`tel:+91${phone}`}>
                      <Icon name="phone" size={18} />
                      <span>{phone}</span>
                    </a>
                  )}
                  {can('LOG_CONTACT') && r.applicationId && (
                    <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={() => setLogging(r)}>
                      Log call
                    </button>
                  )}
                  {r.applicationId && (
                    <Link className="mk-btn mk-btn-ghost mk-btn-sm" to={`/admin/applications/${r.applicationId}`}>
                      History
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="wk-card pad-lg">
          <Empty icon="checkCircle" title="Nobody is waiting"
            text="Every applicant has been called and every employer has answered. Come back later." />
        </div>
      )}

      {logging && (
        <LogCall row={logging} onClose={() => setLogging(null)} onSaved={() => { setLogging(null); refresh() }} />
      )}
    </>
  )
}

/**
 * Logging the call. Deliberately short — this gets filled in while the phone
 * is still warm, so it is three taps and an optional note.
 */
function LogCall({ row, onClose, onSaved }) {
  const [form, setForm] = useState({ channel: 'CALL', outcome: 'REACHED', note: '', nextCallAt: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setBusy(true); setError('')
    try {
      await logContact(row.applicationId, {
        channel: form.channel,
        outcome: form.outcome,
        note: form.note || undefined,
        nextCallAt: form.outcome === 'CALLBACK_REQUESTED' && form.nextCallAt ? form.nextCallAt : undefined,
      })
      onSaved()
    } catch (e) {
      setError(e?.response?.data?.message || 'We could not save that.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={`Call with ${row.personName}`} onClose={onClose}>
      {error && <div className="ad-error"><Icon name="shield" size={15} /><span>{error}</span></div>}

      <p className="wk-sub" style={{ marginTop: 0 }}>{row.reasonLabel}</p>

      <div className="ad-field">
        <span>What happened?</span>
        <div className="cq-outcomes">
          {OUTCOMES.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`cq-outcome${form.outcome === o.value ? ' on' : ''}`}
              onClick={() => setForm((f) => ({ ...f, outcome: o.value }))}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <label className="ad-field">
        <span>How did you reach them?</span>
        <select className="ad-input" value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}>
          {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </label>

      {form.outcome === 'CALLBACK_REQUESTED' && (
        <label className="ad-field">
          <span>Call them back at</span>
          <input
            className="ad-input"
            type="datetime-local"
            value={form.nextCallAt}
            onChange={(e) => setForm((f) => ({ ...f, nextCallAt: e.target.value }))}
          />
        </label>
      )}

      <label className="ad-field">
        <span>Note (optional)</span>
        <textarea className="ad-input" rows={3} placeholder="Anything worth remembering for the next call."
          value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
      </label>

      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <button className="mk-btn mk-btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="mk-btn mk-btn-primary" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save and remove from list'}
        </button>
      </div>
    </Modal>
  )
}
