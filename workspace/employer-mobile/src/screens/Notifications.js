import React, { useCallback, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Card, EmptyState, ErrorNote, Loader, Row, Screen, Small, Spacer, timeAgo,
} from '../ui'
import * as miscApi from '../api/misc'
import { errorText } from '../api/client'
import { colors, radius, space } from '../theme'

const ICON = {
  JOB_MATCH: ['briefcase-outline', colors.blue, colors.blueSoft],
  APPLICATION: ['document-text-outline', colors.violet, colors.violetSoft],
  INTERVIEW: ['calendar-outline', colors.violet, colors.violetSoft],
  REVIEW: ['star-outline', colors.orangeText, colors.orangeSoft],
  VERIFICATION: ['shield-checkmark-outline', colors.greenText, colors.greenSoft],
  PRICING: ['pricetag-outline', colors.orangeText, colors.orangeSoft],
  MESSAGE: ['chatbubble-outline', colors.blue, colors.blueSoft],
  SYSTEM: ['information-circle-outline', colors.body, colors.soft],
}

/**
 * Everything the platform has told this business.
 *
 * There is no employer-to-worker chat in the backend, and inventing one would
 * mean showing threads nobody can reply to. What exists is the notification
 * feed - new applications, attendance, offers answered, pricing advice - so
 * that is what this screen shows. Ringing the worker is one tap from their
 * profile, which is how hiring here actually happens.
 */
export default function Notifications({ navigation }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await miscApi.notifications()
      setRows(Array.isArray(d) ? d : d?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load your alerts.'))
      setRows([])
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const open = async (n) => {
    if (!n.read) miscApi.markRead(n.id).then(load).catch(() => {})
    // Notification links are web paths; map the ones that have a screen here.
    const link = String(n.link || '')
    const jobId = link.match(/jobs\/(\d+)/)?.[1]
    if (jobId) navigation.navigate('JobsTab', { screen: 'JobManagement', params: { jobId: Number(jobId) } })
    else if (link.includes('application')) navigation.navigate('ApplicantsTab')
    else if (link.includes('offer')) navigation.navigate('ProfileTab', { screen: 'OfferTracking' })
    else if (link.includes('attendance')) navigation.navigate('TeamTab')
  }

  const unread = (rows || []).filter((n) => !n.read).length

  return (
    <Screen padded={false}>
      <AppBar
        title={t('notifications.title')}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined}
        right={unread > 0 ? (
          <Pressable hitSlop={10} onPress={() => miscApi.markAllRead().then(load).catch(() => {})}>
            <Text style={s.markAll}>{t('notifications.markAll')}</Text>
          </Pressable>
        ) : null}
      />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <ErrorNote onRetry={load}>{error}</ErrorNote>

        {!rows ? <Loader /> : rows.length ? rows.map((n, i) => {
          const [icon, fg, bg] = ICON[n.type] || ICON.SYSTEM
          return (
            <Card key={n.id ?? `n-${i}`} onPress={() => open(n)}
              style={[{ marginBottom: space.md }, !n.read && s.unread]}>
              <Row align="flex-start">
                <View style={[s.icon, { backgroundColor: bg }]}>
                  <Ionicons name={icon} size={19} color={fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{n.title}</Text>
                  {n.body ? <Small style={{ marginTop: 3 }}>{n.body}</Small> : null}
                  <Small style={{ marginTop: 5 }}>{timeAgo(n.createdAt)}</Small>
                </View>
                {!n.read ? <View style={s.dot} /> : null}
              </Row>
            </Card>
          )
        }) : (
          <Card>
            <EmptyState
              icon="notifications-outline"
              title={t('notifications.none')}
              sub="New applications, attendance and answers to your offers show up here. To reach a worker, ring them from their profile."
            />
          </Card>
        )}

        <Spacer h={space.xxl} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  markAll: { fontSize: 13, fontWeight: '700', color: colors.blue },
  unread: { backgroundColor: colors.blueSoft, borderColor: colors.blueLine },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.blue, marginTop: 6 },
})
