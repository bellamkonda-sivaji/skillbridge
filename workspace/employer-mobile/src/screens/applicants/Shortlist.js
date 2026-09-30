import React, { useCallback, useState } from 'react'
import { Alert, FlatList, StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  AppBar, Body, Button, EmptyState, ErrorNote, Loader, Row, Small,
} from '../../ui'
import ApplicantCard from './ApplicantCard'
import * as applicantsApi from '../../api/applicants'
import { errorText } from '../../api/client'
import { colors, space } from '../../theme'

/**
 * The shortlist for one job, with actions that apply to everyone chosen.
 *
 * Deciding on six people one at a time is six trips through the same screen,
 * so the bulk action exists - but rejecting in bulk still sends each person
 * their own message, because being turned down as part of a batch is how a
 * worker stops using the app.
 */
export default function Shortlist({ navigation, route }) {
  const { t } = useTranslation()
  const { jobId, jobTitle } = route?.params || {}
  const [rows, setRows] = useState(null)
  const [picked, setPicked] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await applicantsApi.shortlist(jobId)
      setRows(Array.isArray(d) ? d : d?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load your shortlist.'))
      setRows([])
    }
  }, [jobId])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const bulk = async (status) => {
    const ids = (rows || [])
      .filter((r) => picked.includes(r.workerId))
      .map((r) => r.applicationId || r.id)
      .filter(Boolean)
    if (!ids.length) return
    setBusy(status)
    try {
      await applicantsApi.bulkDecide(ids, status)
      setPicked([])
      await load()
    } catch (err) {
      Alert.alert('', errorText(err, 'We could not update those.'))
    } finally { setBusy('') }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <AppBar title={t('shortlist.title')} subtitle={jobTitle} onBack={navigation.goBack} />
      {!rows ? <Loader /> : (
        <FlatList
          data={rows}
          keyExtractor={(r, i) => String(r.applicationId ?? r.id ?? `sl-${i}`)}
          contentContainerStyle={{ padding: space.lg, paddingBottom: picked.length ? 150 : space.lg }}
          ListHeaderComponent={(
            <>
              <ErrorNote onRetry={load}>{error}</ErrorNote>
              <Body style={{ fontSize: 14, marginBottom: space.md }}>{t('shortlist.sub')}</Body>
            </>
          )}
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
            <EmptyState
              icon="star-outline"
              title={t('shortlist.none')}
              sub={t('shortlist.noneSub')}
              action={<Button title={t('shortlist.addMore')}
                onPress={() => navigation.navigate('JobApplicants', { jobId, jobTitle })} />}
            />
          ) : null}
        />
      )}

      {picked.length ? (
        <View style={s.bar}>
          <Small style={{ marginBottom: space.sm }}>
            {picked.length} {t('shortlist.selected')}
          </Small>
          <Row>
            <Button title={t('applicants.reject')} tone="dangerQuiet" style={{ flex: 1 }}
              loading={busy === 'REJECTED'} onPress={() => bulk('REJECTED')} />
            <Button title={t('applicants.scheduleTalk')} tone="outline" style={{ flex: 1 }}
              onPress={() => navigation.navigate('ScheduleInterview', {
                applicationId: (rows.find((r) => r.workerId === picked[0]) || {}).applicationId,
                workerName: (rows.find((r) => r.workerId === picked[0]) || {}).workerName,
                jobId,
              })} />
          </Row>
        </View>
      ) : null}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line,
    paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xl,
  },
})
