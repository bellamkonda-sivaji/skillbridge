import React, { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Badge, Button, EmptyState, ErrorNote, Loader, Row, Small, formatDate, money,
} from '../../ui'
import * as offersApi from '../../api/offers'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'
import { word } from '../../ui/words'

const TONE = { PENDING: 'orange', SENT: 'orange', ACCEPTED: 'green', DECLINED: 'red', CANCELLED: 'grey' }

/** Offers waiting for an answer. The most important screen in the app. */
export default function Offers({ navigation }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await offersApi.listOffers()
      setRows(Array.isArray(d) ? d : d?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load your offers.'))
      setRows([])
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  return (
    <SafeAreaView style={s.fill} edges={['top', 'left', 'right']}>
      <AppBar title={t('offers.title')} onBack={navigation.goBack} />
      {!rows ? <Loader /> : (
        <FlatList
          data={rows}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={{ padding: space.lg }}
          ListHeaderComponent={<ErrorNote onRetry={load}>{error}</ErrorNote>}
          renderItem={({ item }) => {
            const oneDay = item.offerType === 'ONE_DAY' || item.engagementModel === 'ONE_DAY'
            return (
              <Pressable
                style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}
                onPress={() => navigation.navigate('OfferDetails', { id: item.id })}
              >
                <Row align="flex-start">
                  <View style={s.thumb}>
                    <Ionicons name="mail-open-outline" size={21} color={colors.blue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.title} numberOfLines={1}>{item.jobTitle}</Text>
                    <Small numberOfLines={1}>{item.businessName}</Small>
                    <Row gap={6} style={{ marginTop: 6 }}>
                      <Badge label={oneDay ? t('work.oneDay') : t('work.monthly')} tone="violet" />
                      {item.status ? (
                        <Badge label={word(t, item.status)} tone={TONE[item.status] || 'grey'} />
                      ) : null}
                    </Row>
                  </View>
                </Row>

                <View style={s.facts}>
                  {item.workDate ? (
                    <Small><Ionicons name="calendar-outline" size={12} /> {formatDate(item.workDate)}</Small>
                  ) : null}
                  {item.joiningDate ? (
                    <Small><Ionicons name="calendar-outline" size={12} /> {t('offers.joining')} {formatDate(item.joiningDate)}</Small>
                  ) : null}
                  <Text style={s.pay}>
                    {money(item.workerSalary ?? item.salary)}
                    {oneDay ? ` ${t('common.perDay')}` : ` ${t('common.perMonth')}`}
                  </Text>
                </View>

                {item.status === 'PENDING' || item.status === 'SENT' ? (
                  <Row style={{ marginTop: space.md }}>
                    <Button title={t('common.seeAll')} tone="outline" size="sm" style={{ flex: 1 }}
                      onPress={() => navigation.navigate('OfferDetails', { id: item.id })} />
                  </Row>
                ) : null}
              </Pressable>
            )
          }}
          ListEmptyComponent={!error ? (
            <EmptyState icon="mail-outline" title={t('offers.none')} sub={t('offers.noneSub')} />
          ) : null}
        />
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.line, padding: space.lg, marginBottom: space.md,
  },
  thumb: {
    width: 46, height: 46, borderRadius: 13, backgroundColor: colors.blueSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.ink },
  facts: { marginTop: space.md, gap: 5 },
  pay: { fontSize: 18, fontWeight: '800', color: colors.greenText, marginTop: 4 },
})
