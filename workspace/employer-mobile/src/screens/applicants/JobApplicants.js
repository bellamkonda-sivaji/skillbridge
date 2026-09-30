import React, { useCallback, useState } from 'react'
import { FlatList, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppBar, Button, EmptyState, ErrorNote, Loader, Row, SegTabs, Small } from '../../ui'
import ApplicantCard from './ApplicantCard'
import * as applicantsApi from '../../api/applicants'
import { errorText } from '../../api/client'
import { colors, space } from '../../theme'

/** Applicants for one job, with the multi-select that feeds Compare. */
export default function JobApplicants({ navigation, route }) {
  const { t } = useTranslation()
  const { jobId, jobTitle } = route?.params || {}
  const [rows, setRows] = useState(null)
  const [tab, setTab] = useState('ALL')
  const [picked, setPicked] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await applicantsApi.applicants(jobId, tab === 'ALL' ? 'ALL' : tab, 'MATCH')
      setRows(Array.isArray(d) ? d : d?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load applicants.'))
      setRows([])
    }
  }, [jobId, tab])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const toggle = (id) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <AppBar title={t('applicants.title')} subtitle={jobTitle} onBack={navigation.goBack} />
      <View style={{
        paddingHorizontal: space.lg, paddingVertical: space.md,
        backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.line,
      }}>
        <SegTabs
          tabs={[
            { value: 'ALL', label: t('common.all') },
            { value: 'APPLIED', label: t('applicants.newOnes') },
            { value: 'SHORTLISTED', label: t('applicants.shortlisted') },
            { value: 'REJECTED', label: t('applicants.rejected') },
          ]}
          value={tab}
          onChange={(v) => { setTab(v); setRows(null) }}
        />
      </View>

      {!rows ? <Loader /> : (
        <FlatList
          data={rows}
          keyExtractor={(r) => String(r.applicationId || r.id)}
          contentContainerStyle={{ padding: space.lg, paddingBottom: picked.length ? 100 : space.lg }}
          ListHeaderComponent={<ErrorNote onRetry={load}>{error}</ErrorNote>}
          renderItem={({ item }) => (
            <ApplicantCard
              item={item}
              t={t}
              selected={picked.includes(item.workerId)}
              onToggleSelect={() => toggle(item.workerId)}
              onPress={() => navigation.navigate('ApplicantProfile', {
                workerId: item.workerId,
                applicationId: item.applicationId || item.id,
                jobId,
              })}
            />
          )}
          ListEmptyComponent={!error ? (
            <EmptyState icon="people-outline" title={t('applicants.none')} sub={t('applicants.noneSub')} />
          ) : null}
        />
      )}

      {picked.length >= 2 ? (
        <View style={{
          position: 'absolute', left: space.lg, right: space.lg, bottom: space.lg,
        }}>
          <Button
            title={`${t('applicants.compare')} (${picked.length})`}
            icon="git-compare-outline"
            onPress={() => navigation.navigate('Compare', { workerIds: picked, jobId })}
          />
        </View>
      ) : null}
    </SafeAreaView>
  )
}
