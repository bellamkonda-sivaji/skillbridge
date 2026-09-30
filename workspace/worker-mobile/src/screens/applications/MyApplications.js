import React, { useCallback, useMemo, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import {
  Badge, Button, EmptyState, ErrorNote, H2, Loader, SegTabs, Small, pay, timeAgo, workerPay,
} from '../../ui'
import * as appsApi from '../../api/applications'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

export const STATUS_TONE = {
  APPLIED: 'orange', PENDING: 'orange', VIEWED: 'blue', SHORTLISTED: 'violet',
  INTERVIEW: 'violet', INTERVIEW_SCHEDULED: 'violet', SELECTED: 'green',
  OFFERED: 'green', HIRED: 'green', REJECTED: 'red', WITHDRAWN: 'grey',
}

export const statusLabel = (status, t) => {
  const map = {
    APPLIED: t('applications.pending'), PENDING: t('applications.pending'),
    VIEWED: t('applications.pending'), SHORTLISTED: t('applications.shortlisted'),
    INTERVIEW: t('applications.interview'), INTERVIEW_SCHEDULED: t('applications.interview'),
    SELECTED: t('applications.selected'), OFFERED: t('applications.selected'),
    HIRED: t('applications.selected'), REJECTED: t('applications.rejected'),
    WITHDRAWN: 'Taken back',
  }
  return map[status] || status
}

/** Everywhere they have applied, and what is happening with each. */
export default function MyApplications({ navigation }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState(null)
  const [tab, setTab] = useState('ALL')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await appsApi.listApplications()
      setRows(Array.isArray(d) ? d : d?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load your applications.'))
      setRows([])
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const filtered = useMemo(() => {
    if (!rows) return []
    if (tab === 'ALL') return rows
    if (tab === 'PENDING') return rows.filter((r) => ['APPLIED', 'PENDING', 'VIEWED'].includes(r.status))
    if (tab === 'SHORTLISTED') return rows.filter((r) => r.status === 'SHORTLISTED')
    if (tab === 'INTERVIEW') return rows.filter((r) => String(r.status).startsWith('INTERVIEW'))
    return rows.filter((r) => ['SELECTED', 'OFFERED', 'HIRED'].includes(r.status))
  }, [rows, tab])

  const count = (fn) => (rows ? rows.filter(fn).length : 0)

  return (
    <SafeAreaView style={s.fill} edges={['top', 'left', 'right']}>
      <View style={s.head}>
        <View style={s.headRow}>
          <H2>{t('applications.title')}</H2>
          <Pressable style={s.offersBtn} onPress={() => navigation.navigate('Offers')}>
            <Ionicons name="mail-outline" size={17} color={colors.blue} />
            <Text style={s.offersText}>{t('offers.title')}</Text>
          </Pressable>
        </View>
        <SegTabs
          tabs={[
            { value: 'ALL', label: `${t('applications.all')} (${rows?.length || 0})` },
            { value: 'PENDING', label: `${t('applications.pending')} (${count((r) => ['APPLIED', 'PENDING', 'VIEWED'].includes(r.status))})` },
            { value: 'SHORTLISTED', label: `${t('applications.shortlisted')} (${count((r) => r.status === 'SHORTLISTED')})` },
            { value: 'SELECTED', label: `${t('applications.selected')} (${count((r) => ['SELECTED', 'OFFERED', 'HIRED'].includes(r.status))})` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {!rows ? <Loader /> : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={{ padding: space.lg }}
          ListHeaderComponent={<ErrorNote onRetry={load}>{error}</ErrorNote>}
          renderItem={({ item }) => {
            const job = item.job || item
            return (
              <Pressable
                style={({ pressed }) => [s.row, pressed && { opacity: 0.8 }]}
                onPress={() => navigation.navigate('ApplicationDetails', { id: item.id })}
              >
                <View style={s.thumb}>
                  <Ionicons name="briefcase-outline" size={22} color={colors.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.title} numberOfLines={1}>{job.title || item.jobTitle}</Text>
                  <Small numberOfLines={1}>{job.businessName || item.businessName}</Small>
                  <Text style={s.pay}>{pay(workerPay(job), job.salaryUnit)}</Text>
                  <Small style={{ marginTop: 4 }}>
                    {t('applications.appliedAgo')} {timeAgo(item.appliedAt)}
                  </Small>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                  <Badge label={statusLabel(item.status, t)} tone={STATUS_TONE[item.status] || 'grey'} />
                  <Ionicons name="chevron-forward" size={19} color={colors.muted} />
                </View>
              </Pressable>
            )
          }}
          ListEmptyComponent={!error ? (
            <EmptyState
              icon="document-text-outline"
              title={t('applications.none')}
              sub={t('jobs.noJobsSub')}
              action={<Button title={t('dashboard.findWork')}
                onPress={() => navigation.navigate('JobsTab')} />}
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
  headRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: space.md,
  },
  offersBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.blueSoft,
    paddingHorizontal: space.md, height: 38, borderRadius: radius.pill,
  },
  offersText: { fontSize: 13, fontWeight: '700', color: colors.blue },
  row: {
    flexDirection: 'row', gap: space.md, backgroundColor: colors.white,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line,
    padding: space.md, marginBottom: space.md,
  },
  thumb: {
    width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.blueSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
  pay: { fontSize: 14.5, fontWeight: '800', color: colors.greenText, marginTop: 4 },
})
