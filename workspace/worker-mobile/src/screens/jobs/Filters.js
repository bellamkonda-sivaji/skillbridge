import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AppBar, Body, Button, Chip, Field, Input, Row, Screen, Small } from '../../ui'
import { EMPLOYMENT_TYPES, RADIUS_OPTIONS, WORK_CATEGORIES } from '../../ui/catalog'
import { colors, space } from '../../theme'

/** Everything here is a tap except the two salary boxes, which are optional. */
export default function Filters({ navigation, route }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language || 'en'
  const current = route?.params?.current || {}

  const [category, setCategory] = useState(current.workerCategory || '')
  const [types, setTypes] = useState(current.employmentTypes || [])
  const [minSalary, setMin] = useState(current.minSalary ? String(current.minSalary) : '')
  const [maxSalary, setMax] = useState(current.maxSalary ? String(current.maxSalary) : '')
  const [km, setKm] = useState(current.radiusKm || 5)

  const toggleType = (v) => setTypes((x) => (x.includes(v) ? x.filter((i) => i !== v) : [...x, v]))

  const apply = () => {
    const filters = {}
    if (category) filters.workerCategory = category
    if (types.length) filters.employmentTypes = types
    if (minSalary) filters.minSalary = Number(minSalary)
    if (maxSalary) filters.maxSalary = Number(maxSalary)
    if (km) filters.radiusKm = km
    navigation.navigate('FindJobs', { filters })
  }

  const reset = () => {
    setCategory(''); setTypes([]); setMin(''); setMax(''); setKm(5)
    navigation.navigate('FindJobs', { filters: null })
  }

  return (
    <Screen
      padded={false}
      bg={colors.white}
      footer={(
        <Row>
          <Button title={t('jobs.reset')} tone="quiet" onPress={reset} style={{ flex: 1 }} />
          <Button title={t('jobs.showJobs')} onPress={apply} style={{ flex: 2 }} />
        </Row>
      )}
    >
      <AppBar title={t('jobs.filters')} onBack={navigation.goBack}
        right={<Small style={{ color: colors.blue, fontWeight: '700' }} onPress={reset}>
          {t('jobs.clearAll')}
        </Small>} />

      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Field label={t('jobs.category')}>
          <View style={s.wrap}>
            <Chip label="All" selected={!category} onPress={() => setCategory('')} />
            {WORK_CATEGORIES.map((c) => (
              <Chip key={c.value} label={c[lang] || c.en} selected={category === c.value}
                onPress={() => setCategory(category === c.value ? '' : c.value)} />
            ))}
          </View>
        </Field>

        <Field label={t('onboarding.employmentType')}>
          <View style={s.wrap}>
            {EMPLOYMENT_TYPES.map((e) => (
              <Chip key={e.value} label={e[lang] || e.en} selected={types.includes(e.value)}
                onPress={() => toggleType(e.value)} />
            ))}
          </View>
        </Field>

        <Field label={t('jobs.salaryRange')} hint="Leave empty for any pay">
          <Row>
            <Input value={minSalary} onChangeText={setMin} placeholder="Least" keyboardType="number-pad"
              prefix="₹" style={{ flex: 1 }} />
            <Input value={maxSalary} onChangeText={setMax} placeholder="Most" keyboardType="number-pad"
              prefix="₹" style={{ flex: 1 }} />
          </Row>
        </Field>

        <Field label={t('jobs.distance')}>
          <View style={s.wrap}>
            {RADIUS_OPTIONS.map((r) => (
              <Chip key={r} label={`${r} km`} selected={km === r} onPress={() => setKm(r)} />
            ))}
          </View>
          <Body style={{ fontSize: 13.5, marginTop: space.sm }}>
            Showing work within {km} km of you.
          </Body>
        </Field>
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
})
