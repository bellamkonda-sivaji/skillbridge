import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import {
  getFinanceSummary, getLedger, listEscrows, listAdminPayouts,
  retryPayout, listOrders, listWebhooks, runReconcile, formatDate, num,
} from '../api'
import { usePagedList, useResource } from '../hooks'
import {
  PageHead, ErrorNote, Card, Badge, DataTable, Pager, Filters, Select,
  StatGrid, Empty, usePermissions,
} from '../components'
import { MetricCard } from '../charts'
import { money, ESCROW_STATUS, PAYOUT_STATUS } from '../../payments/razorpay'
import '../../payments/payments.css'

const TABS = [
  { value: 'summary', label: 'Summary' },
  { value: 'ledger', label: 'Ledger' },
  { value: 'escrows', label: 'Job escrows' },
  { value: 'payouts', label: 'Payouts' },
  { value: 'orders', label: 'Payment orders' },
  { value: 'webhooks', label: 'Webhooks' },
]

export default function Finance() {
  useDocumentTitle('Finance')
  const [tab, setTab] = useState('summary')
  return (
    <>
      <PageHead title="Finance" sub="The ledger, the escrow and every rupee in or out" />
      <div className="ad-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.value} className="ad-tab" role="tab" aria-selected={tab === t.value} onClick={() => setTab(t.value)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'summary' && <Summary />}
      {tab === 'ledger' && <Ledger />}
      {tab === 'escrows' && <Escrows />}
      {tab === 'payouts' && <Payouts />}
      {tab === 'orders' && <Orders />}
      {tab === 'webhooks' && <Webhooks />}
    </>
  )
}

/* ---------------------------------------------------------------- summary */

function Summary() {
  const { can } = usePermissions()
  const { data, error, loading, reload } = useResource(getFinanceSummary, [])
  const [recon, setRecon] = useState(null)
  const [busy, setBusy] = useState(false)

  const e = data?.escrow || {}
  const balanced = data ? data.unbalanced === false : null

  const reconcile = async () => {
    setBusy(true); setRecon(null)
    try { setRecon(await runReconcile()) }
    catch (err) { setRecon({ error: err?.response?.data?.message || 'Reconciliation failed.' }) }
    finally { setBusy(false) }
  }

  return (
    <>
      <ErrorNote onRetry={reload}>{error}</ErrorNote>

      {/* The single most important number on this screen: do the books balance? */}
      {data && (
        <div
          className="pm-note"
          style={balanced
            ? { borderColor: '#a7f3d0', background: '#ecfdf5', marginBottom: 14 }
            : { borderColor: '#fecaca', background: '#fef2f2', marginBottom: 14 }}
        >
          <span className="ic" style={balanced
            ? { color: '#047857', borderColor: '#a7f3d0' }
            : { color: '#b91c1c', borderColor: '#fecaca' }} aria-hidden="true">
            <Icon name={balanced ? 'check' : 'shield'} size={14} />
          </span>
          <div>
            <div className="t" style={{ color: balanced ? '#065f46' : '#991b1b' }}>
              {balanced ? 'The ledger balances' : 'The ledger does NOT balance'}
            </div>
            <div className="d">
              {balanced
                ? 'Every transaction posts equal debits and credits, so the books cannot have drifted.'
                : 'Debits and credits do not sum to zero across all accounts. This needs investigating before any payout.'}
            </div>
          </div>
        </div>
      )}

      <StatGrid>
        <MetricCard icon="wallet" tone="blue" label="Funded into escrow" value={e.funded} format={money} />
        <MetricCard icon="lock" tone="amber" label="Reserved for workers" value={e.reserved} format={money} />
        <MetricCard icon="checkCircle" tone="green" label="Released" value={e.released} format={money} />
        <MetricCard icon="doc" tone="slate" label="Refunded" value={e.refunded} format={money} />
        <MetricCard icon="rupee" tone="green" label="Platform revenue" value={data?.platformRevenueMinor} format={money} />
        <MetricCard icon="users" tone="violet" label="Owed to workers" value={data?.workerPayableMinor} format={money} />
        <MetricCard icon="doc" tone="amber" label="Tax liability" value={data?.taxLiabilityMinor} format={money} />
        <MetricCard icon="trending" tone="slate" label="External settlement" value={data?.externalSettlementMinor} format={money} />
      </StatGrid>

      {can('MANAGE_PAYMENTS') && (
        <Card title="Reconciliation">
          <p className="wk-sub" style={{ marginTop: 0 }}>
            A webhook can be lost — a deploy mid-delivery, a network partition, a rotated secret. When that
            happens the money has still moved and only the gateway knows. This asks the gateway about every
            order still open and makes our record match.
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
            <button className="mk-btn mk-btn-primary mk-btn-sm" onClick={reconcile} disabled={busy}>
              {busy ? 'Checking…' : 'Reconcile now'}
            </button>
            {recon && (
              <span className="wk-sub" style={{ marginTop: 0 }}>
                {recon.error ? recon.error
                  : recon.skipped ? recon.skipped
                  : `Checked ${num(recon.checked)}, updated ${num(recon.updated)}, abandoned ${num(recon.abandoned)}.`}
              </span>
            )}
          </div>
        </Card>
      )}
    </>
  )
}

