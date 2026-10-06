import React, { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { AppBar, Loader, Small, distance, pay, payShort, workerPay } from '../../ui'
import Photo from '../../ui/Photo'
import { workArt } from '../../ui/workArt'
import SimpleMap from '../../ui/map/SimpleMap'
import { haversineKm } from '../../ui/map/tiles'
import NearbyList from './NearbyList'
import * as jobsApi from '../../api/jobs'
import { colors, radius, space } from '../../theme'

const TIRUPATI = { lat: 13.6288, lng: 79.4192 }

/**
 * Jobs on a map.
 *
 * Distance decides whether a local job is worth taking, and a map says it
 * faster than a list of kilometres - particularly for someone who reads
 * slowly but knows their own town perfectly.
 *
 * The map is drawn from OpenStreetMap tiles rather than a mapping SDK, so it
 * needs no API key and cannot fail the way the Google Maps view did, where a
 * missing key took the whole screen down with it. Either way the list stays
 * one tap away, because the list is the thing that always works.
 */
export default function NearbyJobs({ navigation }) {
  const { t } = useTranslation()
  const [jobs, setJobs] = useState(null)
  const [picked, setPicked] = useState(null)
  const [mode, setMode] = useState('map')
  const [box, setBox] = useState({ w: 0, h: 0 })

  useEffect(() => {
    jobsApi.searchJobs({})
      .then((d) => {
        const rows = (Array.isArray(d) ? d : d?.content || [])
        const located = rows.filter((j) => j.latitude && j.longitude)
        located.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
        setJobs(located)
      })
      .catch(() => setJobs([]))
  }, [])

  const open = (j) => navigation.navigate('JobDetails', { jobId: j.id })

  /**
   * Centre on the work, not on the town.
   *
   * The nearest job is a better guess than a fixed point: if everything on
   * offer is out by the bypass, opening over the temple shows an empty map.
   */
  const centre = useMemo(() => {
    const first = jobs?.[0]
    if (first) return { lat: first.latitude, lng: first.longitude }
    return TIRUPATI
  }, [jobs])

  const spread = useMemo(() => {
    if (!jobs?.length) return 13
    let far = 0
    jobs.forEach((j) => {
      far = Math.max(far, haversineKm(centre, { lat: j.latitude, lng: j.longitude }))
    })
    // Pick the closest zoom that still holds the furthest job.
    if (far < 1) return 15
    if (far < 3) return 14
    if (far < 8) return 13
    if (far < 20) return 12
    return 11
  }, [jobs, centre])

  return (
    <SafeAreaView style={s.fill} edges={['top', 'left', 'right']}>
      <AppBar title={t('jobs.nearYou')} onBack={navigation.goBack} />

      {/* One switch, both halves labelled. No hidden state. */}
      <View style={s.toggle}>
        {['map', 'list'].map((m) => (
          <Pressable
            key={m}
            style={[s.tog, mode === m && s.togOn]}
            onPress={() => setMode(m)}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === m }}
          >
            <Ionicons
              name={m === 'map' ? 'map' : 'list'}
              size={18}
              color={mode === m ? colors.white : colors.body}
            />
            <Text style={[s.togText, mode === m && s.togTextOn]}>{t(`jobs.${m}`)}</Text>
          </Pressable>
        ))}
      </View>

      {!jobs ? <Loader /> : mode === 'list' || !jobs.length ? (
        <ScrollView>
          <NearbyList jobs={jobs} onOpen={open} />
        </ScrollView>
      ) : (
        <View
          style={s.fill}
          onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        >
          {box.w ? (
            <SimpleMap
              width={box.w}
              height={box.h}
              points={jobs}
              center={centre}
              zoom={spread}
              selectedId={picked?.id}
              onSelect={setPicked}
              label={(j) => payShort(workerPay(j))}
              style={s.map}
            />
          ) : null}

          {picked ? (
            <View style={s.sheet}>
              <View style={s.sheetTop}>
                <Photo uri={picked.photoUrl || picked.employerLogoUrl} art={workArt(picked)}
                  size={54} radius={12} />
                <View style={{ flex: 1 }}>
                  <Text style={s.sheetTitle} numberOfLines={1}>{picked.title}</Text>
                  <Small numberOfLines={1}>{picked.businessName}</Small>
                  <View style={s.sheetMeta}>
                    <Text style={s.sheetPay}>{pay(workerPay(picked), picked.salaryUnit)}</Text>
                    {distance(picked.distanceKm) ? (
                      <Text style={s.sheetDist}>· {distance(picked.distanceKm)}</Text>
                    ) : null}
                  </View>
                </View>
                <Pressable onPress={() => setPicked(null)} hitSlop={14} style={s.close}
                  accessibilityLabel={t('common.close')}>
                  <Ionicons name="close" size={22} color={colors.muted} />
                </Pressable>
              </View>
              <Pressable style={s.cta} onPress={() => open(picked)}>
                <Text style={s.ctaText}>{t('jobs.viewJob')}</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.white} />
              </Pressable>
            </View>
          ) : (
            <View style={s.hint} pointerEvents="none">
              <Text style={s.hintText}>{t('jobs.tapPin')}</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  map: { borderRadius: 0 },

  toggle: {
    flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg,
    paddingBottom: space.md, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  tog: {
    flex: 1, height: 48, borderRadius: radius.md, backgroundColor: colors.soft,
    borderWidth: 1, borderColor: colors.line,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
  },
  togOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  togText: { fontSize: 15, fontWeight: '700', color: colors.body },
  togTextOn: { color: colors.white },

  sheet: {
    position: 'absolute', left: space.md, right: space.md, bottom: space.md,
    backgroundColor: colors.white, borderRadius: radius.lg, padding: space.lg,
    gap: space.md,
    shadowColor: '#0F172A', shadowOpacity: 0.2, shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  sheetTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  sheetMeta: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 3 },
  sheetPay: { fontSize: 17, fontWeight: '800', color: colors.greenText },
  sheetDist: { fontSize: 13, fontWeight: '700', color: colors.muted },
  close: { alignSelf: 'flex-start' },
  cta: {
    height: 52, borderRadius: radius.md, backgroundColor: colors.blue,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  ctaText: { fontSize: 16.5, fontWeight: '800', color: colors.white },

  hint: {
    position: 'absolute', left: space.xl, right: space.xl, bottom: space.xl,
    backgroundColor: 'rgba(15,23,42,0.86)', borderRadius: radius.pill,
    paddingVertical: space.md, paddingHorizontal: space.lg,
  },
  hintText: { fontSize: 14.5, fontWeight: '700', color: colors.white, textAlign: 'center' },
})
