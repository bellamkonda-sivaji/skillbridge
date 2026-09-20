import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import api, { errMsg } from '../../api'
import { useAuth } from '../../context/AuthContext'
import {
  ObShell, ObCard, ObHead, Stepper, Field, PhoneField, PasswordField, Alert,
} from '../components'
import { useOnboarding } from '../OnboardingContext'

const digits = (s) => (s || '').replace(/\D/g, '')

export default function CreateAccount() {
  useDocumentTitle('Create your account')
  const navigate = useNavigate()
  const { register } = useAuth()
  const { draft, setDraft } = useOnboarding()

  const [form, setForm] = useState({
    name: draft.name || '',
    phone: draft.phone || '',
    email: draft.email || '',
    password: '',
  })
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState({})
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)
  const [social, setSocial] = useState('')

  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (form.name.trim().length < 2) e.name = 'Please enter your full name'
    if (digits(form.phone).length !== 10) e.phone = 'Enter a 10-digit mobile number'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'That email does not look right'
    if (form.password.length < 6) e.password = 'Use at least 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev) => {
    ev.preventDefault()
    setFailure('')
    if (!validate()) return
    if (!agreed) { setFailure('Please accept the Terms & Conditions to continue.'); return }

    setBusy(true)
    const phone = digits(form.phone)
    try {
      const accountType = draft.role || 'WORKER'
      await register(accountType, {
        name: form.name.trim(),
        phone,
        email: form.email.trim() || null,
        password: form.password,
        locale: draft.locale || 'en',
      })

      // Send the verification code, then move to the OTP screen.
      let devCode = ''
      try {
        const res = await api.post(`/${accountType.toLowerCase()}/auth/otp/request`, { phone })
        devCode = res.data?.devCode || ''
      } catch {
        // The account exists; the OTP screen offers a resend if this failed.
      }

      setDraft({ name: form.name.trim(), phone, email: form.email.trim() })
      navigate('/join/verify', { state: { devCode } })
    } catch (err) {
      setFailure(errMsg(err, 'We could not create your account. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ObShell>
      <ObCard>
        <Stepper steps={['Account', 'Verify', 'Profile']} current={0} />
        <ObHead title="Create your account" sub="Let’s get started! It only takes a minute." />

        <Alert>{failure}</Alert>
        {social && <Alert kind="info">{social}</Alert>}

        <form onSubmit={submit} noValidate>
          <Field label="Full Name" htmlFor="ca-name" error={errors.name}>
            <input
              id="ca-name"
              className="ob-input"
              autoComplete="name"
              placeholder="Enter your full name"
              aria-invalid={errors.name ? 'true' : undefined}
              value={form.name}
              onChange={(e) => set('name')(e.target.value)}
            />
          </Field>

          <Field label="Mobile Number" htmlFor="ca-phone" error={errors.phone}>
            <PhoneField id="ca-phone" value={form.phone} onChange={set('phone')} error={errors.phone} />
          </Field>

          <Field label="Email (Optional)" htmlFor="ca-email" error={errors.email}>
            <input
              id="ca-email"
              className="ob-input"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              aria-invalid={errors.email ? 'true' : undefined}
              value={form.email}
              onChange={(e) => set('email')(e.target.value)}
            />
          </Field>

          <Field label="Password" htmlFor="ca-pw" error={errors.password}>
            <PasswordField
              id="ca-pw"
              value={form.password}
              onChange={set('password')}
              placeholder="Create a password"
              error={errors.password}
            />
          </Field>

          <div className="ob-check" style={{ margin: '4px 0 18px' }}>
            <input
              id="ca-terms"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <label htmlFor="ca-terms">
              I agree to the <Link to="/legal/terms">Terms &amp; Conditions</Link> and{' '}
              <Link to="/legal/privacy">Privacy Policy</Link>
            </label>
          </div>

          <button className="mk-btn mk-btn-primary mk-btn-block" disabled={busy}>
            {busy ? 'Creating your account…' : 'Create Account'}
          </button>
        </form>

        <div className="ob-divider">or continue with</div>
        <div className="ob-social">
          <button type="button" onClick={() => setSocial('Google and Apple sign-in are coming soon. Please use your mobile number for now.')}>
            <span aria-hidden="true" style={{ fontWeight: 800, color: '#4285F4' }}>G</span> Google
          </button>
          <button type="button" onClick={() => setSocial('Google and Apple sign-in are coming soon. Please use your mobile number for now.')}>
            <Icon name="apple" size={18} /> Apple
          </button>
        </div>

        <p className="ob-foot-note">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </ObCard>
    </ObShell>
  )
}
