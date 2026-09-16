import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { errMsg } from '../api'

export default function Register() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('WORKER')
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const user = await register({ ...form, role, locale: localStorage.getItem('sb_lang') || 'en' })
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard')
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2>{t('auth.registerTitle')}</h2>
        <p className="sub">SkillBridge {t('tagline')}</p>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="role-toggle">
          <button type="button" className={role === 'WORKER' ? 'active' : ''} onClick={() => setRole('WORKER')}>
            {t('auth.roleWorker')}
          </button>
          <button type="button" className={role === 'EMPLOYER' ? 'active' : ''} onClick={() => setRole('EMPLOYER')}>
            {t('auth.roleEmployer')}
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="field">
            <label>{t('auth.name')}</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>{t('auth.email')}</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label>{t('auth.phone')}</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="field">
            <label>{t('auth.password')}</label>
            <input type="password" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? '...' : t('auth.register')}</button>
        </form>
        <p style={{ marginTop: 16, fontSize: 14 }}>
          {t('auth.haveAccount')} <Link to="/login">{t('auth.login')}</Link>
        </p>
      </div>
    </div>
  )
}
