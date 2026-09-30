import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { Field, PhoneField, StepNav, Alert, ChoiceCard } from '../../onboarding/components'
import { DEFAULT_MAP_CENTER } from '../../onboarding/data'
import { EmpWizard, UploadBox, PlanCard, PayOption } from '../components'
import {
  EMPLOYER_KINDS, BUSINESS_CATEGORIES, BUSINESS_SIZES, PLANS, PAYMENT_METHODS,
} from '../data'
import api, { errMsg } from '../../api'

/* ---------- shared loader ---------- */

/** Loads the saved profile so each step prefills and the wizard can resume. */
function useProfile() {
  const [profile, setProfile] = useState(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    api.get('/employer/onboarding')
      .then((r) => setProfile(r.data || {}))
      .catch(() => { setProfile({}); setFailed(true) })
  }, [])
  return { profile, failed }
}

const save = (body) => api.patch('/employer/onboarding', body).then((r) => r.data)

function Loading() {
  return <p className="wk-sub" style={{ padding: '30px 0' }}>Loading…</p>
}

/* ---------- 6. Account type ---------- */

export function AccountType() {
  useDocumentTitle('Choose account type')
  const navigate = useNavigate()
  const { profile } = useProfile()
  const [kind, setKind] = useState('BUSINESS')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (profile?.employerKind) setKind(profile.employerKind) }, [profile])

  const submit = async () => {
    setBusy(true); setError('')
    try {
      await save({ employerKind: kind })
      navigate('/employer/onboarding/business')
    } catch (err) {
      setError(errMsg(err, 'Could not save your choice. Please try again.'))
    } finally { setBusy(false) }
  }

  return (
    <EmpWizard
      step={0}
      title="Get Started with JobOn"
      sub="Choose the option that best describes you."
    >
      <Alert>{error}</Alert>
      {!profile ? <Loading /> : (
        <>
          <div style={{ display: 'grid', gap: 13 }}>
            {EMPLOYER_KINDS.map((k) => (
              <ChoiceCard
                key={k.value}
                selected={kind === k.value}
                onClick={() => setKind(k.value)}
                icon={k.icon}
                title={k.title}
                points={[k.text]}
              />
            ))}
          </div>
          <button
            className="mk-btn mk-btn-primary mk-btn-block"
            style={{ marginTop: 24 }}
            onClick={submit}
            disabled={busy}
          >
            {busy ? 'Saving…' : 'Continue'} <Icon name="arrowRight" size={17} />
          </button>
        </>
      )}
    </EmpWizard>
  )
}

/* ---------- 7. Business details ---------- */

