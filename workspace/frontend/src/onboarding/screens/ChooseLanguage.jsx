import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { ObShell, ObCard, ObHead, OptionRow, StepNav } from '../components'
import { useOnboarding } from '../OnboardingContext'
import { LANGUAGES } from '../data'

export default function ChooseLanguage() {
  useDocumentTitle('Choose your language')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { i18n } = useTranslation()
  const { draft, setDraft } = useOnboarding()
  const [picked, setPicked] = useState(draft.locale || 'en')

  const submit = () => {
    const lang = LANGUAGES.find((l) => l.code === picked)
    setDraft({ locale: picked })
    localStorage.setItem('sb_lang', picked)
    // Only switch the running UI to a language we actually have strings for.
    if (lang?.ready) i18n.changeLanguage(picked)
    const role = params.get('role')
    navigate(`/join/account-type${role ? `?role=${role}` : ''}`)
  }

  return (
    <ObShell>
      <ObCard>
        <ObHead
          icon={<Icon name="globe" size={30} />}
          title="Choose your language"
          sub="You can change this anytime in settings."
        />

        <div className="ob-options" role="listbox" aria-label="Languages">
          {LANGUAGES.map((l) => (
            <OptionRow
              key={l.code}
              selected={picked === l.code}
              onClick={() => setPicked(l.code)}
              flag={l.flag}
              native={l.native}
              latin={l.label === l.native ? null : l.label}
              badge={l.ready ? null : 'Coming soon'}
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
          Languages marked “Coming soon” are on the way — we’ll remember your choice and
          switch you over the moment they land.
        </p>
      </ObCard>
    </ObShell>
  )
}
