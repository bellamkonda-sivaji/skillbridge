import React, { useCallback, useMemo, useState } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Badge, Card, EmptyState, ErrorNote, Loader, Row, SegTabs, Small,
  formatDate, timeOnly,
} from '../../ui'
import { modeIcon, modeLabel, modeTone } from '../../ui/interviewMode'
import * as appsApi from '../../api/applications'
import { errorText } from '../../api/client'
import { colors, space } from '../../theme'
import { word } from '../../ui/words'


/**
 * Talks and visits the worker has been invited to.
 *
 * Upcoming ones come first and past ones are a separate tab, because the only
 * question anyone opens this screen with is "where do I have to be, and when".
 */
export default function Interviews({ navigation }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState(null)
  const [tab, setTab] = useState('UPCOMING')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await appsApi.interviews()
      setRows(Array.isArray(d) ? d : d?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load your talks.'))
      setRows([])
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const { upcoming, past } = useMemo(() => {
    const now = Date.now()
    const up = []
    const done = []
    for (const r of rows || []) {
      const at = new Date(r.scheduledAt || r.startsAt || 0).getTime()
      const over = ['COMPLETED', 'CANCELLED', 'DONE'].includes(r.status) || (at && at < now)
      ;(over ? done : up).push(r)
    }
    return { upcoming: up, past: done }
  }, [rows])

  const list = tab === 'UPCOMING' ? upcoming : past

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <AppBar title={t('interviews.title')}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined} />
      <View style={s.tabs}>
        <SegTabs
          tabs={[
            { value: 'UPCOMING', label: `${t('interviews.upcoming')} (${upcoming.length})` },
            { value: 'PAST', label: `${t('interviews.past')} (${past.length})` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {!rows ? <Loader /> : (
        <FlatList
          data={list}
          keyExtractor={(r, i) => String(r.id ?? `iv-${i}`)}
          contentContainerStyle={{ padding: space.lg }}
          ListHeaderComponent={<ErrorNote onRetry={load}>{error}</ErrorNote>}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: space.md }}
              onPress={() => navigation.navigate('InterviewDetails', { id: item.id })}>
              <Row align="flex-start">
                <View style={[s.icon, { backgroundColor: modeTone(item.mode)[1] }]}>
                  <Ionicons name={modeIcon(item.mode)} size={21} color={modeTone(item.mode)[0]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{item.jobTitle}</Text>
                  <Small style={{ marginTop: 2 }}>{item.businessName}</Small>
                  <Row gap={space.sm} style={{ marginTop: 7, flexWrap: 'wrap' }}>
                    <Badge label={modeLabel(item)} tone="violet" />
                    {item.status ? <Badge label={word(t, item.status)} tone="grey" /> : null}
                  </Row>
                  <Small style={{ marginTop: 6 }}>
                    {formatDate(item.scheduledAt)} · {timeOnly(item.scheduledAt)}
                  </Small>
                </View>
                <Ionicons name="chevron-forward" size={19} color={colors.muted} />
              </Row>
            </Card>
          )}
          ListEmptyComponent={!error ? (
            <EmptyState icon="calendar-outline" title={t('interviews.none')}
              sub={t('interviews.noneSub')} />
          ) : null}
        />
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  tabs: {
    paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  icon: {
    width: 46, height: 46, borderRadius: 13, backgroundColor: colors.violetSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
})
