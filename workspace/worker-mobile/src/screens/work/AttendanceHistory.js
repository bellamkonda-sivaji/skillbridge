import React, { useCallback, useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Badge, Body, Button, Card, ChoiceCard, EmptyState, ErrorNote, Field,
  H3, Input, Loader, Row, SegTabs, Small, Spacer, formatDate, isoDay, timeOnly,
} from '../../ui'
import * as attendanceApi from '../../api/attendance'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

/** The five things that actually go wrong, offered as taps rather than a box. */
const REASONS = [
  { value: 'FORGOT_PUNCH_IN', key: 'forgotIn', icon: 'play-outline' },
  { value: 'FORGOT_PUNCH_OUT', key: 'forgotOut', icon: 'stop-outline' },
  { value: 'WRONG_TIME', key: 'wrongTime', icon: 'time-outline' },
  { value: 'MISSED_DAY', key: 'missedDay', icon: 'calendar-outline' },
  { value: 'WRONG_ABSENT', key: 'wrongAbsent', icon: 'alert-circle-outline' },
]

/**
 * Every day the worker has marked, and the way to say one of them is wrong.
 *
 * Describing a problem in writing is the hardest thing we could ask here, so
 * the correction flow is five taps and an optional note - never a text box
 * first.
 */
export default function AttendanceHistory({ navigation }) {
  const { t } = useTranslation()
  const [days, setDays] = useState(null)
  const [requests, setRequests] = useState([])
  const [tab, setTab] = useState('DAYS')
  const [error, setError] = useState('')
  const [asking, setAsking] = useState(null)

  const load = useCallback(async () => {
    setError('')
    try {
      const [list, reqs] = await Promise.all([
        attendanceApi.history({}),
        attendanceApi.myRequests().catch(() => []),
      ])
      setDays(Array.isArray(list) ? list : list?.content || [])
      setRequests(Array.isArray(reqs) ? reqs : reqs?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load your days.'))
      setDays([])
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const totals = useMemo(() => {
    const list = days || []
    const present = list.filter((d) => d.checkInAt || d.status === 'PRESENT').length
    const minutes = list.reduce((sum, d) => sum + (Number(d.minutesWorked) || 0), 0)
    return { present, hours: Math.round((minutes / 60) * 10) / 10 }
  }, [days])

  const cancelRequest = async (id) => {
    try { await attendanceApi.cancelRequest(id); load() } catch (err) { setError(errorText(err)) }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <AppBar title={t('attendanceHistory.title')}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined} />
      <View style={s.tabs}>
        <SegTabs
          tabs={[
            { value: 'DAYS', label: t('attendanceHistory.title') },
            { value: 'REQUESTS', label: `${t('attendanceHistory.myRequests')} (${requests.length})` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg }}>
        <ErrorNote onRetry={load}>{error}</ErrorNote>

        {tab === 'DAYS' ? (
          <>
            <Row style={{ marginBottom: space.lg }}>
              <View style={s.tile}>
                <Ionicons name="calendar-outline" size={18} color={colors.greenText} />
                <Text style={s.tileValue}>{totals.present}</Text>
                <Small>{t('attendanceHistory.daysWorked')}</Small>
              </View>
              <View style={s.tile}>
                <Ionicons name="time-outline" size={18} color={colors.blue} />
                <Text style={s.tileValue}>{totals.hours}</Text>
                <Small>{t('attendanceHistory.hours')}</Small>
              </View>
            </Row>

            {!days ? <Loader /> : days.length ? days.map((d, i) => {
              const came = Boolean(d.checkInAt) || d.status === 'PRESENT'
              return (
                <Card key={d.id ?? `day-${i}`} style={{ marginBottom: space.md }}>
                  <Row align="flex-start">
                    <View style={[s.dayIcon, came ? s.dayIconOk : s.dayIconNo]}>
                      <Ionicons name={came ? 'checkmark' : 'close'} size={19}
                        color={came ? colors.greenText : colors.redText} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.dayDate}>{formatDate(d.workDate)}</Text>
                      <Small style={{ marginTop: 2 }}>{d.jobTitle || d.businessName}</Small>
                      <Small style={{ marginTop: 4 }}>
                        {d.checkInAt
                          ? `${timeOnly(d.checkInAt)} – ${d.checkOutAt ? timeOnly(d.checkOutAt) : '…'}`
                          : t('attendanceHistory.absent')}
                        {d.workedLabel ? ` · ${d.workedLabel}` : ''}
                      </Small>
                    </View>
                    <Badge
                      label={d.approvalLabel || d.approvalStatus || (came ? t('attendanceHistory.present') : t('attendanceHistory.absent'))}
                      tone={['APPROVED', 'AUTO_APPROVED'].includes(d.approvalStatus) ? 'green'
                        : d.approvalStatus === 'REJECTED' ? 'red'
                          : d.approvalStatus === 'PENDING' ? 'orange' : 'grey'}
                    />
                  </Row>
                  <Pressable style={s.wrong} onPress={() => setAsking(d)}>
                    <Ionicons name="chatbubble-outline" size={14} color={colors.muted} />
                    <Text style={s.wrongText}>{t('attendanceHistory.somethingWrong')}</Text>
                  </Pressable>
                </Card>
              )
            }) : (
              <Card>
                <EmptyState icon="calendar-outline" title={t('attendanceHistory.noneYet')}
                  sub={t('attendanceHistory.noneYetSub')} />
              </Card>
            )}
          </>
        ) : (
          requests.length ? requests.map((r) => (
            <Card key={r.id} style={{ marginBottom: space.md }}>
              <Row align="flex-start">
                <View style={s.reqIcon}>
                  <Ionicons name="hourglass-outline" size={18} color={colors.orangeText} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.dayDate}>
                    {t(`attendanceHistory.${REASONS.find((x) => x.value === r.type)?.key || 'wrongTime'}`)}
                  </Text>
                  <Small style={{ marginTop: 2 }}>
                    {formatDate(r.workDate)}{r.businessName ? ` · ${r.businessName}` : ''}
                  </Small>
                  {r.reason ? <Small style={{ marginTop: 4 }}>“{r.reason}”</Small> : null}
                </View>
                <Badge label={r.status}
                  tone={r.status === 'APPROVED' ? 'green' : r.status === 'REJECTED' ? 'red' : 'orange'} />
              </Row>
              {r.status === 'PENDING' ? (
                <Button title={t('common.cancel')} tone="quiet" size="sm"
                  style={{ marginTop: space.md }} onPress={() => cancelRequest(r.id)} />
              ) : null}
            </Card>
          )) : (
            <Card>
              <EmptyState icon="checkmark-circle-outline" title={t('attendanceHistory.myRequests')}
                sub="Nothing waiting." />
            </Card>
          )
        )}
        <Spacer h={space.xl} />
      </ScrollView>

      {asking ? (
        <AskDialog day={asking} onClose={() => setAsking(null)}
          onDone={() => { setAsking(null); load() }} t={t} />
      ) : null}
    </SafeAreaView>
  )
}

/** Raising a correction: reason first, times second, words last and optional. */
function AskDialog({ day, onClose, onDone, t }) {
  const [type, setType] = useState('')
  const [checkIn, setCheckIn] = useState('09:00')
  const [checkOut, setCheckOut] = useState('18:00')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const needsTimes = ['FORGOT_PUNCH_IN', 'FORGOT_PUNCH_OUT', 'WRONG_TIME', 'MISSED_DAY'].includes(type)

  const send = async () => {
    if (!type) { setError(t('attendanceHistory.askTitle')); return }
    setBusy(true); setError('')
    try {
      await attendanceApi.raiseRequest({
        employmentId: day.employmentId,
        attendanceId: day.id,
        workDate: day.workDate || isoDay(),
        type,
        requestedCheckIn: needsTimes ? checkIn : undefined,
        requestedCheckOut: needsTimes ? checkOut : undefined,
        reason: note || undefined,
      })
      onDone()
    } catch (err) {
      setError(errorText(err, 'We could not send this. Please try again.'))
    } finally { setBusy(false) }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.sheetBack}>
        <View style={s.sheet}>
          <Row style={{ marginBottom: space.md }}>
            <H3 style={{ flex: 1 }}>{t('attendanceHistory.askTitle')}</H3>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.muted} />
            </Pressable>
          </Row>
          <Small style={{ marginBottom: space.md }}>{t('attendanceHistory.askSub')}</Small>

          <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
            <ErrorNote>{error}</ErrorNote>
            {REASONS.map((r) => (
              <ChoiceCard
                key={r.value}
                selected={type === r.value}
                onPress={() => setType(r.value)}
                icon={r.icon}
                title={t(`attendanceHistory.${r.key}`)}
              />
            ))}

            {needsTimes ? (
              <Row align="flex-start" style={{ marginTop: space.sm }}>
                <Field label={t('attendanceHistory.correctIn')} style={{ flex: 1 }}>
                  <Input value={checkIn} onChangeText={setCheckIn} placeholder="09:00" />
                </Field>
                <Field label={t('attendanceHistory.correctOut')} style={{ flex: 1 }}>
                  <Input value={checkOut} onChangeText={setCheckOut} placeholder="18:00" />
                </Field>
              </Row>
            ) : null}

            <Field label={t('attendanceHistory.addNote')} hint={t('common.optional')}>
              <Input value={note} onChangeText={setNote} multiline maxLength={300}
                style={{ minHeight: 76, alignItems: 'flex-start' }} />
            </Field>
          </ScrollView>

          <Button title={t('attendanceHistory.send')} onPress={send} loading={busy}
            disabled={!type} style={{ marginTop: space.md }} />
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  tabs: {
    paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  tile: {
    flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.line, padding: space.md, gap: 4,
  },
  tileValue: { fontSize: 22, fontWeight: '800', color: colors.ink },
  dayIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayIconOk: { backgroundColor: colors.greenSoft },
  dayIconNo: { backgroundColor: colors.redSoft },
  dayDate: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
  wrong: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md,
    alignSelf: 'flex-start',
  },
  wrongText: { fontSize: 13, color: colors.muted, textDecorationLine: 'underline' },
  reqIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.orangeSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetBack: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: space.lg, paddingBottom: space.xxl,
  },
})
