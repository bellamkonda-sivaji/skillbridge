import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { errMsg } from '../../api'
import { Stars, Badge, SkillChips, EmptyState, Spinner } from '../../components/ui'
import { Modal } from '../../components/controls'
import { ReviewsTab } from '../../components/ReviewsTab'
import { StaticMap } from '../../components/MapPicker'

const AVAILS = ['IMMEDIATE', 'PART_TIME', 'FULL_TIME', 'WEEKENDS_ONLY', 'EVENINGS']

export default function FindWorkersTab() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [myLoc, setMyLoc] = useState({ lat: 0, lng: 0 })
  const [filters, setFilters] = useState({
    q: '', skills: '', city: '', maxDistanceKm: 20, lat: null, lng: null,
    minRating: null, availability: '', verifiedOnly: false, minExperience: null
  })

  useEffect(() => {
    api.get('/employer/profile').then((res) => {
      if (res.data.latitude) setMyLoc({ lat: res.data.latitude, lng: res.data.longitude })
    }).catch(() => {})
  }, [])

  const load = () => {
    setLoading(true)
    const skills = filters.skills.split(',').map((s) => s.trim()).filter(Boolean)
    api.get('/workers', {
      params: {
        q: filters.q || null,
        skills: skills.length ? skills : null,
        city: filters.city || null,
        maxDistanceKm: filters.maxDistanceKm || null,
        lat: filters.lat || myLoc.lat || null,
        lng: filters.lng || myLoc.lng || null,
        minRating: filters.minRating || null,
        availability: filters.availability || null,
        verifiedOnly: filters.verifiedOnly || null,
        minExperience: filters.minExperience || null
      }
    }).then((res) => setWorkers(res.data)).catch(() => {})
      .finally(() => setLoading(false))
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [])

  const message = (w) => navigate('/chat', { state: { workerId: w.userId, jobId: null } })

  const vMap = { VERIFIED: 'green', PENDING: 'amber', UNVERIFIED: 'gray', REJECTED: 'red' }

  return (
    <div>
      <div className="card">
        <div className="row" style={{ alignItems: 'end' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('common.search')}</label>
            <input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="Carpenter, electrician..." />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Skills</label>
            <input value={filters.skills} onChange={(e) => setFilters({ ...filters, skills: e.target.value })} placeholder="Welding, Driving (comma)" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('common.distance')}</label>
            <input type="number" value={filters.maxDistanceKm} onChange={(e) => setFilters({ ...filters, maxDistanceKm: +e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('common.rating')}</label>
            <input type="number" min="0" max="5" value={filters.minRating || ''} onChange={(e) => setFilters({ ...filters, minRating: +e.target.value || null })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('common.minExperience')}</label>
            <input type="number" value={filters.minExperience || ''} onChange={(e) => setFilters({ ...filters, minExperience: +e.target.value || null })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('worker.availability')}</label>
            <select value={filters.availability} onChange={(e) => setFilters({ ...filters, availability: e.target.value })}>
              <option value="">{t('common.all')}</option>
              {AVAILS.map((a) => <option key={a} value={a}>{t(`availability.${a}`)}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 18, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input type="checkbox" checked={filters.verifiedOnly} onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })} />
            {t('common.verifiedOnly')}
          </label>
          <button className="btn btn-primary btn-sm" onClick={load}>{t('common.apply')}</button>
        </div>
      </div>

      {loading ? <Spinner /> : !workers.length
        ? <EmptyState emoji="🔍" text={t('employer.findWorkers')} />
        : (
          <div className="grid">
            {workers.map((w) => (
              <div className="card job-card" key={w.id} onClick={() => setDetail(w)}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="avatar">{w.name.charAt(0)}</div>
                  <div>
                    <h3 style={{ margin: 0 }}>{w.name}</h3>
                    <p className="muted" style={{ margin: 0 }}>{w.jobTitle}</p>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <Badge type={vMap[w.verificationStatus]}>{t(`verification.${w.verificationStatus}`)}</Badge>
                  </div>
                </div>
                <div className="meta" style={{ margin: '10px 0' }}>
                  <span>📍 {w.city} · {w.area}</span>
                  <span>💼 {w.experienceYears}y</span>
                  <span>💰 {w.expectedSalary} {t(`salaryUnit.${w.salaryUnit}`)}</span>
                </div>
                <Stars rating={w.avgRating} count={w.ratingCount} />
                <SkillChips skills={w.skills} />
              </div>
            ))}
          </div>
        )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name}>
        {detail && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div className="avatar" style={{ width: 48, height: 48, fontSize: 20 }}>{detail.name.charAt(0)}</div>
              <div>
                <Badge type={vMap[detail.verificationStatus]}>{t(`verification.${detail.verificationStatus}`)}</Badge>
                <Stars rating={detail.avgRating} count={detail.ratingCount} />
              </div>
            </div>
            <p><b>{t('worker.jobTitle')}:</b> {detail.jobTitle}</p>
            <p><b>{t('worker.experience')}:</b> {detail.experienceYears}</p>
            <p><b>{t('worker.bio')}:</b> {detail.bio || '—'}</p>
            <p><b>{t('worker.location')}:</b> {detail.city} · {detail.area}</p>
            <p><b>{t('worker.availability')}:</b> {t(`availability.${detail.availability}`)}</p>
            <p><b>{t('worker.expectedSalary')}:</b> {detail.expectedSalary} {t(`salaryUnit.${detail.salaryUnit}`)}</p>
            {detail.locationEnabled && detail.latitude ? (
              <div style={{ margin: '10px 0' }}>
                <StaticMap lat={detail.latitude} lng={detail.longitude} />
              </div>
            ) : null}
            <SkillChips skills={detail.skills} />
            <div style={{ display: 'flex', gap: 10, margin: '16px 0' }}>
              <button className="btn btn-primary" onClick={() => message(detail)}>💬 {t('employer.contact')}</button>
              <button className="btn btn-outline" onClick={() => setDetail(null)}>{t('common.close')}</button>
            </div>
            <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 14 }}>
              <ReviewsTab userId={detail.userId} canWrite={false} />
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
