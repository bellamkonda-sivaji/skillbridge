import React, { useState } from 'react'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import {
  listSupportTickets, getSupportSummary, assignSupportTicket, replySupportTicket,
  setSupportStatus, formatDate, num,
  SUPPORT_STATUS_LABEL, SUPPORT_STATUS_TONE, SUPPORT_TOPIC_LABEL,
} from '../api'
import { useResource } from '../hooks'
import { PageHead, ErrorNote, Badge, Empty, Modal, Card } from '../components'

const FILTERS = [
  { key: '', label: 'Everything' },
  { key: 'OPEN', label: 'Waiting' },
  { key: 'IN_PROGRESS', label: 'Being handled' },
  { key: 'RESOLVED', label: 'Sorted' },
  { key: 'CLOSED', label: 'Closed' },
]

const LANGUAGE = { en: 'English', te: 'Telugu', hi: 'Hindi' }

/**
 * The help desk inbox.
 *
 * Most people who raise a ticket here cannot comfortably read a written reply,
 * and many asked to be phoned instead. So the row leads with who is waiting and
 * their number, the call-back flag is impossible to miss, and "Log a call" is
 * as prominent as typing an answer.
 */
export default function Support() {
  useDocumentTitle('Help desk')
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(null)

  const list = useResource(() => listSupportTickets(status ? { status } : {}), [status])
  const summary = useResource(getSupportSummary, [])

  const rows = list.data || []
  const s = summary.data || {}

  const refresh = () => { list.reload(); summary.reload() }

  const act = async (fn) => {
    const updated = await fn()
    setOpen(updated)
    refresh()
  }

  return (
    <>
      <PageHead title="Help desk" sub="Everyone who has asked us for help">
        <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={refresh}>
          <Icon name="trending" size={14} /> Refresh
        </button>
      </PageHead>

      <ErrorNote onRetry={refresh}>{list.error || summary.error}</ErrorNote>

      {s.waitingCallBack > 0 ? (
        <div className="ad-callout" style={{ marginBottom: 14 }}>
          <Card>
            <strong>{num(s.waitingCallBack)} waiting for a call back.</strong>{' '}
            They asked to be phoned rather than written to.
          </Card>
        </div>
      ) : null}

      <div className="ad-filters" style={{ gap: 7 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`cq-chip${status === f.key ? ' on' : ''}`}
            onClick={() => setStatus(f.key)}
          >
            {f.label}{' '}
            <b>{num(f.key === '' ? (s.open + s.inProgress + s.resolved + s.closed) || rows.length
              : { OPEN: s.open, IN_PROGRESS: s.inProgress, RESOLVED: s.resolved, CLOSED: s.closed }[f.key])}</b>
          </button>
        ))}
      </div>

      {list.loading && !rows.length ? (
        <Card>Loading…</Card>
      ) : !rows.length ? (
        <Empty title="Nothing here" text="No help requests in this list." />
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Who</th><th>About</th><th>What they said</th>
                <th>Waiting since</th><th>Status</th><th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div><strong>{r.raiserName || '—'}</strong></div>
                    <div className="ad-dim">
                      {r.raiserType === 'WORKER' ? 'Worker' : 'Employer'}
                      {r.languageCode ? ` · ${LANGUAGE[r.languageCode] || r.languageCode}` : ''}
                    </div>
                    {r.raiserPhone ? (
                      <a className="ad-link" href={`tel:${r.raiserPhone}`}>{r.raiserPhone}</a>
                    ) : null}
                  </td>
                  <td>
                    <Badge tone="viewed">{SUPPORT_TOPIC_LABEL[r.topic] || r.topic}</Badge>
                    {r.callBack ? (
                      <div style={{ marginTop: 4 }}><Badge tone="rejected">Wants a call</Badge></div>
                    ) : null}
                  </td>
                  <td style={{ maxWidth: 320 }}>{r.message}</td>
                  <td>{formatDate(r.createdAt)}</td>
                  <td>
                    <Badge tone={SUPPORT_STATUS_TONE[r.status] || 'grey'}>
                      {SUPPORT_STATUS_LABEL[r.status] || r.status}
                    </Badge>
                    {r.assignedAdminName ? (
                      <div className="ad-dim">{r.assignedAdminName}</div>
                    ) : null}
                  </td>
                  <td>
                    <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={() => setOpen(r)}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open ? (
        <TicketModal ticket={open} onClose={() => setOpen(null)} act={act} />
      ) : null}
    </>
  )
}

