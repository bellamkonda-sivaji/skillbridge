import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Body, Button, Chip, ChoiceCard, ErrorNote, Field, H1, Input, Loader, Screen, Small, Steps,
} from '../../ui'
import { AVAILABILITY, RADIUS_OPTIONS } from '../../ui/catalog'
import AddressPicker from '../../ui/AddressPicker'
import { emptyAddress } from '../../location/geocode'
import { errorText } from '../../api/client'
import * as profileApi from '../../api/profile'
import { useSession } from '../../session/SessionProvider'
import { rememberHome } from '../../location/origin'
import { colors, radius, space } from '../../theme'

/**
 * The last step: where they are and how far they will travel.
 *
 * The radius matters more than the exact address. Someone who will walk 1 km
 * and someone with a bike covering 20 km are looking at two different job
 * markets, and getting that wrong wastes everyone's time on both sides.
 */
export default function LocationStep({ navigation, route }) {
  const { t } = useTranslation()
  const { updateUser } = useSession()
  // Opened from "Where I live" on the Me tab, this is an edit, not a wizard:
  // it saves and goes back instead of finishing onboarding.
  const editing = Boolean(route?.params?.edit)
  const [km, setKm] = useState(3)
  const [availability, setAvailability] = useState('IMMEDIATE')
  const [availabilityTouched, setAvailabilityTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [address, setAddress] = useState(emptyAddress())
  const [loaded, setLoaded] = useState(false)

  /**
   * Start from what is saved.
   *
   * This screen used to open blank with 3 km picked, so someone checking
   * their address saw an empty box and a radius that was not theirs - and
   * pressing the button overwrote both. A failed load still lets them type a
   * fresh address; it just starts empty.
   */
  useEffect(() => {
    let alive = true
    profileApi.getProfile()
      .then((p) => {
        if (!alive || !p) return
        // The server stores "no pin" as 0,0 - which is in the sea off Ghana.
        const pinned = Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude))
          && !(Number(p.latitude) === 0 && Number(p.longitude) === 0)
        setAddress({
          ...emptyAddress(),
          locality: p.area || '',
          city: p.city || '',
          pincode: p.pincode || '',
          latitude: pinned ? Number(p.latitude) : null,
          longitude: pinned ? Number(p.longitude) : null,
        })
        if (Number(p.preferredRadiusKm) > 0) setKm(Number(p.preferredRadiusKm))
        // Only "available now" has a choice on this screen. Anything else the
        // server holds is shown as nothing picked, and left alone on save.
        setAvailability(p.availability === 'IMMEDIATE' || !p.availability ? 'IMMEDIATE' : null)
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoaded(true) })
    return () => { alive = false }
  }, [])

  // The pin is optional — someone can finish on town and area alone — but when
  // we do have it, distance ranking on the jobs list finally has real numbers.

  const finish = async () => {
    setBusy(true); setError('')
    try {
      const saved = await profileApi.saveOnboardingStep({
        step: 'LOCATION',
        city: address.city || undefined,
        area: address.locality || undefined,
        pincode: address.pincode || undefined,
        latitude: address.latitude ?? undefined,
        longitude: address.longitude ?? undefined,
        preferredRadiusKm: km,
        // The server only knows "available now"; "in a week / a month" has no
        // value there yet and was rejected, so it is left at the default.
        // When editing, only send it if they actually changed it.
        availability: availability === 'IMMEDIATE' && (!editing || availabilityTouched)
          ? availability : undefined,
      })
      rememberHome({
        area: address.locality, city: address.city,
        latitude: address.latitude, longitude: address.longitude,
        ...(saved && typeof saved === 'object' ? saved : {}),
      })
      if (editing) {
        updateUser({ city: address.city || undefined })
        navigation.goBack()
        return
      }
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
      footer={(
        <Button title={editing ? t('common.save') : t('onboarding.finish')} icon="checkmark"
          onPress={finish} loading={busy} disabled={!loaded} />
      )}
    >
      <AppBar onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg }}>
        {editing ? null : <Steps total={4} current={4} labels={['You', 'Work', 'Skills', 'Place']} />}
        <H1 style={{ marginTop: space.md }}>{editing ? t('profile.location') : t('onboarding.locationTitle')}</H1>
        <Body style={{ marginTop: 5, marginBottom: space.lg }}>{t('onboarding.locationSub')}</Body>

        <ErrorNote>{error}</ErrorNote>

        {/* Where they live, in the three ways people can actually give it:
            search it, take it from the phone, or type it. No map to pin -
            reading a map is a skill, and getting this wrong means never being
            shown the work next door. */}
        {/* Mounted once the saved address is in, so it opens on the fields. */}
        {loaded ? <AddressPicker value={address} onChange={setAddress} /> : <Loader />}


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
              onPress={() => { setAvailability(a.value); setAvailabilityTouched(true) }}
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
