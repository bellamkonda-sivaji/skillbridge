import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { errMsg } from '../../api'
import { Badge, ScoreRing, EmptyState, Spinner } from '../../components/ui'
import InterviewModal from '../../components/InterviewModal'

export default function ApplicantsTab() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [interviewFor, setInterviewFor] = useState(null)

  const load = () => {
    api.get('/employer/applications').then((res) => setApps(res.data)).catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const update = async (id, status) => {
    try {
      await api.patch(`/employer/applications/${id}`, { status })
      load()
    } catch (e) { alert(errMsg(e)) }
  }

  const message = (a) => {
    navigate('/chat', { state: { workerId: a.workerId, jobId: a.jobId } })
  }

  if (loading) return <Spinner />
  if (!apps.length) return <EmptyState emoji="📥" text={t('employer.applicants')} />

  const statusMap = { PENDING: 'amber', ACCEPTED: 'green', REJECTED: 'red', WITHDRAWN: 'gray' }

  return (
    <div>
      {apps.map((a) => (
        <div className="card" key={a.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h3>{a.workerName}</h3>
              <p className="muted">for {a.jobTitle} · {new Date(a.appliedAt).toLocaleDateString()}</p>
              {a.coverMessage && <p style={{ marginTop: 8 }}>"{a.coverMessage}"</p>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {a.matchScore != null && <ScoreRing score={a.matchScore} size={44} />}
              <Badge type={statusMap[a.status]}>{t(`appStatus.${a.status}`)}</Badge>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {a.status === 'PENDING' && (
              <>
                <button className="btn btn-accent btn-sm" onClick={() => update(a.id, 'ACCEPTED')}>{t('employer.accept')}</button>
                <button className="btn btn-danger btn-sm" onClick={() => update(a.id, 'REJECTED')}>{t('employer.reject')}</button>
              </>
            )}
            <button className="btn btn-outline btn-sm" onClick={() => message(a)}>💬 {t('employer.contact')}</button>
            {a.status !== 'REJECTED' && a.status !== 'WITHDRAWN' && (
              <button className="btn btn-outline btn-sm" onClick={() => setInterviewFor({ workerId: a.workerId, jobId: a.jobId })}>
                🗓️ {t('employer.interview')}
              </button>
            )}
          </div>
        </div>
      ))}

      <InterviewModal
        open={!!interviewFor}
        onClose={() => setInterviewFor(null)}
        workerId={interviewFor?.workerId}
        jobId={interviewFor?.jobId}
        onDone={load}
      />
    </div>
  )
}
