import React, { useCallback, useEffect, useState } from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Badge, Body, Button, Card, EmptyState, ErrorNote, H3, Loader, Row,
  Small, distance, hhmm, minutesLabel, timeOnly,
} from '../../ui'
import * as attendanceApi from '../../api/attendance'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'
import Stamp, { milestoneFor } from '../../ui/Stamp'
import AskForCall from '../../ui/AskForCall'
import { Dialog } from '../../ui/Dialog'
import { locateWithHelp, quietLocation } from '../../location/current'

const ASKED_KEY = 'jobon.worker.punchLocationAsked.v1'

const askedBefore = async () => {
  try { return (await AsyncStorage.getItem(ASKED_KEY)) === 'yes' } catch { return true }
}
const markAsked = () => AsyncStorage.setItem(ASKED_KEY, 'yes').catch(() => {})

/** Dialog.alert, as a promise of which button was pressed. */
const choose = (title, message, yes, no) => new Promise((resolve) => {
  Dialog.alert(title, message, [
    { text: no, style: 'cancel', onPress: () => resolve(false) },
    { text: yes, onPress: () => resolve(true) },
  ], { tone: 'info' })
})

/**
 * Where the worker is as they press start or finish - if the phone will say.
 *
 * Never a reason not to punch: every path ends with the punch going through,
 * with or without a place. Permission is explained and asked for once only,
 * because the shop seeing where you checked in is worth saying out loud. A
 * switched-off location gets the same one-tap "turn on" every other screen
 * uses; a "no" there is simply respected.
 */
async function punchLocation(t) {
  const quiet = await quietLocation()
  if (quiet.ok) return quiet
  if (quiet.reason === 'off') return locateWithHelp({ ask: false })
  if (quiet.reason === 'denied' && !(await askedBefore())) {
    markAsked()
    const yes = await choose(t('myWork.locAskTitle'), t('myWork.locAskBody'),
      t('myWork.locAskYes'), t('myWork.locAskNo'))
    if (yes) return locateWithHelp({ ask: true })
  }
  return quiet
}

/**
 * Starting and finishing work.
 *
 * One clear action, coloured green to start and red to stop, so the state is
 * obvious without reading. The button is large but it is still a button - a
 * full-width slab of colour reads as a banner and people stop pressing it.
 */
