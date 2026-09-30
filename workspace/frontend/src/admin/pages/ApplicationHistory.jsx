import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { Avatar, useDocumentTitle } from '../../marketing/components'
import {
  getApplicationHistory, logContact, money, pay, formatDate, num,
  stageOf, ACTOR_LABEL, CHANNELS, OUTCOMES, CHANNEL_LABEL, OUTCOME_LABEL, OUTCOME_TONE,
} from '../api'
import { useResource } from '../hooks'
import {
  PageHead, ErrorNote, Card, Badge, Phone, Modal, DataTable, Empty, usePermissions,
} from '../components'

const Row = ({ k, v }) => (
  <div className="r"><span className="k">{k}</span><span className="v">{v == null || v === '' ? '—' : v}</span></div>
)

/**
 * The whole story of one application in one place: who applied, whether anyone
 * called them, what the employer did, the interview, the offer, whether they
 * joined, the days they worked and whether the money actually went out.
 */
export default function ApplicationHistory() {
  const { applicationId } = useParams()
  const { can } = usePermissions()
  const { data, error, loading, reload } = useResource(
    () => getApplicationHistory(applicationId), [applicationId],
  )
  const [logging, setLogging] = useState(false)
  useDocumentTitle(data?.worker?.name ? `${data.worker.name} — history` : 'Application history')

  if (error && !data) return <ErrorNote onRetry={reload}>{error}</ErrorNote>
  if (loading && !data) return <div className="wk-card pad-lg"><div className="ad-skel" style={{ height: 220 }} /></div>

  const d = data || {}
  const worker = d.worker || {}
  const job = d.job || {}
  const emp = d.employer || {}
  const offer = d.offer
  const payment = d.payment || {}
  const attendance = d.attendance || []
  const timeline = d.timeline || []
  const stage = stageOf(d.currentStage)

  return (
    <>
      <PageHead
        title={worker.name || 'Application'}
        sub={`${job.title || ''}${emp.businessName ? ` · ${emp.businessName}` : ''}`}
        back={{ to: '/admin/applications', label: 'Back to applications' }}
      >
        {can('LOG_CONTACT') && (
          <button className="mk-btn mk-btn-primary mk-btn-sm" onClick={() => setLogging(true)}>
            <Icon name="phone" size={14} /> Log contact
          </button>
        )}
      </PageHead>

      <ErrorNote onRetry={reload}>{error}</ErrorNote>

      {/* ---------- at a glance ---------- */}
      <div className="wk-card pad-lg" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Avatar name={worker.name || '?'} size={54} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="wk-h2" style={{ margin: 0 }}>{worker.name}</span>
              <Badge tone={stage.tone}>{stage.label}</Badge>
              {d.contacted
                ? <Badge tone="accepted">Contacted {num(d.contactCount)}×</Badge>
                : <Badge tone="rejected">Never contacted</Badge>}
              {d.employerResponded
                ? <Badge tone="accepted">Employer responded</Badge>
                : <Badge tone="pending">Awaiting employer</Badge>}
            </div>
            <div className="wk-sub" style={{ marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Phone number={worker.phone} />
              {worker.rating ? <span>{Number(worker.rating).toFixed(1)}★</span> : null}
              {worker.skills?.length ? <span>{worker.skills.slice(0, 4).join(', ')}</span> : null}
            </div>
          </div>
          <div style={{ display: 'grid', gap: 4, textAlign: 'right' }}>
            <span className="wk-sub" style={{ marginTop: 0 }}>Application #{d.applicationId}</span>
            {payment.paid
              ? <span className="ad-ok">Paid {money(payment.amount)}</span>
              : offer?.status === 'ACCEPTED'
                ? <span className="ad-warn">Not paid yet</span>
                : <span className="ad-zero">No payment</span>}
          </div>
        </div>
      </div>

      <div className="ad-side">
        {/* ---------- the timeline ---------- */}
        <Card title="Tracking history" extra={<span className="wk-sub" style={{ marginTop: 0 }}>{timeline.length} events</span>}>
          {timeline.length ? (
            <div className="ad-timeline">
              {timeline.map((ev, i) => {
                const s = stageOf(ev.stage)
                return (
                  <div className={`ad-tl ${s.tone}`} key={`${ev.at}-${i}`}>
                    <span className="rail">
                      <span className="dot"><Icon name={s.icon} size={14} /></span>
                      <span className="line" />
                    </span>
                    <div className="bd">
                      <div className="t">{ev.label || s.label}</div>
                      {ev.detail && <div className="d">{ev.detail}</div>}
                      <div className="m">
                        <span>{formatDate(ev.at, true)}</span>
                        {ev.actor && <span>· {ev.actorName || ACTOR_LABEL[ev.actor] || ev.actor}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <Empty icon="clock" title="No events yet" text="The history fills in as the application moves along." />
          )}
        </Card>

        <div style={{ display: 'grid', gap: 14 }}>
          <Card title="Job">
            <div className="ad-kv">
              <Row k="Title" v={<Link className="wk-link" to={`/admin/jobs/${job.id}`}>{job.title}</Link>} />
              <Row k="Duration" v={job.engagementModel} />
              <Row k="Pay" v={job.salary != null ? pay(job.salary, job.salaryUnit) : null} />
              <Row k="Company" v={<Link className="wk-link" to={`/admin/companies/${emp.id}`}>{emp.businessName}</Link>} />
              <Row k="Employer contact" v={emp.contactName} />
              <Row k="Employer phone" v={<Phone number={emp.phone} />} />
            </div>
          </Card>

          <Card title="Offer">
            {offer ? (
              <div className="ad-kv">
                <Row k="Status" v={<Badge tone="offered">{offer.status?.toLowerCase()}</Badge>} />
                <Row k="Sent" v={formatDate(offer.sentAt, true)} />
                <Row k="Responded" v={offer.respondedAt ? formatDate(offer.respondedAt, true) : null} />
                <Row k="Agreed pay" v={offer.salary != null ? pay(offer.salary, offer.salaryUnit) : null} />
                <Row k="Worker pay" v={offer.estimatedWorkerPay != null ? money(offer.estimatedWorkerPay) : null} />
                <Row k="Platform fee" v={offer.platformFee != null ? money(offer.platformFee) : null} />
                <Row k="Employer total" v={offer.estimatedEmployerTotal != null ? money(offer.estimatedEmployerTotal) : null} />
              </div>
            ) : (
              <p className="wk-sub" style={{ marginTop: 0 }}>No offer has been sent for this application.</p>
            )}
          </Card>

          <Card title="Payment">
            {payment.paid ? (
              <div className="ad-kv">
                <Row k="Status" v={<span className="ad-ok">Released</span>} />
                <Row k="Amount" v={money(payment.amount)} />
                <Row k="Platform fee" v={payment.platformFee != null ? money(payment.platformFee) : null} />
                <Row k="Paid at" v={formatDate(payment.paidAt, true)} />
                <Row k="Reference" v={payment.reference} />
              </div>
            ) : (
              <p className="wk-sub" style={{ marginTop: 0 }}>
                {offer?.status === 'ACCEPTED'
                  ? 'The offer was accepted but no payment has been released yet.'
                  : 'No payment is due on this application yet.'}
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* ---------- attendance ---------- */}
      <div style={{ marginTop: 14 }}>
        <Card title="Attendance">
          <DataTable
            cols={['Date', 'Status', 'Check in', 'Check out', 'Hours', 'Approved']}
            empty="No attendance has been recorded for this engagement."
          >
            {attendance.map((a, i) => (
              <tr key={`${a.date}-${i}`}>
                <td className="num">{formatDate(a.date)}</td>
                <td><Badge tone={a.status === 'PRESENT' ? 'accepted' : a.status === 'ABSENT' ? 'rejected' : 'pending'}>{String(a.status || '').toLowerCase()}</Badge></td>
                <td className="num">{a.checkIn || '—'}</td>
                <td className="num">{a.checkOut || '—'}</td>
                <td className="num">{a.hours != null ? `${a.hours} h` : '—'}</td>
                <td>{a.approved ? <span className="ad-ok">Yes</span> : <span className="ad-warn">Pending</span>}</td>
              </tr>
            ))}
          </DataTable>
        </Card>
      </div>

      {/* ---------- contact log ---------- */}
      <div style={{ marginTop: 14 }}>
        <Card
          title="Contact log"
          extra={can('LOG_CONTACT') && (
            <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={() => setLogging(true)}>Log a contact</button>
          )}
        >
          <DataTable
            cols={['When', 'Channel', 'Outcome', 'Note', 'Logged by']}
            empty="Nobody has contacted this candidate yet."
          >
            {(d.contacts || []).map((c) => (
              <tr key={c.id}>
                <td className="num">{formatDate(c.contactedAt, true)}</td>
                <td>{CHANNEL_LABEL[c.channel] || c.channel}</td>
                <td><Badge tone={OUTCOME_TONE[c.outcome] || 'viewed'}>{OUTCOME_LABEL[c.outcome] || c.outcome}</Badge></td>
                <td style={{ whiteSpace: 'normal', maxWidth: 320 }}>{c.note || <span className="ad-zero">—</span>}</td>
                <td>{c.contactedByName}</td>
              </tr>
            ))}
          </DataTable>
        </Card>
      </div>

      {logging && (
        <ContactModal
          applicationId={applicationId}
          workerName={worker.name}
          onClose={() => setLogging(false)}
          onSaved={() => { setLogging(false); reload() }}
        />
      )}
    </>
  )
}

function ContactModal({ applicationId, workerName, onClose, onSaved }) {
  const [form, setForm] = useState({ channel: 'CALL', outcome: 'REACHED', note: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setBusy(true); setError('')
    try {
      await logContact(applicationId, form)
      onSaved()
    } catch (e) {
      setError(e?.response?.data?.message || 'We could not save that. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={`Log contact with ${workerName || 'candidate'}`} onClose={onClose}>
      {error && <div className="ad-error"><Icon name="shield" size={15} /><span>{error}</span></div>}

      <label className="ad-field">
        <span>How did you reach out?</span>
        <select className="ad-input" value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}>
          {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </label>

      <label className="ad-field">
        <span>What happened?</span>
        <select className="ad-input" value={form.outcome} onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))}>
          {OUTCOMES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>

      <label className="ad-field">
        <span>Note (optional)</span>
        <textarea
          className="ad-input"
          rows={3}
          placeholder="Anything worth remembering for the next call."
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
        />
      </label>

      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <button className="mk-btn mk-btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="mk-btn mk-btn-primary" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save contact'}
        </button>
      </div>
    </Modal>
  )
}
