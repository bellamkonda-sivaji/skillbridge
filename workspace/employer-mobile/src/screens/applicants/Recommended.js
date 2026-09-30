import React, { useCallback, useState } from 'react'
import { Alert, FlatList, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppBar, Body, Button, EmptyState, ErrorNote, Loader } from '../../ui'
import ApplicantCard from './ApplicantCard'
import * as applicantsApi from '../../api/applicants'
import { errorText } from '../../api/client'
import { colors, space } from '../../theme'

/** Workers the matcher suggests, who have not applied yet. */
export default function Recommended({ navigation, route }) {
  const { t } = useTranslation()
  const { jobId, jobTitle } = route?.params || {}
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await applicantsApi.recommended(jobId, 'TOP')
      setRows(Array.isArray(d) ? d : d?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load suggestions.'))
      setRows([])
    }
  }, [jobId])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const invite = async (workerId) => {
    try {
      await applicantsApi.invite(jobId, workerId)
      Alert.alert('', 'We have invited them to apply.')
    } catch (err) {
      Alert.alert('', errorText(err, 'We could not send the invite.'))
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <AppBar title={t('applicants.recommended')} subtitle={jobTitle} onBack={navigation.goBack} />
      {!rows ? <Loader /> : (
        <FlatList
          data={rows}
          keyExtractor={(r) => String(r.workerId || r.id)}
          contentContainerStyle={{ padding: space.lg }}
          ListHeaderComponent={(
            <>
              <ErrorNote onRetry={load}>{error}</ErrorNote>
              <Body style={{ marginBottom: space.md, fontSize: 14 }}>
                {t('applicants.recommendedSub')}
              </Body>
            </>
          )}
          renderItem={({ item }) => (
            <View>
              <ApplicantCard
                item={item}
                t={t}
                onCall
                onPress={() => navigation.navigate('ApplicantProfile', {
                  workerId: item.workerId || item.id, jobId,
                })}
              />
              <Button
                title="Invite to apply"
                tone="outline"
                size="sm"
                style={{ marginTop: -space.sm, marginBottom: space.md }}
                onPress={() => invite(item.workerId || item.id)}
              />
            </View>
          )}
          ListEmptyComponent={!error ? (
            <EmptyState icon="sparkles-outline" title="No suggestions yet"
              sub="As more workers register nearby, we will suggest the ones who fit." />
          ) : null}
        />
      )}
    </SafeAreaView>
  )
}