export default function TodayShift({ navigation }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState(null)
  const [busy, setBusy] = useState(null)
  const [stamp, setStamp] = useState(null)
  const [error, setError] = useState('')
  const [, setTick] = useState(0)

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await attendanceApi.today()
      setRows(Array.isArray(d) ? d : [])
    } catch (err) {
      setError(errorText(err, 'We could not load your work for today.'))
      setRows([])
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  // Keeps the "worked so far" figure moving while someone is checked in.
  useEffect(() => {
    if (!(rows || []).some((r) => r.status === 'CHECKED_IN')) return undefined
    const id = setInterval(() => setTick((n) => n + 1), 60000)
    return () => clearInterval(id)
  }, [rows])

  const punch = async (row, kind) => {
    setBusy(row.employmentId); setError('')
    try {
      const where = await punchLocation(t).catch(() => null)
      const res = await (kind === 'IN'
        ? attendanceApi.checkIn(row.employmentId, where)
        : attendanceApi.checkOut(row.employmentId, where))
      // Calm, not a telling-off: phones drift, and the shop decides anyway.
      if (kind === 'IN' && res?.locationFlag === 'FAR') {
        const far = res.checkInDistanceM != null ? distance(Number(res.checkInDistanceM) / 1000) : null
        Dialog.alert(
          t('myWork.farTitle'),
          far ? t('myWork.farBody', { distance: far }) : t('myWork.farBodyNoDistance'),
          [{ text: t('myWork.farOk') }],
          { tone: 'warning' },
        )
      }
      // A permission refused for good can only be changed in Settings. Say so
      // once, after the punch has gone through - never before it.
      if (where?.reason === 'blocked' && !(await askedBefore())) {
        markAsked()
        Dialog.alert(t('myWork.locAskTitle'), t('myWork.locBlockedBody'), [
          { text: t('myWork.locAskNo'), style: 'cancel' },
          { text: t('near.openSettings'), onPress: () => Linking.openSettings().catch(() => {}) },
        ], { tone: 'info' })
      }
      // Finishing a day is the only moment a stamp can be earned. The server
      // sends the running total back with the check-out, so there is no second
      // call and no guessing in the app.
      if (kind === 'OUT') {
        const days = res?.daysWorkedTotal
        const earned = milestoneFor(days)
        if (earned) setStamp({ milestone: earned, days })
      }
      await load()
    } catch (err) {
      setError(errorText(err, 'That did not go through. Please try again.'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <SafeAreaView style={s.fill} edges={['top', 'left', 'right']}>
      <Stamp
        milestone={stamp?.milestone}
        daysWorked={stamp?.days}
        onClose={() => setStamp(null)}
      />
      <AppBar
        title={t('myWork.todayShift')}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined}
        right={(
          <Text style={s.link} onPress={() => navigation.navigate('AttendanceHistory')}>
            {t('attendanceHistory.title')}
          </Text>
        )}
      />
      <View style={{ padding: space.lg }}>
        <ErrorNote onRetry={load}>{error}</ErrorNote>

        {!rows ? <Loader /> : rows.length === 0 ? (
          <Card>
            <EmptyState
              icon="calendar-outline"
              title={t('dashboard.noWorkToday')}
              sub="When you are hired, your work shows here."
            />
          </Card>
        ) : rows.map((row) => (
          <PunchCard
            key={row.employmentId}
            row={row}
            busy={busy === row.employmentId}
            onPunch={punch}
            t={t}
          />
        ))}
      </View>
    </SafeAreaView>
  )
}

function PunchCard({ row, busy, onPunch, t }) {
  const minutesIn = row.status === 'CHECKED_IN' && row.checkInAt
    ? Math.round((Date.now() - new Date(row.checkInAt).getTime()) / 60000)
    : null
  // In the first minute there is nothing to count yet, and a bare dash reads
  // like an error - so it says so in words.
  const live = minutesIn === null
    ? null
    : (minutesIn < 1 ? t('myWork.justStarted') : minutesLabel(minutesIn))

  const done = row.nextAction === 'DONE' || row.nextAction === 'NONE'

  return (
    <Card style={{ marginBottom: space.md }}>
      <Text style={s.job}>{row.jobTitle}</Text>
      <Small style={{ marginTop: 2 }}>{row.businessName}</Small>

      <View style={s.meta}>
        {row.shiftStart ? (
          <Row gap={5}>
            <Ionicons name="time-outline" size={14} color={colors.muted} />
            <Small>{hhmm(row.shiftStart)} – {hhmm(row.shiftEnd)}</Small>
          </Row>
        ) : null}
        {/* The office arranges the call. Numbers are not exchanged. */}
        <AskForCall
          about={`Please arrange a call about my shift at ${row.employerName || 'this job'}.`}
          topic="WORK"
          size="sm"
          style={{ marginTop: space.sm }}
        />
      </View>
      {row.location ? (
        <Row gap={5} style={{ marginTop: 6 }} align="flex-start">
          <Ionicons name="location-outline" size={14} color={colors.muted} style={{ marginTop: 2 }} />
          <Small style={{ flex: 1 }}>{row.location}</Small>
        </Row>
      ) : null}

      <View style={s.divider} />

      {row.nextAction === 'CHECK_IN' ? (
        <Row>
          <Button title={busy ? '…' : t('myWork.checkIn')} icon="play" tone="success"
            loading={busy} full={false} style={{ minWidth: 190 }}
            onPress={() => onPunch(row, 'IN')} />
          <Small style={{ flex: 1 }}>{row.nextActionLabel || t('myWork.tapWhenReach')}</Small>
        </Row>
      ) : null}

      {row.nextAction === 'CHECK_OUT' ? (
        <>
          <View style={s.live}>
            <View style={s.dot} />
            <View style={{ flex: 1 }}>
              <Small>{t('myWork.youStartedAt')} {timeOnly(row.checkInAt)}</Small>
              <Text style={s.liveValue}>{live || row.workedLabel}</Text>
            </View>
          </View>
          <Row>
            <Button title={busy ? '…' : t('myWork.checkOut')} icon="checkmark-circle" tone="danger"
              loading={busy} full={false} style={{ minWidth: 190 }}
              onPress={() => onPunch(row, 'OUT')} />
            <Small style={{ flex: 1 }}>{row.nextActionLabel}</Small>
          </Row>
        </>
      ) : null}

      {done ? (
        <View style={s.done}>
          <Ionicons name="checkmark-circle" size={26} color={colors.greenText} />
          <View style={{ flex: 1 }}>
            <Text style={s.doneTitle}>{row.nextActionLabel || t('myWork.doneForToday')}</Text>
            {row.checkInAt ? (
              <Small style={{ marginTop: 2 }}>
                {timeOnly(row.checkInAt)} – {timeOnly(row.checkOutAt)}
                {row.workedLabel ? ` · ${row.workedLabel}` : ''}
              </Small>
            ) : null}
          </View>
        </View>
      ) : null}

      {row.approvalLabel && row.status !== 'NOT_CHECKED_IN' ? (
        <Badge
          label={row.approvalLabel}
          tone={row.approvalStatus === 'APPROVED' || row.approvalStatus === 'AUTO_APPROVED'
            ? 'green' : row.approvalStatus === 'REJECTED' ? 'red' : 'orange'}
          style={{ marginTop: space.md }}
        />
      ) : null}
    </Card>
  )
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  link: { fontSize: 13.5, fontWeight: '700', color: colors.blue },
  job: { fontSize: 17, fontWeight: '800', color: colors.ink },
  meta: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    marginTop: space.md, flexWrap: 'wrap',
  },
  call: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto',
    backgroundColor: colors.blueSoft, borderRadius: radius.pill,
    paddingHorizontal: space.md, paddingVertical: 6,
  },
  callText: { fontSize: 12.5, fontWeight: '700', color: colors.blueDark },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: space.lg },
  live: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    backgroundColor: colors.blueSoft, borderRadius: radius.md,
    padding: space.md, marginBottom: space.md,
  },
  dot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.green },
  liveValue: { fontSize: 19, fontWeight: '800', color: colors.ink, marginTop: 2 },
  done: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    backgroundColor: colors.greenSoft, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.greenLine, padding: space.lg,
  },
  doneTitle: { fontSize: 16, fontWeight: '700', color: colors.greenText },
})
