import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { useAuth } from '../../context/AuthContext'
import { errMsg } from '../../api'
import Logo from '../../marketing/Logo'

export default function AdminLogin() {
  useDocumentTitle('Admin sign in')
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      await login('ADMIN', form.identifier.trim(), form.password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(errMsg(err, 'Those details did not work. Please check and try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mk ad-auth">
      <div className="ad-auth-card">
        <Logo tagline size={40} className="ad-auth-logo" />
        <h1>Back office sign in</h1>
        <p className="sub">JobOn staff only.</p>

        {error && <div className="ad-error"><Icon name="shield" size={15} /><span>{error}</span></div>}

        <form onSubmit={submit} noValidate>
          <label className="ad-field">
            <span>Email or mobile number</span>
            <input
              className="ad-input"
              autoComplete="username"
              placeholder="admin@skillbridge.in"
              value={form.identifier}
              onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
            />
          </label>

          <label className="ad-field">
            <span>Password</span>
            <span style={{ position: 'relative', display: 'block' }}>
              <input
                className="ad-input"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                style={{ paddingRight: 42 }}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 0, background: 'transparent', color: 'var(--muted)', cursor: 'pointer', padding: 5 }}
              >
                <Icon name="eye" size={16} />
              </button>
            </span>
          </label>

          <button className="mk-btn mk-btn-primary mk-btn-block" disabled={busy || !form.identifier || !form.password}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="ad-note">
          Admin accounts are created by a Super Admin. If this is a brand-new installation with no
          admins yet, <Link to="/admin/register">set up the first Super Admin</Link>.
        </p>
      </div>
    </div>
  )
}