/* ----------------------------------------------------------------- ledger */

function Ledger() {
  const list = usePagedList(getLedger, { accountType: '', kind: '', from: '', to: '' })
  return (
    <>
      <Filters q={list.filters.q} onQ={(v) => list.setFilter('q', v)} placeholder="Reference, memo or kind…" onReset={list.reset}>
        <input className="ad-select" type="date" value={list.filters.from || ''} onChange={(e) => list.setFilter('from', e.target.value)} aria-label="From" />
        <input className="ad-select" type="date" value={list.filters.to || ''} onChange={(e) => list.setFilter('to', e.target.value)} aria-label="To" />
      </Filters>
      <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>
      <div className="wk-card pad-lg">
        <DataTable
          loading={list.loading}
          cols={['Reference', 'When', 'Kind', 'Memo', 'Entries', 'Amount']}
          empty="No ledger transactions yet."
        >
          {list.rows.map((t) => {
            const total = t.amountMinor
            return (
              <tr key={t.id}>
                <td className="nm num">{t.reference}</td>
                <td className="num">{formatDate(t.createdAt, true)}</td>
                <td><Badge tone="viewed">{String(t.kind || '').replace(/_/g, ' ').toLowerCase()}</Badge></td>
                <td style={{ whiteSpace: 'normal', maxWidth: 260 }}>{t.memo || '—'}</td>
                <td>
                  <div className="pm-entries">
                    {(t.entries || []).map((x) => (
                      <div className="pm-entry" key={x.id}>
                        <span className={`side ${x.direction.toLowerCase()}`}>{x.direction === 'DEBIT' ? 'DR' : 'CR'}</span>
                        <span className="acct">{String(x.accountType || '').replace(/_/g, ' ').toLowerCase()}</span>
                        <span className="amt">{money(x.amountMinor)}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="num" style={{ fontWeight: 700 }}>{money(total)}</td>
              </tr>
            )
          })}
        </DataTable>
        <Pager {...list.meta} onPage={list.setPage} />
      </div>
    </>
  )
}

/* ---------------------------------------------------------------- escrows */

function Escrows() {
  const list = usePagedList(listEscrows, { status: '' })
  return (
    <>
      <Filters q={list.filters.q} onQ={(v) => list.setFilter('q', v)} placeholder="Job or company…" onReset={list.reset}>
        <Select value={list.filters.status} onChange={(v) => list.setFilter('status', v)}
          options={Object.keys(ESCROW_STATUS).map((k) => ({ value: k, label: ESCROW_STATUS[k].label }))}
          all="Any status" ariaLabel="Status" />
      </Filters>
      <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>
      <div className="wk-card pad-lg">
        <DataTable
          loading={list.loading}
          cols={['Job', 'Funded', 'Reserved', 'Released', 'Refunded', 'Available', 'Status', 'Provider', 'Funded at']}
          empty="No job escrows yet."
        >
          {list.rows.map((e) => {
            const avail = (e.fundedMinor || 0) - (e.reservedMinor || 0) - (e.releasedMinor || 0) - (e.refundedMinor || 0)
            const s = ESCROW_STATUS[e.status] || { label: e.status, tone: 'viewed' }
            return (
              <tr key={e.jobId}>
                <td><Link className="nm wk-link" to={`/admin/jobs/${e.jobId}`}>{e.jobTitle}</Link></td>
                <td className="num">{money(e.fundedMinor)}</td>
                <td className="num">{money(e.reservedMinor)}</td>
                <td className="num">{money(e.releasedMinor)}</td>
                <td className="num">{money(e.refundedMinor)}</td>
                <td className="num" style={{ fontWeight: 700 }}>{money(avail)}</td>
                <td><Badge tone={s.tone}>{s.label}</Badge></td>
                <td>{e.provider || '—'}</td>
                <td className="num">{e.fundedAt ? formatDate(e.fundedAt) : '—'}</td>
              </tr>
            )
          })}
        </DataTable>
        <Pager {...list.meta} onPage={list.setPage} />
      </div>
    </>
  )
}

/* ---------------------------------------------------------------- payouts */

function Payouts() {
  const { can } = usePermissions()
  const list = usePagedList(listAdminPayouts, { status: '' })
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')

  const retry = async (id) => {
    setBusy(id); setError('')
    try { await retryPayout(id); list.reload() }
    catch (e) { setError(e?.response?.data?.message || 'That retry did not go through.') }
    finally { setBusy(null) }
  }

  return (
    <>
      <Filters q={list.filters.q} onQ={(v) => list.setFilter('q', v)} placeholder="Worker or reference…" onReset={list.reset}>
        <Select value={list.filters.status} onChange={(v) => list.setFilter('status', v)}
          options={Object.keys(PAYOUT_STATUS).map((k) => ({ value: k, label: PAYOUT_STATUS[k].label }))}
          all="Any status" ariaLabel="Status" />
      </Filters>
      <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>
      {error && <div className="ad-error"><Icon name="shield" size={15} /><span>{error}</span></div>}
      <div className="wk-card pad-lg">
        <DataTable
          loading={list.loading}
          cols={['Requested', 'Worker', 'Destination', 'Amount', 'Status', 'Provider', 'Failure', '']}
          empty="No payouts requested yet."
        >
          {list.rows.map((p) => {
            const s = PAYOUT_STATUS[p.status] || { label: p.status, tone: 'viewed' }
            const failed = ['FAILED', 'RETURNED'].includes(p.status)
            return (
              <tr key={p.id}>
                <td className="num">{formatDate(p.requestedAt, true)}</td>
                <td className="nm">{p.workerName || `Worker #${p.workerId}`}</td>
                <td>{p.destinationLabel || '—'}</td>
                <td className="num" style={{ fontWeight: 700 }}>{money(p.amountMinor)}</td>
                <td><Badge tone={s.tone}>{s.label}</Badge></td>
                <td className="num">{p.providerPayoutId || p.provider || '—'}</td>
                <td style={{ whiteSpace: 'normal', maxWidth: 220 }}>{p.failureReason || '—'}</td>
                <td>
                  {failed && can('MANAGE_PAYMENTS') && (
                    <button className="mk-btn mk-btn-outline mk-btn-sm" disabled={busy === p.id} onClick={() => retry(p.id)}>
                      {busy === p.id ? '…' : 'Retry'}
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </DataTable>
        <Pager {...list.meta} onPage={list.setPage} />
      </div>
    </>
  )
}

/* ----------------------------------------------------------------- orders */

function Orders() {
  const list = usePagedList(listOrders, { status: '' })
  const TONE = { PAID: 'accepted', CREATED: 'pending', ATTEMPTED: 'interview', FAILED: 'rejected', ABANDONED: 'withdrawn' }
  return (
    <>
      <Filters q={list.filters.q} onQ={(v) => list.setFilter('q', v)} placeholder="Order or receipt…" onReset={list.reset}>
        <Select value={list.filters.status} onChange={(v) => list.setFilter('status', v)}
          options={['CREATED', 'ATTEMPTED', 'PAID', 'FAILED', 'ABANDONED']} all="Any status" ariaLabel="Status" />
      </Filters>
      <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>
      <div className="wk-card pad-lg">
        <DataTable
          loading={list.loading}
          cols={['Created', 'Receipt', 'Job', 'Amount', 'Status', 'Provider order', 'Provider payment']}
          empty="No payment orders yet. Orders appear when an employer starts an online payment."
        >
          {list.rows.map((o) => (
            <tr key={o.id}>
              <td className="num">{formatDate(o.createdAt, true)}</td>
              <td className="nm num">{o.receipt}</td>
              <td>{o.jobId ? <Link className="wk-link" to={`/admin/jobs/${o.jobId}`}>{o.jobTitle || `Job #${o.jobId}`}</Link> : '—'}</td>
              <td className="num">{money(o.amountMinor)}</td>
              <td><Badge tone={TONE[o.status] || 'viewed'}>{String(o.status || '').toLowerCase()}</Badge></td>
              <td className="num">{o.providerOrderId || '—'}</td>
              <td className="num">{o.providerPaymentId || '—'}</td>
            </tr>
          ))}
        </DataTable>
        <Pager {...list.meta} onPage={list.setPage} />
      </div>
    </>
  )
}

/* --------------------------------------------------------------- webhooks */

function Webhooks() {
  const list = usePagedList(listWebhooks, {})
  return (
    <>
      <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>
      <div className="wk-card pad-lg">
        <p className="wk-sub" style={{ marginTop: 0, marginBottom: 14 }}>
          Every delivery the gateway has made, signed or not. An unsigned event is stored for forensics
          and acted on by nothing — a webhook URL is public, and an endpoint that trusts unsigned events
          is one anyone on the internet can use to mark a job funded.
        </p>
        <DataTable
          loading={list.loading}
          cols={['Received', 'Event', 'Event id', 'Signature', 'Processed', 'Error']}
          empty="No webhook deliveries yet."
        >
          {list.rows.map((w) => (
            <tr key={w.id}>
              <td className="num">{formatDate(w.receivedAt, true)}</td>
              <td className="nm">{w.eventType}</td>
              <td className="num" style={{ fontSize: 12 }}>{w.eventId}</td>
              <td>
                {w.signatureOk
                  ? <Badge tone="accepted">Valid</Badge>
                  : <Badge tone="rejected">Rejected</Badge>}
              </td>
              <td className="num">{w.processedAt ? formatDate(w.processedAt, true) : <span className="ad-zero">—</span>}</td>
              <td style={{ whiteSpace: 'normal', maxWidth: 260 }}>{w.processError || '—'}</td>
            </tr>
          ))}
        </DataTable>
        <Pager {...list.meta} onPage={list.setPage} />
      </div>
    </>
  )
}
