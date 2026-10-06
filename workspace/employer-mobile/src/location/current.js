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
 * @returns {Promise<{ok: true, latitude: number, longitude: number}
 *                  | {ok: false, reason: 'denied' | 'off' | 'failed'}>}
 */
export async function currentLocation() {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync()
    if (!granted) return { ok: false, reason: 'denied' }

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
