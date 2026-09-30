import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { useAuth } from '../../context/AuthContext'
import { errMsg } from '../../api'
import { ROLES } from '../api'
import Logo from '../../marketing/Logo'

/**
 * Admin registration.
 *
 * The server decides whether this is allowed: on an installation with no
 * admins at all, the first registration bootstraps a Super Admin. Once any
 * admin exists it requires a signed-in Super Admin, so an anonymous visitor
 * cannot mint themselves an account. We show both cases honestly rather than
 * pretending this is open signup.
 */
export default function AdminRegister() {
  useDocumentTitle('Create admin account')
  const navigate = useNavigate()
  const { user, accountType, register } = useAuth()
  const isSuperAdmin = accountType === 'ADMIN' && user?.role === 'SUPER_ADMIN'

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'SUPER_ADMIN' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      await register('ADMIN', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.replace(/\D/g, '') || null,
        password: form.password,
        role: form.role,
      })
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(errMsg(err, 'We could not create that account.'))
    } finally {
      setBusy(false)
    }
  }

  const valid = form.name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(form.email) && form.password.length >= 6

  return (
    <div className="mk ad-auth">
      <div className="ad-auth-card">
        <Logo tagline size={40} className="ad-auth-logo" />
        <h1>{isSuperAdmin ? 'Add an admin' : 'Set up the first Super Admin'}</h1>
        <p className="sub">
          {isSuperAdmin
            ? 'Create a back-office login and choose what it can do.'
            : 'This works only while no admin accounts exist yet.'}
        </p>

        {error && <div className="ad-error"><Icon name="shield" size={15} /><span>{error}</span></div>}

        <form onSubmit={submit} noValidate>
          <label className="ad-field">
            <span>Full name</span>
            <input className="ad-input" value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="Priya Sharma" />
          </label>

          <label className="ad-field">
            <span>Email</span>
            <input className="ad-input" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email')(e.target.value)} placeholder="name@skillbridge.in" />
          </label>

          <label className="ad-field">
            <span>Mobile number (optional)</span>
            <input className="ad-input" inputMode="numeric" value={form.phone} onChange={(e) => set('phone')(e.target.value)} placeholder="90000 00001" />
          </label>

          <label className="ad-field">
            <span>Password</span>
            <input className="ad-input" type="password" autoComplete="new-password" value={form.password} onChange={(e) => set('password')(e.target.value)} placeholder="At least 6 characters" />
          </label>

          {isSuperAdmin ? (
            <div className="ad-field">
              <span>Role</span>
              <div className="ad-roles">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    className="ad-role"
                    aria-pressed={form.role === r.value}
                    onClick={() => set('role')(r.value)}
                  >
                    <span className="mark" aria-hidden="true" />
                    <span>
                      <span className="t">{r.label}</span>
                      <span className="d">{r.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="ad-note" style={{ marginTop: 0, marginBottom: 14 }}>
              This first account is created as a <strong>Super Admin</strong> with full access.
              You can add more Super Admins, Admins and HR users afterwards.
            </p>
          )}

          <button className="mk-btn mk-btn-primary mk-btn-block" disabled={busy || !valid}>
            {busy ? 'Creating…' : isSuperAdmin ? 'Create account' : 'Create Super Admin'}
          </button>
        </form>

        <p className="ad-note">
          Already have an account? <Link to="/admin/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
