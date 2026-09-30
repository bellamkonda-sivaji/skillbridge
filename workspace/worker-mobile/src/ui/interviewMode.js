import { colors } from '../theme'

/**
 * How a talk or visit is described.
 *
 * The API already sends `modeLabel` ("Phone call", "Come to the shop"), so
 * that is what we show - inventing a second mapping here is how `PHONE_CALL`
 * ends up on screen. The map below is only a fallback for older rows, and it
 * covers every value the enum has, including the legacy aliases.
 */
const FALLBACK = {
  PHONE_CALL: 'Phone call',
  PHONE: 'Phone call',
  VISIT_SHOP: 'Come to the shop',
  IN_PERSON: 'Come to the shop',
  MEET_AT_SITE: 'Meet at the site',
  VIDEO: 'Video call',
}

const ICONS = {
  PHONE_CALL: 'call-outline',
  PHONE: 'call-outline',
  VISIT_SHOP: 'storefront-outline',
  IN_PERSON: 'storefront-outline',
  MEET_AT_SITE: 'location-outline',
  VIDEO: 'videocam-outline',
}

const TONES = {
  PHONE_CALL: [colors.blue, colors.blueSoft],
  PHONE: [colors.blue, colors.blueSoft],
  VISIT_SHOP: [colors.green, colors.greenSoft],
  IN_PERSON: [colors.green, colors.greenSoft],
  MEET_AT_SITE: [colors.orangeText, colors.orangeSoft],
  VIDEO: [colors.violet, colors.violetSoft],
}

/** Prefers what the server called it; never shows a raw enum. */
export const modeLabel = (row) =>
  row?.modeLabel || FALLBACK[row?.mode] || 'Talk'

export const modeIcon = (mode) => ICONS[mode] || 'calendar-outline'
export const modeTone = (mode) => TONES[mode] || [colors.blue, colors.blueSoft]

/** The canonical values to send when arranging one. */
export const MODE_OPTIONS = [
  { value: 'PHONE_CALL', icon: 'call-outline', key: 'phone' },
  { value: 'VISIT_SHOP', icon: 'storefront-outline', key: 'inPerson' },
  { value: 'VIDEO', icon: 'videocam-outline', key: 'video' },
]
