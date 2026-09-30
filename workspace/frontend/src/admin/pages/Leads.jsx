import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import {
  listLeads, updateLead, convertLead, formatDate, timeAgo, num,
  LEAD_SOURCE, LEAD_STATUS, LEAD_INTENT,
} from '../api'
import { usePagedList } from '../hooks'
import {
  PageHead, ErrorNote, Badge, Empty, Modal, Filters, Select, Pager, Phone, usePermissions,
} from '../components'

const STATUSES = Object.entries(LEAD_STATUS).map(([value, v]) => ({ value, label: v.label }))
const SOURCES = Object.entries(LEAD_SOURCE).map(([value, v]) => ({ value, label: v.label }))

/**
 * People who reached us without ever opening the app — a missed call, a
 * WhatsApp message, someone who walked into the office. For most of the
 * workforce this is the only way in, so it is a first-class inbox rather than
 * a support queue.
 */
export default function Leads() {
  useDocumentTitle('Enquiries')
  const { can } = usePermissions()
  const list = usePagedList(listLeads, { status: '', source: '' })
  const [converting, setConverting] = useState(null)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')

  const setStatus = async (lead, status) => {
    setBusy(lead.id); setError('')
    try { await updateLead(lead.id, { status }); list.reload() }
    catch (e) { setError(e?.response?.data?.message || 'That change did not save.') }
    finally { setBusy(null) }
  }

  const newCount = list.rows.filter((l) => l.status === 'NEW').length

  return (
    <>
      <PageHead
        title="Enquiries"
        sub="Missed calls, WhatsApp messages and walk-ins — people with no app"
      >
        {newCount > 0 && <Badge tone="rejected">{num(newCount)} new on this page</Badge>}
      </PageHead>

      <Filters q={list.filters.q} onQ={(v) => list.setFilter('q', v)} placeholder="Name, number or message…" onReset={list.reset}>
        <Select value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={STATUSES} all="Any status" ariaLabel="Status" />
        <Select value={list.filters.source} onChange={(v) => list.setFilter('source', v)} options={SOURCES} all="Any source" ariaLabel="Source" />
      </Filters>

      <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>
      {error && <div className="ad-error"><Icon name="shield" size={15} /><span>{error}</span></div>}

      {list.loading && !list.rows.length ? (
        <div className="wk-card pad-lg"><div className="ad-skel" style={{ height: 160 }} /></div>
      ) : list.rows.length ? (
        <div className="cq-list">
          {list.rows.map((l) => {
            const src = LEAD_SOURCE[l.source] || { label: l.source, icon: 'chat' }
            const st = LEAD_STATUS[l.status] || { label: l.status, tone: 'viewed' }
            return (
              <div className={`cq-row${l.status === 'NEW' ? ' high' : ''}`} key={l.id}>
                <span className="cq-ic viewed" aria-hidden="true"><Icon name={src.icon} size={17} /></span>

                <div className="cq-body">
                  <div className="cq-top">
                    <span className="who">{l.name || 'Unknown caller'}</span>
                    <Badge tone={st.tone}>{st.label}</Badge>
                    <span className="wk-sub" style={{ marginTop: 0 }}>{src.label} · {timeAgo(l.createdAt)}</span>
                  </div>
                  {l.message
                    ? <div className="cq-why">{l.message}</div>
                    : <div className="cq-why" style={{ color: 'var(--muted)' }}>
                        No message — just a missed call. Ring them to find out what they want.
                      </div>}
                  <div className="cq-meta">
                    <span>{LEAD_INTENT[l.intent] || 'Not known yet'}</span>
                    {l.workerId && <Link className="wk-link" to="/admin/skills">· now a worker</Link>}
                    {l.employerId && <Link className="wk-link" to={`/admin/companies/${l.employerId}`}>· now a company</Link>}
                  </div>
                </div>

                <div className="cq-acts">
                  {l.phone && (
                    <a className="cq-call" href={`tel:+91${l.phone}`}>
                      <Icon name="phone" size={18} /><span>{l.phone}</span>
                    </a>
                  )}
                  {l.status === 'NEW' && (
                    <button className="mk-btn mk-btn-outline mk-btn-sm" disabled={busy === l.id}
                      onClick={() => setStatus(l, 'CONTACTED')}>
                      Mark called
                    </button>
                  )}
                  {l.status !== 'CONVERTED' && can('MANAGE_APPLICATIONS') && (
                    <button className="mk-btn mk-btn-primary mk-btn-sm" onClick={() => setConverting(l)}>
                      Sign them up
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="wk-card pad-lg">
          <Empty icon="chat" title="No enquiries" text="Missed calls and WhatsApp messages will land here." />
        </div>
      )}

      <Pager {...list.meta} onPage={list.setPage} />

      {converting && (
        <ConvertLead lead={converting} onClose={() => setConverting(null)}
          onDone={() => { setConverting(null); list.reload() }} />
      )}
    </>
  )
}

/** Turning an enquiry into a real account, filled in by the operator on the call. */
function ConvertLead({ lead, onClose, onDone }) {
  const [type, setType] = useState(lead.intent === 'WANT_TO_HIRE' ? 'EMPLOYER' : 'WORKER')
  const [form, setForm] = useState({
    name: lead.name || '', phone: lead.phone || '', city: 'Tirupati', area: '',
    skills: '', expectedSalary: '', businessName: lead.name || '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    setBusy(true); setError('')
    try {
      await convertLead(lead.id, {
        type,
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, ''),
        city: form.city.trim() || undefined,
        area: form.area.trim() || undefined,
        businessName: type === 'EMPLOYER' ? form.businessName.trim() : undefined,
        skills: type === 'WORKER'
          ? form.skills.split(',').map((x) => x.trim()).filter(Boolean)
          : undefined,
        expectedSalary: form.expectedSalary ? Number(form.expectedSalary) : undefined,
        salaryUnit: form.expectedSalary ? 'DAILY' : undefined,
      })
      onDone()
    } catch (e) {
      setError(e?.response?.data?.message || 'We could not sign them up.')
    } finally {
      setBusy(false)
    }
  }

  const valid = form.name.trim().length >= 2 && form.phone.replace(/\D/g, '').length === 10

  return (
    <Modal title="Sign them up" onClose={onClose}>
      {error && <div className="ad-error"><Icon name="shield" size={15} /><span>{error}</span></div>}

      <p className="wk-sub" style={{ marginTop: 0 }}>
        Fill this in while you are on the call. They never have to touch a phone screen.
      </p>

      <div style={{ display: 'flex', gap: 9, margin: '14px 0' }}>
        {[['WORKER', 'Wants work'], ['EMPLOYER', 'Wants to hire']].map(([v, label]) => (
          <button key={v} className={`mk-btn mk-btn-sm ${type === v ? 'mk-btn-primary' : 'mk-btn-outline'}`}
            onClick={() => setType(v)}>{label}</button>
        ))}
      </div>

      <label className="ad-field">
        <span>{type === 'EMPLOYER' ? 'Owner’s name' : 'Name'}</span>
        <input className="ad-input" value={form.name} onChange={(e) => set('name')(e.target.value)} />
      </label>
      {type === 'EMPLOYER' && (
        <label className="ad-field">
          <span>Shop or business name</span>
          <input className="ad-input" value={form.businessName} onChange={(e) => set('businessName')(e.target.value)} />
        </label>
      )}
      <label className="ad-field">
        <span>Mobile number</span>
        <input className="ad-input" inputMode="numeric" value={form.phone} onChange={(e) => set('phone')(e.target.value)} />
      </label>
      <div className="wk-form" style={{ gap: 12 }}>
        <label className="ad-field"><span>Town</span>
          <input className="ad-input" value={form.city} onChange={(e) => set('city')(e.target.value)} /></label>
        <label className="ad-field"><span>Area</span>
          <input className="ad-input" value={form.area} onChange={(e) => set('area')(e.target.value)} /></label>
      </div>
      {type === 'WORKER' && (
        <>
          <label className="ad-field">
            <span>What work can they do?</span>
            <input className="ad-input" placeholder="Loading, Packing, Driving"
              value={form.skills} onChange={(e) => set('skills')(e.target.value)} />
          </label>
          <label className="ad-field">
            <span>Pay they expect (₹ per day)</span>
            <input className="ad-input" inputMode="numeric" value={form.expectedSalary}
              onChange={(e) => set('expectedSalary')(e.target.value)} />
          </label>
        </>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className="mk-btn mk-btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="mk-btn mk-btn-primary" onClick={save} disabled={!valid || busy}>
          {busy ? 'Signing up…' : 'Sign them up'}
        </button>
      </div>
    </Modal>
  )
}
