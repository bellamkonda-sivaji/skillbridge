import React, { useState } from 'react'
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import {
  AppBar, Card, H3, ListRow, Row, Screen, Small, Spacer,
} from '../ui'
import { LANGUAGES, setLanguage } from '../i18n'
import { useSession } from '../session/SessionProvider'
import { colors, radius, space } from '../theme'
import { Dialog } from '../ui/Dialog'
import client, { errorText } from '../api/client'

// The policies live on the website; Play asks that they can be reached from the app.
const WEBSITE = 'https://jobon.mindsyncos.com'

/**
 * Settings.
 *
 * Language is first and shown in its own script, because it is the setting
 * most likely to be needed by someone who cannot read the rest of the screen.
 */
export default function Settings({ navigation }) {
  const { t, i18n } = useTranslation()
  const { signOut } = useSession()

  // Play requires deleting the account from inside the app. Asked twice: it cannot be undone.
  const deleteAccount = () => {
    Dialog.alert('Delete your account?',
      'Your name, phone number, photo, address, documents and payment details are removed and you are signed out. This cannot be undone.',
      [
        { text: 'Keep my account', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => Dialog.alert('Are you sure?', 'Your account will be deleted right now.', [
            { text: 'No, go back', style: 'cancel' },
            {
              text: 'Yes, delete it',
              style: 'destructive',
              onPress: async () => {
                try {
                  await client.delete('/worker/account')
                  Dialog.alert('Account deleted', 'Your account and personal details have been removed. Thank you for using LocalWork.',
                    [{ text: 'OK', onPress: signOut }], { tone: 'success' })
                } catch (err) {
                  Dialog.alert('We could not delete it yet', errorText(err, 'Please try again.'))
                }
              },
            },
          ]),
        },
      ])
  }
  const [alerts, setAlerts] = useState({ jobs: true, applications: true, pay: true })

  const toggle = (k) => setAlerts((a) => ({ ...a, [k]: !a[k] }))

  const confirmLogout = () => {
    Dialog.alert(t('profile.logoutAsk'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.logout'), style: 'destructive', onPress: signOut },
    ])
  }

  return (
    <Screen padded={false}>
      <AppBar title={t('settings.title')} onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <H3 style={{ marginBottom: space.sm }}>{t('settings.language')}</H3>
        <Card padded={false} style={{ paddingHorizontal: space.lg }}>
          {LANGUAGES.map((l, i) => {
            const on = i18n.language === l.code
            return (
              <View key={l.code}>
                {i > 0 ? <View style={s.divider} /> : null}
                <Pressable onPress={() => setLanguage(l.code)} style={s.langRow}
                  accessibilityRole="radio" accessibilityState={{ selected: on }}>
                  <Text style={s.flag}>{l.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.native, on && { color: colors.blueDark }]}>{l.native}</Text>
                    {l.native !== l.english ? <Small>{l.english}</Small> : null}
                  </View>
                  <View style={[s.radio, on && s.radioOn]}>
                    {on ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
                  </View>
                </Pressable>
              </View>
            )
          })}
        </Card>

        <H3 style={{ marginTop: space.xl, marginBottom: space.sm }}>{t('settings.notifications')}</H3>
        <Card padded={false} style={{ paddingHorizontal: space.lg }}>
          <AlertRow label={t('settings.jobAlerts')} value={alerts.jobs} onChange={() => toggle('jobs')} />
          <View style={s.divider} />
          <AlertRow label={t('settings.applicationAlerts')} value={alerts.applications}
            onChange={() => toggle('applications')} />
          <View style={s.divider} />
          <AlertRow label={t('settings.payAlerts')} value={alerts.pay} onChange={() => toggle('pay')} />
        </Card>
        <Small style={{ marginTop: 6 }}>
          These are kept on this phone. Turning one off stops that kind of alert here.
        </Small>

        <H3 style={{ marginTop: space.xl, marginBottom: space.sm }}>{t('settings.account')}</H3>
        <Card padded={false} style={{ paddingHorizontal: space.lg }}>
          <ListRow icon="person-outline" title={t('settings.editProfile')}
            onPress={() => navigation.navigate('BasicInfo')} />
          <View style={s.divider} />
          <ListRow icon="card-outline" title={t('settings.payoutMethods')}
            onPress={() => navigation.navigate('PayoutMethods')} />
          <View style={s.divider} />
          <ListRow icon="star-outline" title={t('reviews.title')}
            onPress={() => navigation.navigate('Reviews')} />
        </Card>

        <Card style={{ marginTop: space.xl, paddingHorizontal: space.lg }} padded={false}>
          <ListRow icon="document-text-outline" title="Terms of Service"
            onPress={() => Linking.openURL(`${WEBSITE}/legal/terms`)} />
          <View style={s.divider} />
          <ListRow icon="shield-checkmark-outline" title="Privacy Policy"
            onPress={() => Linking.openURL(`${WEBSITE}/legal/privacy`)} />
          <View style={s.divider} />
          <ListRow icon="trash-outline" tone={colors.redText} title="Delete my account"
            sub="Remove your account and personal details" right={null} onPress={deleteAccount} />
        </Card>

        <Card style={{ marginTop: space.xl, paddingHorizontal: space.lg }} padded={false}>
          <ListRow icon="information-circle-outline" title={t('settings.about')}
            sub={`${t('settings.version')} ${Constants.expoConfig?.version || '1.0.0'}`}
            right={null} onPress={() => {}} />
          <View style={s.divider} />
          <ListRow icon="log-out-outline" tone={colors.redText} title={t('settings.logout')}
            right={null} onPress={confirmLogout} />
        </Card>

        <Spacer h={space.xxl} />
      </View>
    </Screen>
  )
}

const AlertRow = ({ label, value, onChange }) => (
  <Row style={{ paddingVertical: space.md, minHeight: 54 }}>
    <Text style={s.alertLabel}>{label}</Text>
    <Switch value={value} onValueChange={onChange}
      trackColor={{ true: colors.blue, false: colors.line }} />
  </Row>
)

const s = StyleSheet.create({
  divider: { height: 1, backgroundColor: colors.line },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  flag: { fontSize: 22 },
  native: { fontSize: 16, fontWeight: '700', color: colors.ink },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  alertLabel: { flex: 1, fontSize: 15, color: colors.ink, fontWeight: '600' },
})
