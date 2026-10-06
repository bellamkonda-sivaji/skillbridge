import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Body, Button, Chip, ErrorNote, Field, H1, Input, Screen, Small, Steps,
} from '../../ui'
import { BUSINESS_TYPES } from '../../ui/catalog'
import * as profileApi from '../../api/profile'
import { currentLocation } from '../../location/current'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

/**
 * The business, as a worker will see it.
 *
 * Workers decide whether to apply partly on who is hiring, so the name and the
 * area matter more here than anything administrative. Registration numbers
 * come later, on a screen that can be skipped.
 */
export default function BusinessDetails({ navigation }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    businessName: '', businessType: '', address: '', city: 'Tirupati', area: '',
    contactPersonName: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [coords, setCoords] = useState(null)
  const [locating, setLocating] = useState(false)

  // Optional: a shop can register on address alone. But a worker browsing the
  // map only sees businesses that have a real point to draw.
  const locate = async () => {
    setLocating(true); setError('')
    const got = await currentLocation()
    if (got.ok) setCoords({ latitude: got.latitude, longitude: got.longitude })
    else setError(t(`business.loc_${got.reason}`))
    setLocating(false)
  }

  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setFieldErrors((e) => ({ ...e, [k]: undefined }))
  }

  const next = async () => {
    const errs = {}
    if (!form.businessName.trim()) errs.businessName = 'Please enter your business name'
    if (!form.businessType) errs.businessType = 'Choose the kind of business'
    setFieldErrors(errs)
    if (Object.keys(errs).length) return

    setBusy(true); setError('')
    try {
      await profileApi.saveOnboardingStep({
        step: 'BUSINESS',
        businessName: form.businessName.trim(),
        businessType: form.businessType,
        address: form.address.trim() || undefined,
        city: form.city.trim(),
        area: form.area.trim() || undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        contactPersonName: form.contactPersonName.trim() || undefined,
      })
      navigation.navigate('Verification')
    } catch (err) {
      setError(errorText(err, 'We could not save your business details.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen
      padded={false}
      bg={colors.white}
      footer={<Button title={t('common.continue')} iconRight="arrow-forward" onPress={next} loading={busy} />}
    >
      <AppBar onBack={navigation.canGoBack() ? navigation.goBack : undefined} />
      <View style={{ paddingHorizontal: space.lg }}>
        <Steps total={4} current={1} labels={['Business', 'Verify', 'Plan', 'Done']} />
        <H1 style={{ marginTop: space.md }}>{t('business.title')}</H1>
        <Body style={{ marginTop: 5, marginBottom: space.lg }}>{t('business.sub')}</Body>

        <ErrorNote>{error}</ErrorNote>

        <Field label={t('business.name')} error={fieldErrors.businessName}>
          <Input value={form.businessName} onChangeText={set('businessName')}
            placeholder={t('business.namePlaceholder')} autoCapitalize="words" />
        </Field>

        <Field label={t('business.type')} error={fieldErrors.businessType}>
          <View style={s.wrap}>
            {BUSINESS_TYPES.map((b) => (
              <Chip key={b} label={b} selected={form.businessType === b}
                onPress={() => set('businessType')(b)} />
            ))}
          </View>
        </Field>

        <Field label={t('business.address')}>
          <Input value={form.address} onChangeText={set('address')}
            placeholder="Shop number, street" multiline
            style={{ minHeight: 72, alignItems: 'flex-start' }} />
        </Field>

        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Field label={t('business.city')} style={{ flex: 1 }}>
            <Input value={form.city} onChangeText={set('city')} placeholder="Tirupati" />
          </Field>
          <Field label={t('business.area')} style={{ flex: 1 }}>
            <Input value={form.area} onChangeText={set('area')} placeholder="Korlagunta" />
          </Field>
        </View>

        <View style={s.mapBox}>
          <Ionicons name={coords ? 'location' : 'map-outline'} size={28} color={colors.blue} />
          <Small style={{ textAlign: 'center', marginTop: 6 }}>
            {coords ? t('business.locPinned') : t('business.locWhy')}
          </Small>
          <Button title={coords ? t('business.locAgain') : t('business.useLocation')}
            icon={coords ? 'checkmark' : 'locate-outline'} tone="outline"
            size="sm" full={false} loading={locating} style={{ marginTop: space.md }}
            onPress={locate} />
        </View>

        <Field label={t('business.contactPerson')} hint={t('common.optional')}>
          <Input value={form.contactPersonName} onChangeText={set('contactPersonName')}
            placeholder="Ravi Kumar" autoCapitalize="words" />
        </Field>
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  mapBox: {
    alignItems: 'center', justifyContent: 'center', padding: space.xl,
    borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: colors.blueLine, backgroundColor: colors.blueSoft, marginBottom: space.lg,
  },
})
