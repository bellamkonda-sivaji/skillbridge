import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { Loading, Empty, ErrorNote, PageHead } from '../components'
import { formatDate } from '../api'
import {
  getWorkerEarnings, listDestinations, requestPayout,
  money, toMinor, EARNING_STATUS, PAYOUT_STATUS,
} from '../../payments/razorpay'
import '../../payments/payments.css'
import { SpeakButton } from '../../a11y/SimpleMode'
import '../../a11y/a11y.css'

/**
 * What the worker has earned and what they can actually take out.
 *
 * The split between "ready to withdraw" and "reserved for you" is the most
 * important thing on this screen: money is ring-fenced against a job the moment
 * an offer is accepted, but it only becomes theirs once the work is signed off.
 * Showing one total would promise money they cannot have yet.
 */
export default function Earnings() {
  useDocumentTitle('Earnings')
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [dests, setDests] = useState([])
  const [error, setError] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)

  const load = () => {
    setData(null); setError('')
    Promise.all([getWorkerEarnings(), listDestinations().catch(() => [])])
      .then(([e, d]) => { setData(e); setDests(Array.isArray(d) ? d : []) })
      .catch(() => setError('We could not load your earnings.'))
  }
  useEffect(load, [])

  if (error && !data) return <><PageHead title="Earnings" /><ErrorNote onRetry={load}>{error}</ErrorNote></>
  if (!data) return <><PageHead title="Earnings" /><Loading rows={3} /></>

  const earnings = data.earnings || []
  const payouts = data.payouts || []
  const canWithdraw = (data.availableMinor || 0) > 0
  const verified = dests.filter((d) => d.verified)

  return (
    <>
      <PageHead title={t('a11y.money.title')} sub={t('a11y.money.sub')} />
      <ErrorNote onRetry={load}>{error}</ErrorNote>

      <div className="pm-balance">
        <div className="lbl">{t('a11y.money.ready')}</div>
        <div className="amt">{money(data.availableMinor)}</div>
        <div className="split">
          <div>
            <div className="k">{t('a11y.money.reserved')}</div>
            <div className="v">{money(data.pendingMinor)}</div>
          </div>
          <div>
            <div className="k">{t('a11y.money.lifetime')}</div>
            <div className="v">{money(data.lifetimeEarnedMinor)}</div>
          </div>
        </div>
        <div className="acts">
          <button
            className="mk-btn mk-btn-primary mk-btn-sm"
            disabled={!canWithdraw}
            onClick={() => setWithdrawing(true)}
          >
            <Icon name="wallet" size={15} /> {t('a11y.money.withdraw')}
          </button>
          <Link className="mk-btn mk-btn-outline mk-btn-sm" to="/worker/payout-methods">
            <Icon name="doc" size={15} /> {t('a11y.money.bank')}
          </Link>
        </div>
      </div>

      {!verified.length && (
        <div className="pm-note" style={{ marginTop: 14 }}>
          <span className="ic" aria-hidden="true"><Icon name="shield" size={14} /></span>
          <div>
            <div className="t">{t('a11y.money.addBank')}</div>
            <div className="d">
              {t('a11y.money.addBankText')}{' '}
              <Link className="wk-link" to="/worker/payout-methods">{t('a11y.money.addNow')}</Link>
            </div>
          </div>
        </div>
      )}

      <h2 className="wk-h2" style={{ marginTop: 24, marginBottom: 12 }}>{t('a11y.money.yourEarnings')}</h2>
      {earnings.length ? (
        <div className="wk-list">
          {earnings.map((e) => {
            const s = EARNING_STATUS[e.status] || { label: e.status, tone: 'viewed' }
            const label = t(`a11y.earning.${e.status}`, s.label)
            const hint = t(`a11y.earningHint.${e.status}`, s.hint || '')
            // Read aloud the way it matters: the amount first, then whether it is theirs yet.
            const spoken = [e.jobTitle, e.employerName, money(e.netMinor), label, hint]
              .filter(Boolean).join('. ')
            return (
              <div className="wk-card" key={e.id}>
                <div className="wk-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <SpeakButton text={spoken} />
                  <div className="grow">
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>{e.jobTitle}</div>
                    <div className="wk-sub" style={{ marginTop: 2 }}>{e.employerName}</div>
                    <span className={`wk-badge ${s.tone}`} style={{ marginTop: 8, display: 'inline-flex' }}>{label}</span>
                    {hint && <div className="wk-sub" style={{ marginTop: 6 }}>{hint}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>{money(e.netMinor)}</div>
                    {e.feeMinor > 0 && (
                      <div className="wk-sub" style={{ marginTop: 2 }}>
                        {t('a11y.money.lessFee', { gross: money(e.grossMinor), fee: money(e.feeMinor) })}
                      </div>
                    )}
                    {(e.paidAt || e.payableAt) && (
                      <div className="wk-sub">{formatDate(e.paidAt || e.payableAt)}</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="wk-card">
          <Empty icon="wallet" title={t('a11y.money.noEarnings')} text={t('a11y.money.noEarningsText')}>
            <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/worker/jobs">{t('a11y.money.findWork')}</Link>
          </Empty>
        </div>
      )}

      <h2 className="wk-h2" style={{ marginTop: 24, marginBottom: 12 }}>{t('a11y.money.withdrawals')}</h2>
      {payouts.length ? (
        <div className="wk-list">
          {payouts.map((p) => {
            const s = PAYOUT_STATUS[p.status] || { label: p.status, tone: 'viewed' }
            return (
              <div className="wk-card" key={p.id}>
                <div className="wk-row">
                  <div className="grow">
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                      {money(p.amountMinor)} to {p.destinationLabel || 'your account'}
                    </div>
                    <div className="wk-sub" style={{ marginTop: 2 }}>
                      {formatDate(p.processedAt || p.requestedAt, true)}
                    </div>
                    {p.failureReason && (
                      <div className="wk-sub" style={{ color: '#b91c1c', marginTop: 4 }}>{p.failureReason}</div>
                    )}
                  </div>
                  <span className={`wk-badge ${s.tone}`}>{s.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="wk-card">
          <Empty icon="wallet" title={t('a11y.money.noWithdrawals')} text={t('a11y.money.noWithdrawalsText')} />
        </div>
      )}

      {withdrawing && (
        <WithdrawDialog
          available={data.availableMinor}
          destinations={verified}
          onClose={() => setWithdrawing(false)}
          onDone={() => { setWithdrawing(false); load() }}
        />
      )}
    </>
  )
}

function WithdrawDialog({ available, destinations, onClose, onDone }) {
  const [amount, setAmount] = useState(String((available || 0) / 100))
  const [destId, setDestId] = useState(destinations.find((d) => d.isDefault)?.id || destinations[0]?.id || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const minor = toMinor(amount)
  const tooMuch = minor > available
  const valid = minor > 0 && !tooMuch && destId

  const submit = async () => {
    setBusy(true); setError('')
    try {
      await requestPayout(minor, destId)
      onDone()
    } catch (e) {
      setError(e?.response?.data?.message || 'We could not start that withdrawal. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="ad-scrim" onClick={onClose} aria-hidden="true" />
      <div className="ad-modal" role="dialog" aria-modal="true" aria-label="Withdraw money">
        <div className="ad-modal-head">
          <h2 className="wk-h2 grow" style={{ margin: 0 }}>Withdraw money</h2>
          <button className="ad-x" onClick={onClose} aria-label="Close"><Icon name="close" size={16} /></button>
        </div>
        <div className="ad-modal-body">
          {error && <div className="ad-error"><Icon name="shield" size={15} /><span>{error}</span></div>}

          <div className="pm-amount">
            <span className="cur">₹</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
              aria-label="Amount to withdraw"
            />
          </div>
          <div className="pm-quick">
            {[500, 1000, 2000].filter((v) => v * 100 <= available).map((v) => (
              <button key={v} onClick={() => setAmount(String(v))}>₹{v}</button>
            ))}
            <button onClick={() => setAmount(String(available / 100))}>All ({money(available)})</button>
          </div>
          {tooMuch && (
            <p className="wk-sub" style={{ color: '#b91c1c' }}>
              You have {money(available)} ready to withdraw.
            </p>
          )}

          <label className="wk-field" style={{ marginTop: 18 }}>
            <span className="lb">Send it to</span>
            <select className="wk-select" value={destId} onChange={(e) => setDestId(e.target.value)}>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.kind === 'UPI' ? d.vpa : `${d.accountHolderName} ····${d.accountNumberLast4}`}
                </option>
              ))}
            </select>
          </label>

          <p className="wk-sub">
            Money usually reaches your account within a few hours. You will see it here as soon as the bank confirms.
          </p>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button className="mk-btn mk-btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="mk-btn mk-btn-primary" onClick={submit} disabled={!valid || busy}>
              {busy ? 'Starting…' : `Withdraw ${money(minor)}`}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
