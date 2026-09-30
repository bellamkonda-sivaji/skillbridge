import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { SITE } from '../../marketing/content'
import { useDocumentTitle } from '../../marketing/components'
import api from '../../api'
import '../employer.css'
import Logo from '../../marketing/Logo'

const CONFETTI = [
  { left: '6%', top: '14%', bg: '#2563eb' },
  { left: '88%', top: '10%', bg: '#f59e0b' },
  { left: '0%', top: '54%', bg: '#10b981' },
  { left: '94%', top: '48%', bg: '#ef4444' },
  { left: '18%', top: '90%', bg: '#8b5cf6' },
  { left: '76%', top: '88%', bg: '#0ea5e9' },
  { left: '46%', top: '2%', bg: '#10b981' },
  { left: '30%', top: '4%', bg: '#f59e0b' },
]

/**
 * Screen 5. While this shows, we ask where the employer should actually land —
 * the wizard if onboarding is unfinished, the dashboard otherwise.
 */
export default function LoginSuccess() {
  useDocumentTitle('Login successful')
  const navigate = useNavigate()
  const [progress, setProgress] = useState(12)

  useEffect(() => {
    let done = false
    const bar = setInterval(() => setProgress((p) => (p < 90 ? p + 11 : p)), 220)

    const go = (path) => {
      if (done) return
      done = true
      setProgress(100)
      setTimeout(() => navigate(path, { replace: true }), 320)
    }

    api.get('/employer/onboarding')
      .then((res) => go(res.data?.onboardingCompleted ? '/dashboard' : '/employer/onboarding'))
      .catch(() => go('/employer/onboarding'))

    // Never strand someone on this screen if the call hangs.
    const safety = setTimeout(() => go('/dashboard'), 6000)
    return () => { clearInterval(bar); clearTimeout(safety) }
  }, [navigate])

  return (
    <div className="mk emp">
      <div className="emp-wizard">
        <header className="emp-topbar">
          <span className="mk-brand">
            <Logo size={30} />
          </span>
        </header>

        <div className="emp-success">
          <div className="tick">
            <span className="emp-confetti" aria-hidden="true">
              {CONFETTI.map((c, i) => (
                <span key={i} style={{ left: c.left, top: c.top, background: c.bg }} />
              ))}
            </span>
            <Icon name="check" size={46} strokeWidth={3} />
          </div>

          <h1>Login Successful!</h1>
          <p>Redirecting to your dashboard…</p>

          <div className="small">Setting up your workspace…</div>
          <div className="emp-progress"><i style={{ width: `${progress}%` }} /></div>
        </div>
      </div>
    </div>
  )
}
