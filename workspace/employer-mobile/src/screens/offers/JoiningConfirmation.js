import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Avatar, Badge, Button, Card, ErrorNote, Field, H3, Input, Loader,
  Row, Screen, Small, Spacer, formatDate,
} from '../../ui'
import * as offersApi from '../../api/offers'
import { errorText } from '../../api/client'
import { colors, space } from '../../theme'

/**
 * Confirming the worker actually turned up.
 *
 * This is the step that releases money, so it is deliberately a positive
 * action by the employer rather than something the system assumes.
 */
export default function JoiningConfirmation({ navigation, route }) {
  const { t } = useTranslation()
  const offerId = route?.params?.offerId
  const [data, setData] = useState(null)
  const [form, setForm] = useState({ joinedOn: '', reportingTime: '', notes: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    offersApi.joining(offerId)
      .then((d) => {
        setData(d)
        setForm((f) => ({
          ...f,
          joinedOn: d.actualJoiningDate || '',
          reportingTime: d.reportingTime || '09:00',
        }))
      })
      .catch((err) => { setError(errorText(err, 'We could not load this.')); setData({}) })
  }, [offerId])

  if (!data) return <Screen scroll={false}><Loader /></Screen>

  const iso = (text) => {
    const parts = String(text).split(/[^0-9]+/).filter(Boolean)
    if (parts.length !== 3) return undefined
    const [d, m, y] = parts
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  const confirm = async () => {
    setBusy(true); setError('')
    try {
      await offersApi.saveJoining(offerId, {
        actualJoiningDate: iso(form.joinedOn),
        reportingTime: form.reportingTime || undefined,
        notes: form.notes || undefined,
        confirmed: true,
      })
      navigation.navigate('OfferTracking')
    } catch (err) {
      setError(errorText(err, 'We could not confirm this.'))
    } finally { setBusy(false) }
  }

  const steps = [
    { key: 'hired', label: t('offers.hired'), done: true },
    { key: 'joined', label: t('offers.workerJoined'), done: Boolean(data.joinedAt) },
    { key: 'completed', label: t('offers.workCompleted'), done: Boolean(data.completedAt) },
    { key: 'payment', label: t('offers.payment'), done: Boolean(data.paidAt) },
  ]

  return (
    <Screen
      padded={false}
      footer={<Button title={t('offers.confirmJoining')} tone="success" icon="checkmark"
        onPress={confirm} loading={busy} />}
    >
      <AppBar title={t('offers.joiningTitle')} onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Row style={{ marginBottom: space.lg }}>
          <Avatar name={data.workerName} size={50} />
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{data.workerName}</Text>
            <Small style={{ marginTop: 2 }}>{data.jobTitle}</Small>
          </View>
          <Badge label={t('offers.accepted')} tone="green" />
        </Row>

        <ErrorNote>{error}</ErrorNote>

        <H3 style={{ marginBottom: space.md }}>{t('offers.workStatus')}</H3>
        {steps.map((st, i) => (
          <Row key={st.key} align="flex-start" gap={space.md}>
            <View style={{ alignItems: 'center' }}>
              <View style={[s.dot, st.done && s.dotOn]}>
                {st.done
                  ? <Ionicons name="checkmark" size={13} color={colors.white} />
                  : <Text style={s.dotNum}>{i + 1}</Text>}
              </View>
              {i < steps.length - 1 ? <View style={[s.line, st.done && s.lineOn]} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: space.lg }}>
              <Text style={[s.stepLabel, !st.done && { color: colors.muted }]}>{st.label}</Text>
            </View>
          </Row>
        ))}

        <H3 style={{ marginTop: space.md, marginBottom: space.md }}>{t('offers.joiningDetails')}</H3>
        <Field label={t('offers.actualJoining')} hint="DD / MM / YYYY">
          <Input value={form.joinedOn} onChangeText={(v) => setForm((f) => ({ ...f, joinedOn: v }))}
            placeholder="22 / 04 / 2026" keyboardType="numbers-and-punctuation" />
        </Field>
        <Field label={t('offers.reportingTime')}>
          <Input value={form.reportingTime}
            onChangeText={(v) => setForm((f) => ({ ...f, reportingTime: v }))} placeholder="09:00" />
        </Field>
        <Field label={t('offers.notes')} hint={t('common.optional')}>
          <Input value={form.notes} onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
            multiline maxLength={300} style={{ minHeight: 80, alignItems: 'flex-start' }} />
        </Field>

        <Spacer h={space.lg} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  name: { fontSize: 17, fontWeight: '800', color: colors.ink },
  dot: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  dotOn: { backgroundColor: colors.green },
  dotNum: { fontSize: 12, fontWeight: '800', color: colors.muted },
  line: { width: 2, flex: 1, minHeight: 24, backgroundColor: colors.line },
  lineOn: { backgroundColor: colors.greenLine },
  stepLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
})
