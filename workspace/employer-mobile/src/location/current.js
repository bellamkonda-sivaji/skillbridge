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
 * for "shops within 3 km", and chasing a GPS fix indoors can take half a minute
 * on the kind of phone this app is built for.
 *
 * `blocked` is a "no" Android will not ask about again: only Settings can undo
 * it, so the caller offers that instead of a button that does nothing.
 *
 * @returns {Promise<{ok: true, latitude: number, longitude: number}
 *                  | {ok: false, reason: 'denied' | 'blocked' | 'off' | 'failed'}>}
 */
export async function currentLocation() {
  try {
    const { granted, canAskAgain } = await Location.requestForegroundPermissionsAsync()
    if (!granted) return { ok: false, reason: canAskAgain === false ? 'blocked' : 'denied' }

    if (!(await Location.hasServicesEnabledAsync())) return { ok: false, reason: 'off' }

    const fix = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })
    const { latitude, longitude } = fix?.coords || {}
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { ok: false, reason: 'failed' }
    }
    return { ok: true, latitude, longitude }
  } catch {
    return { ok: false, reason: 'failed' }
  }
}

/**
 * Where the phone is, switching location on first if it is off.
 *
 * "Location is off, turn it on and tap again" is three steps for someone who
 * pressed one button. On Android, Google's own "Turn on location" sheet does
 * it in one tap without leaving the app. Where that is not available, the
 * phone's location settings open instead and this waits for the person to
 * come back, then tries again by itself.
 *
 * Still `off` afterwards means they chose not to - the caller shows a short
 * note with a button, never an error.
 */
export async function locateTurningOn() {
  const first = await currentLocation()
  if (first.ok || first.reason !== 'off') return first
  if (!(await turnLocationOn())) return { ok: false, reason: 'off' }
  return currentLocation()
}

/**
 * The app's own page in Settings, for a permission that was refused for good,
 * resolving once the person is back so the caller can try again.
 */
export async function openAppSettings() {
  try {
    const back = untilBack()
    await Linking.openSettings()
    await back
  } catch { /* nothing to open on this phone */ }
}

async function servicesOn() {
  try { return await Location.hasServicesEnabledAsync() } catch { return false }
}

/** True once location services are on, by whichever route worked. */
async function turnLocationOn() {
  if (Platform.OS === 'android') {
    try {
      await Location.enableNetworkProviderAsync()
      if (await servicesOn()) return true
    } catch {
      // Declined, or no Play services to show the sheet. Settings still work.
    }
  }
  try {
    const back = untilBack()
    if (Platform.OS === 'android') {
      await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS')
    } else {
      await Linking.openSettings()
    }
    await back
  } catch {
    return false
  }
  return servicesOn()
}

/**
 * Resolves when the app is in front again after leaving for Settings.
 *
 * If it never leaves (the settings page failed to open quietly) this gives up
 * after a moment rather than waiting for ever, and after ten minutes in any
 * case so an abandoned attempt does not hold the button's spinner.
 */
function untilBack() {
  return new Promise((resolve) => {
    let left = false
    let sub = null
    const finish = () => {
      clearTimeout(never)
      clearTimeout(cap)
      sub?.remove()
      resolve()
    }
    sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') { if (left) finish() } else { left = true }
    })
    const never = setTimeout(() => { if (!left) finish() }, 2500)
    const cap = setTimeout(finish, 10 * 60 * 1000)
  })
}
