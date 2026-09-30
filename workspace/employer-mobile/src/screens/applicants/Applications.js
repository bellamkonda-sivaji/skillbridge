import React, { useCallback, useMemo, useState } from 'react'
import { FlatList, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { EmptyState, ErrorNote, H2, Loader, SegTabs } from '../../ui'
import ApplicantCard from './ApplicantCard'
import * as applicantsApi from '../../api/applicants'
import { errorText } from '../../api/client'
import { colors, space } from '../../theme'

/** Everyone who has applied, across every job. */
export default function Applications({ navigation }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState(null)
  const [tab, setTab] = useState('ALL')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await applicantsApi.allApplications()
      setRows(Array.isArray(d) ? d : d?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load applications.'))
      setRows([])
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const filtered = useMemo(() => {
    if (!rows) return []
    if (tab === 'ALL') return rows
    if (tab === 'NEW') return rows.filter((r) => ['APPLIED', 'PENDING', 'VIEWED'].includes(r.status))
    if (tab === 'SHORTLISTED') return rows.filter((r) => r.status === 'SHORTLISTED')
    return rows.filter((r) => ['SELECTED', 'OFFERED', 'HIRED'].includes(r.status))
  }, [rows, tab])

  const count = (list) => (rows ? rows.filter((r) => list.includes(r.status)).length : 0)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <View style={{
        paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.md,
        backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.line,
      }}>
        <H2 style={{ marginBottom: space.md }}>{t('applicants.title')}</H2>
        <SegTabs
          tabs={[
            { value: 'ALL', label: `${t('common.all')} (${rows?.length || 0})` },
            { value: 'NEW', label: `${t('applicants.newOnes')} (${count(['APPLIED', 'PENDING', 'VIEWED'])})` },
            { value: 'SHORTLISTED', label: `${t('applicants.shortlisted')} (${count(['SHORTLISTED'])})` },
            { value: 'SELECTED', label: `${t('applicants.selected')} (${count(['SELECTED', 'OFFERED', 'HIRED'])})` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {!rows ? <Loader /> : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={{ padding: space.lg }}
          ListHeaderComponent={<ErrorNote onRetry={load}>{error}</ErrorNote>}
          renderItem={({ item }) => (
            <ApplicantCard
              item={item}
              t={t}
              onPress={() => navigation.navigate('ApplicantProfile', {
                workerId: item.workerId, applicationId: item.id, jobId: item.jobId,
              })}
            />
          )}
          ListEmptyComponent={!error ? (
            <EmptyState icon="people-outline" title={t('applicants.none')} sub={t('applicants.noneSub')} />
          ) : null}
        />
      )}
    </SafeAreaView>
  )
}
