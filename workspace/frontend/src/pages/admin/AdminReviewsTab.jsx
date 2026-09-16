import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import { Stars, EmptyState, Spinner } from '../../components/ui'

export default function AdminReviewsTab({ targetRole }) {
  const { t } = useTranslation()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/admin/reviews/${targetRole}`).then((res) => setList(res.data)).catch(() => {})
      .finally(() => setLoading(false))
  }, [targetRole])

  if (loading) return <Spinner />
  if (!list.length) return <EmptyState emoji="⭐" text={t('admin.noReviews')} />

  return (
    <div>
      {list.map((r) => (
        <div className="card" key={r.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <b>{r.targetName}</b>
              <p className="muted" style={{ margin: 0 }}>by {r.authorName} ({r.authorRole})</p>
            </div>
            <Stars rating={r.rating} />
          </div>
          {r.jobTitle && <p className="muted">for {r.jobTitle}</p>}
          {r.comment && <p style={{ marginTop: 8 }}>{r.comment}</p>}
          <p className="muted" style={{ marginTop: 6 }}>{new Date(r.createdAt).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  )
}
