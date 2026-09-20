import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import api, { errMsg } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { ObShell, ObCard, ObHead, Stepper, OtpInput, Alert } from '../components'
import { useOnboarding } from '../OnboardingContext'

const pretty = (p) => (p && p.length === 10 ? `+91 ${p.slice(0, 5)} ${p.slice(5)}` : `+91 ${p || ''}`)
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function VerifyOtp() {
  useDocumentTitle('Verify your mobile number')
  const navigate = useNavigate()
  const location = useLocation()
  const { applySession, user } = useAuth()
  const { draft } = useOnboarding()

  const phone = draft.phone || user?.phone || ''
  const accountType = draft.role || user?.accountType || 'WORKER'
  const authBase = `/${accountType.toLowerCase()}/auth`
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [seconds, setSeconds] = useState(30)
  // Present only while the backend runs in demo mode (no SMS provider wired up).
  const [devCode, setDevCode] = useState(location.state?.devCode || '')
  const submitted = useRef(false)

  useEffect(() => {
    if (seconds <= 0) return undefined
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds])

  const verify = async (value) => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const res = await api.post(`${authBase}/otp/verify`, { phone, code: value })
      if (res.data?.token && res.data?.account) applySession(res.data.token, res.data.account, accountType)
      navigate(accountType === 'EMPLOYER' ? '/employer/onboarding' : '/join/about-you', { replace: true })
    } catch (err) {
      setError(errMsg(err, 'That code is not right. Please check and try again.'))
      setCode('')
      submitted.current = false
    } finally {
      setBusy(false)
    }
  }

  // Auto-submit as soon as the sixth digit lands — no extra tap needed.
  useEffect(() => {
    if (code.length === 6 && !submitted.current) {
      submitted.current = true
      verify(code)
    }
  }, [code]) // eslint-disable-line react-hooks/exhaustive-deps

  const resend = async () => {
    setError('')
    try {
      const res = await api.post(`${authBase}/otp/request`, { phone })
      setDevCode(res.data?.devCode || '')
      setSeconds(res.data?.resendAfterSeconds || 30)
      setCode('')
      submitted.current = false
    } catch (err) {
      setError(errMsg(err, 'Could not send the code. Please try again shortly.'))
    }
  }

  return (
    <ObShell>
      <ObCard>
        <Stepper steps={['Account', 'Verify', 'Profile']} current={1} />

        <ObHead
          icon={<Icon name="chat" size={30} />}
          title="Verify your mobile number"
          sub={`We have sent a 6-digit OTP to ${pretty(phone)}`}
        />

        <Alert>{error}</Alert>
        {devCode && (
          <Alert kind="info">
            <strong>Demo mode:</strong> no SMS provider is connected yet, so your code is{' '}
            <strong style={{ letterSpacing: 2 }}>{devCode}</strong>.
          </Alert>
        )}

        <OtpInput value={code} onChange={setCode} invalid={!!error} />

        <div className="ob-resend">
          {seconds > 0 ? (
            <>Resend OTP in {mmss(seconds)}</>
          ) : (
            <button type="button" onClick={resend}>Resend OTP</button>
          )}
        </div>

        <button
          type="button"
          className="mk-btn mk-btn-primary mk-btn-block"
          style={{ marginTop: 20 }}
          disabled={code.length !== 6 || busy}
          onClick={() => verify(code)}
        >
          {busy ? 'Verifying…' : 'Verify & Continue'}
        </button>

        <div className="ob-nav" style={{ marginTop: 14 }}>
          <button type="button" className="ob-back" onClick={() => navigate('/join/create')}>
            <Icon name="chevronLeft" size={16} /> Back
          </button>
        </div>

        <div className="ob-safe">
          <Icon name="shield" size={17} /> Your information is safe with us.
        </div>
      </ObCard>
    </ObShell>
  )
}
