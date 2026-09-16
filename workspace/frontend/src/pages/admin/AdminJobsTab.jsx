import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import { Badge, SkillChips, EmptyState, Spinner } from '../../components/ui'

export default function AdminJobsTab() {
  const { t } = useTranslation()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/jobs').then((res) => setJobs(res.data)).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (!jobs.length) return <EmptyState emoji="📋" text={t('admin.postedJobs')} />

  const grouped = {}
  jobs.forEach((j) => {
    const key = j.businessName || j.employerName || '—'
    ;(grouped[key] = grouped[key] || []).push(j)
  })

  const statusMap = { OPEN: 'green', CLOSED: 'gray', FILLED: 'blue', CANCELLED: 'red' }

  return (
    <div>
      {Object.entries(grouped).map(([employer, list]) => (
        <div className="card" key={employer} style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 4 }}>🏢 {employer}</h3>
          <p className="muted" style={{ marginTop: 0 }}>{list.length} {list.length === 1 ? 'job' : 'jobs'}</p>
          {list.map((j) => (
            <div key={j.id} style={{ borderTop: '1px solid var(--gray-100)', padding: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <b>{j.title}</b>
                  <p className="muted" style={{ margin: 0 }}>{j.city} · {j.area} · {t(`workType.${j.workType}`)}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>💰 {j.salary} {t(`salaryUnit.${j.salaryUnit}`)}</span>
                  <span>📥 {j.applicantsCount}</span>
                  <Badge type={statusMap[j.status]}>{t(`jobStatus.${j.status}`)}</Badge>
                </div>
              </div>
              <SkillChips skills={j.requiredSkills} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
