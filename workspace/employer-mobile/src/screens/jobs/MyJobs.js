import React, { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import {
  Badge, Button, EmptyState, ErrorNote, H2, Loader, Row, SegTabs, Small, money, timeAgo,
} from '../../ui'
import Photo from '../../ui/Photo'
import { workArt } from '../../ui/workArt'
import * as jobsApi from '../../api/jobs'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'
import { word } from '../../ui/words'

const TONE = {
  OPEN: 'green', ACTIVE: 'green', PAUSED: 'orange',
  FILLED: 'blue', CLOSED: 'grey', DRAFT: 'grey',
}

export default function MyJobs({ navigation }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState(null)
  const [tab, setTab] = useState('ALL')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await jobsApi.listJobs('ALL')
      setRows(Array.isArray(d) ? d : d?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load your jobs.'))
      setRows([])
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const filtered = (rows || []).filter((j) => {
    if (tab === 'ALL') return true
    if (tab === 'ACTIVE') return ['OPEN', 'ACTIVE'].includes(j.status)
    return j.status === tab
  })
  const count = (fn) => (rows ? rows.filter(fn).length : 0)

  return (
    <SafeAreaView style={s.fill} edges={['top', 'left', 'right']}>
      <View style={s.head}>
        <Row style={{ marginBottom: space.md }}>
          <H2 style={{ flex: 1 }}>{t('jobs.title')}</H2>
          <Button title={t('dashboard.postJob')} icon="add" size="sm" full={false}
            onPress={() => navigation.navigate('PostJob')} />
        </Row>
        <SegTabs
          tabs={[
            { value: 'ALL', label: `${t('common.all')} (${rows?.length || 0})` },
            { value: 'ACTIVE', label: `${t('jobs.active')} (${count((j) => ['OPEN', 'ACTIVE'].includes(j.status))})` },
            { value: 'PAUSED', label: `${t('jobs.paused')} (${count((j) => j.status === 'PAUSED')})` },
            { value: 'FILLED', label: `${t('jobs.filled')} (${count((j) => j.status === 'FILLED')})` },
            { value: 'DRAFT', label: `${t('jobs.draft')} (${count((j) => j.status === 'DRAFT')})` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {!rows ? <Loader /> : (
        <FlatList
          data={filtered}
          keyExtractor={(j) => String(j.id)}
          contentContainerStyle={{ padding: space.lg }}
          ListHeaderComponent={<ErrorNote onRetry={load}>{error}</ErrorNote>}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}
              onPress={() => navigation.navigate('JobManagement', { jobId: item.id })}
            >
              <Row align="flex-start">
                <Photo uri={item.photoUrl || item.employerLogoUrl} art={workArt(item)}
                  size={48} radius={12} />
                <View style={{ flex: 1 }}>
                  <Text style={s.title} numberOfLines={1}>{item.title}</Text>
                  <Small style={{ marginTop: 2 }}>
                    {[item.area, item.city].filter(Boolean).join(', ')}
                  </Small>
                  <Row gap={space.sm} style={{ marginTop: 7 }}>
                    <Badge label={word(t, item.status)} tone={TONE[item.status] || 'grey'} />
                    <Small>{item.applicationsCount ?? item.applicantsCount ?? 0} {t('jobs.applicants')}</Small>
                  </Row>
                  <Row gap={space.md} style={{ marginTop: 7 }}>
                    <Text style={s.pay}>{money(item.salary)}</Text>
                  </Row>
                  {item.postedAt ? (
                    <Small style={{ marginTop: 5 }}>{t('jobs.posted')} {timeAgo(item.postedAt)}</Small>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={19} color={colors.muted} />
              </Row>
            </Pressable>
          )}
          ListEmptyComponent={!error ? (
            <EmptyState
              icon="briefcase-outline"
              title={t('jobs.noJobs')}
              sub={t('jobs.noJobsSub')}
              action={<Button title={t('dashboard.postJob')} onPress={() => navigation.navigate('PostJob')} />}
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
  card: {
    backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.line, padding: space.md, marginBottom: space.md,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.ink },
  pay: { fontSize: 15, fontWeight: '800', color: colors.ink },
})
