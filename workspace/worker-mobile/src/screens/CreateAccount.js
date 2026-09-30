import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Body, Button, CheckRow, ErrorNote, Field, H1, Input, PasswordInput,
  Row, SafeNote, Screen, Small, Spacer, Steps,
} from '../ui'
import { errorText } from '../api/client'
import * as authApi from '../api/auth'
import { colors, space } from '../theme'

/**
 * Sign-up asks for the four things the backend actually needs and nothing else.
 *
 * Email is optional and labelled "not needed" rather than "optional", because
 * "optional" is a word a lot of our users skip over and then fill in anyway.
 */
export default function CreateAccount({ navigation }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' })
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setFieldErrors((e) => ({ ...e, [k]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Please enter your name'
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) e.phone = 'Enter your 10-digit mobile number'
    if (form.password.length < 6) e.password = 'Use at least 6 characters'
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    setError('')
    if (!validate()) return
    if (!agreed) { setError('Please agree to the terms to continue.'); return }
    setBusy(true)
    try {
      await authApi.register({
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, ''),
        email: form.email.trim() || null,
        password: form.password,
        locale: 'en',
      })
      navigation.navigate('Otp', { phone: form.phone.replace(/\D/g, ''), password: form.password })
    } catch (err) {
      setError(errorText(err, 'We could not create your account. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen
      padded={false}
      bg={colors.white}
      footer={(
        <Button title={t('account.createAccount')} onPress={submit} loading={busy} />
      )}
    >
      <AppBar onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg }}>
        <Steps total={3} current={1} labels={['Account', 'Verify', 'Profile']} />
        <H1 style={{ marginTop: space.md }}>{t('account.createTitle')}</H1>
        <Body style={{ marginTop: 5, marginBottom: space.lg }}>{t('account.createSub')}</Body>

        <ErrorNote>{error}</ErrorNote>

        <Field label={t('account.fullName')} error={fieldErrors.name}>
          <Input
            value={form.name}
            onChangeText={set('name')}
            placeholder={t('account.namePlaceholder')}
            autoCapitalize="words"
            textContentType="name"
          />
        </Field>

        <Field label={t('account.phone')} error={fieldErrors.phone}>
          <Input
            value={form.phone}
            onChangeText={set('phone')}
            placeholder="98765 43210"
            keyboardType="number-pad"
            maxLength={10}
            prefix="+91"
            textContentType="telephoneNumber"
          />
        </Field>

        <Field label={t('account.emailOptional')}>
          <Input
            value={form.email}
            onChangeText={set('email')}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Field>

        <Field label={t('account.password')} error={fieldErrors.password}>
          <PasswordInput
            value={form.password}
            onChangeText={set('password')}
            placeholder={t('account.passwordPlaceholder')}
          />
        </Field>

        <CheckRow checked={agreed} onToggle={() => setAgreed((a) => !a)}>
          <Small style={{ color: colors.body, lineHeight: 19 }}>{t('account.agree')}</Small>
        </CheckRow>

        <Spacer h={space.md} />

        {/* The mockups show these under the form. They are not wired to a
            provider yet - the backend has no OAuth endpoint - so rather than
            a button that silently does nothing, pressing one says so. */}
        <View style={s.orRow}>
          <View style={s.orLine} />
          <Small style={{ marginHorizontal: space.md }}>{t('account.or')}</Small>
          <View style={s.orLine} />
        </View>
        <Row>
          <SocialButton
            label="Google"
            icon="logo-google"
            onPress={() => setError('Google sign-in is not switched on yet. Use your mobile number.')}
          />
          <SocialButton
            label="Apple"
            icon="logo-apple"
            onPress={() => setError('Apple sign-in is not switched on yet. Use your mobile number.')}
          />
        </Row>

        <Spacer h={space.lg} />
        <SafeNote>{t('account.safe')}</SafeNote>

        <View style={s.loginRow}>
          <Small>{t('account.noAccount') && ''}</Small>
          <Text style={s.loginText}>
            {t('splash.haveAccount')}{' '}
            <Text style={s.loginLink} onPress={() => navigation.navigate('Login')}>
              {t('splash.logIn')}
            </Text>
          </Text>
        </View>
        <Spacer h={space.lg} />
      </View>
    </Screen>
  )
}

const SocialButton = ({ label, icon, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [s.social, pressed && { opacity: 0.75 }]}>
    <Ionicons name={icon} size={19} color={colors.ink} />
    <Text style={s.socialText}>{label}</Text>
  </Pressable>
)

const s = StyleSheet.create({
  orRow: { flexDirection: 'row', alignItems: 'center', marginBottom: space.md },
  orLine: { flex: 1, height: 1, backgroundColor: colors.line },
  social: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.white,
  },
  socialText: { fontSize: 15, fontWeight: '700', color: colors.ink },
  loginRow: { alignItems: 'center', marginTop: space.lg },
  loginText: { fontSize: 13.5, color: colors.body },
  loginLink: { fontWeight: '700', color: colors.blue },
})
