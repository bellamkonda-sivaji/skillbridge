import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDocumentTitle } from '../../marketing/components'
import api, { errMsg } from '../../api'
import { ObShell, ObCard, ObHead, Stepper, Tile, Pill, StepNav, Alert } from '../components'
import { useOnboarding } from '../OnboardingContext'
import { JOB_CATEGORIES, EMPLOYMENT_TYPES } from '../data'

const toggle = (list, value) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

export default function JobPreferences() {
  useDocumentTitle('Job preferences')
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { draft, setDraft } = useOnboarding()

  const [categories, setCategories] = useState(draft.jobCategories || [])
  const [types, setTypes] = useState(draft.employmentTypes || [])
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setFailure('')
    setBusy(true)
    try {
      await api.patch('/worker/onboarding', {
        jobCategories: categories,
        employmentTypes: types,
      })
      setDraft({ jobCategories: categories, employmentTypes: types })
      navigate('/join/skills')
    } catch (err) {
      setFailure(errMsg(err, t('ob.prefs.errSave')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ObShell>
      <ObCard wide>
        <Stepper steps={[t('ob.steps.account'), t('ob.steps.profile'), t('ob.steps.complete')]} current={1} />
        <ObHead
          title={t('ob.prefs.title')}
          sub={t('ob.prefs.sub')}
        />

        <Alert>{failure}</Alert>

        <div className="ob-tiles">
          {JOB_CATEGORIES.map((c) => (
            <Tile
              key={c.value}
              icon={c.icon}
              label={t(`opt.category.${c.value}`)}
              selected={categories.includes(c.value)}
              onClick={() => setCategories((l) => toggle(l, c.value))}
            />
          ))}
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '26px 0 12px' }}>{t('ob.prefs.employmentType')}</h2>
        <div className="ob-pills">
          {EMPLOYMENT_TYPES.map((e) => (
            <Pill
              key={e.value}
              label={t(`opt.employment.${e.value}`)}
              selected={types.includes(e.value)}
              onClick={() => setTypes((l) => toggle(l, e.value))}
            />
          ))}
        </div>

        <p className="ob-count">
          {categories.length === 0
            ? t('ob.prefs.errNone')
            : `${categories.length} selected${types.length ? ` · ${types.length} employment type${types.length > 1 ? 's' : ''}` : ''}`}
        </p>

        <StepNav
          backTo="/join/about-you"
          onNext={submit}
          busy={busy}
          disabled={categories.length === 0}
        />
      </ObCard>
    </ObShell>
  )
}
