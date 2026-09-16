import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { errMsg } from '../api'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const user = await login(form.email, form.password)
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard')
    } catch (err) {
      setError(errMsg(err, t('errors.loginFailed')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2>{t('auth.loginTitle')}</h2>
        <p className="sub">SkillBridge {t('tagline')}</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>{t('auth.email')}</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label>{t('auth.password')}</label>
            <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? '...' : t('auth.login')}</button>
        </form>
        <p style={{ marginTop: 16, fontSize: 14 }}>
          {t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link>
        </p>
        <div className="muted" style={{ marginTop: 18, fontSize: 12 }}>
          Demo accounts:
          <br />Worker: john.kamau@mail.com / pass1234
          <br />Employer: james@safiriconstruction.com / pass1234
          <br />Admin: admin@skillbridge.com / admin123
        </div>
      </div>
    </div>
  )
}
