import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Small, distance, pay, workerPay } from '../../ui'
import Photo from '../../ui/Photo'
import { workArt } from '../../ui/workArt'
import { colors, radius, space } from '../../theme'

/**
 * The jobs, nearest first, with a line saying why the map is not here.
 *
 * Used on web, where react-native-maps has no renderer, and on a build with
 * no Google Maps key. Both are cases where a MapView would be a crash or a
 * grey rectangle, and the distance order carries the same information the map
 * was there to show.
 */
export default function NearbyList({ jobs, reason, onOpen }) {
  return (
    <View style={{ padding: space.lg }}>
      <View style={s.note}>
        <Ionicons name="information-circle-outline" size={18} color={colors.blueDark} />
        <Small style={{ flex: 1, color: colors.blueDark }}>{reason}</Small>
      </View>
      {jobs.map((j) => (
        <Pressable key={j.id} style={s.row} onPress={() => onOpen(j)}>
          <Photo uri={j.photoUrl || j.employerLogoUrl} art={workArt(j)} size={46} radius={11} />
          <View style={{ flex: 1 }}>
            <Text style={s.title} numberOfLines={1}>{j.title}</Text>
            <Small numberOfLines={1}>{j.businessName}</Small>
            <Text style={s.pay}>
              {pay(workerPay(j), j.salaryUnit)}
              {distance(j.distanceKm) ? `  ·  ${distance(j.distanceKm)}` : ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color={colors.muted} />
        </Pressable>
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  note: {
    flexDirection: 'row', gap: space.sm, alignItems: 'center',
    backgroundColor: colors.blueSoft, borderRadius: radius.md, padding: space.md,
    marginBottom: space.lg,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.line, padding: space.md, marginBottom: space.md,
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink },
  pay: { fontSize: 14.5, fontWeight: '800', color: colors.greenText, marginTop: 3 },
})
