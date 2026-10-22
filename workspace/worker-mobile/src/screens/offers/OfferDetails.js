import React, { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Badge, Body, Button, Card, ErrorNote, H3, KV, Loader, Row, Screen,
  Small, Spacer, formatDate, hhmm, isOngoing, money, pay,
} from '../../ui'
import { EMPLOYMENT_TYPES } from '../../ui/catalog'
import * as offersApi from '../../api/offers'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'
import { Dialog } from '../../ui/Dialog'

/**
 * The full offer, and the two buttons that answer it.
 *
 * This screen adapts to the length of the engagement: a one-day job shows the
 * date and the money for that day, a permanent one shows the joining date,
 * monthly salary and trial period. Same screen, different facts - the worker
 * should not have to learn two layouts.
 */
const DAY = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' }
const ORDER = Object.keys(DAY)

/** ["MON".."SAT"] -> "Mon – Sat"; a broken run is listed. */
function daysLabel(days) {
  if (!days?.length) return null
  const idx = days.map((d) => ORDER.indexOf(d)).filter((i) => i >= 0).sort((a, b) => a - b)
  const run = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1)
  return run && idx.length > 2 ? `${DAY[ORDER[idx[0]]]} – ${DAY[ORDER[idx[idx.length - 1]]]}`
    : idx.map((i) => DAY[ORDER[i]]).join(', ')
}

export default function OfferDetails({ navigation, route }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language || 'en'
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
      const message = errorText(err, 'We could not accept this offer.')
      // Nothing the worker did wrong - the shop has to add the money first.
      if (/has not added the money/i.test(message)) {
        Dialog.alert('Waiting for the shop', message, [{ text: 'OK, got it' }], { tone: 'info' })
      } else {
        Dialog.alert('', message)
      }
    } finally { setBusy(false) }
  }

  const decline = () => {
    Dialog.alert(t('offers.decline'), t('applications.withdrawAsk'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('offers.decline'),
        style: 'destructive',
        onPress: async () => {
          try { await offersApi.declineOffer(id); navigation.goBack() } catch (err) {
            Dialog.alert('', errorText(err))
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

  const oneDay = offer.engagementModel === 'ONE_DAY' || offer.offerType === 'ONE_DAY'
  const open = ['PENDING', 'SENT'].includes(offer.status)
  // What actually reaches them, in the offer's own unit. This used to print
  // the shop's price with "/month" on a daily job.
  const takeHome = offer.workerSalary ?? offer.salary
  const length = EMPLOYMENT_TYPES.find((e) => e.value === offer.engagementModel)
  const hours = offer.startTime ? `${hhmm(offer.startTime)} – ${hhmm(offer.endTime)}` : null

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
            <Text style={s.biz}>{offer.jobTitle}</Text>
            <Small style={{ marginTop: 2 }}>{offer.employerName}</Small>
            {length ? (
              <Badge label={length[lang] || length.en} tone="violet" style={{ marginTop: 7, alignSelf: 'flex-start' }} />
            ) : null}
          </View>
        </Row>

        <Card style={s.payCard}>
          <Small style={{ color: colors.greenText }}>{t('jobs.youGet')}</Small>
          <Text style={s.payBig}>{pay(takeHome, offer.salaryUnit)}</Text>
          {offer.estimatedWorkerPay ? (
            <Small style={{ color: colors.greenText, marginTop: 4 }}>
              {/* An ongoing job has no "whole work" - its estimate is one
                  month, so that is what it is called. */}
              {isOngoing(offer)
                ? t('offers.everyMonth', { amount: money(offer.estimatedWorkerPay) })
                : t('offers.wholeWork', { amount: money(offer.estimatedWorkerPay) })}
            </Small>
          ) : null}
        </Card>

        <H3 style={{ marginTop: space.xl, marginBottom: space.sm }}>{t('offers.jobDetails')}</H3>
        <Card>
          {oneDay ? (
            <KV k={t('offers.workDate')} v={formatDate(offer.workDate || offer.joiningDate)} />
          ) : (
            <>
              <KV k={t('offers.joining')} v={formatDate(offer.joiningDate || offer.startDate)} />
              {offer.endDate ? <KV k="Last day" v={formatDate(offer.endDate)} /> : null}
              {offer.probationMonths ? (
                <KV k={t('myWork.probation')} v={`${offer.probationMonths} months`} />
              ) : null}
            </>
          )}
          {daysLabel(offer.workingDays) ? <KV k={t('myWork.workingDays')} v={daysLabel(offer.workingDays)} /> : null}
          {hours ? <KV k={t('myWork.workingHours')} v={hours} /> : null}
          <KV k={t('jobs.location')} v={offer.workLocation} />
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
