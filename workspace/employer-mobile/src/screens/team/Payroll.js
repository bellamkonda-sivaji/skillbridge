import React, { useCallback, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
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

  return (
    <Screen padded={false}>
      <AppBar title={t('team.payroll')}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <ErrorNote onRetry={load}>{error}</ErrorNote>

        <Card style={s.total}>
          <Small style={{ color: colors.blueDark }}>{t('team.totalPayout')}</Small>
          <Text style={s.totalValue}>
            {money(data.totalDue ?? data.pending ?? data.outstanding ?? 0)}
          </Text>
          <Small style={{ marginTop: 4 }}>
            {data.walletBalance != null ? `Wallet ${money(data.walletBalance)}` : ''}
          </Small>
        </Card>

        <Spacer h={space.lg} />
        <SegTabs
          tabs={[
            { value: 'PENDING', label: t('team.unpaid') },
            { value: 'PAID', label: t('team.paid') },
          ]}
          value={tab}
          onChange={setTab}
        />
        <Spacer h={space.lg} />

        {filtered.length ? filtered.map((p, i) => (
          <Card key={p.id || i} style={{ marginBottom: space.md }}>
            <Row align="flex-start">
              <Avatar name={p.workerName} size={42} />
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{p.workerName}</Text>
                <Small style={{ marginTop: 2 }}>{p.jobTitle}</Small>
                {p.periodLabel || p.workDate ? (
                  <Small style={{ marginTop: 4 }}>{p.periodLabel || formatDate(p.workDate)}</Small>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={s.amount}>
                  {money(p.grossMinor ? p.grossMinor / 100 : (p.amount ?? p.gross))}
                </Text>
                {p.netMinor || p.workerAmount ? (
                  <Small>Worker {money(p.netMinor ? p.netMinor / 100 : p.workerAmount)}</Small>
                ) : null}
                <Badge label={p.status}
                  tone={['PAID', 'SETTLED'].includes(p.status) ? 'green' : 'orange'} />
              </View>
            </Row>
          </Card>
        )) : (
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
})
