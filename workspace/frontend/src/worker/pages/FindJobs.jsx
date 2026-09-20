import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { searchJobs, saveJob, unsaveJob, applyToJob } from '../api'
import { JobCard, Loading, Empty, ErrorNote } from '../components'
import { QUICK, fromParams, toQuery, toSearchBody, countActive } from '../filters'

export default function FindJobs() {
  useDocumentTitle('Find Jobs')
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const filters = fromParams(params)

  const [jobs, setJobs] = useState(null)
  const [error, setError] = useState('')
  const [applying, setApplying] = useState(null)
  const [q, setQ] = useState(filters.q)

  const key = params.toString()

  const load = useCallback(() => {
    setJobs(null)
    setError('')
    searchJobs(toSearchBody(fromParams(new URLSearchParams(key))))
      .then((d) => setJobs(Array.isArray(d) ? d : []))
      .catch(() => setError('We could not load jobs just now.'))
  }, [key])

  useEffect(() => { load() }, [load])
  useEffect(() => { setQ(fromParams(params).q) }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch) => setParams(new URLSearchParams(toQuery({ ...filters, ...patch }).slice(1)))

  const submitSearch = (e) => {
    e.preventDefault()
    update({ q: q.trim() })
  }

  const toggleQuick = (value) => update({ quick: filters.quick === value ? '' : value })

  const toggleSave = async (job) => {
    const next = !job.saved
    setJobs((l) => l.map((j) => (j.id === job.id ? { ...j, saved: next } : j)))
    try {
      await (next ? saveJob(job.id) : unsaveJob(job.id))
    } catch {
      setJobs((l) => l.map((j) => (j.id === job.id ? { ...j, saved: !next } : j)))
    }
  }

  const apply = async (job) => {
    setApplying(job.id)
    try {
      await applyToJob(job.id)
      setJobs((l) => l.map((j) => (j.id === job.id ? { ...j, applied: true } : j)))
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not apply to that job.')
    } finally {
      setApplying(null)
    }
  }

  const active = countActive(filters)

  return (
    <>
      <div className="wk-row" style={{ marginBottom: 16 }}>
        <div className="grow">
          <h1 className="wk-h1">Find Jobs</h1>
          <p className="wk-sub">Discover opportunities near you</p>
        </div>
        <Link className="mk-btn mk-btn-outline mk-btn-sm" to="/worker/saved">
          <Icon name="heart" size={15} /> Saved
        </Link>
        <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/worker/jobs/map${toQuery(filters)}`}>
          <Icon name="pin" size={15} /> Map
        </Link>
      </div>

      <form onSubmit={submitSearch}>
        <div className="wk-bar">
          <Icon name="search" size={17} style={{ color: '#64748b', flexShrink: 0 }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for jobs, skills or company..."
            aria-label="Search jobs"
          />
          {q && (
            <button type="button" className="act" onClick={() => { setQ(''); update({ q: '' }) }}>
              Clear
            </button>
          )}
        </div>
      </form>

      <div className="wk-row" style={{ marginTop: 12, alignItems: 'flex-start' }}>
        <div className="wk-tabs grow">
          {QUICK.map((f) => (
            <button
              key={f.value}
              className="wk-tab"
              aria-selected={filters.quick === f.value}
              onClick={() => toggleQuick(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Link
          className="mk-btn mk-btn-outline mk-btn-sm"
          to={`/worker/jobs/filters${toQuery(filters)}`}
          style={{ flexShrink: 0 }}
        >
          <Icon name="grid" size={15} /> Filters{active ? ` (${active})` : ''}
        </Link>
      </div>

      {active > 0 && (
        <button
          className="wk-link"
          style={{ background: 0, border: 0, padding: 0, marginTop: 12, cursor: 'pointer', font: 'inherit' }}
          onClick={() => navigate('/worker/jobs')}
        >
          Clear all filters
        </button>
      )}

      <div style={{ marginTop: 16 }}>
        <ErrorNote onRetry={load}>{error}</ErrorNote>

        {!jobs && !error ? (
          <Loading rows={3} />
        ) : jobs?.length ? (
          <>
            <p className="wk-sub" style={{ marginBottom: 12 }}>
              {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} found
            </p>
            <div className="wk-list">
              {jobs.map((j) => (
                <JobCard key={j.id} job={j} onToggleSave={toggleSave} onApply={apply} applying={applying} />
              ))}
            </div>
          </>
        ) : (
          !error && (
            <div className="wk-card">
              <Empty
                icon="search"
                title="No jobs match these filters"
                text="Try widening the distance, or clearing a filter or two."
              >
                <button className="mk-btn mk-btn-primary mk-btn-sm" onClick={() => navigate('/worker/jobs')}>
                  Clear filters
                </button>
              </Empty>
            </div>
          )
        )}
      </div>
    </>
  )
}
