import React, { useCallback, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import {
  Avatar, Badge, Body, Button, Card, EmptyState, ErrorNote, H2, H3, Loader,
  Row, Small, money, timeAgo,
} from '../ui'
import * as jobsApi from '../api/jobs'
import * as applicantsApi from '../api/applicants'
import { errorText } from '../api/client'
import { useSession } from '../session/SessionProvider'
import { colors, radius, space } from '../theme'
import LanguagePicker from '../ui/LanguagePicker'

const greetingKey = () => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

/**
 * The employer's home screen.
 *
 * Jobs that are not going to fill come first, above the counters. A dashboard
 * that leads with totals hides the one thing the owner can actually act on -
 * and acting on it is a phone call, not a report.
 */
export default function Dashboard({ navigation }) {
  const { t } = useTranslation()
  const { user } = useSession()
  const [savedDraft, setSavedDraft] = useState(null)
  const [data, setData] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const [dash, advice] = await Promise.all([
        jobsApi.dashboard(),
        jobsApi.demandAlerts().catch(() => []),
      ])
      setData(dash)
      setAlerts(Array.isArray(advice) ? advice : [])
    } catch (err) {
      setError(errorText(err, 'We could not load your dashboard.'))
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  const firstName = String(data?.greetingName || user?.name || '').split(' ')[0] || 'there'
  const recent = data?.recentApplications || []

  if (!data && !error) return <SafeAreaView style={s.fill}><Loader /></SafeAreaView>

  return (
    <SafeAreaView style={s.fill} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Row style={{ marginBottom: space.lg }}>
          <View style={{ flex: 1 }}>
            <Small>{t(`dashboard.${greetingKey()}`)},</Small>
            <H2 style={{ marginTop: 2 }}>{firstName} 👋</H2>
            <Small style={{ marginTop: 2 }}>{t('dashboard.letsBuild')}</Small>
          </View>
          {/* Between the name and the avatar, where the screenshot asked for it. */}
          <LanguagePicker style={{ marginRight: space.sm }} />
          {/* Same as the worker app: tapping the mark opens the profile. */}
          <Pressable
            onPress={() => navigation.navigate('ProfileTab')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('tabs.profile')}
            style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
          >
            <Avatar name={data?.businessName || user?.name} uri={data?.logoUrl || user?.photoUrl} size={44} />
          </Pressable>
        </Row>

        <ErrorNote onRetry={load}>{error}</ErrorNote>

        {/* An unfinished posting is the most valuable thing on this screen:
            the employer already decided to hire and was interrupted. */}
        {savedDraft ? (
          <Pressable onPress={() => navigation.navigate('PostJob')}>
            <Card style={s.draftCard} padded>
              <Row gap={space.md}>
                <View style={s.draftIcon}>
                  <Ionicons name="document-text-outline" size={20} color={colors.orangeText} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.draftTitle}>{t('post.draftWaiting')}</Text>
                  <Small style={{ marginTop: 2 }}>
                    {draftLabel(savedDraft, t)} · {t('post.stepOf', {
                      step: savedDraft.step || 1, total: 8,
                    })}
                  </Small>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Row>
            </Card>
          </Pressable>
        ) : null}

        <Row style={{ marginBottom: space.lg }}>
          <Button
            title={t('dashboard.postJob')}
            icon="add"
            onPress={() => navigation.navigate('PostJob')}
            style={{ flex: 2 }}
          />
          <Button
            title={t('findWorkers.title')}
            icon="search"
            tone="outline"
            onPress={() => navigation.navigate('FindWorkers')}
            style={{ flex: 1 }}
          />
        </Row>

        {alerts.length > 0 ? (
          <>
            <H3 style={{ marginBottom: space.md }}>{t('dashboard.needsAttention')}</H3>
            {alerts.slice(0, 3).map((a, i) => (
              <Pressable
                key={a.jobId ?? `alert-${i}`}
                onPress={() => navigation.navigate('JobManagement', { jobId: a.jobId })}
              >
                <View style={[s.alert, a.verdict === 'STALLED' ? s.alertBad : s.alertWarn]}>
                  <View style={[s.alertIcon, a.verdict === 'STALLED' ? s.alertIconBad : s.alertIconWarn]}>
                    <Ionicons
                      name={a.verdict === 'STALLED' ? 'notifications' : 'time-outline'}
                      size={17}
                      color={a.verdict === 'STALLED' ? colors.redText : colors.orangeText}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.alertTitle} numberOfLines={1}>{a.jobTitle}</Text>
                    <Small style={{ marginTop: 2 }}>{a.headline}</Small>
                    <Body style={{ fontSize: 13.5, marginTop: 4 }}>{a.detail}</Body>
                    {a.suggestedSalary > 0 ? (
                      <Button
                        title={`Raise to ${money(a.suggestedSalary)}`}
                        size="sm"
                        full={false}
                        style={{ marginTop: space.md, alignSelf: 'flex-start' }}
                        // JobManagement is in this stack already. Hopping to
                        // another tab to reach it relied on the nested
                        // navigator picking up fresh params, which it does not
                        // do once that screen is mounted - so the button did
                        // nothing at all.
                        onPress={() => navigation.navigate('JobManagement', {
                          jobId: a.jobId, raiseTo: a.suggestedSalary,
                        })}
                      />
                    ) : null}
                  </View>
                </View>
              </Pressable>
            ))}
          </>
        ) : null}

        <View style={s.tiles}>
          <Tile tone={colors.blueSoft} fg={colors.blueDark} icon="briefcase-outline"
            value={data?.activeJobs ?? 0} label={t('dashboard.activeJobs')}
            onPress={() => navigation.navigate('JobsTab')} />
          <Tile tone={colors.greenSoft} fg={colors.greenText} icon="document-text-outline"
            value={data?.applications ?? 0} label={t('dashboard.applications')}
            onPress={() => navigation.navigate('ApplicantsTab')} />
          <Tile tone={colors.orangeSoft} fg={colors.orangeText} icon="people-outline"
            value={data?.workersToday ?? data?.todayWorkers ?? 0} label={t('dashboard.todayWorkers')}
            onPress={() => navigation.navigate('TeamTab')} />
          <Tile tone={colors.violetSoft} fg={colors.violet} icon="checkmark-done-outline"
            value={data?.workersHired ?? 0} label={t('dashboard.hired')}
            onPress={() => navigation.navigate('TeamTab')} />
        </View>

        <Row style={{ marginBottom: space.md }}>
          <H3 style={{ flex: 1 }}>{t('dashboard.recentApplications')}</H3>
          <Text style={s.link} onPress={() => navigation.navigate('ApplicantsTab')}>
            {t('common.viewAll')}
          </Text>
        </Row>

        {/* Rows can arrive without an id depending on the endpoint, and two
            undefined keys are a duplicate as far as React is concerned. */}
        {recent.length ? recent.slice(0, 5).map((a, i) => (
          <Card key={a.id ?? a.applicationId ?? `recent-${i}`} style={{ marginBottom: space.md }}
            onPress={() => navigation.navigate('ApplicantsTab')}>
            <Row>
              <Avatar name={a.workerName} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{a.workerName}</Text>
                <Small style={{ marginTop: 2 }}>{a.jobTitle}</Small>
                <Small style={{ marginTop: 3 }}>{timeAgo(a.appliedAt)}</Small>
              </View>
              <Badge label={a.status === 'SHORTLISTED' ? t('applicants.shortlisted') : t('applicants.newOnes')}
                tone={a.status === 'SHORTLISTED' ? 'violet' : 'green'} />
            </Row>
          </Card>
        )) : (
          <Card>
            <EmptyState icon="people-outline" title={t('applicants.none')} sub={t('applicants.noneSub')} />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Tile({ tone, fg, icon, value, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.tile, pressed && { opacity: 0.8 }]}>
      <View style={[s.tileIcon, { backgroundColor: tone }]}>
        <Ionicons name={icon} size={19} color={fg} />
      </View>
      <Text style={s.tileValue}>{value}</Text>
      <Small numberOfLines={1}>{label}</Small>
    </Pressable>
  )
}

const s = StyleSheet.create({
  draftCard: {
    marginBottom: space.lg,
    borderWidth: 1.5, borderColor: '#FDE68A',
    backgroundColor: colors.orangeSoft,
  },
  draftIcon: {
    width: 40, height: 40, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white,
  },
  draftTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  fill: { flex: 1, backgroundColor: colors.bg },
  alert: {
    flexDirection: 'row', gap: space.md, alignItems: 'flex-start',
    borderRadius: radius.lg, borderWidth: 1, borderLeftWidth: 4,
    padding: space.lg, marginBottom: space.md,
  },
  alertWarn: { backgroundColor: colors.orangeSoft, borderColor: '#FDE68A', borderLeftColor: colors.orange },
  alertBad: { backgroundColor: colors.redSoft, borderColor: colors.redLine, borderLeftColor: colors.red },
  alertIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  alertIconWarn: { backgroundColor: '#FEF3C7' },
  alertIconBad: { backgroundColor: '#FEE2E2' },
  alertTitle: { fontSize: 15.5, fontWeight: '800', color: colors.ink },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginVertical: space.lg },
  tile: {
    width: '47%', backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.line, padding: space.md, gap: 5,
  },
  tileIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tileValue: { fontSize: 22, fontWeight: '800', color: colors.ink },
  link: { fontSize: 13.5, fontWeight: '700', color: colors.blue },
  name: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
})
