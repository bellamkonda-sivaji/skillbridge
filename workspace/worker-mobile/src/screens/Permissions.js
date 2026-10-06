import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { Body, Button, Card, H1, Screen, Small } from '../ui'
import Listen from '../ui/Listen'
import LanguagePicker from '../ui/LanguagePicker'
import {
  askLocation, askNotifications, askPhone, markAsked,
} from '../permissions/ask'
import { colors, radius, space } from '../theme'

/**
 * The first screen after install: what the app will ask for, and why.
 *
 * Android's own dialogs are two words and a Deny button. Shown cold they get
 * refused, and a refusal is permanent in practice - nobody goes digging in
 * Settings afterwards. So this explains each one in a sentence first, in the
 * person's own language, with a Listen button for anyone who would rather hear
 * it, and only then fires the system prompts one after another.
 *
 * Nothing here blocks: "Not now" moves on and the app works, with worse
 * ranking and no alerts. The screen never appears again either way.
 */

const ITEMS = [
  { key: 'alerts', icon: 'notifications-outline' },
  { key: 'place', icon: 'location-outline' },
  { key: 'calls', icon: 'call-outline' },
]

export default function Permissions({ navigation }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)

  const finish = async () => {
    await markAsked()
    navigation.replace('Splash')
  }

  // One after another, not all at once: Android queues them anyway, and a
  // person can only read one dialog at a time.
  const allow = async () => {
    setBusy(true)
    try {
      await askNotifications()
      await askLocation()
      await askPhone()
    } finally {
      setBusy(false)
      await finish()
    }
  }

  const spoken = [t('perm.heading'), t('perm.sub')]
    .concat(ITEMS.map((i) => `${t(`perm.${i.key}Title`)}. ${t(`perm.${i.key}Body`)}`))
    .join('. ')

  return (
    <Screen
      padded={false}
      bg={colors.white}
      footer={
        <>
          <Button title={t('perm.allow')} icon="checkmark" onPress={allow} loading={busy} />
          <Button title={t('perm.later')} tone="quiet" onPress={finish} style={{ marginTop: space.sm }} />
        </>
      }
    >
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        {/* Language first: everything below is unreadable until it is right. */}
        <View style={s.langRow}><LanguagePicker /></View>

        <H1 style={{ marginTop: space.lg }}>{t('perm.heading')}</H1>
        <Body style={{ marginTop: 6 }}>{t('perm.sub')}</Body>
        <Listen style={{ marginTop: space.md }} text={spoken} />

        {ITEMS.map((i) => (
          <Card key={i.key} style={{ marginTop: space.md }} padded>
            <View style={s.row}>
              <View style={s.icon}>
                <Ionicons name={i.icon} size={24} color={colors.blue} />
              </View>
              <View style={s.flex}>
                <Body style={s.title}>{t(`perm.${i.key}Title`)}</Body>
                <Small style={{ marginTop: 2 }}>{t(`perm.${i.key}Body`)}</Small>
              </View>
            </View>
          </Card>
        ))}

        <Small style={{ marginTop: space.lg }}>{t('perm.changeLater')}</Small>
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  langRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  title: { fontWeight: '800', color: colors.ink },
  icon: {
    width: 48, height: 48, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft,
  },
})
