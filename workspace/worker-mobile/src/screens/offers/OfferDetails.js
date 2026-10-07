import React, { useCallback, useEffect, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Badge, Body, Button, Card, ErrorNote, H3, KV, Loader, Row, Screen,
  Small, Spacer, formatDate, hhmm, money,
} from '../../ui'
import * as offersApi from '../../api/offers'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

/**
 * The full offer, and the two buttons that answer it.
 *
 * This screen adapts to the length of the engagement: a one-day job shows the
 * date and the money for that day, a permanent one shows the joining date,
 * monthly salary and trial period. Same screen, different facts - the worker
 * should not have to learn two layouts.
 */
export default function OfferDetails({ navigation, route }) {
  const { t } = useTranslation()
  const id = route?.params?.id
  const [offer, setOffer] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try { setOffer(await offersApi.offerDetail(id)) } catch (err) {
      setError(errorText(err, 'We could not load this offer.'))
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const accept = async () => {
    setBusy(true)
    try {
      await offersApi.acceptOffer(id)
      navigation.replace('OfferAccepted', { id })
    } catch (err) {
      Alert.alert('', errorText(err, 'We could not accept this offer.'))
    } finally { setBusy(false) }
  }

  const decline = () => {
    Alert.alert(t('offers.decline'), t('applications.withdrawAsk'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('offers.decline'),
        style: 'destructive',
        onPress: async () => {
          try { await offersApi.declineOffer(id); navigation.goBack() } catch (err) {
            Alert.alert('', errorText(err))
          }
        },
      },
    ])
  }

  if (!offer && !error) return <Screen scroll={false}><Loader /></Screen>
  if (!offer) {
    return <Screen padded={false}><AppBar onBack={navigation.goBack} />
      <View style={{ padding: space.lg }}><ErrorNote onRetry={load}>{error}</ErrorNote></View></Screen>
  }

  const oneDay = offer.offerType === 'ONE_DAY' || offer.engagementModel === 'ONE_DAY'
  const open = ['PENDING', 'SENT'].includes(offer.status)
  const takeHome = offer.workerSalary ?? offer.salary

  return (
    <Screen
      padded={false}
      footer={open ? (
        <Row>
          <Button title={t('offers.decline')} tone="dangerQuiet" onPress={decline} style={{ flex: 1 }} />
          <Button title={t('offers.accept')} tone="success" onPress={accept} loading={busy} style={{ flex: 2 }} />
        </Row>
      ) : null}
    >
      <AppBar title={t('offers.offerDetails')} onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Row align="flex-start">
          <View style={s.logo}><Ionicons name="storefront" size={24} color={colors.blue} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.biz}>{offer.businessName}</Text>
            <Small style={{ marginTop: 2 }}>{[offer.area, offer.city].filter(Boolean).join(', ')}</Small>
            <Badge label={oneDay ? t('work.oneDay') : t('work.permanent')} tone="violet"
              style={{ marginTop: 7 }} />
          </View>
        </Row>

        <Card style={s.payCard}>
          <Small style={{ color: colors.greenText }}>{t('jobs.youGet')}</Small>
          <Text style={s.payBig}>
            {money(takeHome)}{oneDay ? ` ${t('common.perDay')}` : ` ${t('common.perMonth')}`}
          </Text>
        </Card>

        <H3 style={{ marginTop: space.xl, marginBottom: space.sm }}>{t('offers.jobDetails')}</H3>
        <Card>
          <KV k={t('applications.detailsTitle')} v={offer.jobTitle} />
          {oneDay ? (
            <>
              <KV k={t('offers.workDate')} v={formatDate(offer.workDate)} />
              <KV k={t('offers.workTime')}
                v={offer.startTime ? `${hhmm(offer.startTime)} – ${hhmm(offer.endTime)}` : '—'} />
              {offer.breakMinutes ? <KV k={t('offers.breakTime')} v={`${offer.breakMinutes} min`} /> : null}
            </>
          ) : (
            <>
              <KV k={t('offers.joining')} v={formatDate(offer.joiningDate)} />
              {offer.probationMonths ? (
                <KV k={t('myWork.probation')} v={`${offer.probationMonths} months`} />
              ) : null}
              {offer.workingDays ? <KV k={t('myWork.workingDays')} v={offer.workingDays} /> : null}
              {offer.startTime ? (
                <KV k={t('myWork.workingHours')} v={`${hhmm(offer.startTime)} – ${hhmm(offer.endTime)}`} />
              ) : null}
            </>
          )}
          <KV k={t('jobs.location')} v={offer.workLocation || offer.city} />
        </Card>

        {offer.benefits?.length ? (
          <>
            <H3 style={{ marginTop: space.xl, marginBottom: space.sm }}>{t('offers.benefits')}</H3>
            <Card>
              {offer.benefits.map((b) => (
                <Row key={b.label || b} gap={space.sm} style={{ paddingVertical: 7 }}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.green} />
                  <Body style={{ flex: 1, fontSize: 14.5 }}>{b.label || b}</Body>
                </Row>
              ))}
            </Card>
          </>
        ) : null}

        {offer.message ? (
          <>
            <H3 style={{ marginTop: space.xl, marginBottom: space.sm }}>{t('offers.messageFrom')}</H3>
            <Card style={{ backgroundColor: colors.blueSoft, borderColor: colors.blueLine }}>
              <Body style={{ fontSize: 14.5, color: colors.ink }}>{offer.message}</Body>
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
    width: 54, height: 54, borderRadius: 14, backgroundColor: colors.blueSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  biz: { fontSize: 17, fontWeight: '800', color: colors.ink },
  payCard: { marginTop: space.lg, backgroundColor: colors.greenSoft, borderColor: colors.greenLine },
  payBig: { fontSize: 28, fontWeight: '800', color: colors.greenText, marginTop: 2 },
})
