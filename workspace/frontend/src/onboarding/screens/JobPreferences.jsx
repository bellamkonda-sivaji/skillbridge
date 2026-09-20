import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
      setFailure(errMsg(err, 'Could not save your preferences. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ObShell>
      <ObCard wide>
        <Stepper steps={['Account', 'Profile', 'Complete']} current={1} />
        <ObHead
          title="What type of work are you looking for?"
          sub="Select one or more options."
        />

        <Alert>{failure}</Alert>

        <div className="ob-tiles">
          {JOB_CATEGORIES.map((c) => (
            <Tile
              key={c.value}
              icon={c.icon}
              label={c.label}
              selected={categories.includes(c.value)}
              onClick={() => setCategories((l) => toggle(l, c.value))}
            />
          ))}
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '26px 0 12px' }}>Employment Type</h2>
        <div className="ob-pills">
          {EMPLOYMENT_TYPES.map((t) => (
            <Pill
              key={t.value}
              label={t.label}
              selected={types.includes(t.value)}
              onClick={() => setTypes((l) => toggle(l, t.value))}
            />
          ))}
        </div>

        <p className="ob-count">
          {categories.length === 0
            ? 'Pick at least one kind of work so we can match you.'
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
