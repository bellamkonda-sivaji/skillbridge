import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { useDocumentTitle } from '../../../marketing/components'
import { Loading, Empty, ErrorNote, PageHead } from '../../../worker/components'
import { listInterviews, cancelInterview, formatDate } from '../api'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17]
const MODE_LABEL = { IN_PERSON: 'In-person', PHONE: 'Phone', VIDEO: 'Video' }
const VIEWS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

const pad = (n) => String(n).padStart(2, '0')
const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const fromIsoDay = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const hourLabel = (n) => `${n % 12 === 0 ? 12 : n % 12} ${n < 12 ? 'AM' : 'PM'}`

function rangeFor(view, anchor) {
  if (view === 'day') return [anchor, addDays(anchor, 1)]
  if (view === 'week') return [addDays(anchor, -anchor.getDay()), addDays(anchor, 7 - anchor.getDay())]
  return [
    new Date(anchor.getFullYear(), anchor.getMonth(), 1),
    new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1),
  ]
}

function EventButton({ iv, onOpen }) {
  const mode = String(iv.mode || '').toLowerCase()
  return (
    <button className={`emp-cal-ev ${mode}`} onClick={() => onOpen(iv)}>
      <span className="nm">{iv.workerName}</span>
      {MODE_LABEL[iv.mode] || iv.mode}
    </button>
  )
}

