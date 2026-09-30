import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { useDocumentTitle } from '../../../marketing/components'
import { Loading, Empty, ErrorNote, PageHead } from '../../../worker/components'
import { formatDate } from '../api'
import {
  getBilling, getEscrow, createOrder, fundManually, payForJob,
  getPaymentConfig, money, toMinor, ESCROW_STATUS,
} from '../../../payments/razorpay'
import '../../../payments/payments.css'

/** Funded → reserved → released, drawn to scale. */
function EscrowBar({ e }) {
  const funded = Number(e.fundedMinor) || 0
  const w = (v) => (funded ? `${(Math.max(Number(v) || 0, 0) / funded) * 100}%` : '0%')
  if (!funded) {
    return <p className="wk-sub" style={{ marginTop: 0 }}>Nothing funded against this job yet.</p>
  }
  return (
    <>
      <div className="pm-escrow-bar">
        <span className="released" style={{ width: w(e.releasedMinor) }} />
        <span className="reserved" style={{ width: w(e.reservedMinor) }} />
        <span className="refunded" style={{ width: w(e.refundedMinor) }} />
        <span className="free" style={{ width: w(funded - (e.reservedMinor || 0) - (e.releasedMinor || 0) - (e.refundedMinor || 0)) }} />
      </div>
      <div className="pm-escrow-key">
        <span><i style={{ background: '#10b981' }} />Paid out {money(e.releasedMinor)}</span>
        <span><i style={{ background: '#f59e0b' }} />Held for workers {money(e.reservedMinor)}</span>
        {e.refundedMinor > 0 && <span><i style={{ background: '#94a3b8' }} />Refunded {money(e.refundedMinor)}</span>}
        <span><i style={{ background: 'var(--blue-100)' }} />Available {money(funded - (e.reservedMinor || 0) - (e.releasedMinor || 0) - (e.refundedMinor || 0))}</span>
      </div>
    </>
  )
}

