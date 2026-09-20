/**
 * Job filters live in the URL, so a filtered list can be shared, bookmarked
 * and survives the back button without a separate store.
 */

export const QUICK = [
  { value: 'NEARBY', label: 'Nearby' },
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'DAILY_WORK', label: 'Daily Work' },
]

export const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'RETAIL', label: 'Supermarket / Retail' },
  { value: 'RESTAURANT', label: 'Restaurant / Cafe' },
  { value: 'MEDICAL', label: 'Medical Store' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'WAREHOUSE', label: 'Warehouse / Helper' },
  { value: 'CLEANING', label: 'Cleaner / Housekeeping' },
  { value: 'KITCHEN', label: 'Cook / Kitchen Staff' },
  { value: 'SALES', label: 'Salesperson' },
  { value: 'DRIVER', label: 'Driver' },
  { value: 'SALON', label: 'Salon / Beauty' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'OTHER', label: 'Other' },
]

export const EMPLOYMENT = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'DAILY', label: 'Daily Work' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'PERMANENT', label: 'Permanent' },
]

export const SALARY_STEPS = [
  { value: '', label: 'Any' },
  { value: '300', label: '₹300' },
  { value: '500', label: '₹500' },
  { value: '700', label: '₹700' },
  { value: '1000', label: '₹1,000' },
  { value: '15000', label: '₹15,000' },
  { value: '25000', label: '₹25,000' },
]

export const DISTANCE_STEPS = [1, 3, 5, 10, 20]

export const EXPERIENCE = [
  { value: '', label: 'Any Experience' },
  { value: '0', label: 'Fresher' },
  { value: '1', label: '1+ years' },
  { value: '3', label: '3+ years' },
  { value: '5', label: '5+ years' },
]

export const LANGUAGES = [
  { value: '', label: 'Any Language' },
  { value: 'Telugu', label: 'Telugu' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'English', label: 'English' },
  { value: 'Tamil', label: 'Tamil' },
  { value: 'Kannada', label: 'Kannada' },
]

export const EMPTY_FILTERS = {
  q: '',
  quick: '',
  category: '',
  types: [],
  minSalary: '',
  maxSalary: '',
  distance: '',
  experience: '',
  language: '',
}

/** URLSearchParams -> filter object */
export function fromParams(params) {
  const types = params.get('types')
  return {
    q: params.get('q') || '',
    quick: params.get('quick') || '',
    category: params.get('category') || '',
    types: types ? types.split(',').filter(Boolean) : [],
    minSalary: params.get('minSalary') || '',
    maxSalary: params.get('maxSalary') || '',
    distance: params.get('distance') || '',
    experience: params.get('experience') || '',
    language: params.get('language') || '',
  }
}

/** filter object -> query string, omitting anything empty */
export function toQuery(f) {
  const p = new URLSearchParams()
  if (f.q) p.set('q', f.q)
  if (f.quick) p.set('quick', f.quick)
  if (f.category) p.set('category', f.category)
  if (f.types?.length) p.set('types', f.types.join(','))
  if (f.minSalary) p.set('minSalary', f.minSalary)
  if (f.maxSalary) p.set('maxSalary', f.maxSalary)
  if (f.distance) p.set('distance', f.distance)
  if (f.experience) p.set('experience', f.experience)
  if (f.language) p.set('language', f.language)
  const s = p.toString()
  return s ? `?${s}` : ''
}

/** filter object -> POST /api/worker/jobs/search body */
export function toSearchBody(f) {
  return {
    q: f.q || null,
    quickFilter: f.quick || null,
    category: f.category || null,
    employmentTypes: f.types?.length ? f.types : null,
    minSalary: f.minSalary ? Number(f.minSalary) : null,
    maxSalary: f.maxSalary ? Number(f.maxSalary) : null,
    maxDistanceKm: f.distance ? Number(f.distance) : null,
    minExperience: f.experience === '' ? null : Number(f.experience),
    language: f.language || null,
  }
}

export function countActive(f) {
  let n = 0
  if (f.category) n++
  if (f.types?.length) n++
  if (f.minSalary || f.maxSalary) n++
  if (f.distance) n++
  if (f.experience !== '') n++
  if (f.language) n++
  return n
}
