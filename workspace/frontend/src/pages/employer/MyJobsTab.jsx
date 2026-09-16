import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { errMsg } from '../../api'
import { Badge, ScoreRing, SkillChips, EmptyState, Spinner } from '../../components/ui'
import InterviewModal from '../../components/InterviewModal'

export default function MyJobsTab() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [appsByJob, setAppsByJob] = useState({})
  const [interviewFor, setInterviewFor] = useState(null)

  const load = () => {
    api.get('/employer/jobs').then((res) => setJobs(res.data)).catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const setStatus = async (id, status) => {
    await api.patch(`/employer/jobs/${id}/status`, { status })
    load()
  }

  const toggleExpand = async (job) => {
    const next = expanded === job.id ? null : job.id
    setExpanded(next)
    if (next) {
      try {
        const res = await api.get(`/employer/jobs/${job.id}/applications`)
        setAppsByJob((m) => ({ ...m, [job.id]: res.data }))
      } catch (e) { alert(errMsg(e)) }
    }
  }

  const updateApp = async (id, status) => {
    try {
      await api.patch(`/employer/applications/${id}`, { status })
      const res = await api.get(`/employer/jobs/${expanded}/applications`)
      setAppsByJob((m) => ({ ...m, [expanded]: res.data }))
    } catch (e) { alert(errMsg(e)) }
  }

  const refreshApps = async () => {
    if (!expanded) return
    try {
      const res = await api.get(`/employer/jobs/${expanded}/applications`)
      setAppsByJob((m) => ({ ...m, [expanded]: res.data }))
    } catch (e) { alert(errMsg(e)) }
  }

  const message = (a) => navigate('/chat', { state: { workerId: a.workerId, jobId: a.jobId } })

  if (loading) return <Spinner />
  if (!jobs.length) return <EmptyState emoji="📋" text={t('employer.myJobs')} />

  const statusMap = { OPEN: 'green', CLOSED: 'gray', FILLED: 'blue', CANCELLED: 'red' }
  const appStatusMap = { PENDING: 'amber', ACCEPTED: 'green', REJECTED: 'red', WITHDRAWN: 'gray' }

  return (
    <div>
      {jobs.map((j) => {
        const isOpen = expanded === j.id
        const apps = appsByJob[j.id] || []
        return (
          <div className="card" key={j.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }} onClick={() => toggleExpand(j)}>
              <div>
                <h3>{j.title}</h3>
                <p className="muted">{j.city} · {j.area}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Badge type={statusMap[j.status]}>{t(`jobStatus.${j.status}`)}</Badge>
                <span className="muted">{isOpen ? '▾' : '▸'}</span>
              </div>
            </div>
            <div className="meta">
              <span>💰 {j.salary} {t(`salaryUnit.${j.salaryUnit}`)}</span>
              <span>⏱ {t(`workType.${j.workType}`)}</span>
              <span>👥 {j.workersNeeded}</span>
              <span>📥 {j.applicantsCount} {t('employer.applicantsCount')}</span>
            </div>
            <SkillChips skills={j.requiredSkills} />
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              {j.status === 'OPEN' && (
                <button className="btn btn-outline btn-sm" onClick={() => setStatus(j.id, 'CLOSED')}>{t('employer.close')}</button>
              )}
              {j.status === 'CLOSED' && (
                <button className="btn btn-accent btn-sm" onClick={() => setStatus(j.id, 'OPEN')}>Reopen</button>
              )}
            </div>

            {isOpen && (
              <div style={{ borderTop: '1px solid var(--gray-200)', marginTop: 14, paddingTop: 10 }}>
                <h4 style={{ marginBottom: 8 }}>{t('employer.applicants')}</h4>
                {!apps.length ? <EmptyState emoji="📥" text={t('employer.noApplicants')} /> : apps.map((a) => (
                  <div key={a.id} style={{ borderBottom: '1px solid var(--gray-100)', padding: '10px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <b>{a.workerName}</b>
                        <p className="muted" style={{ margin: 0 }}>{new Date(a.appliedAt).toLocaleDateString()}</p>
                        {a.coverMessage && <p style={{ marginTop: 6, marginBottom: 0 }}>"{a.coverMessage}"</p>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {a.matchScore != null && <ScoreRing score={a.matchScore} size={40} />}
                        <Badge type={appStatusMap[a.status]}>{t(`appStatus.${a.status}`)}</Badge>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {a.status === 'PENDING' && (
                        <>
                          <button className="btn btn-accent btn-sm" onClick={() => updateApp(a.id, 'ACCEPTED')}>{t('employer.accept')}</button>
                          <button className="btn btn-danger btn-sm" onClick={() => updateApp(a.id, 'REJECTED')}>{t('employer.reject')}</button>
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
              </div>
            )}
          </div>
        )
      })}

      <InterviewModal
        open={!!interviewFor}
        onClose={() => setInterviewFor(null)}
        workerId={interviewFor?.workerId}
        jobId={interviewFor?.jobId}
        onDone={refreshApps}
      />
    </div>
  )
}
