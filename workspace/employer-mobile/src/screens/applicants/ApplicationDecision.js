import React, { useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  AppBar, Avatar, Badge, Body, Button, CheckRow, ChoiceCard, ErrorNote, Field,
  Input, Row, Screen, Small, Spacer,
} from '../../ui'
import * as applicantsApi from '../../api/applicants'
import { errorText } from '../../api/client'
import { colors, space } from '../../theme'

const OPTIONS = [
  { value: 'SHORTLISTED', icon: 'star-outline', titleKey: 'shortlistIt', subKey: 'shortlistSub', tone: colors.violet },
  { value: 'INTERVIEW', icon: 'call-outline', titleKey: 'talkToThem', subKey: 'talkSub', tone: colors.blue },
  { value: 'SELECTED', icon: 'checkmark-circle-outline', titleKey: 'offerThem', subKey: 'offerSub', tone: colors.green },
  { value: 'REJECTED', icon: 'close-circle-outline', titleKey: 'rejectThem', subKey: 'rejectSub', tone: colors.red },
]

/**
 * One decision about one applicant, on its own screen.
 *
 * Choosing "arrange a talk" or "send an offer" takes the employer straight to
 * that screen rather than just changing a status and leaving them to find it -
 * the decision and the thing it implies are one action.
 */
export default function ApplicationDecision({ navigation, route }) {
  const { t } = useTranslation()
  const { applicationId, workerId, workerName, jobId, matchScore } = route?.params || {}
  const [choice, setChoice] = useState('')
  const [message, setMessage] = useState('')
  const [notify, setNotify] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!choice) { setError(t('decision.title')); return }
    setBusy(true); setError('')
    try {
      await applicantsApi.decide(applicationId, {
        status: choice,
        message: message || undefined,
        notifyWorker: notify,
      })
      if (choice === 'INTERVIEW') {
        navigation.replace('ScheduleInterview', { applicationId, workerName, jobId })
      } else if (choice === 'SELECTED') {
        navigation.replace('CreateOffer', { applicationId, workerId, jobId })
      } else {
        Alert.alert('', t('decision.saved'))
        navigation.goBack()
      }
    } catch (err) {
      setError(errorText(err, 'We could not save that.'))
    } finally { setBusy(false) }
  }

  return (
    <Screen
      padded={false}
      bg={colors.white}
      footer={<Button title={t('decision.save')} onPress={submit} loading={busy} disabled={!choice} />}
    >
      <AppBar title={t('decision.title')} onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Row style={{ marginBottom: space.lg }}>
          <Avatar name={workerName} size={52} />
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{workerName}</Text>
            {matchScore != null ? (
              <Badge label={`${Math.round(matchScore)}% ${t('applicants.match')}`} tone="blue"
                style={{ marginTop: 5 }} />
            ) : null}
          </View>
        </Row>

        <ErrorNote>{error}</ErrorNote>

        {OPTIONS.map((o) => (
          <ChoiceCard
            key={o.value}
            selected={choice === o.value}
            onPress={() => setChoice(o.value)}
            icon={o.icon}
            iconTone={o.tone}
            title={t(`decision.${o.titleKey}`)}
            sub={t(`decision.${o.subKey}`)}
          />
        ))}

        <Field label={t('decision.message')} style={{ marginTop: space.md }}>
          <Input value={message} onChangeText={setMessage} multiline maxLength={500}
            placeholder="Can you come tomorrow at 10?"
            style={{ minHeight: 88, alignItems: 'flex-start' }} />
          <Small style={{ alignSelf: 'flex-end', marginTop: 4 }}>{message.length}/500</Small>
        </Field>

        <CheckRow checked={notify} onToggle={() => setNotify((n) => !n)}>
          <Body style={{ fontSize: 14.5 }}>{t('decision.notify')}</Body>
        </CheckRow>

        <Spacer h={space.lg} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  name: { fontSize: 18, fontWeight: '800', color: colors.ink },
})
