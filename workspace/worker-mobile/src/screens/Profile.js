import * as ImagePicker from 'expo-image-picker'
import React, { useCallback, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import {
  Avatar, Badge, Body, Card, ErrorNote, H2, ListRow, ProgressBar, Row, Screen,
  Small, Spacer,
} from '../ui'
import { LANGUAGES, setLanguage } from '../i18n'
import * as profileApi from '../api/profile'
import * as jobsApi from '../api/jobs'
import { errorText } from '../api/client'
import { useSession } from '../session/SessionProvider'
import { colors, radius, space } from '../theme'

/** The account screen: who they are, and the way out. */
export default function Profile({ navigation }) {
  const { t, i18n } = useTranslation()
  const { signOut, updateUser, user } = useSession()
  const [profile, setProfile] = useState(null)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      // The profile endpoint's `profileCompleted` is a yes/no. The percentage
      // and its hint only exist on the dashboard, so the figure comes from
      // there rather than from coercing a boolean into a number.
      const [me, dash] = await Promise.all([
        profileApi.getProfile(),
        jobsApi.dashboard().catch(() => null),
      ])
      setProfile(me)
      setProgress(dash)
    } catch (err) {
      setError(errorText(err, 'We could not load your profile.'))
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const completion = Number(progress?.profileCompletion ?? 0)
  const completionHint = progress?.profileCompletionHint
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

  const changePhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) return
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1],
        quality: 0.4, base64: true,
      })
      if (res.canceled || !res.assets?.[0]?.base64) return
      const a = res.assets[0]
      const dataUrl = `data:${a.mimeType || 'image/jpeg'};base64,${a.base64}`
      // Paint it immediately, then save. Waiting on the network to show a
      // picture the person just chose feels broken on a slow connection.
      setProfile((prev) => (prev ? { ...prev, photoUrl: dataUrl } : prev))
      await profileApi.saveOnboardingStep({ step: 'BASIC', photoUrl: dataUrl })
      updateUser({ photoUrl: dataUrl })
    } catch {
      // Keeping the old picture is the right failure here; nothing is lost.
      load()
    }
  }

  return (
    <Screen padded={false}>
      <View style={s.header}>
        <Row>
          {/* Changing the picture should not mean going back through
              onboarding, which is where it used to be the only option. */}
          <Pressable onPress={changePhoto} hitSlop={6}
            accessibilityRole="button" accessibilityLabel={t('profile.changePhoto')}
            style={({ pressed }) => (pressed ? { opacity: 0.75 } : null)}>
            <Avatar uri={profile?.photoUrl} name={name} size={66} />
            <View style={s.camera}>
              <Ionicons name="camera" size={13} color={colors.white} />
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <H2>{name}</H2>
            {profile?.jobTitle ? <Small style={{ marginTop: 2 }}>{profile.jobTitle}</Small> : null}
            <Row gap={6} style={{ marginTop: 6 }}>
              {profile?.verificationStatus === 'VERIFIED'
                ? <Badge label={t('jobs.verified')} tone="green" /> : null}
              {profile?.city ? <Small>{profile.city}</Small> : null}
            </Row>
          </View>
        </Row>
      </View>

      <View style={{ paddingHorizontal: space.lg }}>
        <ErrorNote onRetry={load}>{error}</ErrorNote>

        {completion > 0 && completion < 100 ? (
          <Card style={{ marginBottom: space.lg }}>
            <Row>
              <View style={s.ring}>
                <Text style={s.ringText}>{completion}%</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.completionTitle}>{t('profile.completion')}</Text>
                <Small style={{ marginTop: 2 }}>
                  {completionHint || t('profile.completionSub')}
                </Small>
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
          {/* Help sits above Settings on purpose: someone in trouble over their
              wages should reach a person before they reach a preferences list. */}
          <ListRow icon="help-buoy-outline" title={t('help.title')}
            sub={t('help.sub')}
            onPress={() => navigation.navigate('Help')} />
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
  camera: {
    position: 'absolute', right: -2, bottom: -2,
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.blue, borderWidth: 2, borderColor: colors.white,
  },
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
