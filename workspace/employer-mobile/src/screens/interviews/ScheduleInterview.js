import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  AppBar, Avatar, Button, CheckRow, Chip, ChoiceCard, ErrorNote, Field, H3,
  Input, Row, Screen, Small, Spacer,
} from '../../ui'
import { MODE_OPTIONS as MODES } from '../../ui/interviewMode'
import * as interviewsApi from '../../api/interviews'
import { errorText } from '../../api/client'
import { colors, space } from '../../theme'



const TIMES = ['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00']

/** Arranging a call or a visit. Times are taps, not a picker to fight with. */
export default function ScheduleInterview({ navigation, route }) {
  const { t } = useTranslation()
  const { applicationId, workerName, jobId } = route?.params || {}
  const [mode, setMode] = useState('VISIT_SHOP')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('11:00')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [notify, setNotify] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const iso = (text) => {
    const parts = String(text).split(/[^0-9]+/).filter(Boolean)
    if (parts.length !== 3) return null
    const [d, m, y] = parts
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  const submit = async () => {
    const day = iso(date)
    if (!day) { setError('Choose the day.'); return }
    setBusy(true); setError('')
    try {
      await interviewsApi.schedule({
        applicationId, jobId, mode,
        scheduledAt: `${day}T${time}:00`,
        location: location || undefined,
        notes: notes || undefined,
        notifyCandidate: notify,
      })
      navigation.navigate('InterviewCalendar')
    } catch (err) {
      setError(errorText(err, 'We could not arrange this.'))
    } finally { setBusy(false) }
  }

  return (
    <Screen
      padded={false}
      bg={colors.white}
      footer={<Button title={t('interviews.scheduleAction')} onPress={submit} loading={busy} />}
    >
      <AppBar title={t('interviews.schedule')} onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        {workerName ? (
          <Row style={{ marginBottom: space.lg }}>
            <Avatar name={workerName} size={48} />
            <H3 style={{ flex: 1 }}>{workerName}</H3>
          </Row>
        ) : null}

        <ErrorNote>{error}</ErrorNote>

        <Field label={t('interviews.type')}>
          {MODES.map((m) => (
            <ChoiceCard key={m.value} selected={mode === m.value} onPress={() => setMode(m.value)}
              icon={m.icon} title={t(`interviews.${m.key}`)} />
          ))}
        </Field>

        <Field label={t('interviews.date')} hint="DD / MM / YYYY">
          <Input value={date} onChangeText={setDate} placeholder="15 / 04 / 2026"
            keyboardType="numbers-and-punctuation" />
        </Field>

        <Field label={t('interviews.time')}>
          <View style={s.wrap}>
            {TIMES.map((x) => (
              <Chip key={x} label={x} selected={time === x} onPress={() => setTime(x)} />
            ))}
          </View>
        </Field>

        {mode === 'VISIT_SHOP' ? (
          <Field label={t('interviews.location')}>
            <Input value={location} onChangeText={setLocation} placeholder="My shop, Korlagunta" />
          </Field>
        ) : null}

        <Field label={t('interviews.notes')} hint={t('common.optional')}>
          <Input value={notes} onChangeText={setNotes} multiline maxLength={300}
            placeholder="Please bring your ID and come 10 minutes early."
            style={{ minHeight: 84, alignItems: 'flex-start' }} />
        </Field>

        <CheckRow checked={notify} onToggle={() => setNotify((n) => !n)}>
          <Small style={{ color: colors.body, fontSize: 14 }}>{t('interviews.notifyCandidate')}</Small>
        </CheckRow>
        <Spacer h={space.lg} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({ wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm } })
