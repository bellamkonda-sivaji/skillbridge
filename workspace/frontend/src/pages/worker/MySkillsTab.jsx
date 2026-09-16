import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api, { errMsg } from '../../api'
import { EmptyState, Spinner } from '../../components/ui'

export default function MySkillsTab() {
  const { t } = useTranslation()
  const [catalog, setCatalog] = useState([])
  const [selected, setSelected] = useState([])
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    Promise.all([api.get('/skills'), api.get('/worker/profile')])
      .then(([s, p]) => {
        setCatalog(s.data)
        setSelected(p.data.skills || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const toggle = (name) => {
    setSaved(false)
    setSelected((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]))
  }

  const save = async () => {
    try {
      const profile = await api.get('/worker/profile')
      await api.put('/worker/profile', { ...profile.data, skills: selected })
      setSaved(true)
      setMsg(t('worker.save') + ' ✓')
      setTimeout(() => setMsg(''), 2500)
    } catch (e) { alert(errMsg(e)) }
  }

  const groups = {}
  catalog.forEach((s) => { (groups[s.category || t('common.all')] = groups[s.category || t('common.all')] || []).push(s.name) })

  return (
    <div>
      {msg && <div className="alert alert-success">{msg}</div>}
      <div className="card">
        <h3>{t('worker.mySkills')}</h3>
        <p className="card-sub">{t('worker.skillsHint')}</p>
        {selected.length ? (
          <div className="skill-chips" style={{ marginBottom: 10 }}>
            {selected.map((s) => (
              <span key={s} className="tag" style={{ background: 'var(--primary)', color: '#fff' }}>
                {s} <span style={{ cursor: 'pointer', marginLeft: 6 }} onClick={() => toggle(s)}>✕</span>
              </span>
            ))}
          </div>
        ) : (
          <EmptyState emoji="🛠️" text={t('worker.noSkills')} />
        )}
        <button className="btn btn-primary btn-sm" onClick={save}>{t('common.save')}</button>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>{t('worker.skillCatalog')}</h3>
        {Object.entries(groups).map(([cat, names]) => (
          <div key={cat} style={{ marginBottom: 14 }}>
            <b className="muted">{cat}</b>
            <div className="skill-chips" style={{ marginTop: 6 }}>
              {names.map((n) => {
                const active = selected.includes(n)
                return (
                  <span
                    key={n}
                    className="tag"
                    onClick={() => toggle(n)}
                    style={{ cursor: 'pointer', ...(active ? { background: 'var(--primary)', color: '#fff' } : {}) }}
                  >
                    {active ? '✓ ' : '+ '}{n}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
