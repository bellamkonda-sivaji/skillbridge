import React, { useEffect, useState } from 'react'
import { Linking, Platform, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Body, Button, Card, H3, Loader, Row, Screen, Small, Spacer, formatDate, hhmm,
} from '../../ui'
import * as offersApi from '../../api/offers'
import { colors, radius, space } from '../../theme'
import AskForCall from '../../ui/AskForCall'

/**
 * What to do before the first day.
 *
 * Four short instructions, the address with a way to open maps, and the phone
 * number of the person to ask for. That last one matters more than anything
 * else on the screen: a worker who is lost outside a shop needs a number, not
 * a policy.
 */
export default function JoiningInstructions({ navigation, route }) {
  const { t } = useTranslation()
  const id = route?.params?.id
  const [offer, setOffer] = useState(null)

  useEffect(() => { offersApi.offerDetail(id).then(setOffer).catch(() => setOffer({})) }, [id])

  if (!offer) return <Screen scroll={false}><Loader /></Screen>

  const address = offer.workLocation || [offer.area, offer.city].filter(Boolean).join(', ')
  const openMaps = () => {
    const q = encodeURIComponent(address || offer.businessName || '')
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${q}`,
      default: `https://www.google.com/maps/search/?api=1&query=${q}`,
    })
    Linking.openURL(url).catch(() => {})
  }

  const steps = [
    { icon: 'time-outline', text: t('offers.reachEarly') },
    { icon: 'shirt-outline', text: t('offers.wearClothes') },
    { icon: 'card-outline', text: t('offers.carryId') },
    { icon: 'call-outline', text: t('offers.callIfLate') },
  ]

  return (
    <Screen
      padded={false}
      footer={(
        <Button
          title={t('offers.onMyWay')}
          icon="walk-outline"
          tone="success"
          onPress={() => navigation.navigate('MyWorkTab')}
        />
      )}
    >
      <AppBar title={t('offers.joiningTitle')} onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Card>
          <Row align="flex-start">
            <View style={s.logo}><Ionicons name="storefront" size={22} color={colors.blue} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.biz}>{offer.businessName}</Text>
              <Small style={{ marginTop: 2 }}>{offer.jobTitle}</Small>
              <Small style={{ marginTop: 4 }}>
                {formatDate(offer.workDate || offer.joiningDate)}
                {offer.startTime ? ` · ${hhmm(offer.startTime)} – ${hhmm(offer.endTime)}` : ''}
              </Small>
            </View>
          </Row>
        </Card>

        <H3 style={{ marginTop: space.xl, marginBottom: space.md }}>{t('offers.joiningTitle')}</H3>
        {steps.map((step) => (
          <Row key={step.text} gap={space.md} style={s.step}>
            <View style={s.stepIcon}><Ionicons name={step.icon} size={18} color={colors.blue} /></View>
            <Body style={{ flex: 1, fontSize: 14.5, color: colors.ink }}>{step.text}</Body>
          </Row>
        ))}

        <H3 style={{ marginTop: space.xl, marginBottom: space.md }}>{t('offers.storeLocation')}</H3>
        <Card>
          <Row gap={space.sm} align="flex-start">
            <Ionicons name="location-outline" size={19} color={colors.blue} />
            <Body style={{ flex: 1, fontSize: 14.5 }}>{address || '—'}</Body>
          </Row>
          <Button title={t('offers.directions')} icon="navigate-outline" tone="outline" size="sm"
            style={{ marginTop: space.md }} onPress={openMaps} />
        </Card>

        {offer.contactPersonPhone || offer.employerPhone ? (
          <>
            <H3 style={{ marginTop: space.xl, marginBottom: space.md }}>{t('offers.contactPerson')}</H3>
            <Card>
              <Row>
                <View style={s.logo}><Ionicons name="person" size={20} color={colors.blue} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.biz}>{offer.contactPersonName || offer.employerName || 'Owner'}</Text>
                  <Small style={{ marginTop: 2 }}>
                  </Small>
                </View>
                <AskForCall about={`Please arrange a call about joining ${offer?.businessName || offer?.employerName || 'this job'}.`} tone="success" size="sm" />
              </Row>
            </Card>
          </>
        ) : null}

        <Spacer h={space.xxl} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  logo: {
    width: 46, height: 46, borderRadius: 13, backgroundColor: colors.blueSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  biz: { fontSize: 16, fontWeight: '700', color: colors.ink },
  step: {
    backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.line, padding: space.md, marginBottom: space.sm,
  },
  stepIcon: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: colors.blueSoft,
    alignItems: 'center', justifyContent: 'center',
  },
})
