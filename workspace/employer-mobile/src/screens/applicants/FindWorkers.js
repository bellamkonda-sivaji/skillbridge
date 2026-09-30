import React, { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  AppBar, Body, Button, EmptyState, ErrorNote, H2, Input, Loader, Row, Small,
} from '../../ui'
import ApplicantCard from './ApplicantCard'
import * as miscApi from '../../api/misc'
import * as applicantsApi from '../../api/applicants'
import * as jobsApi from '../../api/jobs'
import { errorText } from '../../api/client'
import { colors, space } from '../../theme'

/**
 * Browsing workers instead of waiting for applications.
 *
 * For a one-day job the difference matters: an employer who needs someone
 * tomorrow cannot wait for a job post to attract applicants, so this is the
 * screen that lets them ring people directly.
 */
export default function FindWorkers({ navigation }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [rows, setRows] = useState(null)
  const [jobs, setJobs] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await miscApi.searchWorkers({
        q: query.trim() || undefined,
        city: city.trim() || undefined,
      })
      setRows(Array.isArray(d) ? d : d?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not search workers.'))
      setRows([])
    }
  }, [query, city])

  useEffect(() => { load() }, [])
  useEffect(() => {
    jobsApi.listJobs('OPEN')
      .then((d) => setJobs(Array.isArray(d) ? d : d?.content || []))
      .catch(() => setJobs([]))
  }, [])

  const invite = (worker) => {
    const open = jobs.filter((j) => ['OPEN', 'ACTIVE'].includes(j.status))
    if (!open.length) {
      Alert.alert('', 'Post a job first, then you can invite people to it.')
      return
    }
    Alert.alert(
      t('findWorkers.pickJob'),
      '',
      [
        ...open.slice(0, 3).map((j) => ({
          text: j.title,
          onPress: async () => {
            try {
              await applicantsApi.invite(j.id, worker.userId || worker.id)
              Alert.alert('', t('findWorkers.invited'))
            } catch (err) { Alert.alert('', errorText(err)) }
          },
        })),
        { text: t('common.cancel'), style: 'cancel' },
      ],
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <AppBar title={t('findWorkers.title')}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined} />
      <View style={s.head}>
        <Row>
          <Input value={query} onChangeText={setQuery} onSubmitEditing={load}
            placeholder={t('findWorkers.searchHint')} returnKeyType="search" style={{ flex: 2 }} />
          <Input value={city} onChangeText={setCity} onSubmitEditing={load}
            placeholder={t('findWorkers.city')} style={{ flex: 1 }} />
        </Row>
        <Button title={t('common.search')} icon="search" size="sm"
          style={{ marginTop: space.md }} onPress={load} />
      </View>

      {!rows ? <Loader /> : (
        <FlatList
          data={rows}
          keyExtractor={(w, i) => String(w.userId ?? w.id ?? `w-${i}`)}
          contentContainerStyle={{ padding: space.lg }}
          ListHeaderComponent={(
            <>
              <ErrorNote onRetry={load}>{error}</ErrorNote>
              <Small style={{ marginBottom: space.md }}>
                {rows.length} {rows.length === 1 ? 'worker' : 'workers'}
              </Small>
            </>
          )}
          renderItem={({ item }) => (
            <View>
              <ApplicantCard
                item={{ ...item, workerName: item.name }}
                t={t}
                onCall
                onPress={() => navigation.navigate('ApplicantProfile', {
                  workerId: item.userId || item.id,
                })}
              />
              <Button title={t('findWorkers.inviteToApply')} tone="outline" size="sm"
                style={{ marginTop: -space.sm, marginBottom: space.md }}
                onPress={() => invite(item)} />
            </View>
          )}
          ListEmptyComponent={!error ? (
            <EmptyState icon="people-outline" title={t('findWorkers.none')}
              sub={t('findWorkers.noneSub')} />
          ) : null}
        />
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  head: {
    paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
})
