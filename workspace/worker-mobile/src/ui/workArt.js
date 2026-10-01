/**
 * A drawing for each kind of work.
 *
 * Most records carry no photograph, and a wall of identical grey icons makes
 * every job look the same - which is exactly what a list of jobs must not do.
 * These are illustrations, not photographs: they give a card weight and make
 * categories distinguishable at a glance without pretending to show a real
 * person or a real shop.
 *
 * A real photo always wins. This is only what fills the gap.
 */
const ART = {
  shop: require('../../assets/work/shop.png'),
  kitchen: require('../../assets/work/kitchen.png'),
  delivery: require('../../assets/work/delivery.png'),
  driver: require('../../assets/work/driver.png'),
  cleaning: require('../../assets/work/cleaning.png'),
  helper: require('../../assets/work/helper.png'),
  security: require('../../assets/work/security.png'),
  building: require('../../assets/work/building.png'),
  office: require('../../assets/work/office.png'),
}

/** The category the backend sends maps straight onto a drawing. */
const BY_CATEGORY = {
  CASHIER: 'shop',
  STORE_HELPER: 'helper',
  KITCHEN_STAFF: 'kitchen',
  SERVICE_STAFF: 'kitchen',
  DELIVERY_PARTNER: 'delivery',
  DRIVER: 'driver',
  CLEANING_STAFF: 'cleaning',
  SECURITY: 'security',
  OTHER: 'building',
}

/**
 * Older jobs carry no category, so the title is the only signal left. Matched
 * longest-first so "store helper" does not win over "store".
 */
const BY_WORD = [
  [/mason|mestri|construct|build|weld|paint|plumb|carpent|electric/i, 'building'],
  [/cook|kitchen|chef|tiffin|tandoor|restaurant|hotel|waiter|server/i, 'kitchen'],
  [/deliver|courier|parcel/i, 'delivery'],
  [/driver|driving|auto|tempo|vehicle/i, 'driver'],
  [/clean|housekeep|sweep|maid/i, 'cleaning'],
  [/security|guard|watchman/i, 'security'],
  [/load|unload|helper|warehouse|packing|godown/i, 'helper'],
  [/cashier|billing|shop|store|supermarket|mart|retail/i, 'shop'],
  [/data|office|clerk|computer|admin/i, 'office'],
]

export function workArt(job) {
  if (!job) return ART.building
  const key = BY_CATEGORY[job.workerCategory]
  if (key) return ART[key]
  const text = `${job.title || ''} ${(job.requiredSkills || []).join(' ')}`
  for (const [re, name] of BY_WORD) if (re.test(text)) return ART[name]
  return ART.building
}

export default ART
