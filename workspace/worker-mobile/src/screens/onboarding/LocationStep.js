import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Body, Button, Chip, ChoiceCard, ErrorNote, Field, H1, Input, Screen, Small, Steps,
} from '../../ui'
import { AVAILABILITY, RADIUS_OPTIONS } from '../../ui/catalog'
import { errorText } from '../../api/client'
import * as profileApi from '../../api/profile'
import { useSession } from '../../session/SessionProvider'
import { colors, radius, space } from '../../theme'

/**
 * The last step: where they are and how far they will travel.
 *
 * The radius matters more than the exact address. Someone who will walk 1 km
 * and someone with a bike covering 20 km are looking at two different job
 * markets, and getting that wrong wastes everyone's time on both sides.
 */
export default function LocationStep({ navigation }) {
  const { t } = useTranslation()
  const { updateUser } = useSession()
  const [km, setKm] = useState(3)
  const [availability, setAvailability] = useState('IMMEDIATE')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [address, setAddress] = useState(emptyAddress())

  // The pin is optional — someone can finish on town and area alone — but when
  // we do have it, distance ranking on the jobs list finally has real numbers.

  const finish = async () => {
    setBusy(true); setError('')
    try {
      await profileApi.saveOnboardingStep({
        step: 'LOCATION',
        city: address.city || undefined,
        area: address.locality || undefined,
        pincode: address.pincode || undefined,
        latitude: address.latitude ?? undefined,
        longitude: address.longitude ?? undefined,
        preferredRadiusKm: km,
        availability,
      })
      updateUser({ onboarded: true })
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
    } catch (err) {
      setError(errorText(err, 'We could not save your location. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen
      padded={false}
      bg={colors.white}
      footer={<Button title={t('onboarding.finish')} icon="checkmark" onPress={finish} loading={busy} />}
    >
      <AppBar onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg }}>
        <Steps total={4} current={4} labels={['You', 'Work', 'Skills', 'Place']} />
        <H1 style={{ marginTop: space.md }}>{t('onboarding.locationTitle')}</H1>
        <Body style={{ marginTop: 5, marginBottom: space.lg }}>{t('onboarding.locationSub')}</Body>

        <ErrorNote>{error}</ErrorNote>

        {/* Where they live, in the three ways people can actually give it:
            search it, take it from the phone, or type it. No map to pin -
            reading a map is a skill, and getting this wrong means never being
            shown the work next door. */}
        <AddressPicker value={address} onChange={setAddress} />


        <Field label={t('onboarding.radius')}>
          <View style={s.chips}>
            {RADIUS_OPTIONS.map((r) => (
              <Chip key={r} label={`${r} km`} selected={km === r} onPress={() => setKm(r)} />
            ))}
          </View>
        </Field>

        <Field label={t('onboarding.availability')}>
          {AVAILABILITY.map((a) => (
            <ChoiceCard
              key={a.value}
              selected={availability === a.value}
              onPress={() => setAvailability(a.value)}
              title={t(`onboarding.${a.key}`)}
              icon="time-outline"
            />
          ))}
        </Field>
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
})
