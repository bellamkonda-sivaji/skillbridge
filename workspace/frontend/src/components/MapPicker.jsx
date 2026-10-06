import React, { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet'
import L from 'leaflet'
import { DEFAULT_MAP_CENTER } from '../onboarding/data'

const icon = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
})

// Keeps the pin wherever the map is centred, so you line the map up under a
// fixed crosshair instead of hitting an exact spot with a thumb. Tapping still
// works for anyone on a mouse.
function CenterHandler({ onPick }) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter()
      onPick([c.lat, c.lng])
    },
    click(e) {
      e.target.panTo(e.latlng)
    }
  })
  return null
}

export function MapPicker({ lat, lng, onChange, label, hint }) {
  const [pos, setPos] = useState(lat && lng ? [lat, lng] : DEFAULT_MAP_CENTER)

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <MapContainer
          center={pos}
          zoom={12}
          className="map-picker"
          style={{ height: 260 }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <CenterHandler onPick={(p) => { setPos(p); onChange?.(p[0], p[1]) }} />
          {pos && <Marker position={pos} icon={icon}><Popup>{label || pos[0].toFixed(4) + ', ' + pos[1].toFixed(4)}</Popup></Marker>}
        </MapContainer>
        {/* Crosshair sits above the map, dead centre, and ignores pointers. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', left: '50%', top: '50%', width: 44, height: 44,
            marginLeft: -22, marginTop: -22, pointerEvents: 'none', zIndex: 500
          }}
        >
          <div style={{ position: 'absolute', left: 21, top: 0, width: 2, height: 44, background: 'rgba(37,99,235,.55)' }} />
          <div style={{ position: 'absolute', top: 21, left: 0, height: 2, width: 44, background: 'rgba(37,99,235,.55)' }} />
        </div>
      </div>
      <p className="muted" style={{ marginTop: 6 }}>
        {hint || 'Move the map until your place sits under the cross'}
      </p>
    </div>
  )
}

export function StaticMap({ lat, lng, height = 180 }) {
  if (!lat || !lng) return <div className="muted">No location set</div>
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={12}
      className="map-small"
      style={{ height }}
      scrollWheelZoom={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[lat, lng]} icon={icon} />
    </MapContainer>
  )
}
