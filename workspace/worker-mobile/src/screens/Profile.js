import React, { useCallback, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import {
  Avatar, Badge, Body, Card, ErrorNote, H2, ListRow, ProgressBar, Row, Screen,
  Small, Spacer,
} from '../ui'
import { LANGUAGES, setLanguage } from '../i18n'
import * as profileApi from '../api/profile'
import { errorText } from '../api/client'
import { useSession } from '../session/SessionProvider'
import { colors, radius, space } from '../theme'

/** The account screen: who they are, and the way out. */
export default function Profile({ navigation }) {
  const { t, i18n } = useTranslation()
  const { user, signOut } = useSession()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try { setProfile(await profileApi.getProfile()) } catch (err) {
      setError(errorText(err, 'We could not load your profile.'))
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const completion = profile?.completionPercent ?? profile?.profileCompletion ?? 40
  const name = profile?.name || user?.name || ''

  const cycleLanguage = async () => {
    const i = LANGUAGES.findIndex((l) => l.code === i18n.language)
    const next = LANGUAGES[(i + 1) % LANGUAGES.length]
    await setLanguage(next.code)
  }

  const confirmLogout = () => {
    Alert.alert(t('profile.logoutAsk'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: signOut },
    ])
  }

  return (
    <Screen padded={false}>
      <View style={s.header}>
        <Row>
          <Avatar uri={profile?.photoUrl} name={name} size={66} />
          <View style={{ flex: 1 }}>
            <H2>{name}</H2>
            {profile?.jobTitle ? <Small style={{ marginTop: 2 }}>{profile.jobTitle}</Small> : null}
            <Row gap={6} style={{ marginTop: 6 }}>
              {profile?.verified ? <Badge label={t('jobs.verified')} tone="green" /> : null}
              {profile?.city ? <Small>{profile.city}</Small> : null}
            </Row>
          </View>
        </Row>
      </View>

      <View style={{ paddingHorizontal: space.lg }}>
        <ErrorNote onRetry={load}>{error}</ErrorNote>

        {completion < 100 ? (
          <Card style={{ marginBottom: space.lg }}>
            <Row>
              <View style={s.ring}>
                <Text style={s.ringText}>{completion}%</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.completionTitle}>{t('profile.completion')}</Text>
                <Small style={{ marginTop: 2 }}>{t('profile.completionSub')}</Small>
              </View>
            </Row>
            <View style={{ marginTop: space.md }}>
              <ProgressBar value={completion} />
            </View>
          </Card>
        ) : null}

        <Card padded={false} style={{ paddingHorizontal: space.lg }}>
          <ListRow icon="person-outline" title={t('profile.personal')}
            onPress={() => navigation.navigate('BasicInfo')} />
          <Divider />
          <ListRow icon="construct-outline" title={t('profile.skills')}
            sub={(profile?.skills || []).slice(0, 3).join(', ') || undefined}
            onPress={() => navigation.navigate('SkillsStep')} />
          <Divider />
          <ListRow icon="location-outline" title={t('profile.location')}
            sub={[profile?.area, profile?.city].filter(Boolean).join(', ') || undefined}
            onPress={() => navigation.navigate('LocationStep')} />
          <Divider />
          <ListRow icon="heart-outline" title={t('jobs.saved')}
            onPress={() => navigation.navigate('SavedJobs')} />
          <Divider />
          <ListRow icon="wallet-outline" title={t('earnings.title')}
            onPress={() => navigation.navigate('Earnings')} />
          <Divider />
          <ListRow icon="notifications-outline" title={t('notifications.title')}
            onPress={() => navigation.navigate('Messages')} />
          <Divider />
          <ListRow icon="calendar-outline" title={t('interviews.title')}
            onPress={() => navigation.navigate('Interviews')} />
          <Divider />
          <ListRow icon="checkbox-outline" title={t('attendanceHistory.title')}
            onPress={() => navigation.navigate('AttendanceHistory')} />
          <Divider />
          <ListRow icon="card-outline" title={t('payouts.title')}
            onPress={() => navigation.navigate('PayoutMethods')} />
          <Divider />
          <ListRow icon="star-outline" title={t('reviews.title')}
            onPress={() => navigation.navigate('Reviews')} />
          <Divider />
          <ListRow
            icon="language-outline"
            title={t('profile.languagePref')}
            sub={LANGUAGES.find((l) => l.code === i18n.language)?.native}
            onPress={cycleLanguage}
          />
          <Divider />
          <ListRow icon="settings-outline" title={t('settings.title')}
            onPress={() => navigation.navigate('Settings')} />
        </Card>

        <Card style={{ marginTop: space.lg, paddingHorizontal: space.lg }} padded={false}>
          <ListRow
            icon="log-out-outline"
            tone={colors.redText}
            title={t('profile.logout')}
            right={null}
            onPress={confirmLogout}
          />
        </Card>

        <Spacer h={space.xxl} />
      </View>
    </Screen>
  )
}

const Divider = () => <View style={s.divider} />

const s = StyleSheet.create({
  header: {
    backgroundColor: colors.white, padding: space.lg, paddingTop: space.xl,
    borderBottomWidth: 1, borderBottomColor: colors.line, marginBottom: space.lg,
  },
  ring: {
    width: 54, height: 54, borderRadius: 27, borderWidth: 4, borderColor: colors.blue,
    alignItems: 'center', justifyContent: 'center',
  },
  ringText: { fontSize: 14, fontWeight: '800', color: colors.blueDark },
  completionTitle: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
  divider: { height: 1, backgroundColor: colors.line },
})
