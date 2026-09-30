import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Button, Body, H1, Small } from '../ui'
import { colors, space } from '../theme'

/**
 * The first thing a business owner sees.
 *
 * It says what the app is for in one line, in a language they have not chosen
 * yet, and gets out of the way. Everything past this point is translated.
 */
export default function Splash({ navigation }) {
  const { t } = useTranslation()
  return (
    <LinearGradient colors={[colors.white, colors.blueSoft]} style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top', 'bottom']}>
        <View style={s.body}>
          <View style={s.brandRow}>
            <View style={s.mark}><Ionicons name="business" size={26} color={colors.white} /></View>
            <Text style={s.word}>
              <Text style={s.wordA}>Job</Text><Text style={s.wordB}>On</Text>
            </Text>
          </View>
          <Small style={s.tagline}>{t('splash.tagline')}</Small>

          <View style={s.art}>
            {['storefront-outline', 'people-outline', 'cash-outline'].map((n, i) => (
              <View key={n} style={[s.artBubble, i === 1 && s.artBubbleBig]}>
                <Ionicons name={n} size={i === 1 ? 44 : 32} color={colors.blue} />
              </View>
            ))}
          </View>

          <H1 style={s.headline}>{t('splash.headline')}</H1>
          <Body style={s.sub}>{t('splash.sub')}</Body>
        </View>

        <View style={s.footer}>
          <Button
            title={t('splash.getStarted')}
            iconRight="arrow-forward"
            onPress={() => navigation.navigate('Language')}
          />
          <View style={s.loginRow}>
            <Small>{t('splash.haveAccount')} </Small>
            <Text style={s.loginLink} onPress={() => navigation.navigate('Login')}>
              {t('splash.logIn')}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  mark: {
    width: 46, height: 46, borderRadius: 13, backgroundColor: colors.blue,
    alignItems: 'center', justifyContent: 'center',
  },
  word: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  wordA: { color: colors.blueDark },
  wordB: { color: colors.orange },
  tagline: { marginTop: space.sm, textAlign: 'center' },
  art: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginVertical: space.xxxl },
  artBubble: {
    width: 74, height: 74, borderRadius: 37, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  artBubbleBig: { width: 96, height: 96, borderRadius: 48 },
  headline: { textAlign: 'center', fontSize: 27 },
  sub: { textAlign: 'center', marginTop: space.md },
  footer: { paddingHorizontal: space.xl, paddingBottom: space.lg, gap: space.md },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginLink: { fontSize: 13, fontWeight: '700', color: colors.blue },
})
