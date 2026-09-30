import React, { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  AppBar, Body, Button, CheckRow, ErrorNote, Field, H1, Input, PasswordInput,
  SafeNote, Screen, Small, Spacer, Steps,
} from '../ui'
import { errorText } from '../api/client'
import * as authApi from '../api/auth'
import { colors, space } from '../theme'

/**
 * Sign-up asks for the four things the backend needs and nothing else. The
 * business details come next, once there is an account to attach them to.
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

const s = StyleSheet.create({
  loginRow: { alignItems: 'center', marginTop: space.lg },
  loginText: { fontSize: 13.5, color: colors.body },
  loginLink: { fontWeight: '700', color: colors.blue },
})
