import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { Button, Small } from './index'
import { colors, radius, space } from '../theme'

/**
 * The line above a job list that says where "near" is measured from.
 *
 * One tap switches between the phone's position and home. The note under it
 * only appears when someone chose "current location" and the phone could not
 * give it - and it offers the fix, not a scolding.
 *
 * Takes the whole result of useSearchOrigin().
 */
export default function NearFrom({ near, style }) {
  const { t } = useTranslation()
  if (!near?.origin) return null
  const current = near.origin.mode === 'CURRENT'
  const label = current
    ? t('near.current')
    : (near.origin.homeLabel ? `${t('near.home')} · ${near.origin.homeLabel}` : t('near.home'))

  return (
    <View style={style}>
      <Pressable
        onPress={near.toggle}
        disabled={near.busy}
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${t('near.change')}`}
        style={({ pressed }) => [s.chip, pressed && { opacity: 0.8 }]}
      >
        <Ionicons name={current ? 'locate' : 'home-outline'} size={15} color={colors.blueDark} />
        <Text style={s.chipText} numberOfLines={1}>{label}</Text>
        {near.busy
          ? <ActivityIndicator size="small" color={colors.blue} />
          : <Text style={s.change}>{t('near.change')}</Text>}
      </Pressable>

      {near.note && !near.busy ? (
        <View style={s.note}>
          <Ionicons name="information-circle-outline" size={18} color={colors.orangeText} />
          <View style={{ flex: 1 }}>
            <Small style={{ color: colors.ink }}>{t(`near.note_${near.note}`)}</Small>
            <Button
              title={near.note === 'blocked' ? t('near.openSettings') : t('near.turnOn')}
              icon="locate"
              tone="outline"
              size="sm"
              full={false}
              onPress={() => near.help()}
              style={{ marginTop: space.sm, alignSelf: 'flex-start' }}
            />
          </View>
        </View>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    maxWidth: '100%', backgroundColor: colors.blueSoft, borderRadius: radius.pill,
    paddingHorizontal: space.md, paddingVertical: 7,
  },
  chipText: { fontSize: 13.5, fontWeight: '700', color: colors.blueDark, flexShrink: 1 },
  change: { fontSize: 13, fontWeight: '800', color: colors.blue, textDecorationLine: 'underline' },
  note: {
    flexDirection: 'row', gap: space.sm, alignItems: 'flex-start',
    backgroundColor: colors.orangeSoft, borderRadius: radius.md,
    padding: space.md, marginTop: space.sm,
  },
})
