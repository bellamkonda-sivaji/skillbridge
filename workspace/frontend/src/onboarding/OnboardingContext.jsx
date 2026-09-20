import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const KEY = 'sb_onboarding'

/** Never written to storage — held in memory for the length of the signup only. */
const SECRET_FIELDS = ['password']

const EMPTY = {
  locale: 'en',
  role: 'WORKER',
  // account
  name: '',
  phone: '',
  email: '',
  password: '',
  // basic info
  photoUrl: '',
  dateOfBirth: '',
  gender: '',
  alternatePhone: '',
  // preferences
  jobCategories: [],
  employmentTypes: [],
  // skills
  skills: [],
  experienceYears: null,
  fresher: false,
  // location
  city: '',
  area: '',
  latitude: 0,
  longitude: 0,
  preferredRadiusKm: 3,
  availability: 'IMMEDIATE',
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY, locale: localStorage.getItem('sb_lang') || 'en' }
    return { ...EMPTY, ...JSON.parse(raw), password: '' }
  } catch {
    return { ...EMPTY }
  }
}

function save(draft) {
  try {
    const safe = { ...draft }
    SECRET_FIELDS.forEach((f) => delete safe[f])
    localStorage.setItem(KEY, JSON.stringify(safe))
  } catch {
    // storage can be unavailable (private mode); the flow still works in memory
  }
}

const Ctx = createContext(null)

export function OnboardingProvider({ children }) {
  const [draft, setDraftState] = useState(load)

  const setDraft = useCallback((patch) => {
    setDraftState((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
      save(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    try { localStorage.removeItem(KEY) } catch { /* ignore */ }
    setDraftState({ ...EMPTY })
  }, [])

  const value = useMemo(() => ({ draft, setDraft, reset }), [draft, setDraft, reset])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useOnboarding() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>')
  return ctx
}
