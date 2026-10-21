import React, { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Body, Button, ErrorNote, H1, SafeNote, Screen, Small, Spacer, Steps,
} from '../ui'
import { errorText } from '../api/client'
import * as authApi from '../api/auth'
import { useSession } from '../session/SessionProvider'
import { colors, radius, space } from '../theme'

const LENGTH = 6
const RESEND_SECONDS = 30

/**
 * Six boxes rather than one field, because that is what an SMS code looks like
 * everywhere else and it makes a mistyped digit obvious at a glance.
 *
 * The boxes only show the code. One hidden field underneath holds it, so a
 * pasted or SMS-filled code, or quick typing, arrives whole - six separate
 * fields raced each other and dropped digits.
 */
export default function Otp({ navigation, route }) {
  const { t } = useTranslation()
  const { signIn } = useSession()
  const phone = route?.params?.phone || ''
  const password = route?.params?.password

  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [seconds, setSeconds] = useState(RESEND_SECONDS)
  const input = useRef(null)

  useEffect(() => {
    if (seconds <= 0) return undefined
    const id = setInterval(() => setSeconds((v) => Math.max(0, v - 1)), 1000)
    return () => clearInterval(id)
  }, [seconds])

  // Ask for the code as soon as the screen opens, so nobody has to press twice.
  useEffect(() => {
    if (phone) authApi.requestOtp(phone).catch(() => { /* the resend button covers this */ })
  }, [phone])

  const onCode = (value) => {
    setError('')
    setCode(value.replace(/\D/g, '').slice(0, LENGTH))
  }


  const verify = async () => {
    if (code.length !== LENGTH) { setError(t('otp.wrong')); return }
    setBusy(true); setError('')
    try {
      const verified = await authApi.verifyOtp(phone, code)
      // Some backends return the session straight from verification; if not, the
      // password we just set is enough to sign in without asking again.
      const auth = verified?.token ? verified : await authApi.login(phone, password)
      await signIn(auth)
      navigation.reset({ index: 0, routes: [{ name: 'BusinessDetails' }] })
    } catch (err) {
      setError(errorText(err, t('otp.wrong')))
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    setSeconds(RESEND_SECONDS); setError('')
    try { await authApi.requestOtp(phone) } catch (err) { setError(errorText(err)) }
  }

  return (
    <Screen
      padded={false}
      bg={colors.white}
      footer={<Button title={t('otp.verify')} onPress={verify} loading={busy}
        disabled={code.length !== LENGTH} />}
    >
      <AppBar onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg }}>
        <Steps total={3} current={2} labels={['Account', 'Verify', 'Profile']} />

        <View style={s.art}><Ionicons name="chatbubble-ellipses-outline" size={38} color={colors.blue} /></View>

        <H1 style={{ textAlign: 'center', marginTop: space.lg }}>{t('otp.title')}</H1>
        <Body style={{ textAlign: 'center', marginTop: 6 }}>
          {t('otp.sub')}{'\n'}
          <Text style={s.phone}>+91 {phone}</Text>
        </Body>

        <Spacer h={space.xl} />
        <ErrorNote>{error}</ErrorNote>

        <View style={s.boxes}>
          {Array.from({ length: LENGTH }, (_, i) => (
            <View key={i} style={[s.box, code[i] && s.boxFilled]} accessibilityLabel={`Digit ${i + 1}`}>
              <Text style={s.digit}>{code[i] || ''}</Text>
            </View>
          ))}
          <TextInput
            ref={input}
            value={code}
            onChangeText={onCode}
            keyboardType="number-pad"
            maxLength={LENGTH}
            autoFocus
            autoComplete="sms-otp"
            textContentType="oneTimeCode"
            caretHidden
            style={s.hidden}
            accessibilityLabel="Code"
          />
        </View>

        <View style={s.resendRow}>
          {seconds > 0 ? (
            <Small>{t('otp.resendIn')} 00:{String(seconds).padStart(2, '0')}</Small>
          ) : (
            <Pressable onPress={resend} hitSlop={10}>
              <Text style={s.resend}>{t('otp.resend')}</Text>
            </Pressable>
          )}
        </View>

        <Spacer h={space.xl} />
        <SafeNote>{t('account.safe')}</SafeNote>
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  art: {
    width: 86, height: 86, borderRadius: 43, backgroundColor: colors.blueSoft,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: space.lg,
  },
  phone: { fontWeight: '800', color: colors.ink },
  boxes: { flexDirection: 'row', gap: space.sm, justifyContent: 'center' },
  box: {
    width: 48, height: 58, borderRadius: radius.md, borderWidth: 2, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white,
  },
  digit: { fontSize: 24, fontWeight: '800', color: colors.ink },
  hidden: { ...StyleSheet.absoluteFill, opacity: 0 },
  boxFilled: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  resendRow: { alignItems: 'center', marginTop: space.lg },
  resend: { fontSize: 14, fontWeight: '700', color: colors.blue },
})
