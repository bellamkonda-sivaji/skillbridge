import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { ObShell, ObCard, ObHead, ChoiceCard } from '../components'
import { useOnboarding } from '../OnboardingContext'
import { ACCOUNT_TYPES } from '../data'

export default function AccountType() {
  useDocumentTitle('Choose account type')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { draft, setDraft } = useOnboarding()

  // "I need work" / "I want to hire" on the public site arrive as ?role=…
  const initial = params.get('role') === 'EMPLOYER' ? 'EMPLOYER' : draft.role || 'WORKER'
  const [role, setRole] = useState(initial)

  const submit = () => {
    setDraft({ role })
    navigate('/join/create')
  }

  return (
    <ObShell>
      <ObCard wide>
        <ObHead
          title="How would you like to use SkillBridge?"
          sub="Choose the option that best describes you."
        />

        <div style={{ display: 'grid', gap: 14 }}>
          {ACCOUNT_TYPES.map((t) => (
            <ChoiceCard
              key={t.role}
              selected={role === t.role}
              onClick={() => setRole(t.role)}
              icon={t.icon}
              title={t.title}
              points={t.points}
            />
          ))}
        </div>

        <button
          type="button"
          className="mk-btn mk-btn-primary mk-btn-block"
          style={{ marginTop: 22 }}
          onClick={submit}
        >
          Continue <Icon name="arrowRight" size={17} />
        </button>

        <p className="ob-foot-note">
          Already have an account? <a href="/login">Log In</a>
        </p>
      </ObCard>
    </ObShell>
  )
}
