import React, { useCallback, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Badge, Body, Button, Card, ErrorNote, H3, Loader, Row, Screen, Small,
  Spacer, formatDate, pay, workerPay,
} from '../../ui'
import { STATUS_TONE, statusLabel } from './MyApplications'
import * as appsApi from '../../api/applications'
import { errorText } from '../../api/client'
import { colors, space } from '../../theme'

/**
 * Where an application has got to, as a vertical timeline.
 *
 * "Waiting" is a real answer and the screen says so rather than leaving a gap
 * - not knowing is the thing people ring the office about.
 */
export default function ApplicationDetails({ navigation, route }) {
  const { t } = useTranslation()
  const id = route?.params?.id
  const [item, setItem] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try { setItem(await appsApi.applicationDetail(id)) } catch (err) {
      setError(errorText(err, 'We could not load this application.'))
    }
  }, [id])

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (!item && !error) return <Screen scroll={false}><Loader /></Screen>
  if (!item) {
    return <Screen padded={false}><AppBar onBack={navigation.goBack} />
      <View style={{ padding: space.lg }}><ErrorNote onRetry={load}>{error}</ErrorNote></View></Screen>
  }

  const job = item.job || item
  // The server says whether this can still be withdrawn; it knows about
  // offers and hires, which a status list here kept getting wrong.
  const canWithdraw = item.canWithdraw ?? !['WITHDRAWN', 'REJECTED', 'ACCEPTED'].includes(item.status)
  const offer = item.offer && item.offer.status === 'PENDING' ? item.offer : null
  const openOffer = () => navigation.navigate('OfferDetails', { id: offer.id })

  // The server keeps the real history (when they viewed, shortlisted, ...).
  // Working it out here from fields that were never sent left steps unticked
  // after they had happened, and ticked "Final answer" with nothing under it.
  const LABEL = {
    APPLIED: 'timelineApplied', VIEWED: 'timelineViewed', SHORTLISTED: 'timelineShortlisted',
    INTERVIEW: 'timelineInterview', DECISION: 'timelineDecision',
  }
  const raw = item.timeline || []
  const steps = raw.map((st, i) => ({
    key: st.key,
    label: LABEL[st.key] ? t(`applications.${LABEL[st.key]}`) : st.label,
    at: st.at,
    note: st.note,
    done: st.state === 'DONE',
    current: st.state === 'CURRENT',
    // A talk the shop owner went past (straight to an offer) is not still coming.
    skipped: st.state === 'PENDING' && raw.slice(i + 1).some((x) => x.state !== 'PENDING'),
  }))

  return (
    <Screen
      padded={false}
      footer={offer ? (
        <Button title={t('applications.offerReply')} tone="success" icon="mail-open-outline" onPress={openOffer} />
      ) : canWithdraw ? (
        <Button
          title={t('applications.withdraw')}
          tone="dangerQuiet"
          onPress={() => navigation.navigate('WithdrawApplication', { id })}
        />
      ) : null}
    >
      <AppBar title={t('applications.detailsTitle')} onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Card>
          <Row align="flex-start">
            <View style={s.thumb}>
              <Ionicons name="briefcase-outline" size={22} color={colors.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{job.title || item.jobTitle}</Text>
              <Small style={{ marginTop: 2 }}>{job.businessName || item.businessName}</Small>
              <Text style={s.pay}>{pay(workerPay(job), job.salaryUnit)}</Text>
            </View>
            <Badge label={statusLabel(item.status, t)} tone={STATUS_TONE[item.status] || 'grey'} />
          </Row>
        </Card>

        {offer ? (
          <Card style={s.offer} onPress={openOffer}>
            <Row gap={space.sm}>
              <Text style={{ fontSize: 26 }}>🎉</Text>
              <Text style={s.offerTitle}>{t('applications.offerWaiting')}</Text>
            </Row>
            <Row style={{ marginTop: space.md }}>
              <View style={{ flex: 1 }}>
                <Small>{t('applications.youGet')}</Small>
                <Text style={s.offerPay}>{pay(offer.workerSalary ?? offer.salary, offer.salaryUnit)}</Text>
              </View>
              {offer.joiningDate || offer.workDate ? (
                <View style={{ flex: 1 }}>
                  <Small>{t('applications.starts')}</Small>
                  <Text style={s.offerPay}>{formatDate(offer.workDate || offer.joiningDate)}</Text>
                </View>
              ) : null}
            </Row>
          </Card>
        ) : null}

        <H3 style={{ marginTop: space.xl, marginBottom: space.md }}>Progress</H3>
        <View>
          {steps.map((step, i) => (
            <Row key={step.key} align="flex-start" gap={space.md}>
              <View style={{ alignItems: 'center' }}>
                <View style={[s.dot, step.done && s.dotOn, step.current && s.dotNow]}>
                  {step.done ? <Ionicons name="checkmark" size={13} color={colors.white} /> : null}
                  {step.current ? <View style={s.dotNowInner} /> : null}
                </View>
                {i < steps.length - 1 ? <View style={[s.line, step.done && s.lineOn]} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: space.lg }}>
                <Text style={[s.stepLabel, !step.done && !step.current && { color: colors.muted }]}>{step.label}</Text>
                {step.at ? <Small style={{ marginTop: 2 }}>{formatDate(step.at, true)}</Small> : null}
                {step.skipped ? <Small style={{ marginTop: 2 }}>{t('applications.skipped')}</Small>
                  : step.note && !step.done ? (
                    <Small style={[{ marginTop: 2 }, step.current && { color: colors.body }]}>{step.note}</Small>
                  ) : null}
              </View>
            </Row>
          ))}
        </View>

        {['APPLIED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED'].includes(item.status) ? (
          <Card style={s.waiting}>
            <Row gap={space.sm}>
              <Ionicons name="time-outline" size={19} color={colors.orangeText} />
              <Body style={{ flex: 1, fontSize: 14, color: colors.orangeText }}>
                {t('applications.waiting')}
              </Body>
            </Row>
          </Card>
        ) : null}
        <Spacer h={space.xl} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  thumb: {
    width: 52, height: 52, borderRadius: 12, backgroundColor: colors.blueSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.ink },
  pay: { fontSize: 15, fontWeight: '800', color: colors.greenText, marginTop: 4 },
  dot: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  dotOn: { backgroundColor: colors.green },
  dotNow: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.blue },
  dotNowInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue },
  offer: { marginTop: space.lg, backgroundColor: colors.greenSoft || '#ECFDF5', borderColor: colors.green, borderWidth: 2 },
  offerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: colors.greenText },
  offerPay: { fontSize: 17, fontWeight: '800', color: colors.ink, marginTop: 2 },
  line: { width: 2, flex: 1, minHeight: 26, backgroundColor: colors.line },
  lineOn: { backgroundColor: colors.greenLine },
  stepLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  waiting: { marginTop: space.md, backgroundColor: colors.orangeSoft, borderColor: '#FDE68A' },
})
