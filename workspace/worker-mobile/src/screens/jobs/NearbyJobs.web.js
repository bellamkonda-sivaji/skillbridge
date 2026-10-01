import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { AppBar, Loader } from '../../ui'
import NearbyList from './NearbyList'
import * as jobsApi from '../../api/jobs'
import { colors, radius, space } from '../../theme'

/**
 * The web build of the nearby screen.
 *
 * react-native-maps has no web renderer, so importing it here would break the
 * bundle. The same jobs are listed nearest first instead - which is the
 * information the map was conveying anyway.
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
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
        <ScrollView>
          <NearbyList
            jobs={jobs}
            onOpen={(j) => navigation.navigate('JobDetails', { jobId: j.id })}
            reason={t('jobs.mapOnPhone')}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  listBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.blueSoft,
    paddingHorizontal: space.md, height: 36, borderRadius: radius.pill,
  },
  listBtnText: { fontSize: 13, fontWeight: '700', color: colors.blue },
})
