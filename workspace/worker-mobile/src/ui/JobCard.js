import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, space } from '../theme'
import { Badge } from './index'
import Photo from './Photo'
import { distance, pay, timeAgo, workerPay } from './format'

/**
 * One job, as it appears in every list in this app.
 *
 * The pay is the biggest thing on the card and it is the TAKE-HOME, never the
 * employer's gross - a worker who reads one number and is paid a smaller one
 * stops trusting the app, and that trust is the whole product.
 */
export default function JobCard({ job, onPress, onToggleSave, saved, style }) {
  const km = distance(job.distanceKm)
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.8 }, style]}>
      <View style={s.thumbWrap}>
        <Photo
          uri={job.photoUrl || job.employerLogoUrl || job.employerPhotoUrl}
          size={68}
          radius={radius.md}
          icon="briefcase-outline"
        />
      </View>

      <View style={s.body}>
        <View style={s.topRow}>
          <Text style={s.title} numberOfLines={2}>{job.title}</Text>
          {onToggleSave ? (
            <Pressable onPress={onToggleSave} hitSlop={12} accessibilityLabel={saved ? 'Remove from saved' : 'Save this job'}>
              <Ionicons
                name={saved ? 'heart' : 'heart-outline'}
                size={22}
                color={saved ? colors.red : colors.muted}
              />
            </Pressable>
          ) : null}
        </View>

        <Text style={s.business} numberOfLines={1}>{job.businessName}</Text>

        <View style={s.metaRow}>
          {km ? (
            <View style={s.meta}>
              <Ionicons name="location-outline" size={13} color={colors.muted} />
              <Text style={s.metaText}>{km}</Text>
            </View>
          ) : null}
          {job.city ? <Text style={s.metaText}>{job.area || job.city}</Text> : null}
        </View>

        <View style={s.tagRow}>
          <Text style={s.pay}>{pay(workerPay(job), job.salaryUnit)}</Text>
          {job.urgent ? <Badge label="Urgent" tone="red" /> : null}
          {job.applied ? <Badge label="Applied" tone="green" /> : null}
        </View>

        {job.postedAt ? <Text style={s.posted}>{timeAgo(job.postedAt)}</Text> : null}
      </View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', gap: space.md, backgroundColor: colors.white,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line,
    padding: space.md, marginBottom: space.md,
  },
  thumbWrap: { width: 68 },
  body: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  title: { flex: 1, fontSize: 15.5, fontWeight: '700', color: colors.ink, lineHeight: 21 },
  business: { fontSize: 13.5, color: colors.body, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: 5, flexWrap: 'wrap' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12.5, color: colors.muted },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 8, flexWrap: 'wrap' },
  pay: { fontSize: 16, fontWeight: '800', color: colors.greenText },
  posted: { fontSize: 11.5, color: colors.muted, marginTop: 6 },
})