/** The employer's money overview: what is funded against each job and what is left. */
export default function Billing() {
  useDocumentTitle('Billing')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    setData(null); setError('')
    getBilling().then(setData).catch(() => setError('We could not load your billing.'))
  }
  useEffect(load, [])

  if (error && !data) return <><PageHead title="Billing" /><ErrorNote onRetry={load}>{error}</ErrorNote></>
  if (!data) return <><PageHead title="Billing" /><Loading rows={3} /></>

  const jobs = data.jobs || []

  return (
    <>
      <PageHead title="Billing" sub="Money you have put in, and where it has gone" />
      <ErrorNote onRetry={load}>{error}</ErrorNote>

      <div className="pm-balance">
        <div className="lbl">Wallet balance</div>
        <div className="amt">{money(data.walletBalanceMinor)}</div>
        <div className="split">
          <div><div className="k">Funded into jobs</div><div className="v">{money(data.totalFundedMinor)}</div></div>
          <div><div className="k">Held for workers</div><div className="v">{money(data.totalReservedMinor)}</div></div>
          <div><div className="k">Paid out</div><div className="v">{money(data.totalReleasedMinor)}</div></div>
          <div><div className="k">JobOn fees</div><div className="v">{money(data.platformFeesMinor)}</div></div>
        </div>
      </div>

      <h2 className="wk-h2" style={{ marginTop: 24, marginBottom: 12 }}>Funding by job</h2>
      {jobs.length ? (
        <div className="wk-list">
          {jobs.map((e) => {
            const s = ESCROW_STATUS[e.status] || { label: e.status, tone: 'viewed' }
            return (
              <div className="wk-card pad-lg" key={e.jobId}>
                <div className="wk-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 14 }}>
                  <div className="grow">
                    <Link className="wk-link" style={{ fontSize: 15, fontWeight: 700 }} to={`/employer/jobs/${e.jobId}`}>
                      {e.jobTitle}
                    </Link>
                    <div className="wk-sub" style={{ marginTop: 2 }}>
                      Funded {money(e.fundedMinor)}
                      {e.fundedAt ? ` on ${formatDate(e.fundedAt)}` : ''}
                    </div>
                  </div>
                  <span className={`wk-badge ${s.tone}`}>{s.label}</span>
                  <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/employer/jobs/${e.jobId}/fund`}>
                    Add money
                  </Link>
                </div>
                <EscrowBar e={e} />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="wk-card">
          <Empty icon="wallet" title="Nothing funded yet"
            text="Fund a job and the money is held safely until the work is done.">
            <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/employer/jobs">Go to my jobs</Link>
          </Empty>
        </div>
      )}
    </>
  )
}

/**
 * Funding one job.
 *
 * Nothing here believes the browser. The checkout hands back a signature, we
 * pass it to the server for checking, and then we read the escrow back — it is
 * the server's record, updated by the signed webhook, that decides whether the
 * job is funded.
 */
export function FundJob() {
  const { jobId } = useParams()
  useDocumentTitle('Fund this job')
  const [escrow, setEscrow] = useState(null)
  const [config, setConfig] = useState(null)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState('')

  const load = () => {
    setError('')
    Promise.all([getEscrow(jobId), getPaymentConfig().catch(() => ({ razorpayEnabled: false }))])
      .then(([e, c]) => {
        setEscrow(e); setConfig(c)
        if (!amount && !e?.fundedMinor) setAmount('5000')
      })
      .catch(() => setError('We could not load this job’s funding.'))
  }
  useEffect(load, [jobId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error && !escrow) return <ErrorNote onRetry={load}>{error}</ErrorNote>
  if (!escrow || !config) return <Loading rows={3} />

  const minor = toMinor(amount)
  const valid = minor > 0
  const gatewayReady = !!config.razorpayEnabled

  const payOnline = async () => {
    setBusy(true); setError(''); setDone('')
    try {
      const r = await payForJob({
        jobId, amountMinor: minor, config, jobTitle: escrow.jobTitle,
      })
      if (r.dismissed) { setError('The payment window was closed before it finished.'); return }
      setEscrow(r.escrow)
      setDone(r.escrow?.status === 'UNFUNDED'
        ? 'We have your payment and are waiting for the bank to confirm it. This page updates once it does.'
        : 'Payment received. The money is now held against this job.')
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'The payment did not go through.')
    } finally {
      setBusy(false)
    }
  }

  const payManually = async () => {
    setBusy(true); setError(''); setDone('')
    try {
      setEscrow(await fundManually(jobId, minor))
      setDone('Funded. The money is now held against this job.')
    } catch (e) {
      setError(e?.response?.data?.message || 'We could not record that funding.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Link className="wk-link" to="/employer/billing" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
        <Icon name="chevronLeft" size={15} /> Back to billing
      </Link>

      <PageHead title="Fund this job" sub={escrow.jobTitle} />

      {error && <ErrorNote>{error}</ErrorNote>}
      {done && (
        <div className="pm-note" style={{ borderColor: '#a7f3d0', background: '#ecfdf5', marginBottom: 14 }}>
          <span className="ic" style={{ color: '#047857', borderColor: '#a7f3d0' }} aria-hidden="true">
            <Icon name="check" size={14} />
          </span>
          <div><div className="t" style={{ color: '#065f46' }}>Done</div><div className="d">{done}</div></div>
        </div>
      )}

      <div className="wk-card pad-lg">
        <h2 className="wk-h2" style={{ marginBottom: 12 }}>Currently funded</h2>
        <EscrowBar e={escrow} />
      </div>

      <div className="wk-card pad-lg" style={{ marginTop: 14 }}>
        <h2 className="wk-h2" style={{ marginBottom: 6 }}>How much do you want to add?</h2>
        <p className="wk-sub" style={{ marginTop: 0, marginBottom: 14 }}>
          The money is held by JobOn and only reaches a worker once the work is done.
          Anything unused comes back to you.
        </p>

        <div className="pm-amount">
          <span className="cur">₹</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            aria-label="Amount to fund"
          />
        </div>
        <div className="pm-quick">
          {[2000, 5000, 10000, 25000].map((v) => (
            <button key={v} onClick={() => setAmount(String(v))}>₹{v.toLocaleString('en-IN')}</button>
          ))}
        </div>

        {!gatewayReady && (
          <div className="pm-note" style={{ marginTop: 18 }}>
            <span className="ic" aria-hidden="true"><Icon name="shield" size={14} /></span>
            <div>
              <div className="t">Online payment is not set up on this server yet</div>
              <div className="d">
                No payment gateway keys are configured, so card and UPI checkout is unavailable.
                You can still record funding here — it posts exactly the same entries to the ledger.
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          {gatewayReady ? (
            <button className="mk-btn mk-btn-primary" disabled={!valid || busy} onClick={payOnline}>
              {busy ? 'Opening checkout…' : `Pay ${money(minor)}`}
            </button>
          ) : (
            <button className="mk-btn mk-btn-primary" disabled={!valid || busy} onClick={payManually}>
              {busy ? 'Recording…' : `Record ${money(minor)} funding`}
            </button>
          )}
          <Link className="mk-btn mk-btn-outline" to="/employer/billing">Cancel</Link>
        </div>
      </div>
    </>
  )
}
