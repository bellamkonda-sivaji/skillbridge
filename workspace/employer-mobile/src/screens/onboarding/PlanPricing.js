import React, { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Body, Button, Card, ErrorNote, H1, Row, Screen, Small, Spacer, Steps,
} from '../../ui'
import { FEE_SLABS } from '../../ui/catalog'
import * as profileApi from '../../api/profile'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

const PLANS = [
  {
    value: 'FREE', nameKey: 'free', price: 0,
    features: ['Post up to 3 jobs a month', 'See workers near you', 'Attendance and payments'],
  },
  {
    value: 'PROFESSIONAL', nameKey: 'pro', price: 999,
    features: ['Unlimited jobs', 'Verified workers first', 'Compare and shortlist', 'Priority support'],
  },
  {
    value: 'ENTERPRISE', nameKey: 'enterprise', price: null,
    features: ['For several shops', 'A person you can ring', 'Custom reports'],
  },
]

/**
 * The plan, and - more importantly - the commission table.
 *
 * The subscription is optional; the per-job fee is not, and it is the number
 * that decides whether an employer feels tricked later. So it is on this
 * screen in full, before they have posted anything.
 */
export default function PlanPricing({ navigation }) {
  const { t } = useTranslation()
  const [plan, setPlan] = useState('FREE')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const next = async () => {
    setBusy(true); setError('')
    try {
      await profileApi.saveOnboardingStep({ step: 'PLAN', plan })
      navigation.navigate('CompleteSetup')
    } catch (err) {
      // A plan choice must never be what blocks someone from using the app.
      setError(errorText(err, 'We could not save that, but you can continue.'))
      navigation.navigate('CompleteSetup')
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
      <AppBar onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg }}>
        <Steps total={4} current={3} labels={['Business', 'Verify', 'Plan', 'Done']} />
        <H1 style={{ marginTop: space.md }}>{t('business.planTitle')}</H1>
        <Body style={{ marginTop: 5, marginBottom: space.lg }}>{t('business.planSub')}</Body>

        <ErrorNote>{error}</ErrorNote>

        {PLANS.map((pl) => {
          const on = plan === pl.value
          return (
            <View key={pl.value}>
              <Card
                onPress={() => setPlan(pl.value)}
                style={[s.plan, on && s.planOn]}
              >
                <Row align="flex-start">
                  <View style={{ flex: 1 }}>
                    <Text style={s.planName}>{t(`business.${pl.nameKey}`)}</Text>
                    <Text style={s.planPrice}>
                      {pl.price === 0 ? t('business.free')
                        : pl.price === null ? 'Ask us'
                          : `₹${pl.price.toLocaleString('en-IN')}`}
                      {pl.price ? <Text style={s.planPer}> {t('business.perMonth')}</Text> : null}
                    </Text>
                  </View>
                  <View style={[s.radio, on && s.radioOn]}>
                    {on ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
                  </View>
                </Row>
                <View style={{ marginTop: space.md, gap: 7 }}>
                  {pl.features.map((f) => (
                    <Row key={f} gap={7}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.green} />
                      <Small style={{ flex: 1, color: colors.body }}>{f}</Small>
                    </Row>
                  ))}
                </View>
              </Card>
            </View>
          )
        })}

        {/* The fee an employer actually pays, stated before they post. */}
        <Spacer h={space.lg} />
        <Card style={{ backgroundColor: colors.soft }}>
          <Row gap={space.sm}>
            <Ionicons name="pricetag-outline" size={19} color={colors.ink} />
            <Text style={s.feeTitle}>Our fee on each job</Text>
          </Row>
          <Small style={{ marginTop: 6 }}>
            It comes out of the pay you set - you pay exactly what you type, and the worker
            sees what reaches them.
          </Small>
          <View style={{ marginTop: space.md }}>
            {FEE_SLABS.map((sl) => (
              <Row key={sl.label} style={s.feeRow}>
                <Small style={{ flex: 1, color: colors.body }}>{sl.label}</Small>
                <Text style={s.feePercent}>{sl.percent}%</Text>
              </Row>
            ))}
          </View>
        </Card>
        <Spacer h={space.lg} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  plan: { marginBottom: space.md, borderWidth: 2 },
  planOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  planName: { fontSize: 16, fontWeight: '800', color: colors.ink },
  planPrice: { fontSize: 22, fontWeight: '800', color: colors.blueDark, marginTop: 3 },
  planPer: { fontSize: 13, fontWeight: '500', color: colors.muted },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  feeTitle: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
  feeRow: { paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.line },
  feePercent: { fontSize: 14.5, fontWeight: '800', color: colors.ink },
})
