import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import { Badge, EmptyState, Spinner } from '../../components/ui'

export default function AdminInterviewsTab() {
  const { t } = useTranslation()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/interviews').then((res) => setList(res.data)).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (!list.length) return <EmptyState emoji="🗓️" text={t('admin.interviewsScheduled')} />

  const statusMap = { PENDING: 'amber', CONFIRMED: 'green', COMPLETED: 'blue', CANCELLED: 'red' }
  const modeMap = { IN_PERSON: t('interview.modeInPerson'), VIDEO: t('interview.modeVideo'), PHONE: t('interview.modePhone') }

  return (
    <div>
      {list.map((iv) => (
        <div className="card" key={iv.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h3>{iv.jobTitle || t('interview.mode')}</h3>
              <p className="muted">👷 {iv.workerName} · 🏢 {iv.employerName}</p>
            </div>
            <Badge type={statusMap[iv.status]}>{iv.status}</Badge>
          </div>
          <div className="meta" style={{ marginTop: 8 }}>
            <div>📅 {new Date(iv.scheduledAt).toLocaleString()}</div>
            <div>🎥 {modeMap[iv.mode]}</div>
            {iv.location && <div>📍 {iv.location}</div>}
            {iv.notes && <div>📝 {iv.notes}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
