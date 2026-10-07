import * as Location from 'expo-location'

/**
 * Turning a point into an address, and a search into points.
 *
 * An address here is the single most important field in the product: a worker
 * decides whether to take a job by how far it is, and "Tirupati" is not an
 * answer when the question is which street. So we want the door number, the
 * locality and the PIN code, not a city name.
 *
 * Nominatim for search because it is the same OpenStreetMap data the maps
 * already use - no API key, no billing account. Their policy requires a real
 * User-Agent identifying the app, which the native HTTP client already sets.
 * One request per keystroke would breach it, so callers debounce.
 *
 * Reverse geocoding goes through expo-location, which uses the platform
 * geocoder on the phone: no network round trip, and it already has the
 * permission we asked for.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org'

/** The shape every screen uses, whichever source filled it in. */
export const emptyAddress = () => ({
  doorNo: '', building: '', street: '', locality: '',
  city: '', state: '', pincode: '', latitude: null, longitude: null,
})

/** Joins the parts that are present, so no screen prints ", , Tirupati". */
export function formatAddress(a) {
  if (!a) return ''
  return [a.doorNo, a.building, a.street, a.locality, a.city, a.pincode]
    .map((x) => String(x || '').trim())
    .filter(Boolean)
    .join(', ')
}

/** Where the phone is, as an address rather than two numbers. */
export async function addressFromCoords(latitude, longitude) {
  try {
    const [p] = await Location.reverseGeocodeAsync({ latitude, longitude })
    if (!p) return { ...emptyAddress(), latitude, longitude }
    return {
      // `name` is often the door or building; only use it when it is not just
      // a repeat of the street, which is what the Android geocoder returns for
      // a plain road.
      doorNo: p.streetNumber || (p.name && p.name !== p.street ? p.name : '') || '',
      building: '',
      street: p.street || '',
      locality: p.district || p.subregion || '',
      city: p.city || p.subregion || '',
      state: p.region || '',
      pincode: p.postalCode || '',
      latitude,
      longitude,
    }
  } catch {
    return { ...emptyAddress(), latitude, longitude }
  }
}

/**
 * Search, biased to India.
 *
 * `addressdetails` is what carries the PIN code; without it Nominatim returns
 * a display string and nothing structured, and the whole point here is the
 * structure.
 */
export async function searchAddress(query, signal) {
  const q = String(query || '').trim()
  if (q.length < 3) return []
  try {
    const url = `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=8`
      + `&countrycodes=in&q=${encodeURIComponent(q)}`
    const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
    if (!res.ok) return []
    const rows = await res.json()
    return (Array.isArray(rows) ? rows : []).map((r) => {
      const a = r.address || {}
      return {
        id: String(r.place_id),
        label: r.display_name,
        doorNo: a.house_number || '',
        building: a.building || '',
        street: a.road || '',
        locality: a.suburb || a.neighbourhood || a.village || a.town || '',
        city: a.city || a.town || a.village || a.state_district || '',
        state: a.state || '',
        pincode: a.postcode || '',
        latitude: Number(r.lat),
        longitude: Number(r.lon),
      }
    })
  } catch {
    // An aborted request is the normal case while someone is still typing.
    return []
  }
}
