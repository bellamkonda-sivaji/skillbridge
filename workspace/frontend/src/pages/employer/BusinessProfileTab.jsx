import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api, { errMsg } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { MapPicker } from '../../components/MapPicker'

export default function BusinessProfileTab() {
  const { t } = useTranslation()
  const { refresh } = useAuth()
  const [form, setForm] = useState({
    businessName: '', businessType: '', description: '', city: '', area: '',
    latitude: 0, longitude: 0, locationEnabled: true, website: ''
  })
  const [loaded, setLoaded] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get('/employer/profile').then((res) => {
      setForm({
        businessName: res.data.businessName || '', businessType: res.data.businessType || '',
        description: res.data.description || '', city: res.data.city || '', area: res.data.area || '',
        latitude: res.data.latitude || 0, longitude: res.data.longitude || 0,
        locationEnabled: res.data.locationEnabled !== false, website: res.data.website || ''
      })
      setLoaded(true)
    }).catch(() => {})
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    try {
      await api.put('/employer/profile', form)
      setMsg(t('employer.profile') + ' ✓')
      refresh()
    } catch (e) { alert(errMsg(e)) }
  }

  if (!loaded) return null
  return (
    <div>
      {msg && <div className="alert alert-success">{msg}</div>}
      <div className="card">
        <h3>{t('employer.profile')}</h3>
        <p className="card-sub">Complete your business profile before posting jobs.</p>

        <div className="row">
          <div className="field">
            <label>{t('employer.businessName')}</label>
            <input value={form.businessName} onChange={(e) => set('businessName', e.target.value)} />
          </div>
          <div className="field">
            <label>{t('employer.businessType')}</label>
            <input value={form.businessType} onChange={(e) => set('businessType', e.target.value)} placeholder="Construction, Hospitality..." />
          </div>
        </div>

        <div className="field">
          <label>{t('employer.description')}</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>

        <div className="row">
          <div className="field">
            <label>{t('worker.city')}</label>
            <input value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div className="field">
            <label>{t('worker.area')}</label>
            <input value={form.area} onChange={(e) => set('area', e.target.value)} />
          </div>
          <div className="field">
            <label>{t('employer.website')}</label>
            <input value={form.website} onChange={(e) => set('website', e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>{t('worker.location')}</label>
          <MapPicker lat={form.latitude} lng={form.longitude}
            onChange={(lat, lng) => { set('latitude', lat); set('longitude', lng); set('locationEnabled', true) }} />
        </div>

        <button className="btn btn-primary" onClick={save}>{t('common.save')}</button>
      </div>
    </div>
  )
}
