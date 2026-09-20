import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../marketing/icons'
import { SITE } from '../marketing/content'
import './onboarding.css'

/* ---------- shell ---------- */

export function ObShell({ children }) {
  return (
    <div className="mk">
      <div className="ob-shell">
        <header className="ob-topbar">
          <div className="mk-container ob-topbar-inner">
            <Link to="/" className="mk-brand" aria-label={`${SITE.name} home`}>
              <span className="mk-brand-mark" aria-hidden="true">SB</span>
              {SITE.name}
            </Link>
            <Link to="/help" className="ob-help">Help</Link>
          </div>
        </header>
        <main className="ob-main">{children}</main>
      </div>
    </div>
  )
}

export function ObCard({ wide, children }) {
  return <div className={`ob-card${wide ? ' wide' : ''}`}>{children}</div>
}

export function ObHead({ icon, title, sub, align }) {
  return (
    <>
      {icon && <div className="ob-hero-icon">{icon}</div>}
      <div className={`ob-head${align === 'left' ? ' left' : ''}`}>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
    </>
  )
}

/* ---------- stepper ---------- */

export function Stepper({ steps, current }) {
  return (
    <div className="ob-stepper" aria-label={`Step ${current + 1} of ${steps.length}`}>
      {steps.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : ''
        return (
          <div className={`ob-step ${state}`} key={label}>
            <div className="ob-step-dot" aria-hidden="true">
              {i < current ? <Icon name="check" size={14} strokeWidth={3} /> : i + 1}
            </div>
            <div className="ob-step-label">{label}</div>
          </div>
        )
      })}
    </div>
  )
}

/* ---------- selectable controls ---------- */

export function OptionRow({ selected, onClick, flag, native, latin, badge }) {
  return (
    <button type="button" className="ob-row" aria-pressed={selected} onClick={onClick}>
      {flag && <span className="flag" aria-hidden="true">{flag}</span>}
      <span className="names">
        <span className="native" style={{ display: 'block' }}>{native}</span>
        {latin && <span className="latin">{latin}</span>}
      </span>
      {badge && <span className="ob-soon">{badge}</span>}
      <span className="ob-radio" aria-hidden="true">
        {selected && <Icon name="check" size={12} strokeWidth={3.5} />}
      </span>
    </button>
  )
}

export function ChoiceCard({ selected, onClick, icon, title, points }) {
  return (
    <button type="button" className="ob-choice" aria-pressed={selected} onClick={onClick}>
      <span className="ob-choice-art" aria-hidden="true"><Icon name={icon} size={28} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="title" style={{ display: 'block' }}>{title}</span>
        <ul>
          {points.map((p) => (
            <li key={p}><Icon name="check" size={13} strokeWidth={3} />{p}</li>
          ))}
        </ul>
      </span>
      <span className="ob-radio" aria-hidden="true" style={{ alignSelf: 'flex-start' }}>
        {selected && <Icon name="check" size={12} strokeWidth={3.5} />}
      </span>
    </button>
  )
}

export function Tile({ selected, onClick, icon, label }) {
  return (
    <button type="button" className="ob-tile" aria-pressed={selected} onClick={onClick}>
      <span className={`mk-icon-box sm`} style={{ width: 30, height: 30, marginBottom: 0 }} aria-hidden="true">
        <Icon name={icon} size={16} />
      </span>
      <span>{label}</span>
    </button>
  )
}

export function Pill({ selected, onClick, label, radio = true }) {
  return (
    <button type="button" className="ob-pill" aria-pressed={selected} onClick={onClick}>
      {radio && <span className="mark" aria-hidden="true" />}
      <span>{label}</span>
    </button>
  )
}

export function Chip({ selected, onClick, label }) {
  return (
    <button type="button" className="ob-chip" aria-pressed={selected} onClick={onClick}>
      {selected && <Icon name="check" size={12} strokeWidth={3} />}
      {label}
    </button>
  )
}

/* ---------- form fields ---------- */

export function Field({ label, hint, error, htmlFor, children }) {
  return (
    <div className="ob-field">
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {error ? <span className="ob-error">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </div>
  )
}

export function PhoneField({ id, value, onChange, placeholder = '98765 43210', error, ...rest }) {
  return (
    <div className="ob-phone">
      <span className="cc">+91</span>
      <input
        id={id}
        className="ob-input"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={11}
        aria-invalid={error ? 'true' : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/[^\d ]/g, ''))}
        {...rest}
      />
    </div>
  )
}

export function PasswordField({ id, value, onChange, placeholder, error }) {
  const [show, setShow] = useState(false)
  return (
    <div className="ob-pw">
      <input
        id={id}
        className="ob-input"
        type={show ? 'text' : 'password'}
        autoComplete="new-password"
        value={value}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
        <Icon name="eye" size={18} />
      </button>
    </div>
  )
}

/**
 * Six single-character boxes that behave like one field: typing advances,
 * backspace retreats, and a pasted code fills every box.
 */
export function OtpInput({ value, onChange, length = 6, invalid }) {
  const refs = useRef([])

  const setChar = (i, char) => {
    const next = value.split('')
    next[i] = char
    onChange(next.join('').slice(0, length))
  }

  const onKeyDown = (i) => (e) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus()
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus()
  }

  const onPaste = (e) => {
    const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, length)
    if (!digits) return
    e.preventDefault()
    onChange(digits)
    refs.current[Math.min(digits.length, length - 1)]?.focus()
  }

  useEffect(() => { refs.current[0]?.focus() }, [])

  return (
    <div className="ob-otp" onPaste={onPaste}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid ? 'true' : undefined}
          value={value[i] || ''}
          onChange={(e) => {
            const char = e.target.value.replace(/\D/g, '').slice(-1)
            setChar(i, char)
            if (char && i < length - 1) refs.current[i + 1]?.focus()
          }}
          onKeyDown={onKeyDown(i)}
        />
      ))}
    </div>
  )
}

/* ---------- navigation ---------- */

export function StepNav({ onBack, backTo, nextLabel = 'Continue', disabled, busy, onNext, type = 'button' }) {
  const navigate = useNavigate()
  const goBack = onBack || (backTo ? () => navigate(backTo) : () => navigate(-1))
  return (
    <div className="ob-nav">
      <button type="button" className="ob-back" onClick={goBack}>
        <Icon name="chevronLeft" size={16} /> Back
      </button>
      <span className="grow" />
      <button
        type={type}
        className="mk-btn mk-btn-primary"
        onClick={onNext}
        disabled={disabled || busy}
        style={{ minWidth: 150, opacity: disabled || busy ? 0.6 : 1 }}
      >
        {busy ? 'Please wait…' : nextLabel}
        {!busy && <Icon name="arrowRight" size={17} />}
      </button>
    </div>
  )
}

export function Alert({ kind = 'err', children }) {
  if (!children) return null
  return <div className={`ob-alert ${kind}`}>{children}</div>
}