export function BusinessDetails() {
  useDocumentTitle('Business details')
  const navigate = useNavigate()
  const { profile } = useProfile()
  const [f, setF] = useState(null)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!profile) return
    setF({
      businessName: profile.businessName || '',
      businessType: profile.businessType || '',
      businessSize: profile.businessSize || '',
      phone: profile.phone || '',
      email: profile.email || '',
      website: profile.website || '',
    })
  }, [profile])

  const set = (k) => (v) => { setF((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })) }

  const submit = async () => {
    const e = {}
    if (!f.businessName.trim()) e.businessName = 'Business name is required'
    if (!f.businessType) e.businessType = 'Choose a category'
    if (!f.businessSize) e.businessSize = 'Choose a size'
    if ((f.phone || '').replace(/\D/g, '').length !== 10) e.phone = 'Enter a 10-digit mobile number'
    if (!/^\S+@\S+\.\S+$/.test(f.email || '')) e.email = 'Enter a valid email address'
    setErrors(e)
    if (Object.keys(e).length) return

    setBusy(true); setError('')
    try {
      await save({
        businessName: f.businessName.trim(),
        businessType: f.businessType,
        businessSize: f.businessSize,
        phone: f.phone.replace(/\D/g, ''),
        email: f.email.trim(),
        website: f.website.trim() || null,
      })
      navigate('/employer/onboarding/location')
    } catch (err) {
      setError(errMsg(err, 'Could not save your business details.'))
    } finally { setBusy(false) }
  }

  return (
    <EmpWizard step={1} title="Tell us about your business" sub="Provide your business information.">
      <Alert>{error}</Alert>
      {!f ? <Loading /> : (
        <>
          <Field label={<span className="emp-req">Business Name</span>} htmlFor="bd-name" error={errors.businessName}>
            <input id="bd-name" className="ob-input" placeholder="Fresh Mart Supermarket"
              value={f.businessName} onChange={(e) => set('businessName')(e.target.value)} />
          </Field>

          <div className="emp-two">
            <Field label={<span className="emp-req">Business Category</span>} htmlFor="bd-cat" error={errors.businessType}>
              <select id="bd-cat" className="ob-input" value={f.businessType} onChange={(e) => set('businessType')(e.target.value)}>
                <option value="">Select a category</option>
                {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label={<span className="emp-req">Business Size</span>} htmlFor="bd-size" error={errors.businessSize}>
              <select id="bd-size" className="ob-input" value={f.businessSize} onChange={(e) => set('businessSize')(e.target.value)}>
                <option value="">Select a size</option>
                {BUSINESS_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <Field label={<span className="emp-req">Phone Number</span>} htmlFor="bd-phone" error={errors.phone}>
            <PhoneField id="bd-phone" value={f.phone} onChange={set('phone')} placeholder="98765 43210" error={errors.phone} />
          </Field>

          <Field label={<span className="emp-req">Email Address</span>} htmlFor="bd-email" error={errors.email}>
            <input id="bd-email" className="ob-input" type="email" placeholder="business@freshmart.com"
              value={f.email} onChange={(e) => set('email')(e.target.value)} />
          </Field>

          <Field label="Business Website (Optional)" htmlFor="bd-web">
            <input id="bd-web" className="ob-input" placeholder="https://www.freshmart.com"
              value={f.website} onChange={(e) => set('website')(e.target.value)} />
          </Field>

          <StepNav backTo="/employer/onboarding" onNext={submit} busy={busy} />
        </>
      )}
    </EmpWizard>
  )
}

/* ---------- 8. Business location ---------- */

const pin = L.divIcon({
  className: '',
  html: '<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#2563eb;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
})

function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

function Recenter({ position }) {
  const map = useMap()
  useEffect(() => { if (position) map.setView(position, Math.max(map.getZoom(), 14)) }, [position, map])
  return null
}

export function BusinessLocation() {
  useDocumentTitle('Business location')
  const navigate = useNavigate()
  const { profile } = useProfile()
  const [f, setF] = useState(null)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (!profile) return
    setF({
      address: profile.address || '',
      pincode: profile.pincode || '',
      city: profile.city || '',
      area: profile.area || '',
      latitude: profile.latitude || 0,
      longitude: profile.longitude || 0,
      businessName: profile.businessName || 'Your business',
    })
  }, [profile])

  const place = useCallback((lat, lng) => {
    setF((p) => ({ ...p, latitude: lat, longitude: lng }))
    setErrors((e) => ({ ...e, map: undefined }))
  }, [])

  const locate = () => {
    if (!navigator.geolocation) { setError('Your browser cannot share a location. Tap the map instead.'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { place(pos.coords.latitude, pos.coords.longitude); setLocating(false) },
      () => { setError('We could not get your location. Tap the map to place the pin.'); setLocating(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const submit = async () => {
    const e = {}
    if (!f.address.trim()) e.address = 'Address is required'
    if (!/^\d{6}$/.test(f.pincode || '')) e.pincode = 'Enter a 6-digit pincode'
    if (!f.city.trim()) e.city = 'City is required'
    if (!f.latitude || !f.longitude) e.map = 'Place the pin so workers can see how far away you are'
    setErrors(e)
    if (Object.keys(e).length) return

    setBusy(true); setError('')
    try {
      await save({
        address: f.address.trim(),
        pincode: f.pincode,
        city: f.city.trim(),
        area: f.area.trim() || null,
        latitude: f.latitude,
        longitude: f.longitude,
      })
      navigate('/employer/onboarding/verification')
    } catch (err) {
      setError(errMsg(err, 'Could not save your location.'))
    } finally { setBusy(false) }
  }

  const position = f?.latitude && f?.longitude ? [f.latitude, f.longitude] : null

  return (
    <EmpWizard
      step={2}
      title="Business Location"
      sub="Add your business address (this will be shown to relevant workers)"
    >
      <Alert>{error}</Alert>
      {!f ? <Loading /> : (
        <>
          <Field label={<span className="emp-req">Address</span>} htmlFor="bl-addr" error={errors.address}>
            <textarea
              id="bl-addr" className="emp-textarea"
              placeholder="18-3-12, Air Bypass Road, Tirupati, Andhra Pradesh - 517501"
              value={f.address}
              onChange={(e) => { setF((p) => ({ ...p, address: e.target.value })); setErrors((x) => ({ ...x, address: undefined })) }}
            />
          </Field>

          <div className="emp-two">
            <Field label={<span className="emp-req">Pincode</span>} htmlFor="bl-pin" error={errors.pincode}>
              <input id="bl-pin" className="ob-input" inputMode="numeric" maxLength={6} placeholder="517501"
                value={f.pincode}
                onChange={(e) => { setF((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, '') })); setErrors((x) => ({ ...x, pincode: undefined })) }} />
            </Field>
            <Field label={<span className="emp-req">City</span>} htmlFor="bl-city" error={errors.city}>
              <input id="bl-city" className="ob-input" placeholder="Tirupati"
                value={f.city}
                onChange={(e) => { setF((p) => ({ ...p, city: e.target.value })); setErrors((x) => ({ ...x, city: undefined })) }} />
            </Field>
          </div>

          <Field label="Area / Landmark (Optional)" htmlFor="bl-area">
            <input id="bl-area" className="ob-input" placeholder="Air Bypass Road"
              value={f.area} onChange={(e) => setF((p) => ({ ...p, area: e.target.value }))} />
          </Field>

          <Field error={errors.map} hint="Tap the map to move the pin to your shop.">
            <div className="emp-map-wrap">
              {position && (
                <div className="emp-map-pin">
                  <span className="mk-icon-box sm" style={{ width: 28, height: 28, marginBottom: 0 }}>
                    <Icon name="store" size={15} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span className="nm" style={{ display: 'block' }}>{f.businessName}</span>
                    <span className="ct">{[f.city, 'AP'].filter(Boolean).join(', ')}</span>
                  </span>
                </div>
              )}
              <button type="button" className="emp-map-btn" onClick={locate} disabled={locating}>
                <Icon name="pin" size={14} /> {locating ? 'Locating…' : 'Adjust Location'}
              </button>
              <MapContainer
                center={position || DEFAULT_MAP_CENTER}
                zoom={position ? 14 : 12}
                className="emp-map"
                scrollWheelZoom={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                <ClickToPlace onPick={place} />
                <Recenter position={position} />
                {position && <Marker position={position} icon={pin} />}
              </MapContainer>
            </div>
          </Field>

          <StepNav backTo="/employer/onboarding/business" onNext={submit} busy={busy} />
        </>
      )}
    </EmpWizard>
  )
}

/* ---------- 9. Verification ---------- */

export function Verification() {
  useDocumentTitle('Verify your business')
  const navigate = useNavigate()
  const { profile } = useProfile()
  const [doc, setDoc] = useState(null)
  const [logo, setLogo] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!profile) return
    setDoc(profile.registrationDocUrl || null)
    setLogo(profile.logoUrl || null)
    setConfirmed(Boolean(profile.authorizedConfirmed))
  }, [profile])

  const submit = async () => {
    if (!confirmed) { setError('Please confirm the information is accurate to continue.'); return }
    setBusy(true); setError('')
    try {
      await save({ registrationDocUrl: doc, logoUrl: logo, authorizedConfirmed: true })
      navigate('/employer/onboarding/plan')
    } catch (err) {
      setError(errMsg(err, 'Could not save your verification details.'))
    } finally { setBusy(false) }
  }

  return (
    <EmpWizard
      step={3}
      title="Verify Your Business"
      sub="Build trust with workers. This information is kept secure."
    >
      <Alert>{error}</Alert>
      {profile === null ? <Loading /> : (
        <>
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
              Business Registration (Optional)
            </div>
            <p className="wk-sub" style={{ marginTop: 4, marginBottom: 10 }}>
              Upload GST, Shop Act, or any business registration document.
            </p>
            <UploadBox kind="doc" value={doc} onChange={(url) => setDoc(url)} onError={setError} />
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
              Business Logo (Optional)
            </div>
            <p className="wk-sub" style={{ marginTop: 4, marginBottom: 10 }}>
              Add your business logo. This will be visible to workers.
            </p>
            <UploadBox kind="logo" value={logo} onChange={(url) => setLogo(url)} onError={setError} />
          </div>

          <div className="ob-check">
            <input id="vf-ok" type="checkbox" checked={confirmed} onChange={(e) => { setConfirmed(e.target.checked); setError('') }} />
            <label htmlFor="vf-ok">
              I confirm that the information provided is accurate and I am authorized to represent this business.
            </label>
          </div>

          <p className="wk-sub">
            Verification is reviewed by our team. You can start posting jobs straight away —
            a verified badge appears on your profile once the check completes.
          </p>

          <StepNav backTo="/employer/onboarding/location" onNext={submit} busy={busy} disabled={!confirmed} />
        </>
      )}
    </EmpWizard>
  )
}

