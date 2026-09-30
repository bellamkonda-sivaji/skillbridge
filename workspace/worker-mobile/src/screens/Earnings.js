import React, { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Badge, Body, Card, EmptyState, ErrorNote, H2, Loader, Row, Screen,
  Small, Spacer, formatDate, money,
} from '../ui'
import * as moneyApi from '../api/money'
import { errorText } from '../api/client'
import { colors, radius, space } from '../theme'

/** What they have earned, what is still coming, and where it goes. */
export default function Earnings({ navigation }) {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try { setData(await moneyApi.earnings()) } catch (err) {
      setError(errorText(err, 'We could not load your money.'))
      setData({ items: [] })
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (!data) return <Screen scroll={false}><Loader /></Screen>

  const items = data.items || data.earnings || data.content || []

  return (
    <Screen padded={false}>
      <AppBar title={t('earnings.title')} onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <ErrorNote onRetry={load}>{error}</ErrorNote>

        <Card style={s.total}>
          <Small style={{ color: colors.greenText }}>{t('earnings.total')}</Small>
          <Text style={s.totalValue}>{money(data.totalEarned ?? data.total ?? 0)}</Text>
        </Card>

        <Row style={{ marginTop: space.md }}>
          <View style={s.tile}>
            <Ionicons name="time-outline" size={18} color={colors.orangeText} />
            <Text style={s.tileValue}>{money(data.pending ?? 0)}</Text>
            <Small>{t('earnings.pending')}</Small>
          </View>
          <View style={s.tile}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.greenText} />
            <Text style={s.tileValue}>{money(data.paid ?? 0)}</Text>
            <Small>{t('earnings.paid')}</Small>
          </View>
        </Row>

        <H2 style={{ marginTop: space.xl, marginBottom: space.md, fontSize: 17 }}>
          {t('earnings.thisMonth')}
        </H2>

        {items.length ? items.map((e, i) => (
          <Card key={e.id || i} style={{ marginBottom: space.md }}>
            <Row align="flex-start">
              <View style={{ flex: 1 }}>
                <Text style={s.jobTitle}>{e.jobTitle || e.description || 'Work'}</Text>
                <Small style={{ marginTop: 2 }}>{e.businessName}</Small>
                {e.workDate || e.createdAt ? (
                  <Small style={{ marginTop: 4 }}>{formatDate(e.workDate || e.createdAt)}</Small>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={s.amount}>{money(e.netMinor ? e.netMinor / 100 : e.amount)}</Text>
                <Badge
                  label={e.status || 'Paid'}
                  tone={e.status === 'PAID' ? 'green' : e.status === 'PAYABLE' ? 'orange' : 'grey'}
                />
              </View>
            </Row>
          </Card>
        )) : (
          <Card><EmptyState icon="wallet-outline" title={t('earnings.noEarnings')}
            sub="Money from your work will show here." /></Card>
        )}

        <Spacer h={space.xxl} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  total: { backgroundColor: colors.greenSoft, borderColor: colors.greenLine },
  totalValue: { fontSize: 32, fontWeight: '800', color: colors.greenText, marginTop: 2 },
  tile: {
    flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.line, padding: space.md, gap: 5,
  },
  tileValue: { fontSize: 19, fontWeight: '800', color: colors.ink },
  jobTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  amount: { fontSize: 16, fontWeight: '800', color: colors.greenText },
})
