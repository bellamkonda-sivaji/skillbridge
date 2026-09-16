import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import { ScoreRing, EmptyState, Spinner } from '../../components/ui'

export default function AdminMatchesTab() {
  const { t } = useTranslation()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/matches').then((res) => setMatches(res.data)).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (!matches.length) return <EmptyState emoji="🤝" text={t('admin.matchWorkers')} />

  const bars = [
    ['skillScore', t('worker.skillMatch'), (m) => m.skillScore],
    ['distanceKm', t('worker.distanceMatch'), (m) => Math.max(0, 100 - m.distanceKm * 2)],
    ['experienceScore', t('worker.experienceMatch'), (m) => m.experienceScore],
    ['availabilityScore', t('worker.availabilityMatch'), (m) => m.availabilityScore],
    ['salaryScore', t('worker.salaryMatch'), (m) => m.salaryScore],
    ['ratingScore', t('worker.ratingMatch'), (m) => m.ratingScore]
  ]

  return (
    <div>
      {matches.map((m) => (
        <div className="card" key={m.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h3>{m.workerName} <span className="muted">→</span> {m.job.title}</h3>
              <p className="muted">{m.job.businessName || m.job.employerName} · {m.job.city} · {m.job.salary} {t(`salaryUnit.${m.job.salaryUnit}`)}</p>
            </div>
            <ScoreRing score={m.score} />
          </div>
          <div style={{ marginTop: 10 }}>
            {bars.map(([k, lbl, fn]) => {
              const v = fn(m)
              return (
                <div key={k} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <b>{lbl}</b><span>{Math.round(v)}</span>
                  </div>
                  <div className="progress"><div style={{ width: `${Math.min(v, 100)}%` }} /></div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
