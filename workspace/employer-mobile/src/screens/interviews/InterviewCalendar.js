import React, { useCallback, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Avatar, Badge, Card, EmptyState, ErrorNote, H3, Loader, Row, Small,
  formatDate, isoDay, timeOnly,
} from '../../ui'
import * as interviewsApi from '../../api/interviews'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

const MODE_LABEL = { PHONE: 'Phone call', IN_PERSON: 'At the shop', VIDEO: 'Video call' }

/**
 * The week ahead, as a strip of days rather than a grid.
 *
 * A month grid on a 390pt screen gives each day about 50pt - too small to show
 * anything useful. A strip of seven days with the day's list underneath shows
 * the same information and stays readable.
 */
export default function InterviewCalendar({ navigation }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState(null)
  const [day, setDay] = useState(isoDay())
  const [error, setError] = useState('')

  const days = useMemo(() => {
    const out = []
    const base = new Date()
    for (let i = -1; i < 6; i += 1) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      out.push(d)
    }
    return out
  }, [])

  const load = useCallback(async () => {
    setError('')
    try {
      const from = isoDay(days[0])
      const to = isoDay(days[days.length - 1])
      const d = await interviewsApi.list(from, to)
      setRows(Array.isArray(d) ? d : d?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load your calendar.'))
      setRows([])
    }
  }, [days])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const forDay = (rows || []).filter((r) => String(r.scheduledAt || '').slice(0, 10) === day)
  const countFor = (d) => (rows || [])
    .filter((r) => String(r.scheduledAt || '').slice(0, 10) === isoDay(d)).length

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <AppBar title={t('interviews.title')}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined} />

      <View style={s.strip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.lg }}>
          {days.map((d) => {
            const key = isoDay(d)
            const on = key === day
            const n = countFor(d)
            return (
              <Pressable key={key} onPress={() => setDay(key)} style={[s.day, on && s.dayOn]}>
                <Text style={[s.dayName, on && { color: colors.blueDark }]}>
                  {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                </Text>
                <Text style={[s.dayNum, on && { color: colors.blueDark }]}>{d.getDate()}</Text>
                <View style={[s.pip, n > 0 && s.pipOn]} />
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg }}>
        <ErrorNote onRetry={load}>{error}</ErrorNote>
        <H3 style={{ marginBottom: space.md }}>{formatDate(day)}</H3>

        {!rows ? <Loader /> : forDay.length ? forDay.map((r) => (
          <Card key={r.id} style={{ marginBottom: space.md }}
            onPress={() => navigation.navigate('ApplicantProfile', {
              workerId: r.workerId, applicationId: r.applicationId, jobId: r.jobId,
            })}>
            <Row align="flex-start">
              <View style={s.time}>
                <Text style={s.timeText}>{timeOnly(r.scheduledAt)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{r.workerName}</Text>
                <Small style={{ marginTop: 2 }}>{r.jobTitle}</Small>
                <Row gap={6} style={{ marginTop: 7 }}>
                  <Badge label={MODE_LABEL[r.mode] || r.mode} tone="violet" />
                  {r.status ? <Badge label={r.status} tone="grey" /> : null}
                </Row>
              </View>
              <Avatar name={r.workerName} size={40} />
            </Row>
          </Card>
        )) : (
          <Card>
            <EmptyState icon="calendar-outline" title={t('interviews.none')}
              sub="Arrange a call or a visit from an applicant's profile." />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  strip: {
    paddingVertical: space.md, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  day: {
    width: 58, paddingVertical: space.sm, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.line, alignItems: 'center', gap: 2, backgroundColor: colors.white,
  },
  dayOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  dayName: { fontSize: 11.5, color: colors.muted, textTransform: 'uppercase', fontWeight: '600' },
  dayNum: { fontSize: 19, fontWeight: '800', color: colors.ink },
  pip: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent', marginTop: 3 },
  pipOn: { backgroundColor: colors.green },
  time: {
    backgroundColor: colors.blueSoft, borderRadius: radius.sm,
    paddingHorizontal: space.sm, paddingVertical: 6,
  },
  timeText: { fontSize: 12.5, fontWeight: '800', color: colors.blueDark },
  name: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
})
