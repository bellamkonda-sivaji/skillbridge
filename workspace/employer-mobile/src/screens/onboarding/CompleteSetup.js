import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { Button, Row, Screen, Small, Spacer, SuccessPanel } from '../../ui'
import { useSession } from '../../session/SessionProvider'
import { colors, space } from '../../theme'

/** Setup finished, and what to do next - one obvious action. */
export default function CompleteSetup({ navigation }) {
  const { t } = useTranslation()
  const { updateUser } = useSession()

  const go = () => {
    updateUser({ onboarded: true })
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
  }

  const steps = ['setupStep1', 'setupStep2', 'setupStep3', 'setupStep4']

  return (
    <Screen bg={colors.white} footer={<Button title={t('business.goToDashboard')} onPress={go} />}>
      <SuccessPanel title={t('business.setupDone')} sub={t('business.setupSub')}>
        <View style={{ alignSelf: 'stretch', marginTop: space.xxl, gap: space.md }}>
          {steps.map((key, i) => (
            <Row key={key} gap={space.md} style={s.step}>
              <View style={s.num}><Text style={s.numText}>{i + 1}</Text></View>
              <Text style={s.stepText}>{t(`business.${key}`)}</Text>
              <Ionicons name="checkmark-circle" size={19} color={colors.green} />
            </Row>
          ))}
        </View>
      </SuccessPanel>
      <Spacer h={space.lg} />
    </Screen>
  )
}

const s = StyleSheet.create({
  step: {
    backgroundColor: colors.soft, borderRadius: 12, padding: space.md,
  },
  num: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: colors.blue,
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { fontSize: 12.5, fontWeight: '800', color: colors.white },
  stepText: { flex: 1, fontSize: 14.5, fontWeight: '600', color: colors.ink },
})
