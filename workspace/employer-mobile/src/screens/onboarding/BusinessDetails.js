import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Body, Button, Chip, ErrorNote, Field, H1, Input, Screen, Small, Steps,
} from '../../ui'
import { BUSINESS_TYPES } from '../../ui/catalog'
import * as profileApi from '../../api/profile'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'
import AddressPicker from '../../ui/AddressPicker'
import { emptyAddress, formatAddress } from '../../location/geocode'

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
  const [address, setAddress] = useState(emptyAddress())


  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setFieldErrors((e) => ({ ...e, [k]: undefined }))
  }

  const next = async () => {
    const errs = {}
    if (!form.businessName.trim()) errs.businessName = 'Please enter your business name'
    if (!form.businessType) errs.businessType = 'Choose the kind of business'
    // The address is how a worker decides whether the job is reachable, so a
    // bare city is not enough: ask for the locality or the PIN at least.
    if (!address.locality && !address.pincode && !address.street) {
      errs.address = 'Add the shop address'
    }
    setFieldErrors(errs)
    if (Object.keys(errs).length) return

    setBusy(true); setError('')
    try {
      await profileApi.saveOnboardingStep({
        step: 'BUSINESS',
        businessName: form.businessName.trim(),
        businessType: form.businessType,
        address: formatAddress(address) || undefined,
        pincode: address.pincode || undefined,
        city: form.city.trim(),
        area: form.area.trim() || undefined,
        latitude: address.latitude ?? undefined,
        longitude: address.longitude ?? undefined,
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

        {/* One control for the whole address: search it, take it from the
            phone, or type it. Before this, "use my location" stored two
            numbers and showed nothing back, so nobody could tell whether it
            had worked - and a worker deciding if a job is reachable needs the
            street and the PIN code, not a city name. */}
        <Field label={t('business.address')} error={fieldErrors.address}>
          <AddressPicker value={address} onChange={setAddress} />
        </Field>

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
})