export default function InterviewCalendar() {
  useDocumentTitle('Interview Schedule')

  const [view, setView] = useState('week')
  const [anchorKey, setAnchorKey] = useState(() => isoDay(new Date()))
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)

  const anchor = useMemo(() => fromIsoDay(anchorKey), [anchorKey])
  const [from, to] = useMemo(() => rangeFor(view, anchor), [view, anchor])

  const load = () => {
    setItems(null); setError('')
    listInterviews(from.toISOString(), new Date(to.getTime() - 1).toISOString())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setError('We could not load your interviews for this range.'))
  }
  useEffect(load, [view, anchorKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const shift = (dir) => {
    if (view === 'day') return setAnchorKey(isoDay(addDays(anchor, dir)))
    if (view === 'week') return setAnchorKey(isoDay(addDays(anchor, dir * 7)))
    return setAnchorKey(isoDay(new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1)))
  }

  const dated = useMemo(() => {
    if (!items) return []
    return items
      .map((iv) => ({ iv, at: new Date(iv.scheduledAt) }))
      .filter((x) => !Number.isNaN(x.at.getTime()))
      .sort((a, b) => a.at - b.at)
  }, [items])

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(from, i)), [from])

  const today = new Date()
  const monthLabel = anchor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const cancel = (id) => {
    setBusy(true)
    cancelInterview(id)
      .then(() => { setSelected(null); load() })
      .catch(() => setError('We could not cancel that interview. Please try again.'))
      .finally(() => setBusy(false))
  }

  const groups = useMemo(() => {
    const map = new Map()
    dated.forEach(({ iv, at }) => {
      const key = isoDay(at)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push({ iv, at })
    })
    return [...map.entries()]
  }, [dated])

  return (
    <>
      <PageHead title="Interview Schedule" sub="View and manage all your interviews." />

      <div className="emp-cal-head">
        <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/employer/interviews/schedule">
          Schedule Interview
        </Link>
        <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={() => setAnchorKey(isoDay(new Date()))}>
          Today
        </button>
        <button className="emp-menu-btn" aria-label="Previous" onClick={() => shift(-1)}>
          <Icon name="chevronLeft" size={16} />
        </button>
        <button className="emp-menu-btn" aria-label="Next" onClick={() => shift(1)}>
          <Icon name="chevronRight" size={16} />
        </button>
        <span className="grow" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
          {monthLabel}
        </span>
        <div className="wk-tabs" role="tablist" aria-label="Calendar view">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              className="wk-tab"
              role="tab"
              aria-selected={view === v.value}
              onClick={() => { setView(v.value); setSelected(null) }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <ErrorNote onRetry={load}>{error}</ErrorNote>

      {selected && (
        <div className="wk-card pad-lg" style={{ marginBottom: 14 }}>
          <div className="wk-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div className="grow">
              <h2 className="wk-h2">{selected.workerName}</h2>
              <p className="wk-sub">{selected.jobTitle}</p>
            </div>
            <button className="emp-menu-btn" aria-label="Close details" onClick={() => setSelected(null)}>
              <Icon name="close" size={16} />
            </button>
          </div>

          <div className="emp-kv-grid" style={{ marginTop: 14 }}>
            <div className="r">
              <span className="k">When</span>
              <span className="v">
                {formatDate(selected.scheduledAt, true)}
                {selected.durationMinutes ? ` · ${selected.durationMinutes} min` : ''}
              </span>
            </div>
            <div className="r">
              <span className="k">Type</span>
              <span className="v">{MODE_LABEL[selected.mode] || selected.mode || '—'}</span>
            </div>
            <div className="r">
              <span className="k">Location</span>
              <span className="v">{selected.location || '—'}</span>
            </div>
            <div className="r">
              <span className="k">Notes</span>
              <span className="v">{selected.notes || '—'}</span>
            </div>
            {selected.status && (
              <div className="r">
                <span className="k">Status</span>
                <span className="v">{selected.status}</span>
              </div>
            )}
          </div>

          <div className="wk-row" style={{ gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            {selected.workerId != null && (
              <Link
                className="mk-btn mk-btn-outline mk-btn-sm"
                to={`/employer/workers/${selected.workerId}${selected.jobId ? `?jobId=${selected.jobId}` : ''}`}
              >
                View profile
              </Link>
            )}
            <button
              className="mk-btn mk-btn-outline mk-btn-sm"
              style={{ color: '#b91c1c' }}
              onClick={() => cancel(selected.id)}
              disabled={busy}
            >
              Cancel interview
            </button>
          </div>
        </div>
      )}

      {!items && !error ? (
        <Loading rows={2} />
      ) : view === 'week' ? (
        <div className="emp-cal-wrap">
          <div className="emp-cal">
            <div className="hcell" aria-hidden="true" />
            {days.map((d) => (
              <div className={`hcell${sameDay(d, today) ? ' today' : ''}`} key={isoDay(d)}>
                <div className="d">{DOW[d.getDay()]}</div>
                <div className="n">{d.getDate()}</div>
              </div>
            ))}

            {HOURS.map((hour) => (
              <React.Fragment key={hour}>
                <div className="tcell">{hourLabel(hour)}</div>
                {days.map((d) => {
                  const cell = dated.filter(({ at }) => {
                    if (!sameDay(at, d)) return false
                    // Anything outside the 9-5 gutter is pinned to the nearest visible hour.
                    const hr = Math.min(17, Math.max(9, at.getHours()))
                    return hr === hour
                  })
                  return (
                    <div className="cell" key={isoDay(d) + hour}>
                      {cell.map(({ iv }) => (
                        <EventButton key={iv.id} iv={iv} onOpen={setSelected} />
                      ))}
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : dated.length ? (
        <div className="wk-list">
          {groups.map(([key, list]) => (
            <div className="wk-card" key={key}>
              <div className="wk-section-head" style={{ margin: '0 0 10px' }}>
                <span className="grow" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                  {formatDate(fromIsoDay(key).toISOString())}
                </span>
                <span className="wk-sub" style={{ marginTop: 0 }}>
                  {list.length} interview{list.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="wk-list">
                {list.map(({ iv, at }) => (
                  <div className="emp-app-row" key={iv.id} style={{ flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--muted)', width: 62, flexShrink: 0 }}>
                      {at.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="meta">
                      <div className="nm">{iv.workerName}</div>
                      <div className="sb">
                        {[iv.jobTitle, MODE_LABEL[iv.mode] || iv.mode, iv.location].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={() => setSelected(iv)}>
                      Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !error && (
          <div className="wk-card">
            <Empty
              icon="calendar"
              title="No interviews in this range"
              text="Schedule an interview with a shortlisted candidate and it will show up here."
            >
              <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/employer/interviews/schedule">
                Schedule Interview
              </Link>
            </Empty>
          </div>
        )
      )}
    </>
  )
}
