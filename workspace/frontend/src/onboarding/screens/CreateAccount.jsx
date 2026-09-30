import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
    if (form.name.trim().length < 2) e.name = t('ob.create.errName')
    if (digits(form.phone).length !== 10) e.phone = t('ob.create.errPhone')
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = t('ob.create.errEmail')
    if (form.password.length < 6) e.password = t('ob.create.errPassword')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev) => {
    ev.preventDefault()
    setFailure('')
    if (!validate()) return
    if (!agreed) { setFailure(t('ob.create.errTerms')); return }

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
      setFailure(errMsg(err, t('ob.create.errFailed')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ObShell>
      <ObCard>
        <Stepper steps={[t('ob.steps.account'), t('ob.steps.verify'), t('ob.steps.profile')]} current={0} />
        <ObHead title={t('ob.create.title')} sub={t('ob.create.sub')} />

        <Alert>{failure}</Alert>
        {social && <Alert kind="info">{social}</Alert>}

        <form onSubmit={submit} noValidate>
          <Field label={t('ob.create.name')} htmlFor="ca-name" error={errors.name}>
            <input
              id="ca-name"
              className="ob-input"
              autoComplete="name"
              placeholder={t('ob.create.namePlaceholder')}
              aria-invalid={errors.name ? 'true' : undefined}
              value={form.name}
              onChange={(e) => set('name')(e.target.value)}
            />
          </Field>

          <Field label={t('ob.create.phone')} htmlFor="ca-phone" error={errors.phone}>
            <PhoneField id="ca-phone" value={form.phone} onChange={set('phone')} error={errors.phone} />
          </Field>

          <Field label={t('ob.create.email')} htmlFor="ca-email" error={errors.email}>
            <input
              id="ca-email"
              className="ob-input"
              type="email"
              autoComplete="email"
              placeholder={t('ob.create.emailPlaceholder')}
              aria-invalid={errors.email ? 'true' : undefined}
              value={form.email}
              onChange={(e) => set('email')(e.target.value)}
            />
          </Field>

          <Field label={t('ob.create.password')} htmlFor="ca-pw" error={errors.password}>
            <PasswordField
              id="ca-pw"
              value={form.password}
              onChange={set('password')}
              placeholder={t('ob.create.passwordPlaceholder')}
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
              {/* <1> and <3> map to the two links, so each language orders them itself. */}
              <Trans i18nKey="ob.create.terms">
                I agree to the <Link to="/legal/terms">Terms &amp; Conditions</Link> and{' '}
                <Link to="/legal/privacy">Privacy Policy</Link>
              </Trans>
            </label>
          </div>

          <button className="mk-btn mk-btn-primary mk-btn-block" disabled={busy}>
            {busy ? t('ob.create.submitting') : t('ob.create.submit')}
          </button>
        </form>

        <div className="ob-divider">{t('common.or')}</div>
        <div className="ob-social">
          <button type="button" onClick={() => setSocial(t('ob.create.socialSoon'))}>
            <span aria-hidden="true" style={{ fontWeight: 800, color: '#4285F4' }}>G</span> Google
          </button>
          <button type="button" onClick={() => setSocial(t('ob.create.socialSoon'))}>
            <Icon name="apple" size={18} /> Apple
          </button>
        </div>

        <p className="ob-foot-note">
          {t('common.alreadyHaveAccount')} <Link to="/login">{t('common.logIn')}</Link>
        </p>
      </ObCard>
    </ObShell>
  )
}
