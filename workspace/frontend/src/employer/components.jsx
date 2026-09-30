import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../marketing/icons'
import { SITE } from '../marketing/content'
import { Avatar } from '../marketing/components'
import { Stepper } from '../onboarding/components'
import { PITCH, PASSWORD_RULES, UPLOAD_LIMITS, WIZARD_STEPS } from './data'
import '../onboarding/onboarding.css'
import './employer.css'
import Logo from '../marketing/Logo'

/* ---------- split-screen shell (login + password recovery) ---------- */

export function EmpSplit({ children, topRight, showPitch = true }) {
  return (
    <div className="mk emp">
      <div className="emp-split">
        <header className="emp-topbar">
          <Link to="/" className="mk-brand">
            <Logo size={30} />
          </Link>
          <span className="spacer" />
          {topRight}
        </header>

        <div className="emp-cols">
          <section className="emp-pitch">
            {showPitch && <Pitch />}
          </section>
          <section className="emp-form-wrap">
            <div className="emp-card">{children}</div>
          </section>
        </div>
      </div>
    </div>
  )
}

function Pitch() {
  return (
    <>
      <h1>{PITCH.title}</h1>
      <p className="lede">{PITCH.lede}</p>
      <div className="emp-points">
        {PITCH.points.map((p) => (
          <div className="emp-point" key={p.text}>
            <span className="ic"><Icon name={p.icon} size={16} /></span>
            {p.text}
          </div>
        ))}
      </div>
      <div className="emp-trust">
        <span className="emp-faces" aria-hidden="true">
          <Avatar name="Fresh Mart" size={30} />
          <Avatar name="Bloom Cafe" size={30} />
          <Avatar name="Tirumala Home" size={30} />
        </span>
        <span>
          <span className="n" style={{ display: 'block' }}>{PITCH.trust.count}</span>
          <span className="d">{PITCH.trust.label}</span>
        </span>
      </div>
    </>
  )
}

export function BackToLogin() {
  return (
    <Link to="/employer/login" className="mk-btn mk-btn-ghost mk-btn-sm">
      <Icon name="chevronLeft" size={15} /> Back to Login
    </Link>
  )
}

/* ---------- wizard shell (onboarding steps) ---------- */

export function EmpWizard({ step, title, sub, children, wide }) {
  return (
    <div className="mk emp">
      <div className="emp-wizard">
        <header className="emp-topbar">
          <Link to="/" className="mk-brand">
            <Logo size={30} />
          </Link>
          <span className="spacer" />
          <Link to="/help" className="ob-help">Help</Link>
        </header>

        <main className="emp-wizard-main">
          <div className="emp-wizard-card" style={wide ? { maxWidth: 760 } : undefined}>
            <Stepper steps={WIZARD_STEPS} current={step} />
            <h1>{title}</h1>
            {sub && <p className="sub">{sub}</p>}
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

/* ---------- password rule checklist ---------- */

export function PasswordRules({ value }) {
  return (
    <div className="emp-rules">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value || '')
        return (
          <div className={`emp-rule${ok ? ' ok' : ''}`} key={r.key}>
            <span className="tick" aria-hidden="true">
              <Icon name="check" size={10} strokeWidth={4} />
            </span>
            {r.label}
          </div>
        )
      })}
    </div>
  )
}

/* ---------- file upload ---------- */

/**
 * Reads a chosen file to a data URL. There is no object storage yet, so the
 * file travels as base64 — which is ~33% larger than the file itself.
 */
function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onerror = () => reject(new Error('Could not read that file'))
    r.onload = () => resolve(r.result)
    r.readAsDataURL(file)
  })
}

const MAX_IMAGE_PX = 640

/**
 * Downscales an image before it is stored. A phone photo of a shop front can be
 * several megabytes; as a logo it only ever renders small, so shipping the
 * original wastes bandwidth and overflows the column.
 */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that image'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That does not look like an image'))
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_PX / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        // White behind a transparent PNG, since we re-encode as JPEG.
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export function UploadBox({ kind = 'doc', value, fileName, onChange, onError }) {
  const limits = UPLOAD_LIMITS[kind]
  const ref = useRef(null)
  const [name, setName] = useState(fileName || '')

  const pick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > limits.bytes) {
      onError?.(`That file is too large. ${limits.label}.`)
      e.target.value = ''
      return
    }
    try {
      const url = file.type.startsWith('image/')
        ? await compressImage(file)
        : await readAsDataUrl(file)
      // Guard the column even after compression (a large scanned PDF, say).
      if (url.length > 1400000) {
        onError?.('That file is too large to store. Please upload a smaller one.')
        e.target.value = ''
        return
      }
      setName(file.name)
      onChange(url, file.name)
    } catch (err) {
      onError?.(err.message)
    }
  }

  const clear = () => {
    setName('')
    onChange(null, '')
    if (ref.current) ref.current.value = ''
  }

  return (
    <>
      <button type="button" className={`emp-upload${value ? ' filled' : ''}`} onClick={() => ref.current?.click()}>
        <span className="ic">
          <Icon name={value ? 'checkCircle' : 'doc'} size={20} />
        </span>
        <span>
          <span className="t" style={{ display: 'block' }}>
            {value ? 'File attached' : <><b>Click to upload</b> or drag and drop</>}
          </span>
          <span className="h">{limits.label}</span>
        </span>
      </button>
      <input ref={ref} type="file" accept={limits.accept} hidden onChange={pick} />
      {value && (
        <div className="emp-file-row">
          {kind === 'logo' && <img className="emp-logo-preview" src={value} alt="" />}
          <span className="nm">{name || 'Uploaded file'}</span>
          <button type="button" onClick={clear}>Remove</button>
        </div>
      )}
    </>
  )
}

/* ---------- plan + payment pickers ---------- */

export function PlanCard({ plan, selected, onClick }) {
  return (
    <button type="button" className="emp-plan" aria-pressed={selected} onClick={onClick}>
      {plan.popular && <span className="tag">Most popular</span>}
      <span className="nm">{plan.name}</span>
      <span className="price">
        {plan.price} {plan.per && <span className="per">{plan.per}</span>}
      </span>
      <ul>{plan.features.map((f) => <li key={f}>{f}</li>)}</ul>
      <span className="pick" aria-hidden="true" />
    </button>
  )
}

export function PayOption({ option, selected, onClick }) {
  return (
    <button type="button" className="emp-pay-opt" aria-pressed={selected} onClick={onClick}>
      <span className="mark" aria-hidden="true" />
      {option.label}
    </button>
  )
}
