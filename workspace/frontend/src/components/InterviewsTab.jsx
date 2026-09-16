import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api, { errMsg } from '../api'
import { Badge, EmptyState, Spinner } from '../components/ui'

export function InterviewsTab({ role }) {
  const { t } = useTranslation()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    api.get(`/${role}/interviews`).then((res) => setList(res.data)).catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [role])

  const respond = async (id, status) => {
    try {
      await api.patch(`/interviews/${id}/respond`, { status })
      load()
    } catch (e) { alert(errMsg(e)) }
  }

  const complete = async (id) => {
    try {
      await api.patch(`/interviews/${id}/complete`)
      load()
    } catch (e) { alert(errMsg(e)) }
  }

  if (loading) return <Spinner />
  if (!list.length) return <EmptyState emoji="🗓️" text={t('common.loading') + '…'} />

  const statusMap = { PENDING: 'amber', CONFIRMED: 'green', COMPLETED: 'blue', CANCELLED: 'red' }
  const modeMap = { IN_PERSON: t('interview.modeInPerson'), VIDEO: t('interview.modeVideo'), PHONE: t('interview.modePhone') }

  return (
    <div>
      {list.map((iv) => (
        <div className="card" key={iv.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h3>{iv.jobTitle || t('interview.mode')}</h3>
              <p className="card-sub">
                {role === 'worker' ? `${t('employer.businessName')}: ${iv.employerName}` : `Worker: ${iv.workerName}`}
              </p>
            </div>
            <Badge type={statusMap[iv.status]}>{iv.status}</Badge>
          </div>
          <div className="meta" style={{ color: 'var(--gray-600)', marginTop: 8 }}>
            <div>📅 {new Date(iv.scheduledAt).toLocaleString()}</div>
            <div>🎥 {modeMap[iv.mode]}</div>
            {iv.location && <div>📍 {iv.location}</div>}
            {iv.notes && <div>📝 {iv.notes}</div>}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            {role === 'worker' && iv.status === 'PENDING' && (
              <>
                <button className="btn btn-accent btn-sm" onClick={() => respond(iv.id, 'CONFIRMED')}>{t('common.confirm')}</button>
                <button className="btn btn-danger btn-sm" onClick={() => respond(iv.id, 'CANCELLED')}>{t('common.cancel')}</button>
              </>
            )}
            {role === 'employer' && iv.status === 'PENDING' && (
              <button className="btn btn-outline btn-sm" onClick={() => respond(iv.id, 'CANCELLED')}>{t('common.cancel')}</button>
            )}
            {role === 'employer' && (iv.status === 'CONFIRMED' || iv.status === 'PENDING') && (
              <button className="btn btn-accent btn-sm" onClick={() => complete(iv.id)}>{t('common.complete')}</button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
