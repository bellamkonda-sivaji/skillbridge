import React from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Avatar, Badge, Row, Small, distance, money } from '../../ui'
import { colors, radius, space } from '../../theme'
import { word } from '../../ui/words'

/** One applicant, as they appear in every list on this side of the product. */
export default function ApplicantCard({ item, onPress, onCall, selected, onToggleSelect, t }) {
  const name = item.workerName || item.name
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}>
      <Row align="flex-start">
        {onToggleSelect ? (
          <Pressable onPress={onToggleSelect} hitSlop={10} style={[s.check, selected && s.checkOn]}>
            {selected ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
          </Pressable>
        ) : null}

        <Avatar uri={item.photoUrl} name={name} size={48} />

        <View style={{ flex: 1 }}>
          <Row gap={6}>
            <Text style={s.name} numberOfLines={1}>{name}</Text>
            {item.verified ? <Ionicons name="checkmark-circle" size={15} color={colors.green} /> : null}
          </Row>
          <Small numberOfLines={1} style={{ marginTop: 2 }}>
            {[item.gender, item.age ? `${item.age} yr` : null,
              item.experienceYears != null ? `${item.experienceYears} yr exp` : null]
              .filter(Boolean).join(' · ')}
          </Small>
          <Row gap={space.md} style={{ marginTop: 6, flexWrap: 'wrap' }}>
            {distance(item.distanceKm) ? (
              <Row gap={3}>
                <Ionicons name="location-outline" size={13} color={colors.muted} />
                <Small>{distance(item.distanceKm)}</Small>
              </Row>
            ) : null}
            {item.expectedSalary ? (
              <Small>{t('applicants.expectedPay')} {money(item.expectedSalary)}</Small>
            ) : null}
          </Row>
          <Row gap={6} style={{ marginTop: 7, flexWrap: 'wrap' }}>
            {item.matchScore != null ? (
              <Badge label={`${Math.round(item.matchScore)}% ${t('applicants.match')}`} tone="blue" />
            ) : null}
            {item.availableNow ? <Badge label={t('applicants.availableNow')} tone="green" /> : null}
            {item.status && item.status !== 'APPLIED' ? (
              <Badge label={word(t, item.status)} tone="violet" />
            ) : null}
          </Row>
        </View>

        {/* No dial button on a list row. Asking the office to arrange a call
            is a deliberate act about one person, not something to tap by
            accident while scrolling - and the number is not sent here anyway. */}
        <Ionicons name="chevron-forward" size={19} color={colors.muted} />
      </Row>
    </Pressable>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.line, padding: space.md, marginBottom: space.md,
  },
  name: { fontSize: 15.5, fontWeight: '700', color: colors.ink, flexShrink: 1 },
  check: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.muted,
    alignItems: 'center', justifyContent: 'center', marginTop: 13,
  },
  checkOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  call: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
  },
})
