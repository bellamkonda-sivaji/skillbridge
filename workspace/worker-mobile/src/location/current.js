import { AppState, Linking, Platform } from 'react-native'
import * as Location from 'expo-location'

/**
 * Asks the phone where it is, once.
 *
 * Nearby work is ranked by distance from the worker, so without real
 * coordinates that ranking has nothing to sort by. Everything here resolves
 * rather than throws: the caller gets a reason it can show in the user's own
 * language instead of a stack trace.
 *
 * Balanced accuracy, not the best available — a few hundred metres is plenty
 * for "jobs within 3 km", and chasing a GPS fix indoors can take half a minute
 * on the kind of phone this app is built for.
 *
 * Reasons: 'denied' (said no, can be asked again), 'blocked' (said no for
 * good - only Settings can change it), 'off' (location switched off on the
 * phone), 'failed' (no fix in time).
 */

/** A fix is reused for this long, so the home screen and the list agree. */
const FRESH_MS = 2 * 60 * 1000
const QUICK_TIMEOUT_MS = 4000

let lastFix = null

const finite = (n) => Number.isFinite(n)

function remember(fix) {
  const { latitude, longitude, accuracy } = fix?.coords || {}
  if (!finite(latitude) || !finite(longitude)) return null
  lastFix = {
    latitude,
    longitude,
    accuracyM: finite(accuracy) ? Math.round(accuracy) : null,
    at: Date.now(),
  }
  return lastFix
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(null), ms)),
  ])
}

/** Last known first - it is instant - then a real fix, but never for long. */
async function readFix(timeoutMs) {
  if (lastFix && Date.now() - lastFix.at < FRESH_MS) return lastFix
  try {
    const known = await Location.getLastKnownPositionAsync({ maxAge: FRESH_MS, requiredAccuracy: 1000 })
    const got = remember(known)
    if (got) return got
  } catch { /* fall through to a real fix */ }
  try {
    const fix = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      timeoutMs,
    )
    return remember(fix)
  } catch {
    return null
  }
}

const result = (fix) => (fix
  ? { ok: true, latitude: fix.latitude, longitude: fix.longitude, accuracyM: fix.accuracyM }
  : { ok: false, reason: 'failed' })

/**
 * Where the phone is, without asking anything.
 *
 * For screens that merely prefer a live position - the job list, the home
 * screen. No permission prompt, no "turn on location" box: if either is
 * missing, the caller falls back to the saved home and says nothing.
 */
export async function quietLocation({ timeoutMs = QUICK_TIMEOUT_MS } = {}) {
  try {
    const perm = await Location.getForegroundPermissionsAsync()
    if (!perm?.granted) return { ok: false, reason: perm?.canAskAgain === false ? 'blocked' : 'denied' }
    if (!(await Location.hasServicesEnabledAsync())) return { ok: false, reason: 'off' }
    return result(await readFix(timeoutMs))
  } catch {
    return { ok: false, reason: 'failed' }
  }
}

/** Resolves the next time the app comes back to the front, or after `ms`. */
export function whenBackInApp(ms = 120000) {
  return new Promise((resolve) => {
    let left = AppState.currentState !== 'active'
    let sub = null
    const done = () => { sub?.remove(); clearTimeout(timer); resolve() }
    const timer = setTimeout(done, ms)
    sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') left = true
      else if (left) done()
    })
  })
}

/** The phone's own location page; on iOS only the app's page can be opened. */
async function openLocationSettings() {
  try {
    if (Platform.OS === 'android') await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS')
    else await Linking.openSettings()
    return true
  } catch {
    try { await Linking.openSettings(); return true } catch { return false }
  }
}

/**
 * Switches location on, the least painful way the phone allows.
 *
 * On Android that is Google's one-tap "Turn on location" box. Where that box
 * is not available, the location settings page opens instead and we wait for
 * the person to come back.
 *
 * @returns {Promise<'on' | 'declined' | 'off'>}
 */
async function turnOn() {
  if (Platform.OS === 'android' && typeof Location.enableNetworkProviderAsync === 'function') {
    try {
      await Location.enableNetworkProviderAsync()
      return 'on'
    } catch (err) {
      // "No thanks" on the system box is an answer, not a failure - respect it.
      if (/SETTINGS_UNSATISFIED|unsatisfied device settings/i.test(`${err?.code} ${err?.message}`)) {
        return 'declined'
      }
    }
  }
  if (!(await openLocationSettings())) return 'off'
  await whenBackInApp()
  return (await Location.hasServicesEnabledAsync().catch(() => false)) ? 'on' : 'off'
}

/**
 * The one way every screen asks for a location when the person wants it.
 *
 * Asks for permission if it may, turns location on if it is off, and then
 * reads a fix. A permanently refused permission is only reported - the caller
 * offers "Open settings" ({@link openAppSettings}) rather than nagging.
 *
 * `ask: false` skips the permission prompt (the caller has already explained
 * and been told no) but still helps with switching location on.
 */
export async function locateWithHelp({ ask = true, timeoutMs = 10000 } = {}) {
  try {
    let perm = await Location.getForegroundPermissionsAsync()
    if (!perm?.granted && ask && perm?.canAskAgain !== false) {
      perm = await Location.requestForegroundPermissionsAsync()
    }
    if (!perm?.granted) return { ok: false, reason: perm?.canAskAgain === false ? 'blocked' : 'denied' }

    if (!(await Location.hasServicesEnabledAsync())) {
      const state = await turnOn()
      if (state !== 'on') return { ok: false, reason: 'off', declined: state === 'declined' }
    }
    return result(await readFix(timeoutMs))
  } catch {
    return { ok: false, reason: 'failed' }
  }
}

/**
 * For a permission refused for good: opens the app's settings page and
 * resolves with a fresh attempt once the person comes back.
 */
export async function openAppSettings() {
  try { await Linking.openSettings() } catch { return { ok: false, reason: 'blocked' } }
  await whenBackInApp()
  return locateWithHelp({ ask: false })
}

/**
 * Kept for older callers: the full, helpful version.
 *
 * @returns {Promise<{ok: true, latitude: number, longitude: number, accuracyM: number|null}
 *                  | {ok: false, reason: 'denied' | 'blocked' | 'off' | 'failed'}>}
 */
export const currentLocation = () => locateWithHelp({ ask: true })
