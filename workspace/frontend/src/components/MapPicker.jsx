import React, { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet'
import L from 'leaflet'

const icon = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
})

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng])
    }
  })
  return null
}

export function MapPicker({ lat, lng, onChange, label }) {
  const [pos, setPos] = useState(lat && lng ? [lat, lng] : [-1.2864, 36.8172])

  return (
    <div>
      <MapContainer
        center={pos}
        zoom={12}
        className="map-picker"
        style={{ height: 260 }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler onPick={(p) => { setPos(p); onChange?.(p[0], p[1]) }} />
        {pos && <Marker position={pos} icon={icon}><Popup>{label || pos[0].toFixed(4) + ', ' + pos[1].toFixed(4)}</Popup></Marker>}
      </MapContainer>
      <p className="muted" style={{ marginTop: 6 }}>Tap the map to drop your location pin</p>
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
