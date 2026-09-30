import React, { useCallback, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Avatar, Badge, Button, Card, EmptyState, ErrorNote, H3, Loader, Row,
  Screen, SegTabs, Small, Spacer, formatDate, money,
} from '../../ui'
import * as teamApi from '../../api/team'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

/**
 * What is owed and what has been paid.
 *
 * Amounts here are the employer's side of the ledger - what leaves their
 * account. The worker's take-home appears beside it so the commission is
 * never a surprise at the end of a month either.
 */
export default function Payroll({ navigation }) {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('PENDING')
  const [picked, setPicked] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try { setData(await teamApi.billing()) } catch (err) {
      setError(errorText(err, 'We could not load your payments.'))
      setData({})
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (!data) return <Screen scroll={false}><Loader /></Screen>

  const items = data.items || data.payments || data.content || []
  const filtered = items.filter((i) => (tab === 'PENDING'
    ? ['PENDING', 'PAYABLE', 'DUE'].includes(i.status)
    : ['PAID', 'SETTLED'].includes(i.status)))

  const amountOf = (p) => (p.grossMinor ? p.grossMinor / 100 : (p.amount ?? p.gross ?? 0))
  const chosenTotal = filtered
    .filter((p, i) => picked.includes(p.id ?? `row-${i}`))
    .reduce((sum, p) => sum + amountOf(p), 0)

  const toggle = (key) =>
    setPicked((list) => (list.includes(key) ? list.filter((x) => x !== key) : [...list, key]))
  const toggleAll = () => {
    const keys = filtered.map((p, i) => p.id ?? `row-${i}`)
    setPicked((list) => (list.length === keys.length ? [] : keys))
  }

  const process = () => {
    // Paying out needs the RazorpayX account number, which is not configured.
    // Saying so beats a button that fails with a gateway error.
    Alert.alert(
      t('team.processPayroll'),
      `${money(chosenTotal)} to ${picked.length} ${picked.length === 1 ? 'person' : 'people'}.\n\n`
      + 'Payouts switch on once your payout account is set up. Until then our team settles these for you.',
      [{ text: t('common.close') }],
    )
  }

  return (
    <Screen
      padded={false}
      footer={tab === 'PENDING' && picked.length ? (
        <View>
          <Row style={{ marginBottom: space.sm }}>
            <Small style={{ flex: 1 }}>
              {picked.length} selected
            </Small>
            <Text style={s.footerTotal}>{money(chosenTotal)}</Text>
          </Row>
          <Button title={t('team.processPayroll')} icon="cash-outline" onPress={process} />
        </View>
      ) : null}
    >
      <AppBar title={t('team.payroll')}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <ErrorNote onRetry={load}>{error}</ErrorNote>

        <Card style={s.total}>
          <Small style={{ color: colors.blueDark }}>{t('team.totalPayout')}</Small>
          <Text style={s.totalValue}>
            {money(data.totalDue ?? data.pending ?? data.outstanding ?? 0)}
          </Text>
          {data.walletBalance != null ? (
            <Small style={{ marginTop: 4 }}>
              {t('fund.walletBalance')} {money(data.walletBalance)}
            </Small>
          ) : null}
        </Card>

        <Spacer h={space.lg} />
        <SegTabs
          tabs={[
            { value: 'PENDING', label: `${t('team.unpaid')} (${items.filter((i) => ['PENDING', 'PAYABLE', 'DUE'].includes(i.status)).length})` },
            { value: 'PAID', label: `${t('team.paid')} (${items.filter((i) => ['PAID', 'SETTLED'].includes(i.status)).length})` },
          ]}
          value={tab}
          onChange={(v) => { setTab(v); setPicked([]) }}
        />
        <Spacer h={space.md} />

        {/* Select-all, so paying everyone is one tap rather than ten. */}
        {tab === 'PENDING' && filtered.length ? (
          <Pressable style={s.selectAll} onPress={toggleAll}>
            <View style={[s.check, picked.length === filtered.length && s.checkOn]}>
              {picked.length === filtered.length
                ? <Ionicons name="checkmark" size={13} color={colors.white} /> : null}
            </View>
            <Small style={{ color: colors.body, fontWeight: '600' }}>
              {picked.length === filtered.length ? 'Clear all' : 'Select everyone'}
            </Small>
          </Pressable>
        ) : null}

        {filtered.length ? filtered.map((p, i) => {
          const key = p.id ?? `row-${i}`
          const on = picked.includes(key)
          return (
            <Card key={key} style={[{ marginBottom: space.md }, on && s.rowOn]}
              onPress={tab === 'PENDING' ? () => toggle(key) : undefined}>
              <Row align="flex-start">
                {tab === 'PENDING' ? (
                  <View style={[s.check, on && s.checkOn, { marginTop: 12 }]}>
                    {on ? <Ionicons name="checkmark" size={13} color={colors.white} /> : null}
                  </View>
                ) : null}
                <Avatar uri={p.photoUrl} name={p.workerName} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{p.workerName}</Text>
                  <Small style={{ marginTop: 2 }}>{p.jobTitle}</Small>
                  {p.periodLabel || p.workDate ? (
                    <Small style={{ marginTop: 4 }}>{p.periodLabel || formatDate(p.workDate)}</Small>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={s.amount}>{money(amountOf(p))}</Text>
                  {p.netMinor || p.workerAmount ? (
                    <Small>Worker {money(p.netMinor ? p.netMinor / 100 : p.workerAmount)}</Small>
                  ) : null}
                  <Badge label={p.status}
                    tone={['PAID', 'SETTLED'].includes(p.status) ? 'green' : 'orange'} />
                </View>
              </Row>
            </Card>
          )
        }) : (
          <Card>
            <EmptyState
              icon="cash-outline"
              title={tab === 'PENDING' ? 'Nothing due' : 'Nothing paid yet'}
              sub="Payments for completed work show here."
            />
          </Card>
        )}

        <Spacer h={space.xxl} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  total: { backgroundColor: colors.blueSoft, borderColor: colors.blueLine },
  totalValue: { fontSize: 30, fontWeight: '800', color: colors.blueDark, marginTop: 2 },
  name: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
  amount: { fontSize: 16, fontWeight: '800', color: colors.ink },
  footerTotal: { fontSize: 18, fontWeight: '800', color: colors.ink },
  selectAll: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    paddingVertical: space.sm, marginBottom: space.sm,
  },
  check: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  rowOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
})
