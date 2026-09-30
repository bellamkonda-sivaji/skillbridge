import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { AppBar, Loader, Small, distance, pay, workerPay } from '../../ui'
import * as jobsApi from '../../api/jobs'
import { colors, radius, space } from '../../theme'

/**
 * The web build of the nearby screen.
 *
 * react-native-maps has no web renderer, and a blank grey box would be worse
 * than no map at all. On web the same jobs are listed by distance instead,
 * nearest first - which is the information the map was conveying anyway. The
 * native build keeps the real map.
 */
export default function NearbyJobsWeb({ navigation }) {
  const { t } = useTranslation()
  const [jobs, setJobs] = useState(null)

  useEffect(() => {
    jobsApi.searchJobs({})
      .then((d) => {
        const rows = Array.isArray(d) ? d : d?.content || []
        rows.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
        setJobs(rows)
      })
      .catch(() => setJobs([]))
  }, [])

  return (
    <SafeAreaView style={s.fill} edges={['top', 'left', 'right']}>
      <AppBar title={t('jobs.nearYou')} onBack={navigation.goBack} />
      {!jobs ? <Loader /> : (
        <View style={{ padding: space.lg }}>
          <View style={s.note}>
            <Ionicons name="information-circle-outline" size={18} color={colors.blueDark} />
            <Small style={{ flex: 1, color: colors.blueDark }}>
              The map runs on the phone app. Here the same work is listed nearest first.
            </Small>
          </View>
          {jobs.map((j) => (
            <Pressable
              key={j.id}
              style={s.row}
              onPress={() => navigation.navigate('JobDetails', { jobId: j.id })}
            >
              <View style={s.pin}><Ionicons name="location" size={17} color={colors.white} /></View>
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
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
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
  pin: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.blue,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink },
  pay: { fontSize: 14.5, fontWeight: '800', color: colors.greenText, marginTop: 3 },
})
