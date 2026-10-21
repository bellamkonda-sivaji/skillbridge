import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../../marketing/components'
import { listHires, releaseHire, money, formatDate } from '../api'
import { DataTable, PageHead, ErrorNote, Badge, StatGrid, StatTile, usePermissions } from '../components'

/**
 * Every hire from offer to payout, and the one decision JobOn makes on it:
 * the shop owner says the work is done, and an admin releases the worker's money.
 */
const STAGE_TONE = {
  'Hired - not started': 'pending',
  'Joining confirmed': 'shortlisted',
  Working: 'offered',
  'Completed - release payment': 'rejected',
  Paid: 'accepted',
  Ended: 'withdrawn',
}

const PAYMENT_LABEL = {
  HELD_IN_ESCROW: 'Held safely',
  WAITING_FOR_RELEASE: 'Waiting for you',
  RELEASED: 'Released',
  WITHDRAWN: 'Withdrawn by worker',
  NONE: 'Not funded',
  FAILED: 'Failed',
  REVERSED: 'Reversed',
}

const rupees = (minor) => money(Math.round((minor || 0) / 100))

export default function Hires() {
  useDocumentTitle('Hires & payouts')
  const { can } = usePermissions()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const [done, setDone] = useState('')

  const load = useCallback(async () => {
    setError('')
    try { setRows(await listHires()) } catch (e) {
      setError(e?.response?.data?.message || 'Could not load hires.')
      setRows([])
    }
  }, [])

  useEffect(() => { load() }, [load])

  const release = async (h) => {
    if (!window.confirm(`Release ${rupees(h.netMinor)} to ${h.workerName} for "${h.jobTitle}"?`)) return
    setBusy(h.employmentId); setError(''); setDone('')
    try {
      await releaseHire(h.employmentId)
      setDone(`${rupees(h.netMinor)} released to ${h.workerName}. They have been told.`)
      await load()
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not release this payment.')
    } finally { setBusy(null) }
  }

  const list = rows || []
  const waiting = list.filter((h) => h.paymentStatus === 'WAITING_FOR_RELEASE')
  const working = list.filter((h) => h.status === 'ACTIVE' || h.status === 'JOINING_CONFIRMED')

  return (
    <>
      <PageHead title="Hires & payouts" sub="Every hire from offer to payment. Release a worker's money once the shop says the work is done." />

      <StatGrid>
        <StatTile icon="rupee" tone="amber" label="Waiting for release" value={waiting.length} />
        <StatTile icon="wallet" tone="green" label="Money waiting" value={rupees(waiting.reduce((a, h) => a + h.netMinor, 0))} />
        <StatTile icon="users" tone="blue" label="Working now" value={working.length} />
        <StatTile icon="doc" tone="slate" label="All hires" value={list.length} />
      </StatGrid>

      <ErrorNote onRetry={load}>{error}</ErrorNote>
      {done ? <div className="wk-card pad" style={{ background: '#ecfdf5', color: '#047857', fontWeight: 700, marginBottom: 16 }}>✓ {done}</div> : null}

      <div className="wk-card pad-lg">
        <DataTable
          loading={rows === null}
          cols={['Worker', 'Job', 'Stage', 'Offer → accepted', 'Started', 'Days worked', 'Completed', 'Worker gets', 'Money', '']}
          empty="No hires yet."
        >
          {list.map((h) => (
            <tr key={h.employmentId}>
              <td>
                <div style={{ fontWeight: 700 }}>{h.workerName}</div>
                <div className="sb">{h.workerPhone}</div>
              </td>
              <td>
                <Link className="wk-link" to={`/admin/jobs/${h.jobId}`}>{h.jobTitle}</Link>
                <div className="sb">
                  <Link className="wk-link" to={`/admin/companies/${h.employerId}`}>{h.businessName}</Link>
                </div>
              </td>
              <td><Badge tone={STAGE_TONE[h.stage] || 'viewed'}>{h.stage}</Badge></td>
              <td className="num">
                {h.offeredAt ? formatDate(h.offeredAt) : '—'}
                <div className="sb">{h.acceptedAt ? `accepted ${formatDate(h.acceptedAt)}` : ''}</div>
              </td>
              <td className="num">{h.startedAt ? formatDate(h.startedAt, true) : `due ${formatDate(h.joiningDate)}`}</td>
              <td className="num">{h.daysWorked}</td>
              <td className="num">{h.completedAt ? formatDate(h.completedAt, true) : '—'}</td>
              <td className="num" style={{ fontWeight: 700 }}>
                {rupees(h.netMinor)}
                <div className="sb">of {rupees(h.grossMinor)} · fee {rupees(h.feeMinor)}</div>
              </td>
              <td>{PAYMENT_LABEL[h.paymentStatus] || h.paymentStatus}</td>
              <td>
                {h.paymentStatus === 'WAITING_FOR_RELEASE' && can('MANAGE_PAYMENTS') ? (
                  <button type="button" className="mk-btn mk-btn-primary mk-btn-sm" disabled={busy === h.employmentId}
                    onClick={() => release(h)}>
                    {busy === h.employmentId ? 'Releasing…' : 'Release payment'}
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    </>
  )
}
