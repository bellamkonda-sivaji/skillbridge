import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { Loading, Empty, ErrorNote, PageHead } from '../components'
import {
  listDestinations, addDestination, verifyDestination,
  makeDefaultDestination, removeDestination, VERIFICATION_STATUS,
} from '../../payments/razorpay'
import '../../payments/payments.css'

/**
 * Where a worker's money goes.
 *
 * Verification is a penny drop: a rupee is sent and the bank hands back the
 * name it holds on the account. That is the only check that catches a correctly
 * formed account number belonging to somebody else — a transposed digit that
 * still passes every format rule. A name mismatch is shown, never swallowed,
 * because the alternative is sending a day's wages to a stranger.
 */
export default function PayoutMethods() {
  useDocumentTitle('Bank & UPI')
  const [dests, setDests] = useState(null)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(null)

  const load = () => {
    setDests(null); setError('')
    listDestinations()
      .then((d) => setDests(Array.isArray(d) ? d : []))
      .catch(() => setError('We could not load your payment methods.'))
  }
  useEffect(load, [])

  const act = async (id, fn) => {
    setBusy(id); setError('')
    try { await fn(); load() }
    catch (e) { setError(e?.response?.data?.message || 'That did not work. Please try again.'); setBusy(null) }
  }

  return (
    <>
      <PageHead title="Bank &amp; UPI" sub="Where JobOn sends your money" back>
        <button className="mk-btn mk-btn-primary mk-btn-sm" onClick={() => setAdding(true)}>
          <Icon name="wallet" size={14} /> Add account
        </button>
      </PageHead>

      <ErrorNote onRetry={load}>{error}</ErrorNote>

      {!dests && !error ? <Loading rows={2} /> : dests?.length ? (
        <div className="wk-list">
          {dests.map((d) => {
            const v = VERIFICATION_STATUS[d.verificationStatus] || { label: d.verificationStatus, tone: 'viewed' }
            return (
              <div className={`pm-dest${d.isDefault ? ' is-default' : ''}`} key={d.id}>
                <span className="ic" aria-hidden="true">
                  <Icon name={d.kind === 'UPI' ? 'phone' : 'wallet'} size={16} />
                </span>
                <div className="bd">
                  <div className="t">
                    {d.kind === 'UPI' ? d.vpa : `${d.accountHolderName} ····${d.accountNumberLast4}`}
                  </div>
                  <div className="d">
                    {d.kind === 'UPI' ? 'UPI id' : `Bank account${d.ifsc ? ` · ${d.ifsc}` : ''}`}
                    {d.isDefault ? ' · Default' : ''}
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`wk-badge ${v.tone}`}>{v.label}</span>
                    {d.verifiedName && d.verificationStatus === 'VERIFIED' && (
                      <span className="wk-sub" style={{ marginTop: 0 }}>Bank name: {d.verifiedName}</span>
                    )}
                  </div>
                  {d.verificationStatus === 'NAME_MISMATCH' && (
                    <div className="pm-note" style={{ marginTop: 10 }}>
                      <span className="ic" aria-hidden="true"><Icon name="shield" size={14} /></span>
                      <div>
                        <div className="t">The name does not match</div>
                        <div className="d">
                          Your bank has this account under{' '}
                          <strong>{d.verifiedName || 'a different name'}</strong>. Check the number
                          carefully — paying the wrong account cannot be undone.
                        </div>
                      </div>
                    </div>
                  )}
                  {d.verificationNote && d.verificationStatus === 'FAILED' && (
                    <div className="wk-sub" style={{ color: '#b91c1c', marginTop: 6 }}>{d.verificationNote}</div>
                  )}

                  <div className="acts">
                    {!d.verified && (
                      <button
                        className="mk-btn mk-btn-primary mk-btn-sm"
                        disabled={busy === d.id}
                        onClick={() => act(d.id, () => verifyDestination(d.id))}
                      >
                        {busy === d.id ? 'Checking…' : 'Verify account'}
                      </button>
                    )}
                    {d.verified && !d.isDefault && (
                      <button
                        className="mk-btn mk-btn-outline mk-btn-sm"
                        disabled={busy === d.id}
                        onClick={() => act(d.id, () => makeDefaultDestination(d.id))}
                      >
                        Make default
                      </button>
                    )}
                    <button
                      className="mk-btn mk-btn-outline mk-btn-sm"
                      style={{ color: '#b91c1c', borderColor: '#fecaca' }}
                      disabled={busy === d.id}
                      onClick={() => {
                        if (window.confirm('Remove this payment method?')) act(d.id, () => removeDestination(d.id))
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        !error && (
          <div className="wk-card">
            <Empty
              icon="wallet"
              title="No payment method yet"
              text="Add a bank account or a UPI id so JobOn can send you your wages."
            >
              <button className="mk-btn mk-btn-primary mk-btn-sm" onClick={() => setAdding(true)}>Add account</button>
            </Empty>
          </div>
        )
      )}

      <div className="wk-card pad-lg" style={{ marginTop: 16 }}>
        <h2 className="wk-h2">How verification works</h2>
        <p className="wk-sub" style={{ marginTop: 6 }}>
          We send ₹1 to the account and read back the name your bank has on file. If it matches your
          name, the account is verified and you can withdraw to it. The ₹1 is ours, not yours.
        </p>
      </div>

      {adding && <AddDialog onClose={() => setAdding(false)} onDone={() => { setAdding(false); load() }} />}
    </>
  )
}

function AddDialog({ onClose, onDone }) {
  const [kind, setKind] = useState('UPI')
  const [form, setForm] = useState({ accountHolderName: '', accountNumber: '', confirmNumber: '', ifsc: '', vpa: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  const mismatch = kind === 'BANK' && form.confirmNumber && form.accountNumber !== form.confirmNumber
  const valid = kind === 'UPI'
    ? /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(form.vpa.trim())
    : form.accountHolderName.trim().length >= 2
      && form.accountNumber.length >= 6
      && form.accountNumber === form.confirmNumber
      && /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.ifsc.trim())

  const submit = async () => {
    setBusy(true); setError('')
    try {
      await addDestination({
        kind,
        accountHolderName: form.accountHolderName.trim() || undefined,
        accountNumber: kind === 'BANK' ? form.accountNumber.trim() : undefined,
        ifsc: kind === 'BANK' ? form.ifsc.trim().toUpperCase() : undefined,
        vpa: kind === 'UPI' ? form.vpa.trim() : undefined,
      })
      onDone()
    } catch (e) {
      setError(e?.response?.data?.message || 'We could not save that account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="ad-scrim" onClick={onClose} aria-hidden="true" />
      <div className="ad-modal" role="dialog" aria-modal="true" aria-label="Add a payment method">
        <div className="ad-modal-head">
          <h2 className="wk-h2 grow" style={{ margin: 0 }}>Add a payment method</h2>
          <button className="ad-x" onClick={onClose} aria-label="Close"><Icon name="close" size={16} /></button>
        </div>
        <div className="ad-modal-body">
          {error && <div className="ad-error"><Icon name="shield" size={15} /><span>{error}</span></div>}

          <div style={{ display: 'flex', gap: 9, marginBottom: 16 }}>
            {['UPI', 'BANK'].map((k) => (
              <button
                key={k}
                className={`mk-btn mk-btn-sm ${kind === k ? 'mk-btn-primary' : 'mk-btn-outline'}`}
                onClick={() => setKind(k)}
              >
                {k === 'UPI' ? 'UPI id' : 'Bank account'}
              </button>
            ))}
          </div>

          {kind === 'UPI' ? (
            <label className="wk-field">
              <span className="lb">UPI id</span>
              <input
                className="wk-input"
                placeholder="yourname@okaxis"
                autoCapitalize="none"
                value={form.vpa}
                onChange={(e) => set('vpa')(e.target.value)}
              />
            </label>
          ) : (
            <>
              <label className="wk-field">
                <span className="lb">Name on the account</span>
                <input className="wk-input" value={form.accountHolderName} onChange={(e) => set('accountHolderName')(e.target.value)} />
              </label>
              <label className="wk-field" style={{ marginTop: 14 }}>
                <span className="lb">Account number</span>
                <input className="wk-input" inputMode="numeric" value={form.accountNumber}
                  onChange={(e) => set('accountNumber')(e.target.value.replace(/\s/g, ''))} />
              </label>
              <label className="wk-field" style={{ marginTop: 14 }}>
                <span className="lb">Confirm account number</span>
                <input className="wk-input" inputMode="numeric" value={form.confirmNumber}
                  onChange={(e) => set('confirmNumber')(e.target.value.replace(/\s/g, ''))} />
                {mismatch && (
                  <span className="wk-sub" style={{ color: '#b91c1c' }}>The two numbers do not match.</span>
                )}
              </label>
              <label className="wk-field" style={{ marginTop: 14 }}>
                <span className="lb">IFSC code</span>
                <input className="wk-input" style={{ textTransform: 'uppercase' }} placeholder="SBIN0001234"
                  value={form.ifsc} onChange={(e) => set('ifsc')(e.target.value)} />
              </label>
            </>
          )}

          <p className="wk-sub">
            We store only the last four digits of an account number. Nothing here is shown to employers.
          </p>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button className="mk-btn mk-btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="mk-btn mk-btn-primary" onClick={submit} disabled={!valid || busy}>
              {busy ? 'Saving…' : 'Save account'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
