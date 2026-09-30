import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import api, { errMsg } from '../../api'
import { useAuth } from '../../context/AuthContext'
import {
  ObShell, ObCard, ObHead, Stepper, Field, PhoneField, StepNav, Alert,
} from '../components'
import { useOnboarding } from '../OnboardingContext'
import { GENDERS } from '../data'

const MAX_PHOTO_PX = 256

/** Downscales a chosen photo to a small square JPEG data URL before upload. */
function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('errFile'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('errImage'))
      img.onload = () => {
        const side = Math.min(img.width, img.height)
        const canvas = document.createElement('canvas')
        canvas.width = MAX_PHOTO_PX
        canvas.height = MAX_PHOTO_PX
        const ctx = canvas.getContext('2d')
        ctx.drawImage(
          img,
          (img.width - side) / 2, (img.height - side) / 2, side, side,
          0, 0, MAX_PHOTO_PX, MAX_PHOTO_PX
        )
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export default function BasicInfo() {
  useDocumentTitle('Tell us about yourself')
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, refresh } = useAuth()
  const { draft, setDraft } = useOnboarding()
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    name: draft.name || user?.name || '',
    dateOfBirth: draft.dateOfBirth || '',
    gender: draft.gender || '',
    alternatePhone: draft.alternatePhone || '',
    photoUrl: draft.photoUrl || user?.photoUrl || '',
  })
  const [errors, setErrors] = useState({})
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      set('photoUrl', await resizePhoto(file))
    } catch (err) {
      setFailure(t(`ob.basic.${err.message}`, { defaultValue: t('ob.basic.errFile') }))
    }
  }

  const validate = () => {
    const e = {}
    if (form.name.trim().length < 2) e.name = t('ob.create.errName')
    if (form.dateOfBirth) {
      const age = (Date.now() - new Date(form.dateOfBirth).getTime()) / 31557600000
      if (age < 18) e.dateOfBirth = t('ob.basic.errAge')
      if (age > 100) e.dateOfBirth = t('ob.basic.errDate')
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    setFailure('')
    if (!validate()) return
    setBusy(true)
    try {
      await api.patch('/worker/onboarding', {
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        alternatePhone: form.alternatePhone ? form.alternatePhone.replace(/\D/g, '') : null,
        photoUrl: form.photoUrl || null,
      })
      setDraft({ ...form })
      await refresh().catch(() => {})
      navigate('/join/preferences')
    } catch (err) {
      setFailure(errMsg(err, t('ob.basic.errSave')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ObShell>
      <ObCard>
        <Stepper steps={[t('ob.steps.account'), t('ob.steps.profile'), t('ob.steps.complete')]} current={1} />
        <ObHead
          title={t('ob.basic.title')}
          sub={t('ob.basic.sub')}
        />

        <Alert>{failure}</Alert>

        <div className="ob-photo">
          <span className="ob-photo-preview">
            {form.photoUrl
              ? <img src={form.photoUrl} alt={t('ob.basic.photoAlt')} />
              : <Icon name="user" size={30} />}
          </span>
          <button type="button" className="ob-upload" onClick={() => fileRef.current?.click()}>
            <Icon name="phone" size={18} />
            {form.photoUrl ? t('ob.basic.changePhoto') : t('ob.basic.uploadPhoto')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={pickPhoto}
          />
        </div>

        <Field label={t('ob.basic.name')} htmlFor="bi-name" error={errors.name}>
          <input
            id="bi-name"
            className="ob-input"
            autoComplete="name"
            aria-invalid={errors.name ? 'true' : undefined}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </Field>

        <Field label={t('ob.basic.dob')} htmlFor="bi-dob" error={errors.dateOfBirth}>
          <input
            id="bi-dob"
            className="ob-input"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            aria-invalid={errors.dateOfBirth ? 'true' : undefined}
            value={form.dateOfBirth}
            onChange={(e) => set('dateOfBirth', e.target.value)}
          />
        </Field>

        <Field label={t('ob.basic.gender')} htmlFor="bi-gender">
          <select
            id="bi-gender"
            className="ob-select"
            value={form.gender}
            onChange={(e) => set('gender', e.target.value)}
          >
            <option value="">{t('ob.basic.select')}</option>
            {GENDERS.map((g) => <option key={g.value} value={g.value}>{t(`opt.gender.${g.value}`)}</option>)}
          </select>
        </Field>

        <Field label={t('ob.basic.altPhone')} htmlFor="bi-alt">
          <PhoneField
            id="bi-alt"
            value={form.alternatePhone}
            onChange={(v) => set('alternatePhone', v)}
            placeholder="99999 99999"
          />
        </Field>

        <StepNav backTo="/join/verify" onNext={submit} busy={busy} />
      </ObCard>
    </ObShell>
  )
}
