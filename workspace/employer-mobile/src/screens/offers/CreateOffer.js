import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  AppBar, Avatar, Body, Button, Card, CheckRow, ErrorNote, Field, H3, Input,
  KV, Loader, Row, Screen, Small, Spacer, money,
} from '../../ui'
import { BENEFITS, splitPrice } from '../../ui/catalog'
import * as offersApi from '../../api/offers'
import { errorText } from '../../api/client'
import { colors, space } from '../../theme'

/**
 * Making an offer.
 *
 * The draft comes from the job, so the common case is checking three numbers
 * and pressing send. The split is shown again here because this is the moment
 * the money becomes a promise to a named person.
 */
export default function CreateOffer({ navigation, route }) {
  const { t } = useTranslation()
  const { applicationId } = route?.params || {}
  const [draft, setDraft] = useState(null)
  const [form, setForm] = useState({ salary: '', joiningDate: '', message: '', benefits: [] })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    offersApi.draft(applicationId)
      .then((d) => {
        setDraft(d)
        setForm((f) => ({
          ...f,
          salary: String(d.salary ?? d.suggestedSalary ?? ''),
          joiningDate: d.joiningDate || '',
          benefits: (d.benefits || []).map((b) => b.benefitType || b),
        }))
      })
      .catch((err) => { setError(errorText(err, 'We could not prepare this offer.')); setDraft({}) })
  }, [applicationId])

  if (!draft) return <Screen scroll={false}><Loader /></Screen>

  const split = splitPrice(form.salary)
  const oneDay = draft.offerType === 'ONE_DAY' || draft.engagementModel === 'ONE_DAY'

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))
  const toggleBenefit = (v) => setForm((f) => ({
    ...f,
    benefits: f.benefits.includes(v) ? f.benefits.filter((x) => x !== v) : [...f.benefits, v],
  }))

  const iso = (text) => {
    const parts = String(text).split(/[^0-9]+/).filter(Boolean)
    if (parts.length !== 3) return undefined
    const [d, m, y] = parts
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  // An offer cannot be edited once the worker has seen it, so this hands off to
  // a preview rather than sending on the first press.
  const review = () => {
    if (!(Number(form.salary) > 0)) { setError('Enter what you will pay.'); return }
    navigation.navigate('OfferPreview', {
      applicationId,
      workerName: draft.workerName,
      jobTitle: draft.jobTitle,
      draft: {
        salary: Number(form.salary),
        salaryUnit: draft.salaryUnit,
        joiningDateIso: iso(form.joiningDate),
        message: form.message,
        benefits: form.benefits,
        oneDay,
        workingHours: draft.workingHours,
        location: draft.workLocation || draft.city,
      },
    })
  }

  return (
    <Screen
      padded={false}
      footer={<Button title={t('offers.preview')} iconRight="arrow-forward" onPress={review} />}
    >
      <AppBar title={t('offers.create')} onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Row style={{ marginBottom: space.lg }}>
          <Avatar name={draft.workerName} size={50} />
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{draft.workerName}</Text>
            <Small style={{ marginTop: 2 }}>{draft.jobTitle}</Small>
          </View>
        </Row>

        <ErrorNote>{error}</ErrorNote>

        <Field label={t('post.amount')}>
          <Input value={form.salary} onChangeText={(v) => set('salary')(v.replace(/\D/g, ''))}
            keyboardType="number-pad" prefix="₹" placeholder="700" />
        </Field>

        {split.total > 0 ? (
          <Card style={{ marginBottom: space.lg }}>
            <KV k={t('post.youPay')} v={money(split.total)} strong />
            <KV k={`${t('post.jobonFee')} (${split.percent}%)`} v={`− ${money(split.fee)}`} />
            <KV k={t('post.workerGets')} v={money(split.workerPay)} strong />
            <Small style={{ marginTop: space.sm }}>{t('post.feeNote')}</Small>
          </Card>
        ) : null}

        <Field label={oneDay ? t('post.workDate') : t('offers.actualJoining')} hint="DD / MM / YYYY">
          <Input value={form.joiningDate} onChangeText={set('joiningDate')}
            placeholder="20 / 04 / 2026" keyboardType="numbers-and-punctuation" />
        </Field>

        <Field label={t('offers.additional')} hint={t('common.optional')}>
          {BENEFITS.map((b) => (
            <CheckRow key={b.value} checked={form.benefits.includes(b.value)}
              onToggle={() => toggleBenefit(b.value)}>
              <Body style={{ fontSize: 14.5 }}>{t(`post.${b.key}`)}</Body>
            </CheckRow>
          ))}
        </Field>

        <Field label={t('offers.messageToWorker')} hint={t('common.optional')}>
          <Input value={form.message} onChangeText={set('message')} multiline maxLength={500}
            placeholder="Please reach the shop 10 minutes early."
            style={{ minHeight: 90, alignItems: 'flex-start' }} />
        </Field>

        <Spacer h={space.lg} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  name: { fontSize: 17, fontWeight: '800', color: colors.ink },
})
