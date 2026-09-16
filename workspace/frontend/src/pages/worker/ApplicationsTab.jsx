import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import { Badge, ScoreRing, EmptyState, Spinner } from '../../components/ui'

export default function ApplicationsTab() {
  const { t } = useTranslation()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/worker/applications').then((res) => setApps(res.data)).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (!apps.length) return <EmptyState emoji="📝" text={t('worker.applications')} />

  const statusMap = { PENDING: 'amber', ACCEPTED: 'green', REJECTED: 'red', WITHDRAWN: 'gray' }

  return (
    <div>
      {apps.map((a) => (
        <div className="card" key={a.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h3>{a.jobTitle}</h3>
              <p className="muted">{a.businessName || a.employerName} · {new Date(a.appliedAt).toLocaleDateString()}</p>
              {a.coverMessage && <p style={{ marginTop: 8 }}>"{a.coverMessage}"</p>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {a.matchScore != null && <ScoreRing score={a.matchScore} size={44} />}
              <Badge type={statusMap[a.status]}>{t(`appStatus.${a.status}`)}</Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
