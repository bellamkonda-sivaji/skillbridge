import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'
import { Stars, EmptyState, Spinner } from './ui'

export function ReviewsTab({ userId, canWrite, targetRole , targetType = 'WORKER' }) {
  const { t } = useTranslation()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ rating: 5, comment: '' })

  const load = () => {
    api.get(`/reviews/target/${targetType}/${userId}`).then((res) => setReviews(res.data)).catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [userId])

  const submit = async () => {
    try {
      await api.post('/reviews', { targetType, targetId: userId, rating: form.rating, comment: form.comment })
      setForm({ rating: 5, comment: '' })
      load()
    } catch (e) { alert(e.response?.data?.message || 'Error') }
  }

  if (loading) return <Spinner />
  return (
    <div>
      {canWrite && (
        <div className="card">
          <h3>⭐ {t('common.reviews')}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            {[1, 2, 3, 4, 5].map((r) => (
              <button key={r} onClick={() => setForm({ ...form, rating: r })} style={{ background: 'none', border: 'none', fontSize: 26, opacity: r <= form.rating ? 1 : 0.3 }}>
                ★
              </button>
            ))}
          </div>
          <div className="field">
            <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder={t('worker.bio')} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={submit}>{t('common.save')}</button>
        </div>
      )}
      {!reviews.length && !canWrite ? <EmptyState emoji="⭐" text={t('common.reviews')} /> : null}
      {reviews.map((r) => (
        <div className="card" key={r.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <b>{r.authorName} <span className="muted">({r.authorRole})</span></b>
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
