import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../marketing/icons'
import { speak, stopSpeaking, speechSupported, isSpeaking } from './voice'

/**
 * "Easy mode" — for workers who struggle to read.
 *
 * It is a display preference, nothing more: bigger type, bigger tap targets,
 * icons carrying the meaning instead of sentences, and a speaker on anything
 * worth hearing. Every screen still works with it off, so this can never be the
 * only way to reach a feature.
 */
const Ctx = createContext({ simple: false, setSimple: () => {}, say: () => {}, speaking: false })

export const useSimple = () => useContext(Ctx)

export function SimpleModeProvider({ children }) {
  const { i18n } = useTranslation()
  /**
   * On by default for workers.
   *
   * The people this helps most are the least likely to go looking for a switch
   * in settings, so the accessible version is what they get first and the
   * toggle is there to turn it *off*. Employers and admins keep the dense view,
   * which is what their screens are built for.
   */
  const [simple, setSimpleState] = useState(() => {
    try {
      const saved = localStorage.getItem('sb_simple')
      if (saved !== null) return saved === '1'
      return localStorage.getItem('sb_account_type') === 'WORKER'
    } catch {
      return false
    }
  })
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('sb-simple', simple)
    return () => document.body.classList.remove('sb-simple')
  }, [simple])

  const setSimple = useCallback((v) => {
    setSimpleState(v)
    try { localStorage.setItem('sb_simple', v ? '1' : '0') } catch { /* private mode */ }
    if (!v) stopSpeaking()
  }, [])

  /** Speak in whatever language the app is currently in. */
  const say = useCallback(async (text) => {
    if (!text) return
    if (isSpeaking()) { stopSpeaking(); setSpeaking(false); return }
    setSpeaking(true)
    await speak(text, i18n.language)
    setSpeaking(false)
  }, [i18n.language])

  useEffect(() => stopSpeaking, [])

  return <Ctx.Provider value={{ simple, setSimple, say, speaking }}>{children}</Ctx.Provider>
}

/**
 * A speaker button. Renders nothing at all where the browser has no speech —
 * a dead control is worse than an absent one.
 */
export function SpeakButton({ text, label = 'Listen', className = '', size = 18 }) {
  const { say, speaking } = useSimple()
  if (!speechSupported() || !text) return null
  return (
    <button
      type="button"
      className={`sb-speak ${className}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); say(text) }}
      aria-label={label}
      title={label}
    >
      <Icon name={speaking ? 'close' : 'play'} size={size} />
    </button>
  )
}

/** The toggle itself, for the worker's settings and the top bar. */
export function SimpleModeToggle({ compact }) {
  const { simple, setSimple } = useSimple()
  const { t } = useTranslation()
  return (
    <button
      type="button"
      className={`sb-simple-toggle${simple ? ' on' : ''}${compact ? ' compact' : ''}`}
      onClick={() => setSimple(!simple)}
      aria-pressed={simple}
    >
      <Icon name="eye" size={compact ? 15 : 17} />
      <span className="txt">{t('a11y.easyMode', 'Easy mode')}</span>
      <span className="pip" aria-hidden="true" />
    </button>
  )
}
