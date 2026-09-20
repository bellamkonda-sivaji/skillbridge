import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../marketing/icons'
import { useDocumentTitle } from '../marketing/components'
import { ObShell, ObCard, ObHead, Field, PasswordField, Alert } from '../onboarding/components'
import { useAuth } from '../context/AuthContext'
import { errMsg } from '../api'

const CONFIG = {
  WORKER: {
    title: 'Log in to find work',
    sub: 'Use the mobile number you signed up with.',
    icon: 'user',
    home: '/worker',
    signup: '/join?role=WORKER',
    signupLabel: 'Create a worker account',
    other: [
      { to: '/employer/login', label: 'Log in as a business' },
      { to: '/admin/login', label: 'Admin' },
    ],
    demo: 'Demo: 9000000007 or john.kamau@mail.com / pass1234',
  },
  EMPLOYER: {
    title: 'Log in to hire',
    sub: 'Use the mobile number registered for your business.',
    icon: 'store',
    home: '/dashboard',
    signup: '/join?role=EMPLOYER',
    signupLabel: 'Create a business account',
    other: [
      { to: '/worker/login', label: 'Log in as a worker' },
      { to: '/admin/login', label: 'Admin' },
    ],
    demo: 'Demo: 9000000002 or james@safiriconstruction.com / pass1234',
  },
  ADMIN: {
    title: 'Operations login',
    sub: 'SkillBridge staff only.',
    icon: 'shield',
    home: '/admin',
    signup: null,
    other: [
      { to: '/worker/login', label: 'Worker login' },
      { to: '/employer/login', label: 'Business login' },
    ],
    demo: 'Demo: admin@skillbridge.com / admin123',
  },
}

function LoginForm({ accountType }) {
  const cfg = CONFIG[accountType]
  useDocumentTitle(cfg.title)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await login(accountType, form.identifier.trim(), form.password)
      navigate(cfg.home, { replace: true })
    } catch (err) {
      const status = err?.response?.status
      setError(
        status === 403
          ? 'Those details belong to a different kind of account. Try one of the other logins below.'
          : errMsg(err, 'We could not sign you in. Check your details and try again.')
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <ObShell>
      <ObCard>
        <ObHead icon={<Icon name={cfg.icon} size={30} />} title={cfg.title} sub={cfg.sub} />

        <Alert>{error}</Alert>

        <form onSubmit={submit}>
          <Field label="Mobile number or email" htmlFor="li-id">
            <input
              id="li-id"
              className="ob-input"
              required
              autoComplete="username"
              placeholder="9876543210"
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
            />
          </Field>

          <Field label="Password" htmlFor="li-pw">
            <PasswordField
              id="li-pw"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              placeholder="Your password"
            />
          </Field>

          <button className="mk-btn mk-btn-primary mk-btn-block" disabled={busy}>
            {busy ? 'Signing in…' : 'Log In'}
          </button>
        </form>

        {cfg.signup && (
          <p className="ob-foot-note">
            New here? <Link to={cfg.signup}>{cfg.signupLabel}</Link>
          </p>
        )}

        <div className="ob-divider">or</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {cfg.other.map((o) => (
            <Link key={o.to} className="mk-btn mk-btn-outline mk-btn-sm" to={o.to}>{o.label}</Link>
          ))}
        </div>

        <p className="ob-foot-note" style={{ fontSize: 12.5 }}>{cfg.demo}</p>
      </ObCard>
    </ObShell>
  )
}

export function WorkerLogin() { return <LoginForm accountType="WORKER" /> }
export function EmployerLogin() { return <LoginForm accountType="EMPLOYER" /> }
export function AdminLogin() { return <LoginForm accountType="ADMIN" /> }

/** /login asks which kind of account, because the two are separate systems. */
export function ChooseLogin() {
  useDocumentTitle('Log in')
  return (
    <ObShell>
      <ObCard>
        <ObHead title="Log in to SkillBridge" sub="Which kind of account do you have?" />
        <div style={{ display: 'grid', gap: 12 }}>
          <Link to="/worker/login" className="ob-choice">
            <span className="ob-choice-art" aria-hidden="true"><Icon name="user" size={26} /></span>
            <span style={{ flex: 1 }}>
              <span className="title" style={{ display: 'block' }}>I am looking for work</span>
              <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>Worker account</span>
            </span>
            <Icon name="chevronRight" size={18} style={{ alignSelf: 'center', color: 'var(--muted)' }} />
          </Link>
          <Link to="/employer/login" className="ob-choice">
            <span className="ob-choice-art" aria-hidden="true"><Icon name="store" size={26} /></span>
            <span style={{ flex: 1 }}>
              <span className="title" style={{ display: 'block' }}>I am hiring</span>
              <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>Business account</span>
            </span>
            <Icon name="chevronRight" size={18} style={{ alignSelf: 'center', color: 'var(--muted)' }} />
          </Link>
        </div>
        <p className="ob-foot-note">
          No account yet? <Link to="/join">Sign up</Link> · <Link to="/admin/login">Admin</Link>
        </p>
      </ObCard>
    </ObShell>
  )
}
