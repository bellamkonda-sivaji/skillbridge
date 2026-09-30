import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { ObShell, ObCard, ObHead, ChoiceCard } from '../components'
import { useOnboarding } from '../OnboardingContext'
import { ACCOUNT_TYPES } from '../data'

export default function AccountType() {
  useDocumentTitle('Choose account type')
  const navigate = useNavigate()
  const { t } = useTranslation()
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
          title={t('ob.account.title')}
          sub={t('ob.account.sub')}
        />

        <div style={{ display: 'grid', gap: 14 }}>
          {ACCOUNT_TYPES.map((a) => (
            <ChoiceCard
              key={a.role}
              selected={role === a.role}
              onClick={() => setRole(a.role)}
              icon={a.icon}
              title={t(`ob.account.${a.role === 'WORKER' ? 'worker' : 'employer'}Title`)}
              points={t(`ob.account.${a.role === 'WORKER' ? 'worker' : 'employer'}Points`, { returnObjects: true })}
            />
          ))}
        </div>

        <button
          type="button"
          className="mk-btn mk-btn-primary mk-btn-block"
          style={{ marginTop: 22 }}
          onClick={submit}
        >
          {t('common.continue')} <Icon name="arrowRight" size={17} />
        </button>

        <p className="ob-foot-note">
          {t('common.alreadyHaveAccount')} <a href="/login">{t('common.logIn')}</a>
        </p>
      </ObCard>
    </ObShell>
  )
}
