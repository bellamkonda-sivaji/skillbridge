import React, { useCallback, useEffect, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Avatar, Badge, Body, Button, Card, ErrorNote, Field, H3, Input, Loader,
  Row, Screen, Small, Spacer, SuccessPanel, formatDate, timeOnly,
} from '../../ui'
import * as offersApi from '../../api/offers'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

/**
 * Confirming a hire, from the offer through to the money being released.
 *
 * The timeline is whatever the API says it is - a one-day job runs
 * Hired / Joined / Work done / Payment, a permanent one runs Offer accepted /
 * Joined / In progress / Complete - so this screen renders `steps` rather
 * than hard-coding a list that would be wrong for half the jobs.
 *
 * The button always advances the first step that is not done yet, which is
 * what makes the last one release the worker's money.
 */
export default function JoiningConfirmation({ navigation, route }) {
  const { t } = useTranslation()
  const offerId = route?.params?.offerId
  const [data, setData] = useState(null)
  const [form, setForm] = useState({ joinedOn: '', reportingTime: '', notes: '', employeeId: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [justFinished, setJustFinished] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await offersApi.joining(offerId)
      setData(d)
      setForm((f) => ({
        ...f,
        joinedOn: f.joinedOn || (d.actualJoiningDate
          ? String(d.actualJoiningDate).split('-').reverse().join(' / ') : ''),
        reportingTime: f.reportingTime || d.reportingTime || '09:00',
        employeeId: f.employeeId || d.employeeId || '',
      }))
    } catch (err) {
      setError(errorText(err, 'We could not load this.'))
      setData({})
    }
  }, [offerId])

  useEffect(() => { load() }, [load])

  if (!data) return <Screen scroll={false}><Loader /></Screen>

  const steps = data.steps || []
  const next = steps.find((st) => st.state !== 'DONE')
  const allDone = steps.length > 0 && !next
  const isJoinStep = next?.key === 'JOINED'

  const iso = (text) => {
    const parts = String(text).split(/[^0-9]+/).filter(Boolean)
    if (parts.length !== 3) return undefined
    const [d, m, y] = parts
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  const advance = async () => {
    if (!next) return
    setBusy(true); setError('')
    try {
      await offersApi.saveJoining(offerId, {
        markStep: next.key,
        // The joining details only belong on the step that records them.
        actualJoiningDate: isJoinStep ? iso(form.joinedOn) : undefined,
        reportingTime: isJoinStep ? (form.reportingTime || undefined) : undefined,
        employeeId: isJoinStep ? (form.employeeId || undefined) : undefined,
        notes: form.notes || undefined,
      })
      const fresh = await offersApi.joining(offerId)
      setData(fresh)
      const finished = (fresh.steps || []).every((st) => st.state === 'DONE')
      if (finished) setJustFinished(true)
    } catch (err) {
      setError(errorText(err, 'We could not save that.'))
    } finally { setBusy(false) }
  }

  // The celebratory end state from the designs - and the point the worker's
  // money is released, which is worth saying out loud.
  if (justFinished || allDone) {
    return (
      <Screen
        bg={colors.white}
        footer={(
          <View style={{ gap: space.md }}>
            <Button title={t('team.payroll')}
              onPress={() => navigation.navigate('Payroll')} />
            <Button title={t('common.done')} tone="outline"
              onPress={() => navigation.navigate('OfferTracking')} />
          </View>
        )}
      >
        <SuccessPanel
          icon="checkmark-done"
          title={t('offers.completedTitle')}
          sub={`${data.workerName} · ${data.jobTitle}`}
        >
          <Card style={{ alignSelf: 'stretch', marginTop: space.xl }}>
            {steps.map((st) => (
              <Row key={st.key} gap={space.sm} style={{ paddingVertical: 7 }}>
                <Ionicons name="checkmark-circle" size={18} color={colors.green} />
                <Text style={s.doneStep}>{st.label}</Text>
                <Small>{st.at ? formatDate(st.at) : ''}</Small>
              </Row>
            ))}
          </Card>
          <Small style={{ marginTop: space.lg, textAlign: 'center' }}>
            {t('offers.releasedNote')}
          </Small>
        </SuccessPanel>
        <Spacer h={space.lg} />
      </Screen>
    )
  }

  return (
    <Screen
      padded={false}
      footer={next ? (
        <Button
          title={next.key === 'JOINED' ? t('offers.confirmJoining')
            : next.key === 'WORK_DONE' || next.key === 'COMPLETE' ? t('offers.markCompleted')
              : `${t('common.next')}: ${next.label}`}
          tone="success"
          icon="checkmark"
          onPress={advance}
          loading={busy}
        />
      ) : null}
    >
      <AppBar title={t('offers.joiningTitle')} onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Row style={{ marginBottom: space.lg }}>
          <Avatar uri={data.photoUrl} name={data.workerName} size={50} />
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{data.workerName}</Text>
            <Small style={{ marginTop: 2 }}>{data.jobTitle}</Small>
          </View>
          <Badge label={data.isShortJob ? t('work.oneDay') : t('work.permanent')} tone="violet" />
        </Row>

        <ErrorNote onRetry={load}>{error}</ErrorNote>

        <H3 style={{ marginBottom: space.md }}>{t('offers.workStatus')}</H3>
        {steps.map((st, i) => {
          const done = st.state === 'DONE'
          const current = !done && st.key === next?.key
          return (
            <Row key={st.key} align="flex-start" gap={space.md}>
              <View style={{ alignItems: 'center' }}>
                <View style={[s.dot, done && s.dotDone, current && s.dotNow]}>
                  {done
                    ? <Ionicons name="checkmark" size={13} color={colors.white} />
                    : <Text style={[s.dotNum, current && { color: colors.white }]}>{i + 1}</Text>}
                </View>
                {i < steps.length - 1 ? <View style={[s.line, done && s.lineDone]} /> : null}
              </View>
              <View style={[s.stepBody, current && s.stepBodyNow]}>
                <Text style={[s.stepLabel, !done && !current && { color: colors.muted }]}>
                  {st.label}
                </Text>
                <Small style={{ marginTop: 2 }}>
                  {st.at ? `${formatDate(st.at)} · ${timeOnly(st.at)}` : st.note}
                </Small>
              </View>
            </Row>
          )
        })}

        {/* The joining details are only asked for on the step that records them. */}
        {isJoinStep ? (
          <>
            <H3 style={{ marginTop: space.lg, marginBottom: space.md }}>
              {t('offers.joiningDetails')}
            </H3>
            <Field label={t('offers.actualJoining')} hint="DD / MM / YYYY">
              <Input value={form.joinedOn}
                onChangeText={(v) => setForm((f) => ({ ...f, joinedOn: v }))}
                placeholder="22 / 04 / 2026" keyboardType="numbers-and-punctuation" />
            </Field>
            <Field label={t('offers.reportingTime')}>
              <Input value={form.reportingTime}
                onChangeText={(v) => setForm((f) => ({ ...f, reportingTime: v }))}
                placeholder="09:00" />
            </Field>
            {!data.isShortJob ? (
              <Field label={t('offers.employeeId')} hint={t('common.optional')}>
                <Input value={form.employeeId}
                  onChangeText={(v) => setForm((f) => ({ ...f, employeeId: v }))}
                  placeholder="EMP-00123" autoCapitalize="characters" />
              </Field>
            ) : null}
          </>
        ) : null}

        <Field label={t('offers.notes')} hint={t('common.optional')} style={{ marginTop: space.md }}>
          <Input value={form.notes} onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
            multiline maxLength={300} style={{ minHeight: 76, alignItems: 'flex-start' }} />
        </Field>

        {next?.key === 'WORK_DONE' || next?.key === 'COMPLETE' ? (
          <View style={s.releaseNote}>
            <Ionicons name="wallet-outline" size={18} color={colors.greenText} />
            <Small style={{ flex: 1, color: colors.greenText }}>{t('offers.releaseWarning')}</Small>
          </View>
        ) : null}

        <Spacer h={space.xxl} />
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
  dotDone: { backgroundColor: colors.green },
  dotNow: { backgroundColor: colors.blue },
  dotNum: { fontSize: 12, fontWeight: '800', color: colors.muted },
  line: { width: 2, flex: 1, minHeight: 26, backgroundColor: colors.line },
  lineDone: { backgroundColor: colors.greenLine },
  stepBody: { flex: 1, paddingBottom: space.lg },
  stepBodyNow: {
    backgroundColor: colors.blueSoft, borderRadius: radius.md,
    padding: space.md, marginBottom: space.lg, paddingBottom: space.md,
  },
  stepLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  doneStep: { flex: 1, fontSize: 14.5, fontWeight: '600', color: colors.ink },
  releaseNote: {
    flexDirection: 'row', gap: space.sm, alignItems: 'center',
    backgroundColor: colors.greenSoft, borderRadius: radius.md,
    padding: space.md, marginTop: space.md,
  },
})
