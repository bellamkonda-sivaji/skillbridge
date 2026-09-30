import React, { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Button, EmptyState, ErrorNote, H2, Input, Loader, SegTabs, Small } from '../../ui'
import JobCard from '../../ui/JobCard'
import * as jobsApi from '../../api/jobs'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

const TABS = [
  { value: 'NEARBY', key: 'nearby' },
  { value: 'FULL_TIME', key: 'fullTime' },
  { value: 'PART_TIME', key: 'partTime' },
  { value: 'DAILY', key: 'daily' },
]

/**
 * The job list.
 *
 * Search is there, but the quick tabs above it do the same work without any
 * typing - which is how most people here will actually filter.
 */
export default function FindJobs({ navigation, route }) {
  const { t } = useTranslation()
  const [tab, setTab] = useState('NEARBY')
  const [query, setQuery] = useState('')
  const [jobs, setJobs] = useState(null)
  const [savedIds, setSavedIds] = useState([])
  const [error, setError] = useState('')
  const filters = route?.params?.filters || null

  const load = useCallback(async () => {
    setError('')
    try {
      const body = { ...(filters || {}) }
      if (query.trim()) body.q = query.trim()
      if (tab === 'FULL_TIME' || tab === 'PART_TIME' || tab === 'DAILY') body.employmentType = tab
      const [list, saved] = await Promise.all([
        jobsApi.searchJobs(body),
        jobsApi.savedJobs().catch(() => []),
      ])
      const rows = Array.isArray(list) ? list : (list?.content || [])
      setJobs(rows)
      setSavedIds((Array.isArray(saved) ? saved : []).map((j) => j.id))
    } catch (err) {
      setError(errorText(err, 'We could not load work just now.'))
      setJobs([])
    }
  }, [tab, query, filters])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const toggleSave = async (job) => {
    const on = savedIds.includes(job.id)
    setSavedIds((ids) => (on ? ids.filter((i) => i !== job.id) : [...ids, job.id]))
    try {
      await (on ? jobsApi.unsaveJob(job.id) : jobsApi.saveJob(job.id))
    } catch {
      setSavedIds((ids) => (on ? [...ids, job.id] : ids.filter((i) => i !== job.id)))
    }
  }

  return (
    <SafeAreaView style={s.fill} edges={['top', 'left', 'right']}>
      <View style={s.head}>
        <View style={s.headRow}>
          <H2>{t('jobs.title')}</H2>
          <View style={s.headActions}>
            <Pressable onPress={() => navigation.navigate('NearbyJobs')} hitSlop={10} style={s.iconBtn}>
              <Ionicons name="map-outline" size={20} color={colors.blue} />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('SavedJobs')} hitSlop={10} style={s.iconBtn}>
              <Ionicons name="heart-outline" size={20} color={colors.blue} />
            </Pressable>
          </View>
        </View>

        <View style={s.searchRow}>
          <Input
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={load}
            placeholder={t('dashboard.searchHint')}
            returnKeyType="search"
            style={{ flex: 1 }}
          />
          <Pressable onPress={() => navigation.navigate('Filters', { current: filters })} style={s.filterBtn}>
            <Ionicons name="options-outline" size={21} color={colors.white} />
          </Pressable>
        </View>

        <SegTabs
          tabs={TABS.map((x) => ({ value: x.value, label: t(`jobs.${x.key}`) }))}
          value={tab}
          onChange={setTab}
        />
        {jobs ? <Small style={{ marginTop: space.sm }}>{jobs.length} {t('jobs.found')}</Small> : null}
      </View>

      {!jobs && !error ? <Loader /> : (
        <FlatList
          data={jobs}
          keyExtractor={(j) => String(j.id)}
          contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxxl }}
          ListHeaderComponent={<ErrorNote onRetry={load}>{error}</ErrorNote>}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              saved={savedIds.includes(item.id)}
              onToggleSave={() => toggleSave(item)}
              onPress={() => navigation.navigate('JobDetails', { jobId: item.id })}
            />
          )}
          ListEmptyComponent={!error ? (
            <EmptyState
              icon="briefcase-outline"
              title={t('jobs.noJobs')}
              sub={t('jobs.noJobsSub')}
              action={<Button title={t('jobs.reset')} tone="outline"
                onPress={() => { setQuery(''); setTab('NEARBY'); navigation.setParams({ filters: null }) }} />}
            />
          ) : null}
        />
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  head: {
    paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.md,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headActions: { flexDirection: 'row', gap: space.sm },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.blueSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  searchRow: { flexDirection: 'row', gap: space.sm, marginTop: space.md, marginBottom: space.md },
  filterBtn: {
    width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.blue,
    alignItems: 'center', justifyContent: 'center',
  },
})
