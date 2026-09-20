import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { PageHead } from '../components'
import {
  CATEGORIES, EMPLOYMENT, SALARY_STEPS, DISTANCE_STEPS, EXPERIENCE, LANGUAGES,
  EMPTY_FILTERS, fromParams, toQuery,
} from '../filters'

export default function SearchFilters() {
  useDocumentTitle('Search & Filters')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [f, setF] = useState(() => fromParams(params))

  const set = (patch) => setF((prev) => ({ ...prev, ...patch }))

  const toggleType = (value) =>
    set({ types: f.types.includes(value) ? f.types.filter((t) => t !== value) : [...f.types, value] })

  const distanceIndex = f.distance ? Math.max(0, DISTANCE_STEPS.indexOf(Number(f.distance))) : 2

  return (
    <div style={{ maxWidth: 640 }}>
      <PageHead
        title="Search & Filters"
        sub="Find your perfect job"
        back={{ to: `/worker/jobs${toQuery(f)}`, label: 'Back to jobs' }}
      />

      <div className="wk-card pad-lg">
        <div className="wk-filter-grid">
          <div className="wk-field">
            <label htmlFor="ff-q">Search</label>
            <div className="wk-bar" style={{ padding: '9px 12px' }}>
              <Icon name="search" size={16} style={{ color: '#64748b', flexShrink: 0 }} />
              <input
                id="ff-q"
                value={f.q}
                onChange={(e) => set({ q: e.target.value })}
                placeholder="Search..."
              />
            </div>
          </div>

          <div className="wk-field">
            <label htmlFor="ff-cat">Job Category</label>
            <select id="ff-cat" className="wk-select" value={f.category} onChange={(e) => set({ category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div className="wk-field">
            <label>Employment Type</label>
            <div className="wk-checks">
              {EMPLOYMENT.map((t) => (
                <label className="wk-checkrow" key={t.value}>
                  <input
                    type="checkbox"
                    checked={f.types.includes(t.value)}
                    onChange={() => toggleType(t.value)}
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          <div className="wk-field">
            <label>Salary Range</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <select
                className="wk-select"
                value={f.minSalary}
                onChange={(e) => set({ minSalary: e.target.value })}
                aria-label="Minimum salary"
              >
                {SALARY_STEPS.map((s) => (
                  <option key={s.value} value={s.value}>{s.value ? s.label : 'Min Salary'}</option>
                ))}
              </select>
              <select
                className="wk-select"
                value={f.maxSalary}
                onChange={(e) => set({ maxSalary: e.target.value })}
                aria-label="Maximum salary"
              >
                {SALARY_STEPS.map((s) => (
                  <option key={s.value} value={s.value}>{s.value ? s.label : 'Max Salary'}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="wk-field">
            <label htmlFor="ff-dist">Distance</label>
            <div className="wk-range">
              <input
                id="ff-dist"
                type="range"
                min={0}
                max={DISTANCE_STEPS.length - 1}
                step={1}
                value={distanceIndex}
                onChange={(e) => set({ distance: String(DISTANCE_STEPS[Number(e.target.value)]) })}
              />
              <div className="ticks">
                {DISTANCE_STEPS.map((d) => <span key={d}>{d} km</span>)}
              </div>
              <div className="wk-sub" style={{ marginTop: 0 }}>
                Showing jobs within <strong>{DISTANCE_STEPS[distanceIndex]} km</strong>
              </div>
            </div>
          </div>

          <div className="wk-field">
            <label htmlFor="ff-exp">Experience</label>
            <select id="ff-exp" className="wk-select" value={f.experience} onChange={(e) => set({ experience: e.target.value })}>
              {EXPERIENCE.map((x) => <option key={x.label} value={x.value}>{x.label}</option>)}
            </select>
          </div>

          <div className="wk-field">
            <label htmlFor="ff-lang">Language</label>
            <select id="ff-lang" className="wk-select" value={f.language} onChange={(e) => set({ language: e.target.value })}>
              {LANGUAGES.map((l) => <option key={l.label} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button
            className="mk-btn mk-btn-outline"
            style={{ flex: 1 }}
            onClick={() => setF({ ...EMPTY_FILTERS, q: f.q })}
          >
            Reset
          </button>
          <button
            className="mk-btn mk-btn-primary"
            style={{ flex: 2 }}
            onClick={() => navigate(`/worker/jobs${toQuery(f)}`)}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}
