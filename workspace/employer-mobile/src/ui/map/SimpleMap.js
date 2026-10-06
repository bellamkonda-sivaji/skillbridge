import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Image, Linking, PanResponder, Platform, Pressable, StyleSheet, Text, View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  TILE, clampLat, clampZoom, latToTileY, lngToTileX, metresPerPixel,
  tileUrl, tileXToLng, tileYToLat,
} from './tiles'
import { colors, radius, space } from '../../theme'

/**
 * A map for people who are not reading the map.
 *
 * Three decisions shape this:
 *
 *  - The price is ON the pin. Someone scanning for work wants to know what the
 *    street pays, and a map of identical dots makes them tap every one. With
 *    the number on the pin the comparison is the glance.
 *
 *  - Zoom is two big buttons, not a pinch. Pinching is a two-handed gesture on
 *    a phone that is often being held in one hand, with the other carrying
 *    something, and it is the single most-missed interaction we could pick.
 *
 *  - It is built from plain tile images rather than a mapping SDK, so there is
 *    no API key to obtain, no billing account, and nothing native to install.
 *    OpenStreetMap's attribution is shown and tappable, which is their licence
 *    condition and not optional.
 */
export default function SimpleMap({
  points = [],
  center,
  zoom: initialZoom = 13,
  selectedId,
  onSelect,
  onRegionChange,
  width,
  height,
  label,          // (point) => string shown on the pin, e.g. the pay
  me,             // { lat, lng } - the worker's own position, if known
  style,
}) {
  const [view, setView] = useState({
    lat: center?.lat ?? 13.6288,
    lng: center?.lng ?? 79.4192,
    z: clampZoom(initialZoom),
  })
  // Pan moves this offset; it is folded back into lat/lng when the drag ends,
  // so the tile grid is only recomputed once per gesture rather than per frame.
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const viewRef = useRef(view)
  viewRef.current = view

  useEffect(() => {
    if (center && Number.isFinite(center.lat)) {
      setView((v) => ({ ...v, lat: center.lat, lng: center.lng }))
    }
  }, [center?.lat, center?.lng])

  const W = width || 360
  const H = height || 360

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.hypot(g.dx, g.dy) > 6,
      onPanResponderMove: (_e, g) => setDrag({ x: g.dx, y: g.dy }),
      onPanResponderRelease: (_e, g) => {
        const v = viewRef.current
        const scale = 2 ** v.z
        // Pixels back into tile space, then tile space back into degrees.
        const cx = lngToTileX(v.lng, v.z) - g.dx / TILE
        const cy = latToTileY(v.lat, v.z) - g.dy / TILE
        const next = {
          lat: clampLat(tileYToLat(Math.max(0, Math.min(scale, cy)), v.z)),
          lng: tileXToLng(Math.max(0, Math.min(scale, cx)), v.z),
          z: v.z,
        }
        setDrag({ x: 0, y: 0 })
        setView(next)
        onRegionChange?.(next)
      },
      onPanResponderTerminate: () => setDrag({ x: 0, y: 0 }),
    }),
  ).current

  /** The tile grid covering the viewport, plus one ring so panning has cover. */
  const grid = useMemo(() => {
    const { lat, lng, z } = view
    const scale = 2 ** z
    const cx = lngToTileX(lng, z)
    const cy = latToTileY(lat, z)
    // Where the centre tile's top-left corner sits on screen.
    const originX = W / 2 - (cx - Math.floor(cx)) * TILE
    const originY = H / 2 - (cy - Math.floor(cy)) * TILE
    const cols = Math.ceil(W / TILE) + 2
    const rows = Math.ceil(H / TILE) + 2
    const out = []
    for (let dy = -Math.ceil(rows / 2); dy <= Math.ceil(rows / 2); dy += 1) {
      for (let dx = -Math.ceil(cols / 2); dx <= Math.ceil(cols / 2); dx += 1) {
        const tx = Math.floor(cx) + dx
        const ty = Math.floor(cy) + dy
        if (ty < 0 || ty >= scale) continue
        // Wrap horizontally so panning past the date line still shows map.
        const wrapped = ((tx % scale) + scale) % scale
        out.push({
          key: `${z}/${wrapped}/${ty}/${dx}`,
          uri: tileUrl(wrapped, ty, z),
          left: originX + dx * TILE,
          top: originY + dy * TILE,
        })
      }
    }
    return out
  }, [view, W, H])

  /** Where a lat/lng lands on screen, given the current view. */
  const project = (lat, lng) => {
    const { z } = view
    const cx = lngToTileX(view.lng, z)
    const cy = latToTileY(view.lat, z)
    return {
      x: W / 2 + (lngToTileX(lng, z) - cx) * TILE,
      y: H / 2 + (latToTileY(lat, z) - cy) * TILE,
    }
  }

  const setZoom = (delta) => {
    setView((v) => {
      const next = { ...v, z: clampZoom(v.z + delta) }
      onRegionChange?.(next)
      return next
    })
  }

  const recentre = () => {
    const to = me || center
    if (!to) return
    setView((v) => ({ ...v, lat: to.lat, lng: to.lng }))
    onRegionChange?.({ ...view, lat: to.lat, lng: to.lng })
  }

  // A scale bar that rounds to something sayable: 100 m, 500 m, 1 km.
  const scale = useMemo(() => {
    const mpp = metresPerPixel(view.lat, view.z)
    const target = 80                                   // pixels
    const raw = mpp * target
    const steps = [50, 100, 200, 500, 1000, 2000, 5000, 10000]
    const m = steps.find((s) => s >= raw) || 10000
    return { px: Math.round(m / mpp), text: m >= 1000 ? `${m / 1000} km` : `${m} m` }
  }, [view])

  const visible = points.filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))

  return (
    <View style={[s.wrap, { width: W, height: H }, style]}>
      <View style={s.canvas} {...pan.panHandlers}>
        {/* Tiles. translate on the whole layer keeps the drag at one transform. */}
        <View style={[s.layer, { transform: [{ translateX: drag.x }, { translateY: drag.y }] }]}>
          {grid.map((t) => (
            <Image
              key={t.key}
              source={{ uri: t.uri }}
              style={[s.tile, { left: t.left, top: t.top }]}
              fadeDuration={0}
            />
          ))}

          {me ? (() => {
            const { x, y } = project(me.lat, me.lng)
            return (
              <View key="me" style={[s.me, { left: x - 13, top: y - 13 }]} pointerEvents="none">
                <View style={s.meDot} />
              </View>
            )
          })() : null}

          {visible.map((p) => {
            const { x, y } = project(p.latitude, p.longitude)
            // Skip anything comfortably off screen - a list of 200 jobs should
            // not cost 200 views.
            if (x < -120 || x > W + 120 || y < -120 || y > H + 120) return null
            const on = selectedId === p.id
            const text = label ? label(p) : null
            return (
              <Pressable
                key={p.id}
                onPress={() => onSelect?.(p)}
                hitSlop={10}
                style={[s.pinWrap, { left: x - 52, top: y - 52 }]}
              >
                <View style={[
                  s.pin,
                  p.urgent && s.pinUrgent,
                  on && s.pinOn,
                ]}>
                  {text ? (
                    <Text style={[s.pinText, on && s.pinTextOn]} numberOfLines={1}>{text}</Text>
                  ) : (
                    <Ionicons name="briefcase" size={16} color={on ? colors.white : colors.white} />
                  )}
                </View>
                <View style={[s.pinTail, p.urgent && s.pinTailUrgent, on && s.pinTailOn]} />
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* Controls. 56pt, far apart, and never over the pins in the middle. */}
      <View style={s.zoomCol}>
        <Pressable style={[s.ctl, s.ctlTop]} onPress={() => setZoom(1)}
          accessibilityLabel="Zoom in">
          <Text style={s.ctlText}>+</Text>
        </Pressable>
        <View style={s.ctlDivider} />
        <Pressable style={[s.ctl, s.ctlBottom]} onPress={() => setZoom(-1)}
          accessibilityLabel="Zoom out">
          <Text style={s.ctlText}>−</Text>
        </Pressable>
      </View>

      {me || center ? (
        <Pressable style={s.locate} onPress={recentre} accessibilityLabel="Centre the map on me">
          <Ionicons name="locate" size={24} color={colors.blueDark} />
        </Pressable>
      ) : null}

      <View style={s.scale} pointerEvents="none">
        <View style={[s.scaleBar, { width: scale.px }]} />
        <Text style={s.scaleText}>{scale.text}</Text>
      </View>

      {/* OpenStreetMap's licence requires visible, working attribution. */}
      <Pressable
        style={s.attrib}
        onPress={() => Linking.openURL('https://www.openstreetmap.org/copyright').catch(() => {})}
      >
        <Text style={s.attribText}>© OpenStreetMap</Text>
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: '#E8EDF2', borderRadius: radius.lg },
  canvas: { ...StyleSheet.absoluteFillObject },
  layer: { ...StyleSheet.absoluteFillObject },
  tile: { position: 'absolute', width: TILE, height: TILE },

  pinWrap: { position: 'absolute', width: 104, alignItems: 'center' },
  pin: {
    minWidth: 54, height: 36, borderRadius: 18, paddingHorizontal: 11,
    backgroundColor: colors.green, borderWidth: 2.5, borderColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0F172A', shadowOpacity: 0.3, shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }, elevation: 5,
  },
  pinUrgent: { backgroundColor: colors.red },
  pinOn: { backgroundColor: colors.blueDark, transform: [{ scale: 1.14 }] },
  pinText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  pinTextOn: { color: colors.white },
  pinTail: {
    width: 0, height: 0, marginTop: -3,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 9,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: colors.green,
  },
  pinTailUrgent: { borderTopColor: colors.red },
  pinTailOn: { borderTopColor: colors.blueDark },

  me: {
    position: 'absolute', width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(37,99,235,0.22)', alignItems: 'center', justifyContent: 'center',
  },
  meDot: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: colors.blue,
    borderWidth: 2.5, borderColor: colors.white,
  },

  zoomCol: {
    position: 'absolute', right: space.md, top: space.md,
    backgroundColor: colors.white, borderRadius: radius.md, overflow: 'hidden',
    shadowColor: '#0F172A', shadowOpacity: 0.18, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },
  ctl: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  ctlTop: {}, ctlBottom: {},
  ctlDivider: { height: 1, backgroundColor: colors.line },
  ctlText: { fontSize: 30, fontWeight: '600', color: colors.ink, lineHeight: 34 },

  locate: {
    position: 'absolute', right: space.md, bottom: space.xxl + 10,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0F172A', shadowOpacity: 0.18, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },

  scale: { position: 'absolute', left: space.md, bottom: space.md + 22, alignItems: 'flex-start' },
  scaleBar: { height: 4, backgroundColor: colors.ink, borderRadius: 2, opacity: 0.65 },
  scaleText: { fontSize: 11, fontWeight: '700', color: colors.ink, marginTop: 2, opacity: 0.75 },

  attrib: {
    position: 'absolute', left: space.md, bottom: space.sm,
    backgroundColor: 'rgba(255,255,255,0.86)', borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  attribText: { fontSize: 10, color: colors.body },
})
