import React, { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Body, Button, CheckRow, Chip, ErrorNote, Field, H1, H3, Input, Screen, Small, Steps,
} from '../../ui'
import { SKILLS } from '../../ui/catalog'
import { errorText } from '../../api/client'
import * as profileApi from '../../api/profile'
import { colors, space } from '../../theme'

/**
 * Skills, grouped and tappable.
 *
 * The search box is there for someone who knows exactly what they want, but it
 * is never the only way in - the groups below mean a person who cannot type
 * can still build a full profile by tapping.
 */
export default function SkillsStep({ navigation }) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState([])
  const [query, setQuery] = useState('')
  const [years, setYears] = useState('')
  const [fresher, setFresher] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const toggle = (skill) =>
    setSelected((s) => (s.includes(skill) ? s.filter((x) => x !== skill) : [...s, skill]))

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SKILLS
    return SKILLS
      .map((g) => ({ ...g, items: g.items.filter((i) => i.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length)
  }, [query])

  const next = async () => {
    setBusy(true); setError('')
    try {
      await profileApi.saveOnboardingStep({
        step: 'SKILLS',
        skills: selected,
        experienceYears: fresher ? 0 : Number(years) || undefined,
      })
      navigation.navigate('LocationStep')
    } catch (err) {
      setError(errorText(err, 'We could not save your skills. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen
      padded={false}
      bg={colors.white}
      footer={<Button title={t('common.continue')} iconRight="arrow-forward" onPress={next}
        loading={busy} disabled={!selected.length} />}
    >
      <AppBar onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg }}>
        <Steps total={4} current={3} labels={['You', 'Work', 'Skills', 'Place']} />
        <H1 style={{ marginTop: space.md }}>{t('onboarding.skillsTitle')}</H1>
        <Body style={{ marginTop: 5, marginBottom: space.lg }}>{t('onboarding.skillsSub')}</Body>

        <ErrorNote>{error}</ErrorNote>

        <Input
          value={query}
          onChangeText={setQuery}
          placeholder={t('onboarding.searchSkills')}
          prefix={null}
          style={{ marginBottom: space.lg }}
        />

        {selected.length > 0 ? (
          <View style={s.selectedBar}>
            <Ionicons name="checkmark-circle" size={17} color={colors.greenText} />
            <Small style={{ color: colors.greenText, fontWeight: '700' }}>
              {selected.length} chosen
            </Small>
          </View>
        ) : null}

        {groups.map((g) => (
          <View key={g.group} style={{ marginBottom: space.lg }}>
            <H3 style={{ marginBottom: space.sm, fontSize: 15 }}>{g.group}</H3>
            <View style={s.chips}>
              {g.items.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={selected.includes(item)}
                  onPress={() => toggle(item)}
                />
              ))}
            </View>
          </View>
        ))}

        <Field label={t('onboarding.experience')}>
          <View style={s.chips}>
            {['0 - 1', '1 - 3', '3 - 5', '5+'].map((y) => (
              <Chip key={y} label={`${y} yr`} selected={years === y && !fresher}
                onPress={() => { setYears(y); setFresher(false) }} />
            ))}
          </View>
          <CheckRow checked={fresher} onToggle={() => { setFresher((f) => !f); setYears('') }}>
            <Body style={{ fontSize: 14 }}>{t('onboarding.fresher')}</Body>
          </CheckRow>
        </Field>
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  selectedBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.greenSoft, borderRadius: 999,
    paddingHorizontal: space.md, paddingVertical: 7, alignSelf: 'flex-start',
    marginBottom: space.lg,
  },
})
