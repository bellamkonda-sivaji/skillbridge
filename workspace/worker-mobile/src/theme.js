/**
 * The JobOn look, in one place.
 *
 * Sizes lean large on purpose. The people using this app are shop workers,
 * drivers, cooks and masons reading a cheap phone in daylight, often without
 * glasses - so body text starts at 15pt, never 12, and anything tappable is at
 * least 48pt tall.
 */

export const colors = {
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  blueSoft: '#EFF6FF',
  blueLine: '#DBEAFE',

  orange: '#F59E0B',
  orangeSoft: '#FFFBEB',
  orangeText: '#B45309',

  green: '#059669',
  greenSoft: '#ECFDF5',
  greenText: '#047857',
  greenLine: '#A7F3D0',

  red: '#DC2626',
  redSoft: '#FEF2F2',
  redText: '#B91C1C',
  redLine: '#FECACA',

  violet: '#7C3AED',
  violetSoft: '#F5F3FF',

  ink: '#0F172A',
  body: '#475569',
  muted: '#94A3B8',

  line: '#E2E8F0',
  soft: '#F8FAFC',
  bg: '#F1F5F9',
  white: '#FFFFFF',
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 }

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 }

export const type = {
  h1: { fontSize: 26, fontWeight: '800', color: colors.ink },
  h2: { fontSize: 20, fontWeight: '800', color: colors.ink },
  h3: { fontSize: 17, fontWeight: '700', color: colors.ink },
  body: { fontSize: 15, color: colors.body, lineHeight: 22 },
  bodyStrong: { fontSize: 15, fontWeight: '700', color: colors.ink },
  small: { fontSize: 13, color: colors.muted },
  label: { fontSize: 13, fontWeight: '700', color: colors.body },
}

export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
}

/** The smallest a control may be and still be hit reliably with a thumb. */
export const HIT = 48
