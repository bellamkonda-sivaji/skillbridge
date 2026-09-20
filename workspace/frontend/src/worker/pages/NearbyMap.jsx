import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { searchJobs, pay, distance } from '../api'
import { JobArt, Loading, Empty, ErrorNote } from '../components'
import { fromParams, toQuery, toSearchBody } from '../filters'
import { DEFAULT_MAP_CENTER } from '../../onboarding/data'

const marker = (urgent) => L.divIcon({
  className: '',
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    background:${urgent ? '#ef4444' : '#2563eb'};border:3px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,.32)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -24],
})

/** Reports the map's centre so "Search this area" can re-query around it. */
function TrackCenter({ onMove }) {
  useMapEvents({
    dragend: (e) => onMove(e.target.getCenter()),
    zoomend: (e) => onMove(e.target.getCenter()),
  })
  return null
}

function FitJobs({ points, fitKey }) {
  const map = useMap()
  const fitted = useRef('')
  useEffect(() => {
    if (!fitKey || fitted.current === fitKey) return
    fitted.current = fitKey
    if (points.length > 1) map.fitBounds(points, { padding: [40, 40], maxZoom: 14 })
    else if (points.length === 1) map.setView(points[0], 14)
  }, [fitKey, points, map])
  return null
}

export default function NearbyMap() {
  useDocumentTitle('Jobs near you')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const filters = useMemo(() => fromParams(params), [params])

  const [jobs, setJobs] = useState(null)
  const [error, setError] = useState('')
  const [center, setCenter] = useState(null)
  const [dirty, setDirty] = useState(false)

  const load = useCallback((around) => {
    setJobs(null); setError('')
    const body = toSearchBody(filters)
    if (around) { body.latitude = around.lat; body.longitude = around.lng }
    searchJobs(body)
      .then((d) => setJobs(Array.isArray(d) ? d : []))
      .catch(() => setError('We could not load jobs on the map.'))
      .finally(() => setDirty(false))
  }, [filters])

  useEffect(() => { load() }, [load])

  const located = useMemo(
    () => (jobs || []).filter((j) => j.latitude && j.longitude),
    [jobs]
  )
  const points = useMemo(() => located.map((j) => [j.latitude, j.longitude]), [located])
  const fitKey = located.map((j) => j.id).join(',')

  return (
    <>
      <div className="wk-row" style={{ marginBottom: 14 }}>
        <button
          className="wk-bell"
          onClick={() => navigate(`/worker/jobs${toQuery(filters)}`)}
          aria-label="Back to job list"
        >
          <Icon name="chevronLeft" size={18} />
        </button>
        <div className="grow">
          <h1 className="wk-h1">Jobs Near You</h1>
          <p className="wk-sub">Explore opportunities on map</p>
        </div>
      </div>

      <ErrorNote onRetry={() => load()}>{error}</ErrorNote>

      <div className="wk-map-wrap">
        {dirty && (
          <button className="wk-map-btn tr" onClick={() => load(center)}>
            <Icon name="search" size={14} /> Search this area
          </button>
        )}
        <Link className="wk-map-btn br" to={`/worker/jobs${toQuery(filters)}`}>
          <Icon name="menu" size={14} /> List View
        </Link>

        <MapContainer center={DEFAULT_MAP_CENTER} zoom={12} className="wk-map" scrollWheelZoom>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />
          <TrackCenter onMove={(c) => { setCenter(c); setDirty(true) }} />
          <FitJobs points={points} fitKey={fitKey} />
          {located.map((j) => (
            <Marker key={j.id} position={[j.latitude, j.longitude]} icon={marker(j.urgent)}>
              <Popup>
                <div className="wk-map-pop">
                  <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                    <JobArt job={j} size={34} radius={9} />
                    <span>
                      <span className="ttl" style={{ display: 'block' }}>{j.title}</span>
                      <span className="biz">{j.businessName}</span>
                    </span>
                  </div>
                  <div className="pay">
                    {pay(j.salary, j.salaryUnit)}
                    {distance(j.distanceKm) ? ` · ${distance(j.distanceKm)}` : ''}
                  </div>
                  <Link
                    className="mk-btn mk-btn-primary mk-btn-sm"
                    to={`/worker/jobs/${j.id}`}
                    style={{ marginTop: 8, width: '100%' }}
                  >
                    View job
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div style={{ marginTop: 14 }}>
        {!jobs && !error ? (
          <Loading rows={1} />
        ) : (
          <p className="wk-sub">
            {located.length} of {jobs?.length || 0} nearby {jobs?.length === 1 ? 'job' : 'jobs'} have a map location.
            {jobs?.length > located.length && ' The rest are in the list view.'}
          </p>
        )}
        {jobs && jobs.length === 0 && !error && (
          <div className="wk-card" style={{ marginTop: 12 }}>
            <Empty icon="pin" title="No jobs in this area yet" text="Try zooming out and searching this area again." />
          </div>
        )}
      </div>
    </>
  )
}
