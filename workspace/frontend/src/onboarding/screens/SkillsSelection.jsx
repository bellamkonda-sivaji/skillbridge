import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import api, { errMsg } from '../../api'
import { ObShell, ObCard, ObHead, Stepper, Chip, Field, StepNav, Alert } from '../components'
import { useOnboarding } from '../OnboardingContext'
import { SUGGESTED_SKILLS, EXPERIENCE_OPTIONS } from '../data'

export default function SkillsSelection() {
  useDocumentTitle('Select your skills')
  const navigate = useNavigate()
  const { draft, setDraft } = useOnboarding()

  const [selected, setSelected] = useState(draft.skills || [])
  const [catalog, setCatalog] = useState([])
  const [q, setQ] = useState('')
  const [fresher, setFresher] = useState(draft.fresher || false)
  const [experience, setExperience] = useState(
    draft.experienceYears === null || draft.experienceYears === undefined ? 2 : draft.experienceYears
  )
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)

  // Merge the shared skill catalogue in, so picks use the same vocabulary
  // employers choose from when they post a job.
  useEffect(() => {
    api.get('/skills')
      .then((res) => setCatalog((res.data || []).map((s) => s.name).filter(Boolean)))
      .catch(() => setCatalog([]))
  }, [])

  const all = useMemo(() => {
    const seen = new Set()
    return [...SUGGESTED_SKILLS, ...catalog, ...selected].filter((s) => {
      const k = s.toLowerCase()
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }, [catalog, selected])

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return all
    return all.filter((s) => s.toLowerCase().includes(term))
  }, [all, q])

  const exactMatch = all.some((s) => s.toLowerCase() === q.trim().toLowerCase())

  const toggle = (skill) =>
    setSelected((l) => (l.includes(skill) ? l.filter((s) => s !== skill) : [...l, skill]))

  const addCustom = () => {
    const skill = q.trim()
    if (!skill || exactMatch) return
    setSelected((l) => [...l, skill])
    setQ('')
  }

  const submit = async () => {
    setFailure('')
    setBusy(true)
    const years = fresher ? 0 : experience
    try {
      await api.patch('/worker/onboarding', {
        skills: selected,
        experienceYears: years,
        fresher,
      })
      setDraft({ skills: selected, experienceYears: years, fresher })
      navigate('/join/location')
    } catch (err) {
      setFailure(errMsg(err, 'Could not save your skills. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ObShell>
      <ObCard wide>
        <Stepper steps={['Account', 'Profile', 'Complete']} current={1} />
        <ObHead
          title="Select your skills"
          sub="Choose the skills you have. This helps us match you with relevant jobs."
        />

        <Alert>{failure}</Alert>

        <div className="mk-search" style={{ marginBottom: 16 }}>
          <Icon name="search" size={18} style={{ color: '#64748b', flexShrink: 0 }} />
          <input
            type="search"
            value={q}
            placeholder="Search skills..."
            aria-label="Search skills"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
          />
        </div>

        <div className="ob-chips">
          {shown.map((s) => (
            <Chip key={s} label={s} selected={selected.includes(s)} onClick={() => toggle(s)} />
          ))}
          {shown.length === 0 && q.trim() && (
            <button type="button" className="ob-chip" onClick={addCustom}>
              + Add “{q.trim()}”
            </button>
          )}
        </div>

        <p className="ob-count">
          {selected.length === 0
            ? 'Select at least one skill to continue.'
            : `${selected.length} skill${selected.length > 1 ? 's' : ''} selected`}
        </p>

        <div style={{ marginTop: 22 }}>
          <Field label="Years of Experience (optional)" htmlFor="sk-exp">
            <div className="ob-two" style={{ alignItems: 'center' }}>
              <select
                id="sk-exp"
                className="ob-select"
                value={experience}
                disabled={fresher}
                style={{ opacity: fresher ? 0.55 : 1 }}
                onChange={(e) => setExperience(Number(e.target.value))}
              >
                {EXPERIENCE_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value}>{o.label}</option>
                ))}
              </select>
              <div className="ob-check" style={{ marginTop: 8 }}>
                <input
                  id="sk-fresher"
                  type="checkbox"
                  checked={fresher}
                  onChange={(e) => setFresher(e.target.checked)}
                />
                <label htmlFor="sk-fresher">I’m a fresher</label>
              </div>
            </div>
          </Field>
        </div>

        <StepNav
          backTo="/join/preferences"
          onNext={submit}
          busy={busy}
          disabled={selected.length === 0}
        />
      </ObCard>
    </ObShell>
  )
}
