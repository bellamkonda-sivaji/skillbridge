import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import api, { errMsg } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { ObShell, ObCard, ObHead, Stepper, Field, Pill, StepNav, Alert } from '../components'
import { useOnboarding } from '../OnboardingContext'
import { RADIUS_OPTIONS, AVAILABILITY_OPTIONS, DEFAULT_MAP_CENTER } from '../data'

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

/** Keeps the viewport following the pin when it moves programmatically. */
function Recenter({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 14))
  }, [position, map])
  return null
}

export default function LocationAvailability() {
  useDocumentTitle('Location & availability')
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { refresh } = useAuth()
  const { draft, setDraft, reset } = useOnboarding()

  const hasPin = Boolean(draft.latitude && draft.longitude)
  const [form, setForm] = useState({
    city: draft.city || '',
    area: draft.area || '',
    latitude: draft.latitude || 0,
    longitude: draft.longitude || 0,
    preferredRadiusKm: draft.preferredRadiusKm === undefined ? 3 : draft.preferredRadiusKm,
    availability: draft.availability || 'IMMEDIATE',
  })
  const [errors, setErrors] = useState({})
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)
  const [locating, setLocating] = useState(false)

  const position = form.latitude && form.longitude ? [form.latitude, form.longitude] : null

  const place = (lat, lng) => {
    setForm((f) => ({ ...f, latitude: lat, longitude: lng }))
    setErrors((e) => ({ ...e, map: undefined }))
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setFailure(t('ob.location.errNoGeo'))
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { place(pos.coords.latitude, pos.coords.longitude); setLocating(false) },
      () => {
        setFailure(t('ob.location.errGeo'))
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const submit = async () => {
    setFailure('')
    const e = {}
    if (!form.city.trim()) e.city = t('ob.location.errCity')
    if (!form.latitude || !form.longitude) e.map = t('ob.location.errPin')
    setErrors(e)
    if (Object.keys(e).length) return

    setBusy(true)
    try {
      await api.patch('/worker/onboarding', {
        city: form.city.trim(),
        area: form.area.trim() || null,
        latitude: form.latitude,
        longitude: form.longitude,
        preferredRadiusKm: form.preferredRadiusKm,
        availability: form.availability,
      })
      setDraft({ ...form })
      await refresh().catch(() => {})
      reset() // onboarding finished — clear the saved draft
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setFailure(errMsg(err, t('ob.location.errSave')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ObShell>
      <ObCard wide>
        <Stepper steps={[t('ob.steps.account'), t('ob.steps.profile'), t('ob.steps.complete')]} current={1} />
        <ObHead title={t('ob.location.title')} sub={t('ob.location.sub')} />

        <Alert>{failure}</Alert>

        <div className="ob-two">
          <Field label={t('ob.location.city')} htmlFor="lo-city" error={errors.city}>
            <input
              id="lo-city"
              className="ob-input"
              placeholder={t('ob.location.cityPlaceholder')}
              autoComplete="address-level2"
              aria-invalid={errors.city ? 'true' : undefined}
              value={form.city}
              onChange={(e) => {
                setForm((f) => ({ ...f, city: e.target.value }))
                setErrors((x) => ({ ...x, city: undefined }))
              }}
            />
          </Field>
          <Field label={t('ob.location.area')} htmlFor="lo-area">
            <input
              id="lo-area"
              className="ob-input"
              placeholder={t('ob.location.areaPlaceholder')}
              value={form.area}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
            />
          </Field>
        </div>

        <Field label={t('ob.location.map')} error={errors.map} hint={t('ob.location.mapHint')}>
          <div className="ob-map-wrap">
            <button
              type="button"
              className="ob-locate"
              onClick={useMyLocation}
              disabled={locating}
            >
              <Icon name="pin" size={14} />
              {locating ? t('ob.location.locating') : t('ob.location.locate')}
            </button>
            <MapContainer
              center={position || DEFAULT_MAP_CENTER}
              zoom={position ? 14 : 12}
              className="ob-map"
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap"
              />
              <ClickToPlace onPick={place} />
              <Recenter position={position} />
              {position && <Marker position={position} icon={pin} />}
            </MapContainer>
          </div>
        </Field>

        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '22px 0 12px' }}>{t('ob.location.radius')}</h2>
        <div className="ob-pills compact">
          {RADIUS_OPTIONS.map((r) => (
            <Pill
              key={r.label}
              label={r.value === null ? t('opt.radius.ANY') : t('opt.radius.km', { count: r.value })}
              selected={form.preferredRadiusKm === r.value}
              onClick={() => setForm((f) => ({ ...f, preferredRadiusKm: r.value }))}
            />
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <Field label={t('ob.location.availability')} htmlFor="lo-avail">
            <select
              id="lo-avail"
              className="ob-select"
              value={form.availability}
              onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}
            >
              {AVAILABILITY_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>{t(`opt.availability.${a.value}`)}</option>
              ))}
            </select>
          </Field>
        </div>

        <StepNav
          backTo="/join/skills"
          onNext={submit}
          busy={busy}
          nextLabel={t('ob.location.finish')}
        />
      </ObCard>
    </ObShell>
  )
}
