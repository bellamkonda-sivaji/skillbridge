import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { Field, PasswordField, Alert } from '../../onboarding/components'
import { EmpSplit } from '../components'
import { useAuth } from '../../context/AuthContext'
import { errMsg } from '../../api'

const REMEMBER_KEY = 'sb_employer_identifier'

export default function EmployerLoginScreen() {
  useDocumentTitle('Employer login')
  const { login } = useAuth()
  const navigate = useNavigate()

  const remembered = localStorage.getItem(REMEMBER_KEY) || ''
  const [form, setForm] = useState({ identifier: remembered, password: '' })
  const [remember, setRemember] = useState(Boolean(remembered))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [social, setSocial] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await login('EMPLOYER', form.identifier.trim(), form.password)
      if (remember) localStorage.setItem(REMEMBER_KEY, form.identifier.trim())
      else localStorage.removeItem(REMEMBER_KEY)
      navigate('/employer/login-success', { replace: true })
    } catch (err) {
      setError(
        err?.response?.status === 403
          ? 'Those details belong to a worker account. Use the worker login instead.'
          : errMsg(err, 'We could not sign you in. Check your details and try again.')
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <EmpSplit
      topRight={
        <span className="note">
          Don’t have an account? <Link to="/join?role=EMPLOYER">Sign Up</Link>
        </span>
      }
    >
      <h2>Welcome Back</h2>
      <p className="sub">Login to your employer account</p>

      <Alert>{error}</Alert>
      {social && <Alert kind="info">{social}</Alert>}

      <form onSubmit={submit}>
        <Field label="Email or Mobile Number" htmlFor="el-id">
          <input
            id="el-id"
            className="ob-input"
            required
            autoComplete="username"
            placeholder="business@freshmart.com"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
          />
        </Field>

        <Field label="Password" htmlFor="el-pw">
          <PasswordField
            id="el-pw"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            placeholder="Your password"
          />
        </Field>

        <div className="emp-row-between">
          <label className="ob-check" style={{ margin: 0 }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span>Remember me</span>
          </label>
          <Link to="/employer/forgot-password" style={{ fontSize: 13.5, fontWeight: 600 }}>
            Forgot password?
          </Link>
        </div>

        <button className="mk-btn mk-btn-primary mk-btn-block" disabled={busy}>
          {busy ? 'Signing in…' : 'Login'}
        </button>
      </form>

      <div className="ob-divider">or continue with</div>
      <div className="emp-social">
        <button type="button" onClick={() => setSocial('Google and Microsoft sign-in are coming soon. Please use your email or mobile number for now.')}>
          <span aria-hidden="true" style={{ fontWeight: 800, color: '#4285F4' }}>G</span> Continue with Google
        </button>
        <button type="button" onClick={() => setSocial('Google and Microsoft sign-in are coming soon. Please use your email or mobile number for now.')}>
          <span aria-hidden="true" style={{ fontWeight: 800, color: '#00A4EF' }}>▦</span> Continue with Microsoft
        </button>
      </div>

      <p className="ob-foot-note">
        Looking for work instead? <Link to="/worker/login">Worker login</Link>
      </p>
    </EmpSplit>
  )
}
