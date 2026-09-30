import React, { useCallback, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Avatar, Badge, Body, Button, Card, ChoiceCard, EmptyState, ErrorNote,
  Field, Input, Loader, Row, Screen, Small, Spacer, formatDate, timeOnly,
} from '../../ui'
import * as interviewsApi from '../../api/interviews'
import { errorText } from '../../api/client'
import { colors, space } from '../../theme'

const RESULTS = [
  { value: 'SELECTED', key: 'good', icon: 'checkmark-circle-outline', tone: colors.green },
  { value: 'REJECTED', key: 'notSuitable', icon: 'close-circle-outline', tone: colors.red },
  { value: 'PENDING', key: 'notDecided', icon: 'time-outline', tone: colors.muted },
]

/**
 * After the call or the visit: say how it went, then hire.
 *
 * The offer button only appears once someone is marked good, so the screen
 * reads as one decision followed by one action rather than a form.
 */
export default function InterviewResults({ navigation, route }) {
  const { t } = useTranslation()
  const { jobId, jobTitle } = route?.params || {}
  const [rows, setRows] = useState(null)
  const [editing, setEditing] = useState(null)
  const [choice, setChoice] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await interviewsApi.results(jobId)
      setRows(Array.isArray(d) ? d : d?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load the results.'))
      setRows([])
    }
  }, [jobId])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const save = async (applicationId) => {
    if (!choice) return
    setBusy(true)
    try {
      await interviewsApi.setResult(applicationId, choice, notes || undefined)
      setEditing(null); setChoice(''); setNotes('')
      await load()
    } catch (err) {
      Alert.alert('', errorText(err, 'We could not save that.'))
    } finally { setBusy(false) }
  }

  if (!rows) return <Screen scroll={false}><Loader /></Screen>

  return (
    <Screen padded={false}>
      <AppBar title={t('results.title')} subtitle={jobTitle} onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <ErrorNote onRetry={load}>{error}</ErrorNote>
        <Body style={{ fontSize: 14, marginBottom: space.md }}>{t('results.sub')}</Body>

        {rows.length ? rows.map((r, i) => {
          const appId = r.applicationId || r.id
          const isEditing = editing === appId
          const decided = r.result && r.result !== 'PENDING'
          // The schedule can come from the row or from the job's first shift.
          const when = r.scheduledAt || r.interviewAt
          return (
            <Card key={appId ?? `res-${i}`} style={{ marginBottom: space.md }}>
              <Row align="flex-start">
                <Avatar name={r.workerName} size={46} />
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{r.workerName}</Text>
                  {when ? (
                    <Small style={{ marginTop: 2 }}>
                      {formatDate(when)} · {timeOnly(when)}
                    </Small>
                  ) : null}
                  {r.feedback ? <Small style={{ marginTop: 4 }}>“{r.feedback}”</Small> : null}
                </View>
                <Badge
                  label={t(`results.${RESULTS.find((x) => x.value === r.result)?.key || 'notDecided'}`)}
                  tone={r.result === 'SELECTED' ? 'green' : r.result === 'REJECTED' ? 'red' : 'orange'}
                />
              </Row>

              {isEditing ? (
                <View style={{ marginTop: space.md }}>
                  {RESULTS.map((opt) => (
                    <ChoiceCard key={opt.value} selected={choice === opt.value}
                      onPress={() => setChoice(opt.value)} icon={opt.icon} iconTone={opt.tone}
                      title={t(`results.${opt.key}`)} />
                  ))}
                  <Field label={t('results.notes')} hint={t('common.optional')}>
                    <Input value={notes} onChangeText={setNotes} multiline maxLength={300}
                      style={{ minHeight: 76, alignItems: 'flex-start' }} />
                  </Field>
                  <Row>
                    <Button title={t('common.cancel')} tone="quiet" style={{ flex: 1 }}
                      onPress={() => { setEditing(null); setChoice(''); setNotes('') }} />
                    <Button title={t('results.saveResult')} style={{ flex: 2 }} loading={busy}
                      disabled={!choice} onPress={() => save(appId)} />
                  </Row>
                </View>
              ) : (
                <Row style={{ marginTop: space.md }}>
                  <Button
                    title={t('results.howWasIt')}
                    tone="outline"
                    size="sm"
                    style={{ flex: 1 }}
                    onPress={() => { setEditing(appId); setChoice(r.result || ''); setNotes(r.feedback || '') }}
                  />
                  {/* Only offer the next step once this one is a yes. */}
                  {r.result === 'SELECTED' ? (
                    <Button title={t('applicants.sendOffer')} tone="success" size="sm" style={{ flex: 1 }}
                      onPress={() => navigation.navigate('CreateOffer', {
                        applicationId: appId, workerId: r.workerId, jobId,
                      })} />
                  ) : null}
                </Row>
              )}
            </Card>
          )
        }) : (
          <Card>
            <EmptyState icon="chatbubbles-outline" title={t('results.none')}
              sub="Arrange a talk from an applicant's profile first." />
          </Card>
        )}

        <Spacer h={space.xxl} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  name: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
})
