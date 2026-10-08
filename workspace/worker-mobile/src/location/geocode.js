import client from '../api/client'
import * as Location from 'expo-location'

/**
 * Turning a point into an address, and a search into points.
 *
 * An address here is the single most important field in the product: a worker
 * decides whether to take a job by how far it is, and "Tirupati" is not an
 * answer when the question is which street. So we want the door number, the
 * locality and the PIN code, not a city name.
 *
 * Search goes through our own backend, not a maps provider directly. The key
 * then lives on one server instead of inside every APK, the provider can be
 * swapped without shipping a new app, and the provider's usage policy is one
 * server's problem rather than every handset's. Callers still debounce.
 *
 * Reverse geocoding goes through expo-location, which uses the platform
 * geocoder on the phone: no network round trip, and it already has the
 * permission we asked for.
 */

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
export async function searchAddress(query, signal, near) {
  const q = String(query || '').trim()
  if (q.length < 3) return []
  try {
    const res = await client.get('/places/search', {
      params: { q, near: near || undefined },
      signal,
    })
    const rows = res?.data?.results
    return (Array.isArray(rows) ? rows : []).map((r) => ({
      id: String(r.id),
      // The shop's own name when the provider knows it - which is the whole
      // reason for going through a places API rather than a street gazetteer.
      name: r.name || '',
      label: r.label || '',
      doorNo: r.doorNo || '',
      building: r.building || '',
      street: r.street || '',
      locality: r.locality || '',
      city: r.city || '',
      state: r.state || '',
      pincode: r.pincode || '',
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
    }))
  } catch {
    // An aborted request is the normal case while someone is still typing.
    return []
  }
}
