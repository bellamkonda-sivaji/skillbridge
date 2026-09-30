import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { AppBar, Body, Button, Chip, ErrorNote, Field, H1, Screen, Steps } from '../../ui'
import { EMPLOYMENT_TYPES, WORK_CATEGORIES } from '../../ui/catalog'
import { errorText } from '../../api/client'
import * as profileApi from '../../api/profile'
import { colors, radius, space } from '../../theme'

/**
 * Work type as a grid of icons.
 *
 * This is the screen that decides whether someone who cannot read finishes
 * signing up, so each tile leads with a picture and the words are a caption -
 * and the captions are translated, which a photo of a shop sign never is.
 */
export default function JobPreferences({ navigation }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language || 'en'
  const [categories, setCategories] = useState([])
  const [employment, setEmployment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const toggle = (value) =>
    setCategories((c) => (c.includes(value) ? c.filter((x) => x !== value) : [...c, value]))

  const next = async () => {
    setBusy(true); setError('')
    try {
      await profileApi.saveOnboardingStep({
        step: 'PREFERENCES',
        preferredCategories: categories,
        employmentType: employment || undefined,
      })
      navigation.navigate('SkillsStep')
    } catch (err) {
      setError(errorText(err, 'We could not save that. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen
      padded={false}
      bg={colors.white}
      footer={<Button title={t('common.continue')} iconRight="arrow-forward" onPress={next}
        loading={busy} disabled={!categories.length} />}
    >
      <AppBar onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg }}>
        <Steps total={4} current={2} labels={['You', 'Work', 'Skills', 'Place']} />
        <H1 style={{ marginTop: space.md }}>{t('onboarding.prefTitle')}</H1>
        <Body style={{ marginTop: 5, marginBottom: space.lg }}>{t('onboarding.prefSub')}</Body>

        <ErrorNote>{error}</ErrorNote>

        <View style={s.grid}>
          {WORK_CATEGORIES.map((c) => {
            const on = categories.includes(c.value)
            return (
              <Pressable
                key={c.value}
                onPress={() => toggle(c.value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={({ pressed }) => [s.tile, on && s.tileOn, pressed && { opacity: 0.8 }]}
              >
                {on ? (
                  <View style={s.tick}><Ionicons name="checkmark" size={12} color={colors.white} /></View>
                ) : null}
                <Ionicons name={c.icon} size={26} color={on ? colors.blueDark : colors.blue} />
                <Text style={[s.tileText, on && { color: colors.blueDark }]} numberOfLines={2}>
                  {c[lang] || c.en}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <Field label={t('onboarding.employmentType')} style={{ marginTop: space.xl }}>
          <View style={s.chips}>
            {EMPLOYMENT_TYPES.map((e) => (
              <Chip
                key={e.value}
                label={e[lang] || e.en}
                selected={employment === e.value}
                onPress={() => setEmployment(e.value)}
              />
            ))}
          </View>
        </Field>
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: {
    width: '31%', minHeight: 96, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center', gap: 7, padding: space.sm,
    backgroundColor: colors.white,
  },
  tileOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  tileText: { fontSize: 11.5, fontWeight: '600', color: colors.body, textAlign: 'center', lineHeight: 15 },
  tick: {
    position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
})
