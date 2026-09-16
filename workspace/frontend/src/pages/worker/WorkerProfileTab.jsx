import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api, { errMsg } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { MapPicker } from '../../components/MapPicker'
import { TagInput } from '../../components/controls'
import { Badge } from '../../components/ui'

const AVAILS = ['IMMEDIATE', 'PART_TIME', 'FULL_TIME', 'WEEKENDS_ONLY', 'EVENINGS']
const UNITS = ['PER_DAY', 'PER_WEEK', 'PER_MONTH']

export default function WorkerProfileTab() {
  const { t } = useTranslation()
  const { user, refresh } = useAuth()
  const [form, setForm] = useState({
    skills: [], experienceYears: 0, jobTitle: '', bio: '', city: '', area: '',
    latitude: 0, longitude: 0, locationEnabled: true,
    availability: 'IMMEDIATE', expectedSalary: 0, salaryUnit: 'PER_MONTH', verificationDoc: ''
  })
  const [loaded, setLoaded] = useState(false)
  const [msg, setMsg] = useState('')
  const [verification, setVerification] = useState('UNVERIFIED')

  useEffect(() => {
    api.get('/worker/profile').then((res) => {
      setForm({
        skills: res.data.skills || [], experienceYears: res.data.experienceYears || 0,
        jobTitle: res.data.jobTitle || '', bio: res.data.bio || '',
        city: res.data.city || '', area: res.data.area || '',
        latitude: res.data.latitude || 0, longitude: res.data.longitude || 0,
        locationEnabled: res.data.locationEnabled !== false,
        availability: res.data.availability || 'IMMEDIATE',
        expectedSalary: res.data.expectedSalary || 0, salaryUnit: res.data.salaryUnit || 'PER_MONTH',
        verificationDoc: ''
      })
      setVerification(res.data.verificationStatus || 'UNVERIFIED')
      setLoaded(true)
    }).catch(() => {})
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    setMsg('')
    try {
      await api.put('/worker/profile', form)
      setMsg(t('worker.save') + ' ✓')
      refresh()
    } catch (e) { alert(errMsg(e)) }
  }

  const verificationBadge = (
    <Badge type={{ VERIFIED: 'green', PENDING: 'amber', UNVERIFIED: 'gray', REJECTED: 'red' }[verification]}>
      {t(`verification.${verification}`)}
    </Badge>
  )

  if (!loaded) return null

  return (
    <div>
      {msg && <div className="alert alert-success">{msg}</div>}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h3>{t('worker.profile')}</h3>
          {verificationBadge}
        </div>
        <p className="card-sub">{t('worker.profileHint')}</p>

        <div className="row">
          <div className="field">
            <label>{t('worker.jobTitle')}</label>
            <input value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} />
          </div>
          <div className="field">
            <label>{t('worker.experience')}</label>
            <input type="number" min="0" value={form.experienceYears} onChange={(e) => set('experienceYears', +e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>{t('worker.skills')}</label>
          <TagInput value={form.skills} onChange={(v) => set('skills', v)} placeholder="e.g. Carpentry, Tiling" />
        </div>

        <div className="field">
          <label>{t('worker.bio')}</label>
          <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} />
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
        </div>

        <div className="field">
          <label>{t('worker.location')}</label>
          <MapPicker
            lat={form.latitude}
            lng={form.longitude}
            onChange={(lat, lng) => { set('latitude', lat); set('longitude', lng); set('locationEnabled', true) }}
          />
        </div>

        <div className="row">
          <div className="field">
            <label>{t('worker.availability')}</label>
            <select value={form.availability} onChange={(e) => set('availability', e.target.value)}>
              {AVAILS.map((a) => <option key={a} value={a}>{t(`availability.${a}`)}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t('worker.expectedSalary')}</label>
            <input type="number" min="0" value={form.expectedSalary} onChange={(e) => set('expectedSalary', +e.target.value)} />
          </div>
          <div className="field">
            <label>{t('worker.salaryUnit')}</label>
            <select value={form.salaryUnit} onChange={(e) => set('salaryUnit', e.target.value)}>
              {UNITS.map((u) => <option key={u} value={u}>{t(`salaryUnit.${u}`)}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label>{t('worker.verifyDoc')}</label>
          <input value={form.verificationDoc} onChange={(e) => set('verificationDoc', e.target.value)} />
          <p className="muted">Submit an ID number or license to request verification (reviewed by admin)</p>
        </div>

        <button className="btn btn-primary" onClick={save}>{t('worker.save')}</button>
      </div>
    </div>
  )
}
