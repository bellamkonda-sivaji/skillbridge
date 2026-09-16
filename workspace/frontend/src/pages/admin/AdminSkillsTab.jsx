import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api, { errMsg } from '../../api'
import { EmptyState, Spinner } from '../../components/ui'

export default function AdminSkillsTab() {
  const { t } = useTranslation()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [msg, setMsg] = useState('')

  const load = () => {
    api.get('/skills').then((res) => setSkills(res.data)).catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const create = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/skills', { name, category })
      setName('')
      setCategory('')
      setMsg(t('admin.skillCreated') + ' ✓')
      setTimeout(() => setMsg(''), 2500)
      load()
    } catch (err) { alert(errMsg(err)) }
  }

  if (loading) return <Spinner />

  const groups = {}
  skills.forEach((s) => { (groups[s.category || t('common.all')] = groups[s.category || t('common.all')] || []).push(s.name) })

  return (
    <div>
      {msg && <div className="alert alert-success">{msg}</div>}
      <div className="card">
        <h3>{t('admin.postSkill')}</h3>
        <form onSubmit={create} className="row" style={{ alignItems: 'end' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('admin.skillName')}</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Masonry" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('admin.skillCategory')}</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Construction" />
          </div>
          <button className="btn btn-primary">{t('admin.addSkill')}</button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>{t('worker.skillCatalog')} ({skills.length})</h3>
        {Object.entries(groups).map(([cat, names]) => (
          <div key={cat} style={{ marginBottom: 12 }}>
            <b className="muted">{cat}</b>
            <div className="skill-chips" style={{ marginTop: 6 }}>
              {names.map((n) => <span key={n} className="tag">{n}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
