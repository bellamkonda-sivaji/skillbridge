import React, { useEffect, useRef } from 'react'
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { Button } from './index'
import Listen from './Listen'
import { colors, radius, space } from '../theme'

/**
 * The appreciation stamp.
 *
 * Deliberately a government register stamp: the double ring, the arched text
 * around the top, the date line underneath, the slight tilt, the ink-blue
 * colour. That object means something specific to the people using this app -
 * it is what gets pressed on a paper when a thing is officially done and nobody
 * can take it back. A gold star would not carry the same weight.
 *
 * It lands with a press: scales down fast onto the page rather than fading in,
 * because a stamp is a physical thing being brought down by a hand.
 */

/**
 * Which stamp a running total has earned.
 *
 * Thresholds are descending, so the biggest one a total has passed wins. Null
 * means no stamp today - most days are ordinary, and a stamp that appears every
 * single evening stops meaning anything by the end of the week.
 */
const MILESTONES = [
  { days: 365, key: 'year' },
  { days: 180, key: 'halfYear' },
  { days: 90, key: 'quarter' },
  { days: 30, key: 'month' },
  { days: 14, key: 'fortnight' },
  { days: 7, key: 'week' },
  { days: 1, key: 'firstDay' },
]

export function milestoneFor(daysWorked) {
  const n = Number(daysWorked)
  if (!Number.isFinite(n) || n <= 0) return null
  // Only on the day the total lands exactly on a threshold.
  const hit = MILESTONES.find((m) => m.days === n)
  return hit ? hit.key : null
}

/** Today, as a stamp would print it: 06 OCT 2026. */
function stampDate(d = new Date()) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export default function Stamp({ milestone, daysWorked, onClose }) {
  const { t } = useTranslation()
  const press = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!milestone) return
    press.setValue(0)
    Animated.sequence([
      Animated.timing(press, {
        toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      // The tiny rebound is the ink settling, not a bounce.
      Animated.spring(press, { toValue: 0.94, friction: 5, useNativeDriver: true }),
    ]).start()
  }, [milestone, press])

  if (!milestone) return null

  // Starts big and above the page, then comes down onto it.
  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [2.1, 1] })
  const opacity = press.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 1, 1] })

  const title = t(`stamp.${milestone}Title`)
  const body = t(`stamp.${milestone}Body`, { days: daysWorked })

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.scrim}>
        <View style={s.sheet}>
          <Animated.View style={[s.stampWrap, { opacity, transform: [{ scale }, { rotate: '-8deg' }] }]}>
            <View style={s.ringOuter}>
              <View style={s.ringInner}>
                {/* Arched text is not worth a font hack here: the curve costs
                    legibility at this size, and the ring already says "stamp". */}
                <Text style={s.brandTop}>JOBON</Text>
                <View style={s.markRow}>
                  <Ionicons name="checkmark-sharp" size={30} color={colors.blue} />
                </View>
                <Text style={s.days}>{t('stamp.daysDone', { days: daysWorked })}</Text>
                <View style={s.rule} />
                <Text style={s.date}>{stampDate()}</Text>
              </View>
            </View>
          </Animated.View>

          <Text style={s.title}>{title}</Text>
          <Text style={s.body}>{body}</Text>

          <Listen style={{ alignSelf: 'center', marginTop: space.md }} text={`${title}. ${body}`} />

          <Button title={t('common.done')} onPress={onClose} style={{ marginTop: space.lg }} />
        </View>
        <Pressable style={s.behind} onPress={onClose} />
      </View>
    </Modal>
  )
}

const INK = '#1D4ED8'

const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', padding: space.lg },
  behind: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
  sheet: {
    backgroundColor: colors.white, borderRadius: 24,
    paddingHorizontal: space.lg, paddingTop: space.xxl, paddingBottom: space.lg,
  },
  stampWrap: { alignSelf: 'center', marginBottom: space.lg },
  ringOuter: {
    width: 184, height: 184, borderRadius: 92,
    borderWidth: 4, borderColor: INK,
    alignItems: 'center', justifyContent: 'center',
    // Slightly see-through, the way real stamp ink sits on paper.
    opacity: 0.92,
  },
  ringInner: {
    width: 158, height: 158, borderRadius: 79,
    borderWidth: 2, borderColor: INK,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10,
  },
  brandTop: { fontSize: 17, fontWeight: '900', letterSpacing: 3, color: INK },
  markRow: { marginTop: 2 },
  days: { fontSize: 15, fontWeight: '800', color: INK, textAlign: 'center' },
  rule: { width: 86, height: 2, backgroundColor: INK, marginVertical: 5 },
  date: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: INK },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  body: { fontSize: 16, color: colors.body, textAlign: 'center', marginTop: 6, lineHeight: 23 },
})
