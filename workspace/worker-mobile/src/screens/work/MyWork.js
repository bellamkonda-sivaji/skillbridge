import React, { useCallback, useMemo, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import {
  Badge, Button, Card, EmptyState, ErrorNote, H2, Loader, Row, SegTabs, Small,
  formatDate, money,
} from '../../ui'
import * as offersApi from '../../api/offers'
import * as attendanceApi from '../../api/attendance'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

/** Every job they hold: running now, starting soon, or finished. */
export default function MyWork({ navigation }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState(null)
  const [today, setToday] = useState([])
  const [tab, setTab] = useState('ACTIVE')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [list, shifts] = await Promise.all([
        offersApi.employments(),
        attendanceApi.today().catch(() => []),
      ])
      setRows(Array.isArray(list) ? list : list?.content || [])
      setToday(Array.isArray(shifts) ? shifts : [])
    } catch (err) {
      setError(errorText(err, 'We could not load your work.'))
      setRows([])
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const filtered = useMemo(() => {
    if (!rows) return []
    if (tab === 'ACTIVE') return rows.filter((r) => ['ACTIVE', 'JOINED', 'ONGOING'].includes(r.status))
    if (tab === 'UPCOMING') return rows.filter((r) => ['OFFERED', 'ACCEPTED', 'UPCOMING', 'PENDING_JOIN'].includes(r.status))
    return rows.filter((r) => ['COMPLETED', 'ENDED', 'TERMINATED'].includes(r.status))
  }, [rows, tab])

  const count = (list) => (rows ? rows.filter((r) => list.includes(r.status)).length : 0)

  return (
    <SafeAreaView style={s.fill} edges={['top', 'left', 'right']}>
      <View style={s.head}>
        <H2>{t('myWork.title')}</H2>
        <View style={{ marginTop: space.md }}>
          <SegTabs
            tabs={[
              { value: 'ACTIVE', label: `${t('myWork.active')} (${count(['ACTIVE', 'JOINED', 'ONGOING'])})` },
              { value: 'UPCOMING', label: `${t('myWork.upcoming')} (${count(['OFFERED', 'ACCEPTED', 'UPCOMING', 'PENDING_JOIN'])})` },
              { value: 'COMPLETED', label: `${t('myWork.completed')} (${count(['COMPLETED', 'ENDED', 'TERMINATED'])})` },
            ]}
            value={tab}
            onChange={setTab}
          />
        </View>
      </View>

      {!rows ? <Loader /> : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={{ padding: space.lg }}
          ListHeaderComponent={(
            <>
              <ErrorNote onRetry={load}>{error}</ErrorNote>
              {today.length > 0 ? (
                <Pressable onPress={() => navigation.navigate('TodayShift')}>
                  <Card style={s.todayCard}>
                    <Row>
                      <View style={s.todayIcon}>
                        <Ionicons name="today-outline" size={21} color={colors.white} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.todayTitle}>{t('myWork.todayShift')}</Text>
                        <Small style={{ marginTop: 2 }}>
                          {today[0].jobTitle} · {today[0].nextActionLabel || ''}
                        </Small>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.greenText} />
                    </Row>
                  </Card>
                </Pressable>
              ) : null}
            </>
          )}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [s.row, pressed && { opacity: 0.85 }]}
              onPress={() => navigation.navigate('EmploymentDetails', { id: item.id })}
            >
              <View style={s.thumb}>
                <Ionicons name="briefcase-outline" size={21} color={colors.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.title} numberOfLines={1}>{item.jobTitle}</Text>
                <Small numberOfLines={1}>{item.businessName}</Small>
                <Row gap={space.sm} style={{ marginTop: 6 }}>
                  <Badge
                    label={item.status}
                    tone={['ACTIVE', 'JOINED', 'ONGOING'].includes(item.status) ? 'green' : 'grey'}
                  />
                  {item.salary ? (
                    <Small style={{ fontWeight: '700', color: colors.greenText }}>
                      {money(item.workerSalary ?? item.salary)}
                    </Small>
                  ) : null}
                </Row>
                {item.joinedAt || item.startDate ? (
                  <Small style={{ marginTop: 4 }}>
                    {t('myWork.joined')} {formatDate(item.joinedAt || item.startDate)}
                  </Small>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={19} color={colors.muted} />
            </Pressable>
          )}
          ListEmptyComponent={!error ? (
            <EmptyState
              icon="calendar-outline"
              title="Nothing here yet"
              sub="Work you are hired for will show here."
              action={<Button title={t('dashboard.findWork')} onPress={() => navigation.navigate('JobsTab')} />}
            />
          ) : null}
        />
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  head: {
    paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.md,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  todayCard: {
    marginBottom: space.lg, backgroundColor: colors.greenSoft, borderColor: colors.greenLine,
  },
  todayIcon: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
  },
  todayTitle: { fontSize: 16, fontWeight: '800', color: colors.greenText },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.white,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line,
    padding: space.md, marginBottom: space.md,
  },
  thumb: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: colors.blueSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
})
