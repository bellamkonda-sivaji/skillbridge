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
import { modeLabel, modeTone } from '../../ui/interviewMode'
import * as interviewsApi from '../../api/interviews'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'


/** 9am to 6pm, which is when these actually happen. */
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
const HOUR_HEIGHT = 62
const COL_WIDTH = 108

/**
 * The week, as a grid of days against hours.
 *
 * This is the layout from the designs, and it earns its place: a shop owner
 * arranging a second visit needs to see the gaps, and a list of appointments
 * shows the appointments but not the space between them. It scrolls sideways
 * rather than squeezing seven columns onto a phone, because a column too
 * narrow to read a name in compares nothing.
 *
 * The day list is kept as a second view for anyone who just wants "what is on
 * today".
 */
export default function InterviewCalendar({ navigation }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState(null)
  const [view, setView] = useState('WEEK')
  const [day, setDay] = useState(isoDay())
  const [error, setError] = useState('')
  const gridRef = useRef(null)

  // Monday of the current week, so the grid always starts where a week starts.
  const days = useMemo(() => {
    const base = new Date()
    const monday = new Date(base)
    monday.setDate(base.getDate() - ((base.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i); return d
    })
  }, [])

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await interviewsApi.list(isoDay(days[0]), isoDay(days[6]))
      setRows(Array.isArray(d) ? d : d?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load your calendar.'))
      setRows([])
    }
  }, [days])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const at = (r) => new Date(r.scheduledAt || r.startsAt || 0)
  const forDay = (rows || []).filter((r) => String(r.scheduledAt || '').slice(0, 10) === day)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <AppBar
        title={t('interviews.title')}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined}
        right={(
          <Pressable hitSlop={10} onPress={() => navigation.navigate('ApplicantsTab', { screen: 'Applications' })}>
            <Ionicons name="add-circle-outline" size={24} color={colors.blue} />
          </Pressable>
        )}
      />
      <View style={s.tabsBar}>
        <SegTabs
          tabs={[
            { value: 'WEEK', label: t('interviews.week') },
            { value: 'DAY', label: t('interviews.today') },
          ]}
          value={view}
          onChange={setView}
        />
      </View>

      {!rows ? <Loader /> : view === 'WEEK' ? (
        <ScrollView>
          <ErrorNote onRetry={load}>{error}</ErrorNote>
          <ScrollView horizontal showsHorizontalScrollIndicator ref={gridRef}>
            <View style={{ flexDirection: 'row', paddingBottom: space.xxl }}>
              {/* The hour gutter stays with the grid so the rows line up. */}
              <View style={s.gutter}>
                <View style={s.headCell} />
                {HOURS.map((h) => (
                  <View key={h} style={s.hourCell}>
                    <Text style={s.hourText}>
                      {h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}
                    </Text>
                  </View>
                ))}
              </View>

              {days.map((d) => {
                const key = isoDay(d)
                const today = key === isoDay()
                const items = (rows || []).filter(
                  (r) => String(r.scheduledAt || '').slice(0, 10) === key,
                )
                return (
                  <View key={key} style={s.col}>
                    <Pressable
                      style={[s.headCell, s.colHead, today && s.colHeadToday]}
                      onPress={() => { setDay(key); setView('DAY') }}
                    >
                      <Text style={[s.dayName, today && { color: colors.blueDark }]}>
                        {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                      </Text>
                      <Text style={[s.dayNum, today && { color: colors.blueDark }]}>
                        {d.getDate()}
                      </Text>
                    </Pressable>

                    <View style={{ height: HOURS.length * HOUR_HEIGHT }}>
                      {HOURS.map((h) => <View key={h} style={s.slot} />)}

                      {items.map((r, i) => {
                        const when = at(r)
                        const hour = when.getHours() + when.getMinutes() / 60
                        const top = (hour - HOURS[0]) * HOUR_HEIGHT
                        if (top < 0 || top > HOURS.length * HOUR_HEIGHT) return null
                        return (
                          <Pressable
                            key={r.id ?? `iv-${i}`}
                            style={[s.block, {
                              top,
                              backgroundColor: modeTone(r.mode)[1],
                              borderLeftColor: modeTone(r.mode)[0],
                            }]}
                            onPress={() => navigation.navigate('ApplicantProfile', {
                              workerId: r.workerId, applicationId: r.applicationId, jobId: r.jobId,
                            })}
                          >
                            <Text style={s.blockName} numberOfLines={1}>{r.workerName}</Text>
                            <Text style={s.blockMeta} numberOfLines={1}>{timeOnly(r.scheduledAt)}</Text>
                            <Text style={s.blockMeta} numberOfLines={1}>{modeLabel(r)}</Text>
                          </Pressable>
                        )
                      })}
                    </View>
                  </View>
                )
              })}
            </View>
          </ScrollView>

          {rows.length === 0 ? (
            <View style={{ padding: space.lg }}>
              <Card>
                <EmptyState icon="calendar-outline" title={t('interviews.none')}
                  sub="Arrange a call or a visit from an applicant's profile." />
              </Card>
            </View>
          ) : null}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: space.lg }}>
          <ErrorNote onRetry={load}>{error}</ErrorNote>
          <H3 style={{ marginBottom: space.md }}>{formatDate(day)}</H3>
          {forDay.length ? forDay.map((r, i) => (
            <Card key={r.id ?? `d-${i}`} style={{ marginBottom: space.md }}
              onPress={() => navigation.navigate('ApplicantProfile', {
                workerId: r.workerId, applicationId: r.applicationId, jobId: r.jobId,
              })}>
              <Row align="flex-start">
                <View style={s.time}><Text style={s.timeText}>{timeOnly(r.scheduledAt)}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{r.workerName}</Text>
                  <Small style={{ marginTop: 2 }}>{r.jobTitle}</Small>
                  <Row gap={6} style={{ marginTop: 7 }}>
                    <Badge label={modeLabel(r)} tone="violet" />
                    {r.status ? <Badge label={r.status} tone="grey" /> : null}
                  </Row>
                </View>
                <Avatar uri={r.photoUrl} name={r.workerName} size={40} />
              </Row>
            </Card>
          )) : (
            <Card>
              <EmptyState icon="calendar-outline" title={t('interviews.none')}
                sub="Nothing arranged for this day." />
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
  gutter: { width: 58, backgroundColor: colors.white },
  headCell: { height: 56, justifyContent: 'center', alignItems: 'center' },
  hourCell: {
    height: HOUR_HEIGHT, alignItems: 'flex-end', paddingRight: 6, paddingTop: 2,
    borderTopWidth: 1, borderTopColor: colors.line,
  },
  hourText: { fontSize: 10.5, color: colors.muted, fontWeight: '600' },
  col: { width: COL_WIDTH, borderLeftWidth: 1, borderLeftColor: colors.line },
  colHead: { backgroundColor: colors.white, gap: 1 },
  colHeadToday: { backgroundColor: colors.blueSoft },
  dayName: { fontSize: 11, color: colors.muted, textTransform: 'uppercase', fontWeight: '700' },
  dayNum: { fontSize: 17, fontWeight: '800', color: colors.ink },
  slot: { height: HOUR_HEIGHT, borderTopWidth: 1, borderTopColor: colors.line },
  block: {
    position: 'absolute', left: 3, right: 3, minHeight: HOUR_HEIGHT - 8,
    borderRadius: 8, borderLeftWidth: 3, padding: 6, justifyContent: 'center',
  },
  blockName: { fontSize: 11.5, fontWeight: '800', color: colors.ink },
  blockMeta: { fontSize: 10, color: colors.body, marginTop: 1 },
  time: {
    backgroundColor: colors.blueSoft, borderRadius: radius.sm,
    paddingHorizontal: space.sm, paddingVertical: 6,
  },
  timeText: { fontSize: 12.5, fontWeight: '800', color: colors.blueDark },
  name: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
})
