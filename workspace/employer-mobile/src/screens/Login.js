import React, { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  AppBar, Body, Button, ErrorNote, Field, H1, Input, PasswordInput, Screen, Small, Spacer,
} from '../ui'
import { errorText } from '../api/client'
import * as authApi from '../api/auth'
import { useSession } from '../session/SessionProvider'
import { colors, space } from '../theme'

export default function Login({ navigation }) {
  const { t } = useTranslation()
  const { signIn } = useSession()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!identifier.trim() || !password) {
      setError('Enter your mobile number and password.')
      return
    }
    setBusy(true); setError('')
    try {
      const auth = await authApi.login(identifier.trim(), password)
      await signIn(auth)
      // The root navigator swaps to the signed-in stack on its own.
    } catch (err) {
      setError(errorText(err, 'That mobile number or password is not right.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen
      padded={false}
      bg={colors.white}
      footer={<Button title={t('account.loginAction')} onPress={submit} loading={busy} />}
    >
      <AppBar onBack={navigation.canGoBack() ? navigation.goBack : undefined} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.xl }}>
        <H1>{t('account.loginTitle')}</H1>
        <Body style={{ marginTop: 5, marginBottom: space.xl }}>{t('account.loginSub')}</Body>

        <ErrorNote>{error}</ErrorNote>

        <Field label={t('account.phone')}>
          <Input
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="98765 43210"
            keyboardType="default"
            autoCapitalize="none"
          />
        </Field>

        <Field label={t('account.password')}>
          <PasswordInput value={password} onChangeText={setPassword} placeholder="••••••" />
        </Field>

        <Text style={s.forgot} onPress={() => navigation.navigate('CreateAccount')}>
          {t('account.forgot')}
        </Text>

        <Spacer h={space.xl} />
        <View style={{ alignItems: 'center' }}>
          <Text style={s.signUpText}>
            {t('account.noAccount')}{' '}
            <Text style={s.signUpLink} onPress={() => navigation.navigate('Language')}>
              {t('account.signUp')}
            </Text>
          </Text>
        </View>
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  forgot: { fontSize: 13.5, fontWeight: '700', color: colors.blue, alignSelf: 'flex-end' },
  signUpText: { fontSize: 13.5, color: colors.body },
  signUpLink: { fontWeight: '700', color: colors.blue },
})
