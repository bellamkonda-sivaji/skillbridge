import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { AppBar, Body, Button, H1, Screen } from '../ui'
import { LANGUAGES, setLanguage } from '../i18n'
import { colors, radius, space } from '../theme'

/**
 * Language comes before the account.
 *
 * Each option is written in its own script - the English word "Telugu" is
 * exactly what a Telugu-only reader cannot read. The choice applies at once,
 * so they see the app in their language before committing to it.
 */
export default function Language({ navigation, route }) {
  const { t, i18n } = useTranslation()
  const [picked, setPicked] = useState(i18n.language || 'en')
  const nextScreen = route?.params?.next || 'CreateAccount'

  const choose = async (code) => {
    setPicked(code)
    await setLanguage(code)
  }

  return (
    <Screen
      padded={false}
      footer={<Button title={t('common.continue')} iconRight="arrow-forward"
        onPress={() => navigation.navigate(nextScreen)} />}
      bg={colors.white}
    >
      <AppBar onBack={navigation.canGoBack() ? navigation.goBack : undefined} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <View style={s.globe}><Ionicons name="globe-outline" size={28} color={colors.blue} /></View>
        <H1 style={{ marginTop: space.lg }}>{t('language.title')}</H1>
        <Body style={{ marginTop: 6, marginBottom: space.lg }}>{t('language.sub')}</Body>

        {LANGUAGES.map((l) => {
          const on = picked === l.code
          return (
            <Pressable
              key={l.code}
              onPress={() => choose(l.code)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={({ pressed }) => [s.row, on && s.rowOn, pressed && { opacity: 0.8 }]}
            >
              <Text style={s.flag}>{l.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.native, on && { color: colors.blueDark }]}>{l.native}</Text>
                {l.native !== l.english ? <Text style={s.english}>{l.english}</Text> : null}
              </View>
              <View style={[s.radio, on && s.radioOn]}>
                {on ? <Ionicons name="checkmark" size={15} color={colors.white} /> : null}
              </View>
            </Pressable>
          )
        })}
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  globe: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.blueSoft,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    borderWidth: 2, borderColor: colors.line, borderRadius: radius.md,
    padding: space.lg, marginBottom: space.md, minHeight: 68,
  },
  rowOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  flag: { fontSize: 24 },
  native: { fontSize: 18, fontWeight: '700', color: colors.ink },
  english: { fontSize: 12.5, color: colors.muted, marginTop: 1 },
  radio: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOn: { backgroundColor: colors.blue, borderColor: colors.blue },
})
