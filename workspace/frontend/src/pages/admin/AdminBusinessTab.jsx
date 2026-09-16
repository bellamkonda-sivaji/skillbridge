import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import { Stars, EmptyState, Spinner } from '../../components/ui'

export default function AdminBusinessTab() {
  const { t } = useTranslation()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/employers').then((res) => setList(res.data)).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (!list.length) return <EmptyState emoji="🏢" text={t('admin.businessProfiles')} />

  return (
    <div className="grid">
      {list.map((e) => (
        <div className="card job-card" key={e.id}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="avatar">{e.businessName.charAt(0)}</div>
            <div>
              <h3 style={{ margin: 0 }}>{e.businessName}</h3>
              <p className="muted" style={{ margin: 0 }}>{e.businessType}</p>
            </div>
          </div>
          <div className="meta" style={{ margin: '10px 0' }}>
            <span>📍 {e.city} · {e.area}</span>
            {e.website && <span>🌐 {e.website}</span>}
          </div>
          <Stars rating={e.avgRating} count={e.ratingCount} />
          <p className="muted" style={{ marginTop: 8 }}>{e.description || '—'}</p>
          <p className="muted">Contact: {e.name} · {e.email}{e.phone ? ` · ${e.phone}` : ''}</p>
        </div>
      ))}
    </div>
  )
}
