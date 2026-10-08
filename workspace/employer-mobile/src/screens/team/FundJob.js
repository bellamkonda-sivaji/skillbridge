import React, { useCallback, useEffect, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Body, Button, Card, ErrorNote, Field, H3, Input, KV, Loader, Row,
  Screen, Small, Spacer, SuccessPanel, money,
} from '../../ui'
import * as teamApi from '../../api/team'
import * as miscApi from '../../api/misc'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'
import RazorpayCheckout from 'react-native-razorpay'
import { useSession } from '../../session/SessionProvider'

/**
 * Putting money behind a job.
 *
 * The screen explains why the money is held before it asks for any, because
 * "give us the wages up front" is a reasonable thing for a small business to
 * be suspicious of - and the honest answer (the worker knows they will be
 * paid, you only pay for work that happened) is the whole argument.
 */
export default function FundJob({ navigation, route }) {
  const { user } = useSession()
  const { t } = useTranslation()
  const { jobId, jobTitle } = route?.params || {}
  const [escrow, setEscrow] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const [e, w] = await Promise.all([
        teamApi.escrow(jobId),
        miscApi.wallet().catch(() => null),
      ])
      setEscrow(e)
      setWallet(w)
      const needed = Math.max(0, (e?.requiredMinor ?? 0) - (e?.fundedMinor ?? 0)) / 100
      if (needed > 0) setAmount(String(Math.round(needed)))
    } catch (err) {
      setError(errorText(err, 'We could not load this job’s money.'))
      setEscrow({})
    }
  }, [jobId])

  useEffect(() => { load() }, [load])

  if (!escrow) return <Screen scroll={false}><Loader /></Screen>

  if (done) {
    return (
      <Screen bg={colors.white} footer={<Button title={t('common.done')}
        onPress={() => navigation.goBack()} />}>
        <SuccessPanel title={t('fund.funded')} sub={jobTitle} />
      </Screen>
    )
  }

  const rupees = (minor) => (Number(minor) || 0) / 100
  const funded = rupees(escrow.fundedMinor)
  const required = rupees(escrow.requiredMinor)
  const reserved = rupees(escrow.reservedMinor)
  const walletBalance = rupees(wallet?.balanceMinor ?? wallet?.balance * 100)

  const fund = async (fromWallet) => {
    const value = Number(amount)
    if (!(value > 0)) { setError('Enter how much to add.'); return }
    setBusy(true); setError('')
    try {
      if (fromWallet) {
        await teamApi.fundFromWallet(jobId, value)
        setDone(true)
        return
      }

      // The order is written down first, so a payment that succeeds while the
      // app dies still arrives by webhook with something to match it to.
      const order = await teamApi.createEscrowOrder(jobId, value)

      // Razorpay's own checkout: cards, UPI, Google Pay, PhonePe, net banking.
      // In test mode every one of those is real UI with test instruments
      // behind it, which is the point - the flow is what needs testing, not
      // the money.
      const result = await RazorpayCheckout.open({
        key: order.keyId,
        order_id: order.providerOrderId,
        amount: order.amountMinor,
        currency: order.currency || 'INR',
        name: 'JobOn',
        description: jobTitle || 'Money for this job',
        prefill: {
          contact: user?.phone || '',
          email: user?.email || '',
        },
        theme: { color: '#2563EB' },
      })

      // Verified on our server, never trusted from the phone: the signature is
      // what proves the payment is real and not something typed into the app.
      await teamApi.verifyEscrow(jobId, {
        providerOrderId: result.razorpay_order_id,
        providerPaymentId: result.razorpay_payment_id,
        signature: result.razorpay_signature,
      })
      setDone(true)
    } catch (err) {
      // Closing the sheet is a choice, not a failure, and should not be
      // reported as one.
      const cancelled = err?.code === 0 || /cancel/i.test(err?.description || '')
      if (!cancelled) {
        setError(err?.description || errorText(err, 'We could not take that payment.'))
      }
    } finally { setBusy(false) }
  }

  return (
    <Screen padded={false}>
      <AppBar title={t('fund.title')} subtitle={jobTitle} onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Body style={{ marginBottom: space.lg }}>{t('fund.sub')}</Body>
        <ErrorNote onRetry={load}>{error}</ErrorNote>

        <Card>
          <KV k={t('fund.needed')} v={money(required)} strong />
          <KV k={t('fund.inEscrow')} v={money(funded)} />
          {reserved > 0 ? <KV k="Held for workers" v={money(reserved)} /> : null}
          {wallet ? <KV k={t('fund.walletBalance')} v={money(walletBalance)} /> : null}
        </Card>

        <Field label={t('fund.toAdd')} style={{ marginTop: space.lg }}>
          <Input value={amount} onChangeText={(v) => setAmount(v.replace(/\D/g, ''))}
            keyboardType="number-pad" prefix="₹" placeholder="5000" />
        </Field>

        <Button title={t('fund.payNow')} icon="card-outline" loading={busy}
          onPress={() => fund(false)} />
        {wallet ? (
          <Button title={t('fund.fromWallet')} tone="outline" style={{ marginTop: space.md }}
            loading={busy} onPress={() => fund(true)} />
        ) : null}

        <Card style={s.why}>
          <Row gap={space.sm}>
            <Ionicons name="shield-checkmark-outline" size={19} color={colors.greenText} />
            <H3 style={{ fontSize: 15, color: colors.greenText }}>{t('fund.whyTitle')}</H3>
          </Row>
          <Small style={{ marginTop: 6, color: colors.body }}>{t('fund.whyBody')}</Small>
        </Card>

        <Spacer h={space.xxl} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  why: {
    marginTop: space.xl, backgroundColor: colors.greenSoft, borderColor: colors.greenLine,
  },
})
