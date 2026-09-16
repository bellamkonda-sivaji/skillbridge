import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api, { errMsg } from '../../api'
import { ScoreRing, Badge, SkillChips, EmptyState, Spinner } from '../../components/ui'
import { Modal } from '../../components/controls'

function Breakdown({ match }) {
  const bars = [
    { l: 'skills', v: match.skillScore },
    { l: 'distance', v: Math.max(0, 100 - match.distanceKm * 2), raw: `${match.distanceKm} km` },
    { l: 'experience', v: match.experienceScore },
    { l: 'availability', v: match.availabilityScore },
    { l: 'salary', v: match.salaryScore },
    { l: 'rating', v: match.ratingScore }
  ]
  return (
    <div>
      {bars.map((b, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <b>{b.l}</b><span>{b.raw || `${Math.round(b.v)}`}</span>
          </div>
          <div className="progress"><div style={{ width: `${Math.round(b.v)}%` }} /></div>
        </div>
      ))}
    </div>
  )
}

export default function MatchesTab() {
  const { t } = useTranslation()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)

  const load = () => {
    api.get('/worker/matches').then((res) => setMatches(res.data)).catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const apply = async (match) => {
    try {
      await api.post(`/jobs/${match.job.id}/apply`, { message: '' })
      load()
      setDetail(null)
    } catch (e) { alert(errMsg(e)) }
  }

  const view = (m) => {
    setDetail(m)
    api.patch(`/worker/matches/${m.id}/view`).catch(() => {})
  }

  if (loading) return <Spinner />
  if (!matches.length) return <EmptyState emoji="🤝" text={t('worker.matches')} />

  return (
    <div className="grid">
      {matches.map((m) => (
        <div className="card job-card" key={m.id} onClick={() => view(m)}>
          <div className="top">
            <div>
              <h3>{m.job.title}</h3>
              <p className="muted">{m.job.businessName || m.job.employerName}</p>
            </div>
            <ScoreRing score={m.score} />
          </div>
          <div className="meta">
            <span>📍 {m.job.city} · {Math.round(m.distanceKm)} {t('common.kmAway')}</span>
            <span>💰 {m.job.salary} {t(`salaryUnit.${m.job.salaryUnit}`)}</span>
            <span>⏱ {t(`workType.${m.job.workType}`)}</span>
            {m.job.urgent && <Badge type="red">URGENT</Badge>}
          </div>
          <SkillChips skills={m.job.requiredSkills} />
        </div>
      ))}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.job?.title}>
        {detail && (
          <>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14 }}>
              <ScoreRing score={detail.score} size={72} />
              <div>
                <p className="muted">Distance {Math.round(detail.distanceKm)} km</p>
                <p>{detail.job.businessName}</p>
              </div>
            </div>
            <Breakdown match={detail} />
            <p style={{ margin: '14px 0' }}>{detail.job.description}</p>
            <SkillChips skills={detail.job.requiredSkills} />
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button className="btn btn-primary" onClick={() => apply(detail)}>{t('worker.apply')}</button>
              <button className="btn btn-outline" onClick={() => setDetail(null)}>{t('common.close')}</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
