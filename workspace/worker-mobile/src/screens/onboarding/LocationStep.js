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
  const [city, setCity] = useState('Tirupati')
  const [area, setArea] = useState('')
  const [km, setKm] = useState(3)
  const [availability, setAvailability] = useState('IMMEDIATE')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const finish = async () => {
    setBusy(true); setError('')
    try {
      await profileApi.saveOnboardingStep({
        step: 'LOCATION',
        city: city.trim(),
        area: area.trim() || undefined,
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

        <Field label={t('onboarding.city')}>
          <Input value={city} onChangeText={setCity} placeholder="Tirupati" />
        </Field>

        <Field label={t('onboarding.area')}>
          <Input value={area} onChangeText={setArea} placeholder="Karakambadi" />
        </Field>

        <View style={s.mapBox}>
          <Ionicons name="map-outline" size={30} color={colors.blue} />
          <Small style={{ textAlign: 'center', marginTop: 6 }}>
            We use your area to show work close by.
          </Small>
          <Button
            title={t('onboarding.useLocation')}
            icon="locate-outline"
            tone="outline"
            size="sm"
            full={false}
            style={{ marginTop: space.md }}
            onPress={() => setArea(area || 'Karakambadi')}
          />
        </View>

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
  mapBox: {
    alignItems: 'center', justifyContent: 'center', padding: space.xl,
    borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: colors.blueLine, backgroundColor: colors.blueSoft, marginBottom: space.lg,
  },
})