/** One conversation, and everything the operator can do about it. */
function TicketModal({ ticket, onClose, act }) {
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async (fn) => {
    setBusy(true); setError('')
    try { await act(fn) } catch (e) {
      setError(e?.response?.data?.message || 'That did not go through.')
    } finally { setBusy(false) }
  }

  const send = (phoneCall) => run(async () => {
    const updated = await replySupportTicket(ticket.id, { body, phoneCall })
    setBody('')
    return updated
  })

  return (
    <Modal title={`Help request #${ticket.id}`} onClose={onClose} wide>
      <ErrorNote>{error}</ErrorNote>

      <div style={{ marginBottom: 12 }}>
      <Card>
        <div><strong>{ticket.raiserName}</strong> · {ticket.raiserType === 'WORKER' ? 'Worker' : 'Employer'}</div>
        {ticket.raiserPhone ? (
          <div style={{ margin: '6px 0' }}>
            <a className="mk-btn mk-btn-sm" href={`tel:${ticket.raiserPhone}`}>
              <Icon name="phone" size={14} /> Ring {ticket.raiserPhone}
            </a>
          </div>
        ) : null}
        <div className="ad-dim">
          {SUPPORT_TOPIC_LABEL[ticket.topic] || ticket.topic} · {formatDate(ticket.createdAt)}
          {ticket.languageCode ? ` · speaks ${LANGUAGE[ticket.languageCode] || ticket.languageCode}` : ''}
        </div>
        <p style={{ marginTop: 8 }}>{ticket.message}</p>
      </Card>
      </div>

      <div style={{ maxHeight: 240, overflowY: 'auto', marginBottom: 12 }}>
        {(ticket.messages || []).map((m) => (
          <div key={m.id} style={{ marginBottom: 10 }}>
            <div className="ad-dim">
              <strong>{m.authorType === 'ADMIN' ? (m.authorName || 'Our team') : ticket.raiserName}</strong>
              {' · '}{formatDate(m.createdAt)}
              {m.phoneCall ? ' · phoned them' : ''}
            </div>
            <div>{m.body || <em className="ad-dim">Spoke on the phone</em>}</div>
          </div>
        ))}
      </div>

      <textarea
        className="mk-input"
        rows={3}
        placeholder="Write a reply, or note what you said on the phone"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button className="mk-btn mk-btn-sm" disabled={busy || !body.trim()} onClick={() => send(false)}>
          Send reply
        </button>
        {/* A logged call needs no text: the call itself was the answer. */}
        <button className="mk-btn mk-btn-outline mk-btn-sm" disabled={busy} onClick={() => send(true)}>
          <Icon name="phone" size={14} /> Log a call
        </button>
        {!ticket.assignedAdminName ? (
          <button className="mk-btn mk-btn-outline mk-btn-sm" disabled={busy}
            onClick={() => run(() => assignSupportTicket(ticket.id))}>
            Take this
          </button>
        ) : null}
        {ticket.status !== 'RESOLVED' ? (
          <button className="mk-btn mk-btn-outline mk-btn-sm" disabled={busy}
            onClick={() => run(() => setSupportStatus(ticket.id, 'RESOLVED'))}>
            Mark sorted
          </button>
        ) : null}
        {ticket.status !== 'CLOSED' ? (
          <button className="mk-btn mk-btn-outline mk-btn-sm" disabled={busy}
            onClick={() => run(() => setSupportStatus(ticket.id, 'CLOSED'))}>
            Close
          </button>
        ) : null}
      </div>
    </Modal>
  )
}
