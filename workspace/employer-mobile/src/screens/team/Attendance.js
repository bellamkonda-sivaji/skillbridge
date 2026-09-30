import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Avatar, Badge, Button, Card, EmptyState, ErrorNote, H3, Loader, Row,
  SegTabs, Small, formatDate, isoDay, timeOnly,
} from '../../ui'
import * as teamApi from '../../api/team'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

/**
 * A day of attendance, and the corrections waiting on the owner.
 *
 * Short engagements need the employer to confirm the day; longer ones do not,
 * and this screen only ever asks about the ones that do - so the list here is
 * short by design rather than a full timesheet to audit.
 */
export default function Attendance({ navigation }) {
  const { t } = useTranslation()
  const [day, setDay] = useState(isoDay())
  const [rows, setRows] = useState(null)
  const [requests, setRequests] = useState([])
  const [tab, setTab] = useState('day')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const stripRef = useRef(null)

  const days = useMemo(() => {
    const out = []
    const base = new Date()
    for (let i = -6; i <= 0; i += 1) {
      const d = new Date(base); d.setDate(base.getDate() + i); out.push(d)
    }
    return out
  }, [])

  const load = useCallback(async () => {
    setError('')
    try {
      const [list, reqs] = await Promise.all([
        teamApi.attendanceDay(day),
        teamApi.requests().catch(() => []),
      ])
      setRows(Array.isArray(list) ? list : list?.rows || list?.content || [])
      setRequests(Array.isArray(reqs) ? reqs : reqs?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load attendance.'))
      setRows([])
    }
  }, [day])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const act = async (id, fn) => {
    setBusy(id)
    try { await fn(); await load() } catch (err) { setError(errorText(err)) } finally { setBusy(null) }
  }

  const pending = (rows || []).filter((r) => r.approvalStatus === 'PENDING')

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <AppBar title={t('team.attendance')}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined} />

      <View style={s.tabsBar}>
        <SegTabs
          tabs={[
            { value: 'day', label: t('team.attendance') },
            { value: 'requests', label: `${t('team.corrections')} (${requests.length})` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {tab === 'day' ? (
        <>
          <View style={s.strip}>
            {/* The strip runs back a week, so it has to open scrolled to today -
                otherwise it lands on last Thursday and looks like no one has
                marked anything. */}
            <ScrollView
              ref={stripRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              onContentSizeChange={() => stripRef.current?.scrollToEnd({ animated: false })}
              contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.lg }}
            >
              {days.map((d) => {
                const key = isoDay(d)
                const on = key === day
                return (
                  <Pressable key={key} onPress={() => { setDay(key); setRows(null) }}
                    style={[s.day, on && s.dayOn]}>
                    <Text style={[s.dayName, on && { color: colors.blueDark }]}>
                      {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </Text>
                    <Text style={[s.dayNum, on && { color: colors.blueDark }]}>{d.getDate()}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={{ padding: space.lg }}>
            <ErrorNote onRetry={load}>{error}</ErrorNote>
            <H3 style={{ marginBottom: space.md }}>{formatDate(day)}</H3>

            {pending.length > 1 ? (
              <Button
                title={`${t('team.approveAll')} (${pending.length})`}
                tone="success"
                style={{ marginBottom: space.md }}
                onPress={() => act('all', () => teamApi.approveAll(day))}
                loading={busy === 'all'}
              />
            ) : null}

            {!rows ? <Loader /> : rows.length ? rows.map((r) => (
              <Card key={r.id || r.attendanceId} style={{ marginBottom: space.md }}>
                <Row align="flex-start">
                  <Avatar name={r.workerName} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{r.workerName}</Text>
                    <Small style={{ marginTop: 2 }}>{r.jobTitle}</Small>
                    <Small style={{ marginTop: 4 }}>
                      {r.checkInAt ? `${timeOnly(r.checkInAt)} – ${r.checkOutAt ? timeOnly(r.checkOutAt) : '…'}` : '—'}
                      {r.workedLabel ? ` · ${r.workedLabel}` : ''}
                    </Small>
                  </View>
                  <Badge
                    label={r.approvalLabel || r.approvalStatus || r.status}
                    tone={['APPROVED', 'AUTO_APPROVED'].includes(r.approvalStatus) ? 'green'
                      : r.approvalStatus === 'REJECTED' ? 'red' : 'orange'}
                  />
                </Row>
                {r.approvalStatus === 'PENDING' ? (
                  <Row style={{ marginTop: space.md }}>
                    <Button title={t('team.approve')} tone="success" size="sm" style={{ flex: 2 }}
                      loading={busy === r.id}
                      onPress={() => act(r.id, () => teamApi.approve(r.id))} />
                    <Button title={t('team.rejectDay')} tone="dangerQuiet" size="sm" style={{ flex: 1 }}
                      onPress={() => act(r.id, () => teamApi.reject(r.id))} />
                  </Row>
                ) : null}
              </Card>
            )) : (
              <Card>
                <EmptyState icon="calendar-outline" title={t('team.noAttendance')}
                  sub="When your team marks attendance, it shows here." />
              </Card>
            )}
          </ScrollView>
        </>
      ) : (
        <ScrollView contentContainerStyle={{ padding: space.lg }}>
          <ErrorNote onRetry={load}>{error}</ErrorNote>
          {requests.length ? requests.map((q) => (
            <Card key={q.id} style={{ marginBottom: space.md }}>
              <Row align="flex-start">
                <View style={s.reqIcon}>
                  <Ionicons name="alert-circle-outline" size={19} color={colors.orangeText} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{q.workerName}</Text>
                  <Small style={{ marginTop: 2 }}>{q.typeLabel || q.type}</Small>
                  <Small style={{ marginTop: 4 }}>{formatDate(q.workDate)}</Small>
                  {q.reason ? <Small style={{ marginTop: 4 }}>“{q.reason}”</Small> : null}
                </View>
              </Row>
              <Row style={{ marginTop: space.md }}>
                <Button title={t('team.approve')} tone="success" size="sm" style={{ flex: 2 }}
                  loading={busy === q.id}
                  onPress={() => act(q.id, () => teamApi.approveRequest(q.id, {}))} />
                <Button title={t('team.rejectDay')} tone="dangerQuiet" size="sm" style={{ flex: 1 }}
                  onPress={() => act(q.id, () => teamApi.rejectRequest(q.id))} />
              </Row>
            </Card>
          )) : (
            <Card>
              <EmptyState icon="checkmark-circle-outline" title="Nothing to review"
                sub="Change requests from your team appear here." />
            </Card>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  tabsBar: {
    paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  strip: {
    paddingVertical: space.md, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  day: {
    width: 56, paddingVertical: space.sm, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.line, alignItems: 'center', backgroundColor: colors.white,
  },
  dayOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  dayName: { fontSize: 11.5, color: colors.muted, textTransform: 'uppercase', fontWeight: '600' },
  dayNum: { fontSize: 19, fontWeight: '800', color: colors.ink, marginTop: 2 },
  name: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
  reqIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.orangeSoft,
    alignItems: 'center', justifyContent: 'center',
  },
})
