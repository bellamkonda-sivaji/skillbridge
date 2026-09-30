import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Linking, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Avatar, Badge, Body, Button, Card, ErrorNote, H3, KV, Loader, Row,
  Screen, Small, Spacer, formatDate, money, timeOnly,
} from '../../ui'
import * as offersApi from '../../api/offers'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

const TONE = { PENDING: 'orange', SENT: 'orange', ACCEPTED: 'green', DECLINED: 'red', CANCELLED: 'grey' }

/**
 * One offer, and exactly where it has got to.
 *
 * "Sent three days ago" is not an answer to "have they seen it" - so the
 * timeline separates sent, seen and answered. An employer refreshing this
 * screen is deciding whether to ring the person, and those are different
 * situations.
 */
export default function OfferStatusDetail({ navigation, route }) {
  const { t } = useTranslation()
  const offerId = route?.params?.offerId
  const [offer, setOffer] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try { setOffer(await offersApi.detail(offerId)) } catch (err) {
      setError(errorText(err, 'We could not load this offer.'))
    }
  }, [offerId])

  useEffect(() => { load() }, [load])

  const cancel = () => {
    Alert.alert(t('offers.cancelOffer'), t('offers.cancelAsk'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('offers.cancelOffer'),
        style: 'destructive',
        onPress: async () => {
          setBusy(true)
          try { await offersApi.cancel(offerId); await load() } catch (err) {
            Alert.alert('', errorText(err))
          } finally { setBusy(false) }
        },
      },
    ])
  }

  if (!offer && !error) return <Screen scroll={false}><Loader /></Screen>
  if (!offer) {
    return <Screen padded={false}><AppBar onBack={navigation.goBack} />
      <View style={{ padding: space.lg }}><ErrorNote onRetry={load}>{error}</ErrorNote></View></Screen>
  }

  const open = ['PENDING', 'SENT'].includes(offer.status)
  const declined = offer.status === 'DECLINED'

  const steps = [
    { key: 'sent', label: t('offers.stepSent'), at: offer.sentAt || offer.createdAt, done: true },
    { key: 'viewed', label: t('offers.stepViewed'), at: offer.viewedAt, done: Boolean(offer.viewedAt) },
    {
      key: 'answered',
      label: declined ? t('offers.stepDeclined') : t('offers.stepAccepted'),
      at: offer.respondedAt || offer.acceptedAt || offer.declinedAt,
      done: ['ACCEPTED', 'DECLINED'].includes(offer.status),
      bad: declined,
    },
    {
      key: 'joined',
      label: t('offers.workerJoined'),
      at: offer.joinedAt,
      done: Boolean(offer.joinedAt),
    },
  ]

  return (
    <Screen
      padded={false}
      footer={(
        <Row>
          {offer.workerPhone ? (
            <Button title={t('applicants.call')} icon="call" tone="success" style={{ flex: 1 }}
              onPress={() => Linking.openURL(`tel:${offer.workerPhone}`)} />
          ) : null}
          {open ? (
            <Button title={t('offers.cancelOffer')} tone="dangerQuiet" style={{ flex: 1 }}
              loading={busy} onPress={cancel} />
          ) : null}
          {offer.status === 'ACCEPTED' ? (
            <Button title={t('offers.joiningTitle')} style={{ flex: 2 }}
              onPress={() => navigation.navigate('JoiningConfirmation', { offerId })} />
          ) : null}
        </Row>
      )}
    >
      <AppBar title={t('offers.tracking')} onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Row align="flex-start">
          <Avatar uri={offer.photoUrl} name={offer.workerName} size={54} />
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{offer.workerName}</Text>
            <Small style={{ marginTop: 2 }}>{offer.jobTitle}</Small>
          </View>
          <Badge label={offer.status} tone={TONE[offer.status] || 'grey'} />
        </Row>

        <ErrorNote onRetry={load}>{error}</ErrorNote>

        <Card style={s.payCard}>
          <Small>{t('post.youPay')}</Small>
          <Text style={s.payBig}>{money(offer.salary)}</Text>
          {offer.workerSalary ? (
            <Small style={{ marginTop: 3 }}>
              {t('post.workerGets')} {money(offer.workerSalary)}
            </Small>
          ) : null}
        </Card>

        <H3 style={{ marginTop: space.xl, marginBottom: space.md }}>{t('offers.workStatus')}</H3>
        {steps.map((st, i) => (
          <Row key={st.key} align="flex-start" gap={space.md}>
            <View style={{ alignItems: 'center' }}>
              <View style={[s.dot, st.done && (st.bad ? s.dotBad : s.dotDone)]}>
                {st.done ? (
                  <Ionicons name={st.bad ? 'close' : 'checkmark'} size={13} color={colors.white} />
                ) : null}
              </View>
              {i < steps.length - 1 ? <View style={[s.line, st.done && !st.bad && s.lineDone]} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: space.lg }}>
              <Text style={[s.stepLabel, !st.done && { color: colors.muted }]}>{st.label}</Text>
              <Small style={{ marginTop: 2 }}>
                {st.at ? `${formatDate(st.at)} · ${timeOnly(st.at)}` : t('offers.waitingOn')}
              </Small>
            </View>
          </Row>
        ))}

        {open ? (
          <View style={s.note}>
            <Ionicons name="information-circle-outline" size={18} color={colors.blueDark} />
            <Small style={{ flex: 1, color: colors.blueDark }}>{t('offers.willTell')}</Small>
          </View>
        ) : null}

        <H3 style={{ marginTop: space.xl, marginBottom: space.sm }}>{t('offers.jobSummary')}</H3>
        <Card>
          <KV k={t('post.jobTitle')} v={offer.jobTitle} strong />
          {offer.joiningDate ? (
            <KV k={t('offers.actualJoining')} v={formatDate(offer.joiningDate)} />
          ) : null}
          {offer.workDate ? <KV k={t('post.workDate')} v={formatDate(offer.workDate)} /> : null}
          {offer.workLocation ? <KV k={t('business.address')} v={offer.workLocation} /> : null}
        </Card>

        {offer.message ? (
          <>
            <H3 style={{ marginTop: space.xl, marginBottom: space.sm }}>
              {t('offers.messageToWorker')}
            </H3>
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
  name: { fontSize: 18, fontWeight: '800', color: colors.ink },
  payCard: { marginTop: space.lg },
  payBig: { fontSize: 26, fontWeight: '800', color: colors.ink, marginTop: 2 },
  dot: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.green },
  dotBad: { backgroundColor: colors.red },
  line: { width: 2, flex: 1, minHeight: 26, backgroundColor: colors.line },
  lineDone: { backgroundColor: colors.greenLine },
  stepLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  note: {
    flexDirection: 'row', gap: space.sm, alignItems: 'center',
    backgroundColor: colors.blueSoft, borderRadius: radius.md, padding: space.md,
  },
})
