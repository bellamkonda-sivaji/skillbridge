import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api, { errMsg } from '../../api'
import { TagInput } from '../../components/controls'
import { MapPicker } from '../../components/MapPicker'

const empty = {
  title: '', description: '', requiredSkills: [], workType: 'DAILY',
  salary: 0, salaryUnit: 'PER_DAY', city: '', area: '',
  latitude: 0, longitude: 0, workersNeeded: 1, urgent: false
}

export default function PostJobTab({ onPosted }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(empty)
  const [msg, setMsg] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/employer/jobs', form)
      setMsg(t('employer.post') + ' ✓')
      setForm(empty)
      onPosted?.()
    } catch (err) { alert(errMsg(err)) }
  }

  return (
    <div className="card">
      {msg && <div className="alert alert-success">{msg}</div>}
      <h3>{t('employer.postJob')}</h3>
      <form onSubmit={submit} style={{ marginTop: 14 }}>
        <div className="field">
          <label>{t('employer.jobTitle')}</label>
          <input required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Skilled carpenter for renovation" />
        </div>
        <div className="field">
          <label>{t('employer.jobDescription')}</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="field">
          <label>{t('employer.requiredSkills')}</label>
          <TagInput value={form.requiredSkills} onChange={(v) => set('requiredSkills', v)} placeholder="Carpentry, Tiling..." />
        </div>
        <div className="row">
          <div className="field">
            <label>{t('employer.workType')}</label>
            <select value={form.workType} onChange={(e) => set('workType', e.target.value)}>
              {['DAILY', 'WEEKLY', 'MONTHLY', 'PERMANENT'].map((w) => <option key={w} value={w}>{t(`workType.${w}`)}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t('employer.salary')}</label>
            <input type="number" required min="0" value={form.salary} onChange={(e) => set('salary', +e.target.value)} />
          </div>
          <div className="field">
            <label>{t('worker.salaryUnit')}</label>
            <select value={form.salaryUnit} onChange={(e) => set('salaryUnit', e.target.value)}>
              {['PER_DAY', 'PER_WEEK', 'PER_MONTH'].map((u) => <option key={u} value={u}>{t(`salaryUnit.${u}`)}</option>)}
            </select>
          </div>
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
            <label>{t('employer.workersNeeded')}</label>
            <input type="number" min="1" value={form.workersNeeded} onChange={(e) => set('workersNeeded', +e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>{t('worker.location')}</label>
          <MapPicker lat={form.latitude} lng={form.longitude}
            onChange={(lat, lng) => { set('latitude', lat); set('longitude', lng) }} />
        </div>
        <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={form.urgent} onChange={(e) => set('urgent', e.target.checked)} />
          <label style={{ marginBottom: 0 }}>{t('employer.urgent')}</label>
        </div>
        <button className="btn btn-primary">{t('employer.post')}</button>
      </form>
    </div>
  )
}
