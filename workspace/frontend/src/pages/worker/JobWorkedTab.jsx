import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import { Badge, EmptyState, Spinner } from '../../components/ui'

export default function JobWorkedTab() {
  const { t } = useTranslation()
  const [apps, setApps] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/worker/applications'), api.get('/wallet')])
      .then(([a, w]) => {
        setApps(a.data)
        setPayments((w.data.transactions || []).filter((tx) => tx.reference === 'JOB_PAYMENT' && tx.type === 'CREDIT'))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const worked = apps.filter((a) => a.status === 'ACCEPTED')
  if (!worked.length) return <EmptyState emoji="🧰" text={t('worker.jobWorkedEmpty')} />

  const payFor = (jobId) => payments.filter((p) => p.jobId === jobId)

  return (
    <div>
      {worked.map((a) => {
        const paid = payFor(a.jobId)
        return (
          <div className="card" key={a.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h3>{a.jobTitle}</h3>
                <p className="muted">{a.businessName || a.employerName} · {new Date(a.appliedAt).toLocaleDateString()}</p>
              </div>
              <Badge type="green">{t('appStatus.ACCEPTED')}</Badge>
            </div>
            {paid.length ? (
              <div className="meta" style={{ marginTop: 10 }}>
                {paid.map((p) => (
                  <span key={p.id} style={{ color: 'var(--green-600)', fontWeight: 600 }}>
                    💰 {t('wallet.paid')} {p.amount.toLocaleString()} · {new Date(p.createdAt).toLocaleString()}
                  </span>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ marginTop: 10 }}>{t('wallet.paymentPending')}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
