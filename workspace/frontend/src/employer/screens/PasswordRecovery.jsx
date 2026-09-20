import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { Field, PasswordField, OtpInput, Alert } from '../../onboarding/components'
import { EmpSplit, BackToLogin, PasswordRules } from '../components'
import api, { errMsg } from '../../api'
import { passwordOk } from '../data'

const BASE = '/employer/auth/password'
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

/* ---------- 2. Forgot password ---------- */

export function ForgotPassword() {
  useDocumentTitle('Reset your password')
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const res = await api.post(`${BASE}/forgot`, { identifier: identifier.trim() })
      navigate('/employer/verify-code', {
        state: {
          identifier: identifier.trim(),
          maskedTarget: res.data?.maskedTarget,
          devCode: res.data?.devCode || '',
          resendAfter: res.data?.resendAfterSeconds || 30,
        },
      })
    } catch (err) {
      setError(errMsg(err, 'We could not send the code. Please try again shortly.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <EmpSplit topRight={<BackToLogin />} showPitch={false}>
      <div style={{ textAlign: 'center' }}>
        <h2>Reset Your Password</h2>
        <p className="sub">
          Enter your registered email or mobile number and we’ll send you a code to reset your password.
        </p>
      </div>

      <Alert>{error}</Alert>

      <form onSubmit={submit}>
        <Field label="Email or Mobile Number" htmlFor="fp-id">
          <input
            id="fp-id"
            className="ob-input"
            required
            autoComplete="username"
            placeholder="business@freshmart.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </Field>
        <button className="mk-btn mk-btn-primary mk-btn-block" disabled={busy}>
          {busy ? 'Sending…' : 'Send Reset Code'}
        </button>
      </form>

      <p className="ob-foot-note">
        Remember your password? <Link to="/employer/login">Login</Link>
      </p>

      <div style={{ display: 'grid', placeItems: 'center', marginTop: 22, color: 'var(--blue-100)' }} aria-hidden="true">
        <Icon name="mail" size={64} strokeWidth={1.2} />
      </div>
    </EmpSplit>
  )
}

/* ---------- 3. OTP verification ---------- */

export function VerifyCode() {
  useDocumentTitle('Enter verification code')
  const navigate = useNavigate()
  const { state } = useLocation()
  const identifier = state?.identifier

  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState(state?.devCode || '')
  const [seconds, setSeconds] = useState(state?.resendAfter || 30)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const sent = useRef(false)

  useEffect(() => {
    if (seconds <= 0) return undefined
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds])

  if (!identifier) return <Restart />

  const verify = async (value) => {
    if (busy) return
    setBusy(true); setError('')
    try {
      const res = await api.post(`${BASE}/verify`, { identifier, code: value })
      navigate('/employer/reset-password', {
        state: { identifier, resetToken: res.data?.resetToken },
        replace: true,
      })
    } catch (err) {
      setError(errMsg(err, 'That code is not right. Please check and try again.'))
      setCode('')
      sent.current = false
    } finally {
      setBusy(false)
    }
  }

  const onChange = (v) => {
    setCode(v)
    if (v.length === 6 && !sent.current) { sent.current = true; verify(v) }
  }

  const resend = async () => {
    setError('')
    try {
      const res = await api.post(`${BASE}/forgot`, { identifier })
      setDevCode(res.data?.devCode || '')
      setSeconds(res.data?.resendAfterSeconds || 30)
      setCode(''); sent.current = false
    } catch (err) {
      setError(errMsg(err, 'Could not resend the code.'))
    }
  }

  return (
    <EmpSplit topRight={<BackToLogin />} showPitch={false}>
      <div style={{ textAlign: 'center' }}>
        <h2>Enter Verification Code</h2>
        <p className="sub">
          We’ve sent a 6-digit code to <strong>{state?.maskedTarget || identifier}</strong>
        </p>
      </div>

      <Alert>{error}</Alert>
      {devCode && (
        <Alert kind="info">
          <strong>Demo mode:</strong> no SMS or email provider is connected yet, so your code is{' '}
          <strong style={{ letterSpacing: 2 }}>{devCode}</strong>.
        </Alert>
      )}

      <OtpInput value={code} onChange={onChange} invalid={!!error} />

      <div className="ob-resend">
        {seconds > 0
          ? <>Didn’t receive the code? Resend in {mmss(seconds)}</>
          : <button type="button" onClick={resend}>Resend code</button>}
      </div>

      <button
        type="button"
        className="mk-btn mk-btn-primary mk-btn-block"
        style={{ marginTop: 18 }}
        disabled={code.length !== 6 || busy}
        onClick={() => verify(code)}
      >
        {busy ? 'Verifying…' : 'Verify Code'}
      </button>

      <p className="ob-foot-note">
        <Link to="/employer/forgot-password">Use a different email or mobile number</Link>
      </p>

      <div style={{ display: 'grid', placeItems: 'center', marginTop: 20, color: 'var(--blue-100)' }} aria-hidden="true">
        <Icon name="shield" size={60} strokeWidth={1.2} />
      </div>
    </EmpSplit>
  )
}

/* ---------- 4. Create new password ---------- */

export function ResetPassword() {
  useDocumentTitle('Create new password')
  const navigate = useNavigate()
  const { state } = useLocation()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!state?.identifier || !state?.resetToken) return <Restart />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!passwordOk(pw)) { setError('Your password does not meet all four rules yet.'); return }
    if (pw !== confirm) { setError('Both passwords must match.'); return }

    setBusy(true)
    try {
      await api.post(`${BASE}/reset`, {
        identifier: state.identifier,
        resetToken: state.resetToken,
        newPassword: pw,
      })
      navigate('/employer/login', {
        replace: true,
        state: { notice: 'Your password has been reset. Please log in.' },
      })
    } catch (err) {
      setError(errMsg(err, 'We could not reset your password. Request a new code and try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <EmpSplit topRight={<BackToLogin />} showPitch={false}>
      <div style={{ textAlign: 'center' }}>
        <h2>Create New Password</h2>
        <p className="sub">Enter a new password for your account.</p>
      </div>

      <Alert>{error}</Alert>

      <form onSubmit={submit}>
        <Field label="New Password" htmlFor="rp-pw">
          <PasswordField id="rp-pw" value={pw} onChange={setPw} placeholder="Enter a new password" />
        </Field>

        <PasswordRules value={pw} />

        <Field
          label="Confirm New Password"
          htmlFor="rp-confirm"
          error={confirm && pw !== confirm ? 'Both passwords must match' : undefined}
        >
          <PasswordField id="rp-confirm" value={confirm} onChange={setConfirm} placeholder="Re-enter the password" />
        </Field>

        <button className="mk-btn mk-btn-primary mk-btn-block" disabled={busy}>
          {busy ? 'Saving…' : 'Reset Password'}
        </button>
      </form>

      <div style={{ display: 'grid', placeItems: 'center', marginTop: 22, color: 'var(--blue-100)' }} aria-hidden="true">
        <Icon name="lock" size={58} strokeWidth={1.2} />
      </div>
    </EmpSplit>
  )
}

/** Shown when someone lands mid-flow without the previous step's state. */
function Restart() {
  return (
    <EmpSplit topRight={<BackToLogin />} showPitch={false}>
      <div style={{ textAlign: 'center' }}>
        <h2>Start again</h2>
        <p className="sub">
          This reset link has expired or was opened out of order. Request a fresh code to continue.
        </p>
        <Link className="mk-btn mk-btn-primary mk-btn-block" to="/employer/forgot-password">
          Reset your password
        </Link>
      </div>
    </EmpSplit>
  )
}
