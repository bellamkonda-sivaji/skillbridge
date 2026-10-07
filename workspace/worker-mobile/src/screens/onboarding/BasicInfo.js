import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import {
  AppBar, Avatar, Body, Button, Chip, ErrorNote, Field, H1, Input, Screen, Small, Steps,
} from '../../ui'
import { errorText } from '../../api/client'
import * as profileApi from '../../api/profile'
import { useSession } from '../../session/SessionProvider'
import { colors, space } from '../../theme'

/**
 * Step 1 of the profile. Name is pre-filled from sign-up, so in practice this
 * screen asks for a date of birth and a photo - both skippable, because a
 * blocked profile is worse than an incomplete one.
 */
export default function BasicInfo({ navigation }) {
  const { t } = useTranslation()
  const { user, updateUser } = useSession()
  const [name, setName] = useState(user?.name || '')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [photo, setPhoto] = useState(null)
  const [altPhone, setAltPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [photoData, setPhotoData] = useState(null)
  const [error, setError] = useState('')

  const pickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) { setError('We need permission to open your photos.'); return }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        // The photo is stored as a base64 data URL, so it travels inside the
        // JSON body. Quality is low on purpose: this is shown at 66px on a
        // profile and 44px in a header, and a full-size phone photo would be
        // megabytes of text for something nobody will ever see at that size.
        quality: 0.4,
        base64: true,
      })
      if (result.canceled) return
      const asset = result.assets[0]
      setPhoto(asset.uri)
      // The local file:// URI only exists on this phone. What gets saved is
      // the data URL - without it the picture shows once and is gone on the
      // next launch, which is exactly how this used to behave.
      if (asset.base64) {
        const mime = asset.mimeType || 'image/jpeg'
        setPhotoData(`data:${mime};base64,${asset.base64}`)
      }
    } catch {
      setError('We could not open your photos.')
    }
  }

  const next = async () => {
    setBusy(true); setError('')
    try {
      await profileApi.saveOnboardingStep({
        step: 'BASIC',
        name: name.trim() || undefined,
        dateOfBirth: dob || undefined,
        gender: gender || undefined,
        alternatePhone: altPhone.replace(/\D/g, '') || undefined,
        photoUrl: photoData || undefined,
      })
      updateUser({ name: name.trim(), ...(photoData ? { photoUrl: photoData } : {}) })
      navigation.navigate('JobPreferences')
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
      footer={<Button title={t('common.continue')} iconRight="arrow-forward" onPress={next} loading={busy} />}
    >
      <AppBar onBack={navigation.canGoBack() ? navigation.goBack : undefined}
        right={<Small onPress={() => navigation.navigate('JobPreferences')}>{t('common.skip')}</Small>} />
      <View style={{ paddingHorizontal: space.lg }}>
        <Steps total={4} current={1} labels={['You', 'Work', 'Skills', 'Place']} />
        <H1 style={{ marginTop: space.md }}>{t('onboarding.basicTitle')}</H1>
        <Body style={{ marginTop: 5, marginBottom: space.lg }}>{t('onboarding.basicSub')}</Body>

        <ErrorNote>{error}</ErrorNote>

        <Pressable onPress={pickPhoto} style={s.photoRow}>
          <Avatar uri={photo} name={name} size={74} />
          <View style={s.photoBtn}>
            <Ionicons name="camera-outline" size={19} color={colors.blue} />
            <Small style={{ color: colors.blue, fontWeight: '700' }}>{t('onboarding.photo')}</Small>
          </View>
        </Pressable>

        <Field label={t('account.fullName')}>
          <Input value={name} onChangeText={setName} placeholder={t('account.namePlaceholder')}
            autoCapitalize="words" />
        </Field>

        <Field label={t('onboarding.dob')} hint="DD / MM / YYYY">
          <Input value={dob} onChangeText={setDob} placeholder="15 / 03 / 2000" keyboardType="numbers-and-punctuation" />
        </Field>

        <Field label={t('onboarding.gender')}>
          <View style={s.chipWrap}>
            {[['MALE', 'male'], ['FEMALE', 'female'], ['OTHER', 'other']].map(([value, key]) => (
              <Chip key={value} label={t(`onboarding.${key}`)} selected={gender === value}
                onPress={() => setGender(value)} />
            ))}
          </View>
        </Field>

        <Field label={`${t('account.phone')} 2`} hint={t('common.optional')}>
          <Input value={altPhone} onChangeText={setAltPhone} placeholder="99999 99999"
            keyboardType="number-pad" maxLength={10} prefix="+91" />
        </Field>
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg, marginBottom: space.xl },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipWrap: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
})
