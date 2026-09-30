/** Money, dates and distances the way people here actually say them. */

export function money(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '₹0'
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: n % 1 === 0 ? 0 : 2 })
}

const UNIT = {
  HOURLY: '/hour', PER_SHIFT: '/shift', DAILY: '/day',
  PER_WEEK: '/week', MONTHLY: '/month',
}

export const pay = (amount, unit) => money(amount) + (UNIT[unit] || '')

/**
 * What the worker actually takes home.
 *
 * The employer posts a price and the platform's commission comes out of it, so
 * every screen in this app shows the take-home. Job cards already arrive with
 * the net figure in `salary`; the fuller job record carries it separately.
 * Reading both here means no screen can show a number that will not be paid.
 */
export const workerPay = (job) =>
  Number(job?.workerSalary) > 0 ? Number(job.workerSalary) : Number(job?.salary) || 0

export function distance(km) {
  if (km === null || km === undefined) return null
  const n = Number(km)
  if (!Number.isFinite(n)) return null
  return n < 1 ? `${Math.round(n * 1000)} m` : `${n.toFixed(1)} km`
}

export function timeAgo(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatDate(iso)
}

export function formatDate(iso, withTime = false) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  if (!withTime) return date
  return `${date}, ${timeOnly(iso)}`
}

export function timeOnly(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

/** "09:00:00" from the API is not something anyone wants to read. */
export const hhmm = (t) => (t ? String(t).slice(0, 5) : '')

export function minutesLabel(mins) {
  const m = Math.max(0, Math.round(Number(mins) || 0))
  if (!m) return null
  const h = Math.floor(m / 60)
  const r = m % 60
  if (!h) return `${r} min`
  if (!r) return `${h} hour${h === 1 ? '' : 's'}`
  return `${h} h ${r} min`
}

/** Today in the device's own calendar. toISOString() would shift to UTC. */
export function isoDay(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
