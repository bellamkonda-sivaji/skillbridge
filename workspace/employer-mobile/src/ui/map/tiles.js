/**
 * Web Mercator maths, which is all a slippy map actually needs.
 *
 * OpenStreetMap serves tiles as plain 256px PNGs at
 * `tile.openstreetmap.org/{z}/{x}/{y}.png`, so a map is a grid of images
 * positioned by these functions. No API key, no billing account, and nothing
 * native to install - which matters here because the alternative was Google
 * Maps, and Google Maps on Android throws from inside the native view when
 * there is no key.
 */

export const TILE = 256

/** Longitude to tile x at a zoom level. Fractional - the floor is the tile. */
export const lngToTileX = (lng, z) => ((lng + 180) / 360) * 2 ** z

/** Latitude to tile y. The log/tan is the Mercator projection. */
export function latToTileY(lat, z) {
  const rad = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z
}

export const tileXToLng = (x, z) => (x / 2 ** z) * 360 - 180

export function tileYToLat(y, z) {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
}

/**
 * One canonical host. The old a/b/c mirrors are deprecated - OpenStreetMap now
 * serves everything from this name behind a CDN, and splitting across
 * subdomains only costs extra DNS and TLS handshakes.
 */
export function tileUrl(x, y, z) {
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
}

/**
 * OpenStreetMap's tile policy requires a User-Agent that names the app and
 * gives them someone to contact. Without one their CDN answers with a
 * "blocked" image - served as a normal 200, so it renders as a working map
 * made entirely of error tiles.
 *
 * That header is NOT set here. React Native's `<Image source={{ headers }}>`
 * is ignored on Android; the request goes out as `okhttp/4.x` regardless,
 * which is exactly what gets blocked. It is set on the native OkHttp client
 * instead - see plugins/withTileUserAgent.js.
 *
 * These tiles are a volunteer-funded service meant for light use. Before this
 * ships at real volume it needs a provider that sells tiles (MapTiler, Stadia,
 * Thunderforest) or a self-hosted renderer. Only tileUrl changes.
 */

/** Metres per pixel, so a scale bar can be honest. */
export const metresPerPixel = (lat, z) =>
  (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** z

export const clampLat = (lat) => Math.max(-85.05, Math.min(85.05, lat))
export const clampZoom = (z) => Math.max(3, Math.min(18, z))

/** Distance in km between two points, for "how far is this really". */
export function haversineKm(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}
