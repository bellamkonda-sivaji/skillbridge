import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import MapView, { Marker } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { AppBar, Loader, Small, pay, workerPay } from '../../ui'
import Photo from '../../ui/Photo'
import * as jobsApi from '../../api/jobs'
import { colors, radius, space } from '../../theme'

const TIRUPATI = { latitude: 13.6288, longitude: 79.4192, latitudeDelta: 0.09, longitudeDelta: 0.09 }

/**
 * Jobs on a map.
 *
 * Distance is the single thing that decides whether a local job is worth
 * taking, and a map says it faster than a list of kilometres - particularly
 * for someone who reads slowly but knows their own town perfectly.
 */
export default function NearbyJobs({ navigation }) {
  const { t } = useTranslation()
  const [jobs, setJobs] = useState(null)
  const [picked, setPicked] = useState(null)

  useEffect(() => {
    jobsApi.searchJobs({})
      .then((d) => {
        const rows = (Array.isArray(d) ? d : d?.content || []).filter((j) => j.latitude && j.longitude)
        setJobs(rows)
      })
      .catch(() => setJobs([]))
  }, [])

  return (
    <SafeAreaView style={s.fill} edges={['top', 'left', 'right']}>
      <AppBar
        title={t('jobs.nearYou')}
        onBack={navigation.goBack}
        right={(
          <Pressable style={s.listBtn} onPress={() => navigation.navigate('FindJobs')}>
            <Ionicons name="list" size={16} color={colors.blue} />
            <Text style={s.listBtnText}>{t('jobs.list')}</Text>
          </Pressable>
        )}
      />
      {!jobs ? <Loader /> : (
        <View style={s.fill}>
          <MapView style={s.fill} initialRegion={TIRUPATI}>
            {jobs.map((j) => (
              <Marker
                key={j.id}
                coordinate={{ latitude: j.latitude, longitude: j.longitude }}
                onPress={() => setPicked(j)}
                pinColor={colors.blue}
              />
            ))}
          </MapView>

          {picked ? (
            <Pressable
              style={s.callout}
              onPress={() => navigation.navigate('JobDetails', { jobId: picked.id })}
            >
              <Photo uri={picked.photoUrl || picked.employerLogoUrl} size={48}
                radius={10} icon="briefcase-outline" />
              <View style={{ flex: 1 }}>
                <Text style={s.calloutTitle} numberOfLines={1}>{picked.title}</Text>
                <Small numberOfLines={1}>{picked.businessName}</Small>
                <Text style={s.calloutPay}>{pay(workerPay(picked), picked.salaryUnit)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          ) : (
            <View style={s.hint}>
              <Small style={{ textAlign: 'center' }}>Tap a pin to see the work</Small>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  listBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.blueSoft,
    paddingHorizontal: space.md, height: 36, borderRadius: radius.pill,
  },
  listBtnText: { fontSize: 13, fontWeight: '700', color: colors.blue },
  callout: {
    position: 'absolute', left: space.lg, right: space.lg, bottom: space.xl,
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    backgroundColor: colors.white, borderRadius: radius.lg, padding: space.lg,
    shadowColor: '#0F172A', shadowOpacity: 0.18, shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  calloutTitle: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
  calloutPay: { fontSize: 16, fontWeight: '800', color: colors.greenText, marginTop: 4 },
  hint: {
    position: 'absolute', left: space.lg, right: space.lg, bottom: space.xl,
    backgroundColor: colors.white, borderRadius: radius.pill, paddingVertical: space.md,
  },
})
