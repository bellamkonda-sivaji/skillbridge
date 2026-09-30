import React, { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
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

  useEffect(() => { load() }, [load])

  if (!item && !error) return <Screen scroll={false}><Loader /></Screen>
  if (!item) {
    return <Screen padded={false}><AppBar onBack={navigation.goBack} />
      <View style={{ padding: space.lg }}><ErrorNote onRetry={load}>{error}</ErrorNote></View></Screen>
  }

  const job = item.job || item
  const canWithdraw = !['WITHDRAWN', 'REJECTED', 'HIRED'].includes(item.status)

  const steps = [
    { key: 'applied', label: t('applications.timelineApplied'), at: item.appliedAt, done: true },
    { key: 'viewed', label: t('applications.timelineViewed'), at: item.viewedAt, done: Boolean(item.viewedAt) },
    {
      key: 'shortlisted',
      label: t('applications.timelineShortlisted'),
      at: item.shortlistedAt,
      done: Boolean(item.shortlistedAt) || ['SHORTLISTED', 'INTERVIEW', 'SELECTED', 'HIRED'].includes(item.status),
    },
    {
      key: 'interview',
      label: t('applications.timelineInterview'),
      at: item.interviewAt,
      done: Boolean(item.interviewAt),
    },
    {
      key: 'decision',
      label: t('applications.timelineDecision'),
      at: item.decidedAt,
      done: ['SELECTED', 'OFFERED', 'HIRED', 'REJECTED'].includes(item.status),
    },
  ]

  return (
    <Screen
      padded={false}
      footer={canWithdraw ? (
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

        <H3 style={{ marginTop: space.xl, marginBottom: space.md }}>Progress</H3>
        <View>
          {steps.map((step, i) => (
            <Row key={step.key} align="flex-start" gap={space.md}>
              <View style={{ alignItems: 'center' }}>
                <View style={[s.dot, step.done && s.dotOn]}>
                  {step.done ? <Ionicons name="checkmark" size={13} color={colors.white} /> : null}
                </View>
                {i < steps.length - 1 ? <View style={[s.line, step.done && s.lineOn]} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: space.lg }}>
                <Text style={[s.stepLabel, !step.done && { color: colors.muted }]}>{step.label}</Text>
                <Small style={{ marginTop: 2 }}>
                  {step.at ? formatDate(step.at, true)
                    : step.done ? '' : t('applications.willTell')}
                </Small>
              </View>
            </Row>
          ))}
        </View>

        {!['SELECTED', 'OFFERED', 'HIRED', 'REJECTED'].includes(item.status) ? (
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
  line: { width: 2, flex: 1, minHeight: 26, backgroundColor: colors.line },
  lineOn: { backgroundColor: colors.greenLine },
  stepLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  waiting: { marginTop: space.md, backgroundColor: colors.orangeSoft, borderColor: '#FDE68A' },
})
