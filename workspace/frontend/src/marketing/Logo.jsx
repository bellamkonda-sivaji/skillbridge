import React from 'react'
import { useTranslation } from 'react-i18next'
import { SITE } from './content'

/**
 * The JobOn mark.
 *
 * One component so the logo can never drift between the four apps. `mark`
 * renders the artwork alone (tight spaces: avatars, the app bar on a phone);
 * the default adds the wordmark; `tagline` adds the strapline beneath, for the
 * places with room to say it — the landing hero, the sign-in screens, the
 * footer. The wordmark and strapline are real text rather than part of the
 * image, so they stay crisp and can be read in Telugu or Hindi, which a
 * baked-in image could never do.
 */
/**
 * The three sparks that fan off the top-right of the "n", as in the logo artwork.
 *
 * Drawn rather than baked into the image so they scale with the type, stay sharp at any size
 * and can turn white on a dark bar - none of which a cropped PNG could do. Sized in `em` so
 * they track the wordmark wherever it is used.
 */
function Sparks() {
  return (
    <svg className="jo-spark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
        <path d="M5.5 13.5 L9.5 3.5" />
        <path d="M11 16 L19.5 8" />
        <path d="M14 20.5 L23 16.5" />
      </g>
    </svg>
  )
}

/** The wordmark: two colours and the sparks, in one place so it cannot drift. */
function Word() {
  return (
    <span className="jo-word">
      <span className="a">Job</span>
      <span className="b">On<Sparks /></span>
    </span>
  )
}

export default function Logo({ mark = false, size = 30, showName = true, tagline = false, className = '' }) {
  const { t } = useTranslation()
  if (tagline) {
    return (
      <span className={`jo-lockup ${className}`}>
        <span className="jo-logo">
          <img src="/brand/jobon-icon.png" alt="" aria-hidden="true" width={size} height={size} className="jo-mark" />
          <Word />
        </span>
        <span className="jo-tagline">{t('a11y.tagline', SITE.tagline)}</span>
      </span>
    )
  }
  return (
    <span className={`jo-logo ${className}`}>
      <img
        src="/brand/jobon-icon.png"
        alt={mark ? SITE.name : ''}
        aria-hidden={mark ? undefined : 'true'}
        width={size}
        height={size}
        className="jo-mark"
      />
      {!mark && showName && <Word />}
    </span>
  )
}
