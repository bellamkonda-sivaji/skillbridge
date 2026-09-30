import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { AppBar, Body, Button, ErrorNote, H1, Screen, Small, Spacer, Steps } from '../../ui'
import { colors, radius, space } from '../../theme'

const DOCS = [
  { key: 'registration', icon: 'document-text-outline', titleKey: 'registration', subKey: 'registrationSub' },
  { key: 'shopProof', icon: 'storefront-outline', titleKey: 'shopProof' },
  { key: 'ownerId', icon: 'card-outline', titleKey: 'ownerId' },
]

/**
 * Verification, and the choice to skip it.
 *
 * A verified badge gets a business more applicants, which is the honest reason
 * to do it - so that is what the screen says, rather than implying the account
 * is blocked without it. Nothing here is required.
 */
export default function Verification({ navigation }) {
  const { t } = useTranslation()
  const [uploaded, setUploaded] = useState({})
  const [error, setError] = useState('')

  const pick = async (key) => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) { setError('We need permission to open your photos.'); return }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 })
      if (!result.canceled) setUploaded((u) => ({ ...u, [key]: result.assets[0].uri }))
    } catch {
      setError('We could not open your photos.')
    }
  }

  return (
    <Screen
      padded={false}
      bg={colors.white}
      footer={(
        <Button title={t('common.continue')} iconRight="arrow-forward"
          onPress={() => navigation.navigate('PlanPricing')} />
      )}
    >
      <AppBar
        onBack={navigation.goBack}
        right={(
          <Text style={s.skip} onPress={() => navigation.navigate('PlanPricing')}>
            {t('business.skipForNow')}
          </Text>
        )}
      />
      <View style={{ paddingHorizontal: space.lg }}>
        <Steps total={4} current={2} labels={['Business', 'Verify', 'Plan', 'Done']} />
        <H1 style={{ marginTop: space.md }}>{t('business.verifyTitle')}</H1>
        <Body style={{ marginTop: 5, marginBottom: space.lg }}>{t('business.verifySub')}</Body>

        <ErrorNote>{error}</ErrorNote>

        {DOCS.map((d) => {
          const done = Boolean(uploaded[d.key])
          return (
            <Pressable key={d.key} onPress={() => pick(d.key)}
              style={({ pressed }) => [s.doc, done && s.docDone, pressed && { opacity: 0.85 }]}>
              <View style={[s.docIcon, done && { backgroundColor: colors.greenSoft }]}>
                <Ionicons name={done ? 'checkmark' : d.icon} size={21}
                  color={done ? colors.greenText : colors.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.docTitle}>{t(`business.${d.titleKey}`)}</Text>
                {d.subKey ? <Small style={{ marginTop: 2 }}>{t(`business.${d.subKey}`)}</Small> : null}
              </View>
              <View style={[s.uploadBtn, done && { backgroundColor: colors.greenSoft }]}>
                <Text style={[s.uploadText, done && { color: colors.greenText }]}>
                  {done ? t('business.uploaded') : t('business.upload')}
                </Text>
              </View>
            </Pressable>
          )
        })}

        <Spacer h={space.lg} />
        <View style={s.note}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.greenText} />
          <Small style={{ flex: 1, color: colors.greenText }}>
            Verified businesses get more applications. You can add these any time.
          </Small>
        </View>
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  skip: { fontSize: 14, fontWeight: '700', color: colors.blue },
  doc: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.lg,
    padding: space.lg, marginBottom: space.md, backgroundColor: colors.white,
  },
  docDone: { borderColor: colors.greenLine, backgroundColor: colors.greenSoft },
  docIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: colors.blueSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  docTitle: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
  uploadBtn: {
    backgroundColor: colors.blueSoft, borderRadius: radius.pill,
    paddingHorizontal: space.md, paddingVertical: 8,
  },
  uploadText: { fontSize: 13, fontWeight: '700', color: colors.blue },
  note: {
    flexDirection: 'row', gap: space.sm, alignItems: 'center',
    backgroundColor: colors.greenSoft, borderRadius: radius.md, padding: space.md,
  },
})
