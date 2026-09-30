import React, { useCallback, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Badge, Body, Button, Card, Chip, EmptyState, ErrorNote, Field, H3,
  Input, Loader, Row, Screen, Small, Spacer,
} from '../ui'
import * as moneyApi from '../api/money'
import { errorText } from '../api/client'
import { colors, radius, space } from '../theme'

/**
 * Where the worker's money goes.
 *
 * The account number is typed twice, because a single wrong digit sends a
 * week's wages to a stranger and there is no undo for that.
 */
export default function PayoutMethods({ navigation }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [kind, setKind] = useState('BANK')
  const [form, setForm] = useState({
    bankName: '', accountNumber: '', confirmAccount: '', ifsc: '', holderName: '', upi: '',
  })
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await moneyApi.payoutDestinations()
      setRows(Array.isArray(d) ? d : d?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load your bank accounts.'))
      setRows([])
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  const add = async () => {
    setError('')
    if (kind === 'BANK') {
      if (!form.accountNumber || !form.ifsc || !form.holderName) {
        setError('Fill the account number, IFSC and name.')
        return
      }
      if (form.accountNumber !== form.confirmAccount) {
        setError(t('payouts.mismatch'))
        return
      }
    } else if (!form.upi) {
      setError('Enter your UPI number.')
      return
    }

    setBusy(true)
    try {
      await moneyApi.addPayoutDestination(kind === 'BANK' ? {
        type: 'BANK_ACCOUNT',
        bankName: form.bankName || undefined,
        accountNumber: form.accountNumber,
        ifsc: form.ifsc.toUpperCase(),
        accountHolderName: form.holderName,
      } : { type: 'VPA', vpa: form.upi })
      setAdding(false)
      setForm({ bankName: '', accountNumber: '', confirmAccount: '', ifsc: '', holderName: '', upi: '' })
      load()
    } catch (err) {
      setError(errorText(err, 'We could not add that account.'))
    } finally { setBusy(false) }
  }

  const act = async (fn, id) => {
    try { await fn(id); load() } catch (err) { Alert.alert('', errorText(err)) }
  }

  const remove = (id) => {
    Alert.alert(t('payouts.remove'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('payouts.remove'), style: 'destructive',
        onPress: () => act(moneyApi.removeDestination, id) },
    ])
  }

  return (
    <Screen
      padded={false}
      footer={!adding ? (
        <Button title={t('payouts.addTitle')} icon="add" onPress={() => setAdding(true)} />
      ) : null}
    >
      <AppBar title={t('payouts.title')} onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <ErrorNote onRetry={load}>{error}</ErrorNote>

        {adding ? (
          <Card style={{ marginBottom: space.lg }}>
            <H3 style={{ fontSize: 16, marginBottom: space.md }}>{t('payouts.addTitle')}</H3>
            <Row gap={space.sm} style={{ marginBottom: space.lg }}>
              <Chip label={t('payouts.useBank')} selected={kind === 'BANK'} onPress={() => setKind('BANK')} />
              <Chip label={t('payouts.useUpi')} selected={kind === 'UPI'} onPress={() => setKind('UPI')} />
            </Row>

            {kind === 'BANK' ? (
              <>
                <Field label={t('payouts.holderName')}>
                  <Input value={form.holderName} onChangeText={set('holderName')}
                    placeholder="John Kamau" autoCapitalize="words" />
                </Field>
                <Field label={t('payouts.bankName')} hint={t('common.optional')}>
                  <Input value={form.bankName} onChangeText={set('bankName')} placeholder="SBI" />
                </Field>
                <Field label={t('payouts.accountNumber')}>
                  <Input value={form.accountNumber} onChangeText={set('accountNumber')}
                    keyboardType="number-pad" placeholder="000000000000" />
                </Field>
                <Field label={t('payouts.confirmAccount')}>
                  <Input value={form.confirmAccount} onChangeText={set('confirmAccount')}
                    keyboardType="number-pad" placeholder="000000000000" />
                </Field>
                <Field label={t('payouts.ifsc')}>
                  <Input value={form.ifsc} onChangeText={set('ifsc')}
                    autoCapitalize="characters" placeholder="SBIN0001234" />
                </Field>
              </>
            ) : (
              <Field label={t('payouts.upi')}>
                <Input value={form.upi} onChangeText={set('upi')} autoCapitalize="none"
                  placeholder="name@bank" />
              </Field>
            )}

            <Row>
              <Button title={t('common.cancel')} tone="quiet" style={{ flex: 1 }}
                onPress={() => { setAdding(false); setError('') }} />
              <Button title={t('payouts.add')} style={{ flex: 2 }} loading={busy} onPress={add} />
            </Row>
          </Card>
        ) : null}

        {!rows ? <Loader /> : rows.length ? rows.map((d) => (
          <Card key={d.id} style={{ marginBottom: space.md }}>
            <Row align="flex-start">
              <View style={s.icon}>
                <Ionicons name={d.type === 'VPA' ? 'phone-portrait-outline' : 'card-outline'}
                  size={20} color={colors.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>
                  {d.type === 'VPA' ? d.vpa : `${d.bankName || 'Bank'} •••• ${String(d.accountNumber || '').slice(-4)}`}
                </Text>
                {d.accountHolderName ? <Small style={{ marginTop: 2 }}>{d.accountHolderName}</Small> : null}
                <Row gap={6} style={{ marginTop: 7, flexWrap: 'wrap' }}>
                  <Badge label={d.verified ? t('payouts.verified') : t('payouts.unverified')}
                    tone={d.verified ? 'green' : 'orange'} />
                  {d.isDefault || d.defaultDestination ? (
                    <Badge label={t('payouts.isDefault')} tone="blue" />
                  ) : null}
                </Row>
              </View>
            </Row>
            <Row style={{ marginTop: space.md }}>
              {!d.verified ? (
                <Button title={t('payouts.verify')} tone="outline" size="sm" style={{ flex: 1 }}
                  onPress={() => act(moneyApi.verifyDestination, d.id)} />
              ) : null}
              {!(d.isDefault || d.defaultDestination) ? (
                <Button title={t('payouts.makeDefault')} tone="quiet" size="sm" style={{ flex: 1 }}
                  onPress={() => act(moneyApi.makeDefault, d.id)} />
              ) : null}
              <Button title={t('payouts.remove')} tone="dangerQuiet" size="sm" full={false}
                onPress={() => remove(d.id)} />
            </Row>
          </Card>
        )) : !adding ? (
          <Card>
            <EmptyState icon="card-outline" title={t('payouts.none')} sub={t('payouts.noneSub')} />
          </Card>
        ) : null}

        <Spacer h={space.xxl} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  icon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: colors.blueSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
})
