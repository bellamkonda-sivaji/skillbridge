import React, { useCallback, useState } from 'react'
import { FlatList, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppBar, Button, EmptyState, ErrorNote, Loader } from '../../ui'
import JobCard from '../../ui/JobCard'
import * as jobsApi from '../../api/jobs'
import { errorText } from '../../api/client'
import { colors, space } from '../../theme'

export default function SavedJobs({ navigation }) {
  const { t } = useTranslation()
  const [jobs, setJobs] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await jobsApi.savedJobs()
      setJobs(Array.isArray(d) ? d : d?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load your saved work.'))
      setJobs([])
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const remove = async (job) => {
    setJobs((list) => list.filter((j) => j.id !== job.id))
    try { await jobsApi.unsaveJob(job.id) } catch { load() }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <AppBar title={t('jobs.saved')} onBack={navigation.goBack} />
      {!jobs ? <Loader /> : (
        <FlatList
          data={jobs}
          keyExtractor={(j) => String(j.id)}
          contentContainerStyle={{ padding: space.lg }}
          ListHeaderComponent={<ErrorNote onRetry={load}>{error}</ErrorNote>}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              saved
              onToggleSave={() => remove(item)}
              onPress={() => navigation.navigate('JobDetails', { jobId: item.id })}
            />
          )}
          ListEmptyComponent={(
            <EmptyState
              icon="heart-outline"
              title={t('jobs.noSaved')}
              sub="Tap the heart on any work to keep it here."
              action={<Button title={t('jobs.title')} onPress={() => navigation.navigate('FindJobs')} />}
            />
          )}
        />
      )}
    </SafeAreaView>
  )
}
