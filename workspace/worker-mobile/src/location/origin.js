import { useCallback, useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import * as profileApi from '../api/profile'
import { locateWithHelp, openAppSettings, quietLocation } from './current'

/**
 * Where "near you" is measured from.
 *
 * The phone's own position when location is on and already allowed, else the
 * saved home. Reading it never shows a prompt: someone opening the job list
 * has not asked to be asked anything. Only when they tap the chip and choose
 * "current location" do we help them switch it on.
 *
 * The choice is remembered. With nothing stored, current location is used
 * when it is quietly available - and a failure then says nothing at all.
 */

const CHOICE_KEY = 'jobon.worker.nearFrom.v1'

/** The saved home, fetched once a run - every list screen wants its name. */
let home = null
let homeLoading = null

const validPoint = (lat, lng) =>
  Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && !(Number(lat) === 0 && Number(lng) === 0)

function loadHome() {
  if (home) return Promise.resolve(home)
  if (!homeLoading) {
    homeLoading = profileApi.getProfile()
      .then((p) => { rememberHome(p); return home })
      .catch(() => null)
      .finally(() => { homeLoading = null })
  }
  return homeLoading
}

/** Called after "Where I live" is saved, so the chip shows the new area. */
export function rememberHome(p) {
  if (!p) return
  home = {
    area: p.area || p.locality || '',
    city: p.city || '',
    point: validPoint(p.latitude, p.longitude)
      ? { lat: Number(p.latitude), lng: Number(p.longitude) } : null,
  }
}

const same = (a, b) => a && b && a.mode === b.mode && a.reason === b.reason
  && a.lat?.toFixed?.(4) === b.lat?.toFixed?.(4) && a.lng?.toFixed?.(4) === b.lng?.toFixed?.(4)
  && a.homeLabel === b.homeLabel

function homeOrigin(reason) {
  return {
    mode: 'HOME',
    reason: reason || null,
    homeLabel: home?.area || home?.city || '',
    point: home?.point || null,
  }
}

/**
 * @returns {{
 *   ready: boolean, choice: 'CURRENT'|'HOME'|null,
 *   origin: { mode: 'CURRENT'|'HOME', lat?, lng?, point, homeLabel, reason },
 *   params: { lat?: number, lng?: number },
 *   note: null | 'off' | 'denied' | 'blocked' | 'failed',
 *   busy: boolean, toggle: () => void, help: () => void,
 * }}
 */
export function useSearchOrigin() {
  const [choice, setChoice] = useState(undefined) // undefined = not read yet
  const [origin, setOrigin] = useState(null)
  const [busy, setBusy] = useState(false)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    AsyncStorage.getItem(CHOICE_KEY)
      .then((v) => alive.current && setChoice(v === 'HOME' || v === 'CURRENT' ? v : null))
      .catch(() => alive.current && setChoice(null))
    return () => { alive.current = false }
  }, [])

  const apply = useCallback((next) => {
    if (!alive.current) return
    setOrigin((prev) => (same(prev, next) ? prev : next))
  }, [])

  const fromFix = (got) => ({
    mode: 'CURRENT', lat: got.latitude, lng: got.longitude,
    point: { lat: got.latitude, lng: got.longitude },
    homeLabel: home?.area || home?.city || '', reason: null,
  })

  const resolve = useCallback(async () => {
    if (choice === undefined) return
    await loadHome()
    if (choice === 'HOME') { apply(homeOrigin()); return }
    const got = await quietLocation()
    apply(got.ok ? fromFix(got) : homeOrigin(got.reason))
  }, [choice, apply])

  // Again on every visit: someone may have switched location on meanwhile.
  useFocusEffect(useCallback(() => { resolve() }, [resolve]))

  const save = (v) => AsyncStorage.setItem(CHOICE_KEY, v).catch(() => {})

  /** The helpful path - asks, switches location on, reads. */
  const help = useCallback(async (blockedToo = true) => {
    setBusy(true)
    let got = await locateWithHelp({ ask: true })
    if (!got.ok && got.reason === 'blocked' && blockedToo) got = await openAppSettings()
    if (alive.current) setBusy(false)
    apply(got.ok ? fromFix(got) : homeOrigin(got.reason))
  }, [apply])

  const toggle = useCallback(() => {
    const next = origin?.mode === 'CURRENT' ? 'HOME' : 'CURRENT'
    setChoice(next)
    save(next)
    if (next === 'HOME') apply(homeOrigin())
    // Choosing "where I am now" is the person asking - so now we may help.
    else help(false)
  }, [origin, apply, help])

  const ready = Boolean(origin)
  const params = origin?.mode === 'CURRENT' ? { lat: origin.lat, lng: origin.lng } : {}
  // Only explain a fallback the person chose against; a default says nothing.
  const note = choice === 'CURRENT' && origin?.mode === 'HOME' ? (origin.reason || 'failed') : null

  return { ready, choice, origin, params, note, busy, toggle, help }
}
