import React, { useCallback, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Avatar, Badge, Body, Button, Card, EmptyState, ErrorNote, H2, H3, Loader, Small, money,
} from '../ui'
import JobCard from '../ui/JobCard'
import { hhmm } from '../ui/format'
import * as jobsApi from '../api/jobs'
import * as attendanceApi from '../api/attendance'
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
 * The home screen answers one question first: do I have work today?
 *
 * If there is a shift on, that card comes before the counters and the job
 * list, because someone opening the app at 8am needs the punch button, not a
 * summary of how many places they have applied to.
 */
export default function Dashboard({ navigation }) {
  const { t } = useTranslation()
  const { user } = useSession()
  const [data, setData] = useState(null)
  const [today, setToday] = useState([])
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const [dash, shifts] = await Promise.all([
        jobsApi.dashboard(),
        attendanceApi.today().catch(() => []),
      ])
      setData(dash)
      setToday(Array.isArray(shifts) ? shifts : [])
    } catch (err) {
      setError(errorText(err, 'We could not load your home screen.'))
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  const firstName = String(data?.greetingName || user?.name || '').split(' ')[0] || 'there'
  const recommended = data?.recommendedJobs || data?.matches || []

  if (!data && !error) return <SafeAreaView style={s.fill}><Loader label={t('common.loading')} /></SafeAreaView>

  return (
    <SafeAreaView style={s.fill} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Small>{t(`dashboard.${greetingKey()}`)},</Small>
            <H2 style={{ marginTop: 2 }}>{firstName} 👋</H2>
            {data?.locationLabel || user?.city ? (
              <View style={s.place}>
                <Ionicons name="location-outline" size={13} color={colors.muted} />
                <Small>{data?.locationLabel || user.city}</Small>
              </View>
            ) : null}
          </View>
          {/* Between the name and the avatar, where the screenshot asked for it:
              reachable on the first screen, without reading any English. */}
          <LanguagePicker style={{ marginRight: space.sm }} />
          {/* The avatar is where a thumb goes looking for "me". Leaving it
              inert makes the whole header feel dead. */}
          <Pressable
            onPress={() => navigation.navigate('ProfileTab')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('tabs.profile')}
            style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
          >
            <Avatar name={user?.name} uri={user?.photoUrl} size={44} />
          </Pressable>
        </View>

        <ErrorNote onRetry={load}>{error}</ErrorNote>

        <Pressable style={s.search} onPress={() => navigation.navigate('JobsTab')}>
          <Ionicons name="search" size={19} color={colors.muted} />
          <Small style={{ fontSize: 14.5 }}>{t('dashboard.searchHint')}</Small>
        </Pressable>

        {/* The promo band from the designs. It is not decoration: it is the one
            place that tells a new worker what filling in their profile buys
            them, which is the single biggest lever on match quality. */}
        {(data?.profileCompletion ?? 0) < 100 ? (
        <LinearGradient
          colors={[colors.blue, '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.promo}
        >
          <View style={{ flex: 1 }}>
            <Text style={s.promoTitle}>{t('dashboard.promoTitle')}</Text>
            <Text style={s.promoSub}>
              {data?.profileCompletionHint || t('dashboard.promoSub')}
            </Text>
            <Pressable
              style={s.promoBtn}
              onPress={() => navigation.navigate('ProfileTab')}
            >
              <Text style={s.promoBtnText}>{t('dashboard.promoAction')}</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.blueDark} />
            </Pressable>
          </View>
          <Ionicons name="trending-up" size={54} color="rgba(255,255,255,0.35)" />
        </LinearGradient>
        ) : null}

        {/* Work today comes first - it is the only thing that is time-critical. */}
        {today.length > 0 ? (
          <Card style={s.todayCard} padded>
            <View style={s.todayHead}>
              <Badge label={t('dashboard.todayWork')} tone="green" />
            </View>
            {today.map((row) => (
              <Pressable
                key={row.employmentId}
                style={s.todayRow}
                onPress={() => navigation.navigate('MyWorkTab', { screen: 'TodayShift' })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.todayTitle}>{row.jobTitle}</Text>
                  <Small style={{ marginTop: 2 }}>{row.businessName}</Small>
                  {row.shiftStart ? (
                    <View style={s.place}>
                      <Ionicons name="time-outline" size={13} color={colors.muted} />
                      <Small>{hhmm(row.shiftStart)} – {hhmm(row.shiftEnd)}</Small>
                    </View>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </Pressable>
            ))}
          </Card>
        ) : null}

        <View style={s.tiles}>
          <Tile tone={colors.greenSoft} fg={colors.greenText} icon="briefcase-outline"
            value={data?.jobsNearYou ?? recommended.length ?? 0} label={t('dashboard.jobsNearYou')}
            onPress={() => navigation.navigate('JobsTab')} />
          <Tile tone={colors.blueSoft} fg={colors.blueDark} icon="document-text-outline"
            value={data?.applicationsCount ?? 0} label={t('dashboard.applied')}
            onPress={() => navigation.navigate('ApplicationsTab')} />
          <Tile tone={colors.violetSoft} fg={colors.violet} icon="chatbubbles-outline"
            value={data?.interviewsCount ?? 0} label={t('dashboard.interviews')}
            onPress={() => navigation.navigate('MyWorkTab', { screen: 'Interviews' })} />
          <Tile tone={colors.orangeSoft} fg={colors.orangeText} icon="wallet-outline"
            value={money(data?.earnings ?? 0)} label={t('dashboard.earnings')}
            onPress={() => navigation.navigate('ProfileTab', { screen: 'Earnings' })} />
        </View>

        <View style={s.sectionHead}>
          <H3>{t('dashboard.recommended')}</H3>
          <Text style={s.link} onPress={() => navigation.navigate('JobsTab')}>
            {t('common.viewAll')}
          </Text>
        </View>

        {recommended.length ? (
          recommended.slice(0, 5).map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onPress={() => navigation.navigate('JobsTab', {
                screen: 'JobDetails', params: { jobId: job.id },
              })}
            />
          ))
        ) : (
          <Card>
            <EmptyState
              icon="briefcase-outline"
              title={t('jobs.noJobs')}
              sub={t('jobs.noJobsSub')}
              action={<Button title={t('dashboard.findWork')} onPress={() => navigation.navigate('JobsTab')} />}
            />
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
  fill: { flex: 1, backgroundColor: colors.bg },
  promo: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    borderRadius: radius.lg, padding: space.lg, marginBottom: space.lg,
  },
  promoTitle: { fontSize: 17, fontWeight: '800', color: colors.white, lineHeight: 23 },
  promoSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4, lineHeight: 18 },
  promoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: colors.white, borderRadius: 999,
    paddingHorizontal: space.md, paddingVertical: 7, marginTop: space.md,
  },
  promoBtnText: { fontSize: 12.5, fontWeight: '800', color: colors.blueDark },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.lg },
  place: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line,
    paddingHorizontal: space.md, minHeight: 50, marginBottom: space.lg,
  },
  todayCard: { marginBottom: space.lg, borderColor: colors.greenLine, backgroundColor: colors.greenSoft },
  todayHead: { marginBottom: space.md },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 6 },
  todayTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginBottom: space.lg },
  tile: {
    width: '47%', backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.line, padding: space.md, gap: 5,
  },
  tileIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tileValue: { fontSize: 22, fontWeight: '800', color: colors.ink },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: space.md,
  },
  link: { fontSize: 13.5, fontWeight: '700', color: colors.blue },
})
