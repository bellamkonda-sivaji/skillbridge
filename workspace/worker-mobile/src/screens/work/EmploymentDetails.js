import React, { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Badge, Button, Card, ErrorNote, H3, KV, Loader, Row, Screen, Small,
  Spacer, formatDate, hhmm, money,
} from '../../ui'
import * as offersApi from '../../api/offers'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'
import { word } from '../../ui/words'

/** One job in full: the terms, the days worked and the money so far. */
export default function EmploymentDetails({ navigation, route }) {
  const { t } = useTranslation()
  const id = route?.params?.id
  const [item, setItem] = useState(null)
  const [payrollData, setPayroll] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const [detail, pay] = await Promise.all([
        offersApi.employmentDetail(id),
        offersApi.payroll(id).catch(() => null),
      ])
      setItem(detail)
      setPayroll(pay)
    } catch (err) {
      setError(errorText(err, 'We could not load this work.'))
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const markJoined = async () => {
    setBusy(true)
    try { await offersApi.acknowledgeJoining(id); await load() } catch (err) {
      setError(errorText(err))
    } finally { setBusy(false) }
  }

  if (!item && !error) return <Screen scroll={false}><Loader /></Screen>
  if (!item) {
    return <Screen padded={false}><AppBar onBack={navigation.goBack} />
      <View style={{ padding: space.lg }}><ErrorNote onRetry={load}>{error}</ErrorNote></View></Screen>
  }

  const canMarkJoined = ['ACCEPTED', 'UPCOMING', 'PENDING_JOIN'].includes(item.status)

  return (
    <Screen
      padded={false}
      footer={canMarkJoined ? (
        <Button title={t('myWork.markJoined')} tone="success" icon="checkmark"
          onPress={markJoined} loading={busy} />
      ) : null}
    >
      <AppBar title={t('myWork.viewEmployment')} onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Card>
          <Row align="flex-start">
            <View style={s.logo}><Ionicons name="storefront" size={22} color={colors.blue} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{item.jobTitle}</Text>
              <Small style={{ marginTop: 2 }}>{item.businessName}</Small>
            </View>
            <Badge
              label={word(t, item.status)}
              tone={['ACTIVE', 'JOINED', 'ONGOING'].includes(item.status) ? 'green' : 'grey'}
            />
          </Row>
        </Card>

        <View style={s.tiles}>
          <View style={s.tile}>
            <Ionicons name="calendar-outline" size={19} color={colors.blue} />
            <Text style={s.tileValue}>
              {payrollData?.daysPresent ?? item.daysWorked ?? '—'}
              {payrollData?.workingDays ? ` / ${payrollData.workingDays}` : ''}
            </Text>
            <Small numberOfLines={1}>{t('myWork.attendanceThisMonth')}</Small>
          </View>
          <View style={s.tile}>
            <Ionicons name="cash-outline" size={19} color={colors.greenText} />
            <Text style={[s.tileValue, { color: colors.greenText }]}>
              {money(payrollData?.netPayable ?? item.workerSalary ?? item.salary)}
            </Text>
            <Small numberOfLines={1}>{t('myWork.salaryThisMonth')}</Small>
          </View>
        </View>

        <H3 style={{ marginTop: space.xl, marginBottom: space.sm }}>{t('offers.jobDetails')}</H3>
        <Card>
          {item.joinedAt || item.startDate ? (
            <KV k={t('myWork.joiningDate')} v={formatDate(item.joinedAt || item.startDate)} />
          ) : null}
          <KV k={t('jobs.type')} v={item.employmentType || item.engagementModel} />
          <KV k={t('myWork.monthlySalary')} v={money(item.workerSalary ?? item.salary)} strong />
          {item.workingDays ? <KV k={t('myWork.workingDays')} v={item.workingDays} /> : null}
          {item.shiftStart ? (
            <KV k={t('myWork.workingHours')} v={`${hhmm(item.shiftStart)} – ${hhmm(item.shiftEnd)}`} />
          ) : null}
          {item.probationMonths ? (
            <KV k={t('myWork.probation')} v={`${item.probationMonths} months`} />
          ) : null}
          <KV k={t('jobs.location')} v={item.workLocation || item.city} />
        </Card>

        <Button
          title={t('myWork.todayShift')}
          icon="time-outline"
          tone="outline"
          style={{ marginTop: space.lg }}
          onPress={() => navigation.navigate('TodayShift')}
        />
        <Spacer h={space.xxl} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  logo: {
    width: 48, height: 48, borderRadius: 13, backgroundColor: colors.blueSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '800', color: colors.ink },
  tiles: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  tile: {
    flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.line, padding: space.md, gap: 5,
  },
  tileValue: { fontSize: 20, fontWeight: '800', color: colors.ink },
})
