import React, { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Avatar, Badge, Body, Button, Card, ErrorNote, H3, KV, Row, Screen,
  Small, Spacer, formatDate, money,
} from '../../ui'
import { splitPrice } from '../../ui/catalog'
import * as offersApi from '../../api/offers'
import { errorText } from '../../api/client'
import { colors, space } from '../../theme'

/**
 * The last look before an offer goes out.
 *
 * An offer is a promise to a named person, and it cannot be edited once they
 * have seen it - so this screen exists purely so nobody sends the wrong number
 * by pressing one button too quickly.
 */
export default function OfferPreview({ navigation, route }) {
  const { t } = useTranslation()
  const { applicationId, draft, workerName, jobTitle } = route?.params || {}
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const split = splitPrice(draft?.salary)
  const oneDay = draft?.oneDay

  const send = async () => {
    setBusy(true); setError('')
    try {
      const offer = await offersApi.send(applicationId, {
        salary: Number(draft.salary),
        salaryUnit: draft.salaryUnit,
        joiningDate: draft.joiningDateIso,
        message: draft.message || undefined,
        benefits: (draft.benefits || []).map((b) => ({ benefitType: b })),
      })
      navigation.replace('OfferSent', { offer, workerName })
    } catch (err) {
      setError(errorText(err, 'We could not send this offer.'))
    } finally { setBusy(false) }
  }

  return (
    <Screen
      padded={false}
      footer={(
        <Row>
          <Button title={t('offerPreview.editIt')} tone="quiet" style={{ flex: 1 }}
            onPress={navigation.goBack} />
          <Button title={t('offers.send')} icon="send" style={{ flex: 2 }}
            loading={busy} onPress={send} />
        </Row>
      )}
    >
      <AppBar title={t('offerPreview.title')} onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Row style={{ marginBottom: space.lg }}>
          <Avatar name={workerName} size={52} />
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{workerName}</Text>
            <Small style={{ marginTop: 2 }}>{jobTitle}</Small>
          </View>
          <Badge label={oneDay ? t('post.perDay') : t('post.perMonth')} tone="violet" />
        </Row>

        <ErrorNote>{error}</ErrorNote>

        <H3 style={{ marginBottom: space.sm }}>{t('offers.jobSummary')}</H3>
        <Card>
          <KV k={t('post.jobTitle')} v={jobTitle} strong />
          <KV k={oneDay ? t('post.workDate') : t('offers.actualJoining')}
            v={draft?.joiningDateIso ? formatDate(draft.joiningDateIso) : '—'} />
          {draft?.workingHours ? <KV k={t('post.shiftTimings')} v={draft.workingHours} /> : null}
          {draft?.location ? <KV k={t('jobs.title')} v={draft.location} /> : null}
        </Card>

        <H3 style={{ marginTop: space.xl, marginBottom: space.sm }}>{t('offers.paySummary')}</H3>
        <Card>
          <KV k={t('post.youPay')} v={money(split.total)} strong />
          <KV k={`${t('post.jobonFee')} (${split.percent}%)`} v={`− ${money(split.fee)}`} />
          <KV k={t('post.workerGets')} v={money(split.workerPay)} strong />
        </Card>

        {(draft?.benefits || []).length ? (
          <>
            <H3 style={{ marginTop: space.xl, marginBottom: space.sm }}>{t('offers.additional')}</H3>
            <Card>
              {draft.benefits.map((b) => (
                <Row key={b} gap={space.sm} style={{ paddingVertical: 7 }}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.green} />
                  <Body style={{ flex: 1, fontSize: 14.5 }}>{b.replace(/_/g, ' ').toLowerCase()}</Body>
                </Row>
              ))}
            </Card>
          </>
        ) : null}

        {draft?.message ? (
          <>
            <H3 style={{ marginTop: space.xl, marginBottom: space.sm }}>
              {t('offers.messageToWorker')}
            </H3>
            <Card style={{ backgroundColor: colors.blueSoft, borderColor: colors.blueLine }}>
              <Body style={{ fontSize: 14.5, color: colors.ink }}>{draft.message}</Body>
            </Card>
          </>
        ) : null}

        <View style={s.note}>
          <Ionicons name="information-circle-outline" size={18} color={colors.blueDark} />
          <Small style={{ flex: 1, color: colors.blueDark }}>{t('offerPreview.confirm')}</Small>
        </View>

        <Spacer h={space.xxl} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  name: { fontSize: 18, fontWeight: '800', color: colors.ink },
  note: {
    flexDirection: 'row', gap: space.sm, alignItems: 'center',
    backgroundColor: colors.blueSoft, borderRadius: 12, padding: space.md, marginTop: space.lg,
  },
})
