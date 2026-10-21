import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { AppBar, Body, Button, Chip, ErrorNote, Field, H1, Input, Screen, Small, Steps } from '../../ui'
import { CATEGORY_TITLE, EMPLOYMENT_TYPES, JOB_ROLES } from '../../ui/catalog'
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
// How long they want to work, in the words the profile stores.
const EMPLOYMENT_FOR = {
  ONE_DAY: 'DAILY', FEW_DAYS: 'DAILY', FEW_WEEKS: 'TEMPORARY', MONTHS: 'MONTHLY', PERMANENT: 'PERMANENT',
}

/** A role picked from the list, or one they typed because it was not there. */
const roleFor = (id) =>
  JOB_ROLES.find((r) => r.id === id) || { id, category: 'OTHER', emoji: '🧰', en: id.replace(/^custom:/, '') }

export default function JobPreferences({ navigation }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language || 'en'
  const [roles, setRoles] = useState([])
  const [query, setQuery] = useState('')
  const [employment, setEmployment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const toggle = (id) =>
    setRoles((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]))

  // Searches all three languages, so someone typing in Telugu still finds it.
  const q = query.trim().toLowerCase()
  const shown = useMemo(() => {
    if (!q) return JOB_ROLES
    return JOB_ROLES.filter((r) => [r.en, r.te, r.hi].some((w) => w.toLowerCase().includes(q)))
  }, [q])
  const custom = roles.filter((id) => id.startsWith('custom:')).map(roleFor)
  const canAdd = q.length > 1 && !shown.some((r) => r.en.toLowerCase() === q)

  const next = async () => {
    setBusy(true); setError('')
    try {
      // The server reads jobCategories, jobTitle and employmentTypes. The old
      // preferredCategories / employmentType keys were silently dropped, so
      // nothing chosen here was ever saved.
      const picked = roles.map(roleFor)
      await profileApi.saveOnboardingStep({
        step: 'PREFERENCES',
        jobCategories: [...new Set(picked.map((r) => r.category))],
        jobTitle: CATEGORY_TITLE[picked[0].category] || picked[0].en,
        employmentTypes: EMPLOYMENT_FOR[employment] ? [EMPLOYMENT_FOR[employment]] : undefined,
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
        loading={busy} disabled={!roles.length} />}
    >
      <AppBar onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg }}>
        <Steps total={4} current={2} labels={['You', 'Work', 'Skills', 'Place']} />
        <H1 style={{ marginTop: space.md }}>{t('onboarding.prefTitle')}</H1>
        <Body style={{ marginTop: 5, marginBottom: space.lg }}>{t('onboarding.prefSub')}</Body>

        <ErrorNote>{error}</ErrorNote>

        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search work - driver, cook, electrician…"
          prefix={<Ionicons name="search" size={18} color={colors.muted} />}
          style={{ marginBottom: space.md }}
        />

        {roles.length > 0 ? (
          <View style={s.selectedBar}>
            <Ionicons name="checkmark-circle" size={17} color={colors.greenText} />
            <Small style={{ color: colors.greenText, fontWeight: '700' }}>{roles.length} chosen</Small>
          </View>
        ) : null}

        <View style={s.grid}>
          {[...custom, ...shown].map((r) => {
            const on = roles.includes(r.id)
            return (
              <Pressable
                key={r.id}
                onPress={() => toggle(r.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={({ pressed }) => [s.tile, on && s.tileOn, pressed && { opacity: 0.8 }]}
              >
                {on ? (
                  <View style={s.tick}><Ionicons name="checkmark" size={12} color={colors.white} /></View>
                ) : null}
                <Text style={s.emoji}>{r.emoji}</Text>
                <Text style={[s.tileText, on && { color: colors.blueDark }]} numberOfLines={2}>
                  {r[lang] || r.en}
                </Text>
              </Pressable>
            )
          })}
          {canAdd ? (
            <Pressable
              onPress={() => { toggle(`custom:${query.trim()}`); setQuery('') }}
              style={({ pressed }) => [s.tile, s.tileAdd, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="add-circle" size={30} color={colors.blue} />
              <Text style={[s.tileText, { color: colors.blue }]} numberOfLines={2}>Add "{query.trim()}"</Text>
            </Pressable>
          ) : null}
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
  emoji: { fontSize: 34, lineHeight: 42 },
  tile: {
    width: '31%', minHeight: 96, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center', gap: 7, padding: space.sm,
    backgroundColor: colors.white,
  },
  tileOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  tileAdd: { borderStyle: 'dashed', borderColor: colors.blue },
  selectedBar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: space.md },
  tileText: { fontSize: 11.5, fontWeight: '600', color: colors.body, textAlign: 'center', lineHeight: 15 },
  tick: {
    position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
})
