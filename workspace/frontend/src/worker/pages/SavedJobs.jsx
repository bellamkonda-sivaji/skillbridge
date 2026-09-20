import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../../marketing/components'
import { getSavedJobs, unsaveJob, applyToJob } from '../api'
import { JobCard, Loading, Empty, ErrorNote, PageHead } from '../components'

export default function SavedJobs() {
  useDocumentTitle('Saved Jobs')
  const [jobs, setJobs] = useState(null)
  const [error, setError] = useState('')
  const [applying, setApplying] = useState(null)

  const load = () => {
    setJobs(null); setError('')
    getSavedJobs()
      .then((d) => setJobs((Array.isArray(d) ? d : []).map((j) => ({ ...j, saved: true }))))
      .catch(() => setError('We could not load your saved jobs.'))
  }
  useEffect(load, [])

  const remove = async (job) => {
    const before = jobs
    setJobs((l) => l.filter((j) => j.id !== job.id))
    try { await unsaveJob(job.id) } catch { setJobs(before) }
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

  return (
    <>
      <PageHead
        title="Saved Jobs"
        sub="Jobs you've bookmarked"
      >
        {jobs?.length > 0 && (
          <span className="wk-sub" style={{ marginTop: 0 }}>
            {jobs.length} saved {jobs.length === 1 ? 'job' : 'jobs'}
          </span>
        )}
      </PageHead>

      <ErrorNote onRetry={load}>{error}</ErrorNote>

      {!jobs && !error ? (
        <Loading rows={3} />
      ) : jobs?.length ? (
        <div className="wk-list">
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} onToggleSave={remove} onApply={apply} applying={applying} />
          ))}
        </div>
      ) : (
        !error && (
          <div className="wk-card">
            <Empty
              icon="heart"
              title="Nothing saved yet"
              text="Tap the bookmark on any job to keep it here for later."
            >
              <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/worker/jobs">Browse jobs</Link>
            </Empty>
          </div>
        )
      )}
    </>
  )
}
