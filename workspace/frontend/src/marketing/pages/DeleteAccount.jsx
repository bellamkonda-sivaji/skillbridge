import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { Section, Card, Btn, PageHead, useDocumentTitle } from '../components'

/**
 * The account-deletion page Google Play asks for: how to delete from the app,
 * what is removed and what is kept, and a way to ask for it without the app.
 */
const EMPTY = { name: '', phone: '', accountType: 'WORKER', reason: '' }

export default function DeleteAccount() {
  useDocumentTitle('Delete your account')
  const [form, setForm] = useState(EMPTY)
  const [sent, setSent] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const { data } = await api.post('/public/account-deletion', form)
      setSent(data?.reference || 'received')
      setForm(EMPTY)
    } catch (err) {
      setError(err?.response?.data?.message || 'We could not send that. Please try again.')
    } finally { setBusy(false) }
  }

  return (
    <>
      <PageHead
        eyebrow="Your account"
        title="Delete your LocalWork account"
        sub="For both apps: LocalWork (for workers) and LocalWork for Shops (for businesses)."
      />

      <Section style={{ paddingTop: 8 }}>
        <div className="mk-grid mk-grid-2" style={{ gap: 32, alignItems: 'start' }}>
          <div>
            <Card>
              <h3 className="mk-h3">Delete it from the app</h3>
              <ol className="mk-mt-8" style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Open the LocalWork app and sign in.</li>
                <li>Go to <b>Me</b> (or <b>Business</b>) → <b>Settings</b>.</li>
                <li>Tap <b>Delete my account</b> and confirm.</li>
              </ol>
              <p className="mk-sub">It happens straight away and you are signed out.</p>
            </Card>

            <Card className="mk-mt-24">
              <h3 className="mk-h3">What is deleted</h3>
              <p className="mk-mt-8">
                Your name, mobile number, email, photo, date of birth, address and location, skills,
                uploaded documents, bank and UPI details, and your login. Your open applications are
                withdrawn and a business's open jobs are closed.
              </p>
              <h3 className="mk-h3 mk-mt-24">What is kept, and for how long</h3>
              <p className="mk-mt-8">
                Records of payments, earnings and completed work are kept without your name or
                contact details for up to 8 years, because tax and payment laws require it. Nothing
                that identifies you stays in them.
              </p>
              <p className="mk-sub">
                You cannot delete an account while work is still going on or money is still waiting
                for you (or, for a business, while money you added is unused). Finish or withdraw first.
              </p>
            </Card>
          </div>

          <Card>
            <h2 className="mk-h2" style={{ fontSize: 22 }}>No longer have the app?</h2>
            <p className="mk-sub mk-mt-0" style={{ marginBottom: 20 }}>
              Ask us here. We call the number to check it is you, then delete the account within 30 days.
            </p>

            {sent ? (
              <div className="mk-success" style={{ marginBottom: 18 }}>
                Request received (reference {sent}). We will call you to confirm, then delete the account.
              </div>
            ) : null}
            {error ? <div className="mk-error" style={{ marginBottom: 18, color: '#b91c1c' }}>{error}</div> : null}

            <form onSubmit={submit}>
              <div className="mk-field">
                <label htmlFor="d-phone">Mobile number you signed up with</label>
                <input id="d-phone" className="mk-input" required inputMode="tel" value={form.phone}
                  onChange={set('phone')} placeholder="98765 43210" autoComplete="tel" />
              </div>
              <div className="mk-field">
                <label htmlFor="d-name">Name</label>
                <input id="d-name" className="mk-input" value={form.name}
                  onChange={set('name')} placeholder="Your name (optional)" autoComplete="name" />
              </div>
              <div className="mk-field">
                <label htmlFor="d-type">Which account?</label>
                <select id="d-type" className="mk-select" value={form.accountType} onChange={set('accountType')}>
                  <option value="WORKER">Worker — LocalWork app</option>
                  <option value="EMPLOYER">Business — LocalWork for Shops</option>
                </select>
              </div>
              <div className="mk-field">
                <label htmlFor="d-reason">Anything you want to tell us?</label>
                <textarea id="d-reason" className="mk-textarea" value={form.reason}
                  onChange={set('reason')} placeholder="Optional" />
              </div>
              <Btn type="submit" className="mk-btn-block" disabled={busy}>
                {busy ? 'Sending…' : 'Request account deletion'}
              </Btn>
              <p className="mk-sub">
                See our <Link to="/legal/privacy">Privacy Policy</Link> and{' '}
                <Link to="/legal/terms">Terms of Service</Link>.
              </p>
            </form>
          </Card>
        </div>
      </Section>
    </>
  )
}
