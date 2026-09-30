import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Button, Card, Loader, Row, Screen, Small, Spacer, SuccessPanel,
  formatDate, hhmm, money,
} from '../../ui'
import * as offersApi from '../../api/offers'
import { colors, space } from '../../theme'

/** The confirmation after accepting. Short, and it points at what happens next. */
export default function OfferAccepted({ navigation, route }) {
  const { t } = useTranslation()
  const id = route?.params?.id
  const [offer, setOffer] = useState(null)

  useEffect(() => { offersApi.offerDetail(id).then(setOffer).catch(() => setOffer({})) }, [id])

  if (!offer) return <Screen scroll={false}><Loader /></Screen>

  const oneDay = offer.offerType === 'ONE_DAY' || offer.engagementModel === 'ONE_DAY'

  return (
    <Screen padded={false} bg={colors.white}>
      <AppBar onBack={() => navigation.navigate('Offers')} />
      <SuccessPanel
        title={t('offers.acceptedTitle')}
        sub={`${t('offers.acceptedSub')} ${offer.businessName || ''}`.trim()}
      >
        <Card style={s.card}>
          {oneDay && offer.workDate ? (
            <Fact icon="calendar-outline" text={formatDate(offer.workDate)} />
          ) : null}
          {!oneDay && offer.joiningDate ? (
            <Fact icon="calendar-outline" text={`${t('offers.joining')}: ${formatDate(offer.joiningDate)}`} />
          ) : null}
          {offer.startTime ? (
            <Fact icon="time-outline" text={`${hhmm(offer.startTime)} – ${hhmm(offer.endTime)}`} />
          ) : null}
          <Fact
            icon="cash-outline"
            text={`${money(offer.workerSalary ?? offer.salary)}${oneDay ? ` ${t('common.perDay')}` : ` ${t('common.perMonth')}`}`}
          />
        </Card>

        <View style={s.note}>
          <Ionicons name="information-circle-outline" size={18} color={colors.blueDark} />
          <Small style={{ flex: 1, color: colors.blueDark }}>
            The shop owner has been told. Your joining details are in My work.
          </Small>
        </View>

        <View style={{ alignSelf: 'stretch', gap: space.md, marginTop: space.xl }}>
          <Button
            title={t('offers.joiningTitle')}
            onPress={() => navigation.replace('JoiningInstructions', { id })}
          />
          <Button
            title={t('offers.goToMyWork')}
            tone="outline"
            onPress={() => navigation.navigate('MyWorkTab')}
          />
        </View>
      </SuccessPanel>
      <Spacer h={space.xl} />
    </Screen>
  )
}

const Fact = ({ icon, text }) => (
  <Row gap={space.md} style={{ paddingVertical: 8 }}>
    <Ionicons name={icon} size={19} color={colors.blue} />
    <Text style={s.factText}>{text}</Text>
  </Row>
)

const s = StyleSheet.create({
  card: { alignSelf: 'stretch', marginTop: space.xl },
  factText: { fontSize: 15, fontWeight: '600', color: colors.ink, flex: 1 },
  note: {
    flexDirection: 'row', gap: space.sm, alignItems: 'center', alignSelf: 'stretch',
    backgroundColor: colors.blueSoft, borderRadius: 12, padding: space.md, marginTop: space.lg,
  },
})
