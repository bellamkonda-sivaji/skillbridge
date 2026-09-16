import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api, { errMsg } from '../../api'
import { ScoreRing, Badge, SkillChips, EmptyState, Spinner } from '../../components/ui'
import { Modal } from '../../components/controls'

export default function JobBrowse() {
  const { t } = useTranslation()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [filters, setFilters] = useState({ q: '', workType: '', city: '', urgent: false })
  const [message, setMessage] = useState('')

  const load = () => {
    setLoading(true)
    api.post('/jobs/search', {
      q: filters.q || null,
      workType: filters.workType || null,
      city: filters.city || null,
      urgent: filters.urgent || null
    }).then((res) => setJobs(res.data)).catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [filters.q, filters.workType, filters.city, filters.urgent])

  const apply = async (job) => {
    try {
      await api.post(`/jobs/${job.id}/apply`, { message })
      setDetail(null)
      load()
    } catch (e) { alert(errMsg(e)) }
  }

  return (
    <div>
      <div className="card">
        <div className="row" style={{ alignItems: 'end' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('common.search')}</label>
            <input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="Carpenter, plumber, driver..." />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('employer.workType')}</label>
            <select value={filters.workType} onChange={(e) => setFilters({ ...filters, workType: e.target.value })}>
              <option value="">{t('common.all')}</option>
              {['DAILY', 'WEEKLY', 'MONTHLY', 'PERMANENT'].map((w) => (
                <option key={w} value={w}>{t(`workType.${w}`)}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('worker.city')}</label>
            <input value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
            <input type="checkbox" checked={filters.urgent} onChange={(e) => setFilters({ ...filters, urgent: e.target.checked })} />
            <label style={{ marginBottom: 0 }}>URGENT</label>
          </div>
        </div>
      </div>

      {loading ? <Spinner /> : !jobs.length
        ? <EmptyState emoji="🔍" text={t('worker.jobs')} />
        : (
          <div className="grid">
            {jobs.map((j) => (
              <div className="card job-card" key={j.id} onClick={() => setDetail(j)}>
                <div className="top">
                  <div>
                    <h3>{j.title}</h3>
                    <p className="muted">{j.businessName || j.employerName}</p>
                  </div>
                  {j.matchScore != null && <ScoreRing score={j.matchScore} />}
                </div>
                <div className="meta">
                  <span>📍 {j.city} · {j.area || ''}</span>
                  <span>💰 {j.salary} {t(`salaryUnit.${j.salaryUnit}`)}</span>
                  <span>⏱ {t(`workType.${j.workType}`)}</span>
                  <span>👥 {j.workersNeeded}</span>
                </div>
                <SkillChips skills={j.requiredSkills} />
              </div>
            ))}
          </div>
        )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title}>
        {detail && (
          <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              {detail.matchScore != null && <ScoreRing score={detail.matchScore} />}
              <div>
                <p className="muted">{detail.businessName}</p>
                <p>{detail.city} · {detail.area}</p>
              </div>
            </div>
            <p>{detail.description}</p>
            <div className="meta" style={{ margin: '10px 0' }}>
              <span>💰 {detail.salary} {t(`salaryUnit.${detail.salaryUnit}`)}</span>
              <span>⏱ {t(`workType.${detail.workType}`)}</span>
              <span>👥 {detail.workersNeeded}</span>
              {detail.urgent && <Badge type="red">URGENT</Badge>}
            </div>
            <SkillChips skills={detail.requiredSkills} />
            <div className="field" style={{ marginTop: 14 }}>
              <label>Cover message</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={() => apply(detail)}>{t('worker.apply')}</button>
              <button className="btn btn-outline" onClick={() => setDetail(null)}>{t('common.close')}</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