/* ---------- 10. Choose plan & complete ---------- */

export function ChoosePlan() {
  useDocumentTitle('Choose a plan')
  const navigate = useNavigate()
  const { profile } = useProfile()
  const [plan, setPlan] = useState('GROWTH')
  const [method, setMethod] = useState('UPI')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!profile) return
    if (profile.plan) setPlan(profile.plan)
    if (profile.paymentMethod) setMethod(profile.paymentMethod)
  }, [profile])

  const submit = async () => {
    setBusy(true); setError('')
    try {
      await save({ plan, paymentMethod: method, onboardingCompleted: true })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(errMsg(err, 'Could not complete your setup.'))
      setBusy(false)
    }
  }

  const free = plan === 'STARTER'

  return (
    <EmpWizard
      step={4}
      title="Choose a Plan"
      sub="Start with a plan that fits your hiring needs. You can change later."
      wide
    >
      <Alert>{error}</Alert>
      {!profile ? <Loading /> : (
        <>
          <div className="emp-plans">
            {PLANS.map((p) => (
              <PlanCard key={p.value} plan={p} selected={plan === p.value} onClick={() => setPlan(p.value)} />
            ))}
          </div>

          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '26px 0 12px' }}>Payment Method</h2>
          {free ? (
            <p className="wk-sub" style={{ marginTop: 0 }}>
              The Starter plan is free — no payment method needed. You can add one when you upgrade.
            </p>
          ) : (
            <>
              <div className="emp-pay">
                {PAYMENT_METHODS.map((m) => (
                  <PayOption key={m.value} option={m} selected={method === m.value} onClick={() => setMethod(m.value)} />
                ))}
              </div>
              <p className="wk-sub">
                No payment is taken now. We will set up billing before your first charge.
              </p>
            </>
          )}

          <StepNav
            backTo="/employer/onboarding/verification"
            onNext={submit}
            busy={busy}
            nextLabel="Complete Setup"
          />
        </>
      )}
    </EmpWizard>
  )
}
