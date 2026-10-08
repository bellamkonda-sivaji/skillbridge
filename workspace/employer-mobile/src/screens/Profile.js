import React, { useCallback, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import {
  Avatar, Badge, Card, ErrorNote, H2, ListRow, Row, Screen, Small, Spacer,
} from '../ui'
import { LANGUAGES, setLanguage } from '../i18n'
import * as profileApi from '../api/profile'
import { errorText } from '../api/client'
import { useSession } from '../session/SessionProvider'
import { colors, space } from '../theme'

export default function Profile({ navigation }) {
  const { t, i18n } = useTranslation()
  const { user, signOut } = useSession()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try { setProfile(await profileApi.getProfile()) } catch (err) {
      setError(errorText(err, 'We could not load your business.'))
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const name = profile?.businessName || user?.name || ''

  const cycleLanguage = async () => {
    const i = LANGUAGES.findIndex((l) => l.code === i18n.language)
    await setLanguage(LANGUAGES[(i + 1) % LANGUAGES.length].code)
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
          {/* The shop front, if one was uploaded during verification. It is
              the one picture a business has that means anything to a worker. */}
          <Avatar name={name} uri={profile?.logoUrl || profile?.photoUrl} size={64} />
          <View style={{ flex: 1 }}>
            <H2>{name}</H2>
            {profile?.businessType ? <Small style={{ marginTop: 2 }}>{profile.businessType}</Small> : null}
            <Row gap={6} style={{ marginTop: 6 }}>
              {profile?.verified ? <Badge label="Verified" tone="green" /> : null}
              {profile?.city ? <Small>{[profile.area, profile.city].filter(Boolean).join(', ')}</Small> : null}
            </Row>
          </View>
        </Row>
      </View>

      <View style={{ paddingHorizontal: space.lg }}>
        <ErrorNote onRetry={load}>{error}</ErrorNote>

        <Card padded={false} style={{ paddingHorizontal: space.lg }}>
          <ListRow icon="storefront-outline" title={t('profile.title')}
            sub={name} onPress={() => navigation.navigate('BusinessDetails')} />
          <Divider />
          <ListRow icon="shield-checkmark-outline" title={t('business.verifyTitle')}
            onPress={() => navigation.navigate('Verification')} />
          <Divider />
          <ListRow icon="pricetag-outline" title={t('profile.plan')}
            sub={profile?.plan || 'Free'} onPress={() => navigation.navigate('PlanPricing')} />
          <Divider />
          <ListRow icon="cash-outline" title={t('profile.billing')}
            onPress={() => navigation.navigate('TeamTab', { screen: 'Payroll' })} />
          <Divider />
          <ListRow icon="calendar-outline" title={t('interviews.title')}
            onPress={() => navigation.navigate('InterviewCalendar')} />
          <Divider />
          <ListRow icon="mail-outline" title={t('offers.tracking')}
            onPress={() => navigation.navigate('OfferTracking')} />
          <Divider />
          <ListRow icon="notifications-outline" title={t('notifications.title')}
            onPress={() => navigation.navigate('Notifications')} />
          <Divider />
          <ListRow icon="star-outline" title={t('empReviews.title')}
            onPress={() => navigation.navigate('Reviews')} />
          <Divider />
          <ListRow
            icon="language-outline"
            title={t('profile.languagePref')}
            sub={LANGUAGES.find((l) => l.code === i18n.language)?.native}
            onPress={cycleLanguage}
          />
          <Divider />
          {/* Above Settings, for the same reason as in the worker app: a shop
              owner chasing a problem should reach a person, not a preferences list. */}
          <ListRow icon="help-buoy-outline" title={t('help.title')}
            sub={t('help.sub')}
            onPress={() => navigation.navigate('Help')} />
          <Divider />
          <ListRow icon="settings-outline" title={t('settings.title')}
            onPress={() => navigation.navigate('Settings')} />
        </Card>

        <Card style={{ marginTop: space.lg, paddingHorizontal: space.lg }} padded={false}>
          <ListRow icon="log-out-outline" tone={colors.redText} title={t('profile.logout')}
            right={null} onPress={confirmLogout} />
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
  divider: { height: 1, backgroundColor: colors.line },
})
