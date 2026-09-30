import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { AppBar, Body, Button, H1, Screen, Small } from '../ui'
import { colors, radius, space } from '../theme'

/**
 * This is the worker app, so there is no real choice to make here - the screen
 * exists to tell someone who downloaded the wrong one, and to send them to the
 * employer app rather than leaving them stuck in a sign-up that will not fit.
 */
export default function AccountType({ navigation }) {
  const { t } = useTranslation()
  return (
    <Screen
      footer={<Button title={t('common.continue')} iconRight="arrow-forward"
        onPress={() => navigation.navigate('CreateAccount')} />}
      bg={colors.white}
      padded={false}
    >
      <AppBar onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <H1>I am joining as</H1>
        <Body style={{ marginTop: 6, marginBottom: space.xl }}>
          This app is for people looking for work.
        </Body>

        <View style={s.selected}>
          <View style={s.icon}><Ionicons name="person" size={26} color={colors.white} /></View>
          <View style={{ flex: 1 }}>
            <Body style={s.title}>Worker</Body>
            <Small style={{ marginTop: 3 }}>Looking for jobs near me</Small>
            <View style={{ marginTop: space.md, gap: 6 }}>
              {['Find work close to home', 'Apply with one tap', 'Mark your attendance', 'Get paid safely']
                .map((line) => (
                  <View key={line} style={s.tick}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.green} />
                    <Small style={{ color: colors.body }}>{line}</Small>
                  </View>
                ))}
            </View>
          </View>
        </View>

        <View style={s.other}>
          <Ionicons name="storefront-outline" size={22} color={colors.orangeText} />
          <View style={{ flex: 1 }}>
            <Body style={{ fontWeight: '700', color: colors.ink }}>Are you hiring?</Body>
            <Small style={{ marginTop: 2 }}>
              Business owners use the JobOn for Employers app to post work and hire.
            </Small>
          </View>
        </View>
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  selected: {
    flexDirection: 'row', gap: space.md, borderWidth: 2, borderColor: colors.blue,
    backgroundColor: colors.blueSoft, borderRadius: radius.lg, padding: space.lg,
  },
  icon: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: colors.blue,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink },
  tick: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  other: {
    flexDirection: 'row', gap: space.md, alignItems: 'flex-start',
    backgroundColor: colors.orangeSoft, borderRadius: radius.md,
    padding: space.lg, marginTop: space.lg,
  },
})
