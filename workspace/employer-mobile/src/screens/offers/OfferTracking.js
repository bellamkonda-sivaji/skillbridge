import React, { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Avatar, Badge, EmptyState, ErrorNote, Loader, Row, SegTabs, Small,
  formatDate, money,
} from '../../ui'
import * as offersApi from '../../api/offers'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

const TONE = { PENDING: 'orange', SENT: 'orange', ACCEPTED: 'green', DECLINED: 'red', CANCELLED: 'grey' }

/** Every offer sent, and where it stands. */
export default function OfferTracking({ navigation }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState(null)
  const [tab, setTab] = useState('ALL')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await offersApi.list('ALL')
      setRows(Array.isArray(d) ? d : d?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load your offers.'))
      setRows([])
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const filtered = (rows || []).filter((o) => {
    if (tab === 'ALL') return true
    if (tab === 'PENDING') return ['PENDING', 'SENT'].includes(o.status)
    return o.status === tab
  })
  const count = (list) => (rows ? rows.filter((o) => list.includes(o.status)).length : 0)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <AppBar title={t('offers.tracking')}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined} />
      <View style={{
        paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: colors.white,
        borderBottomWidth: 1, borderBottomColor: colors.line,
      }}>
        <SegTabs
          tabs={[
            { value: 'ALL', label: `${t('common.all')} (${rows?.length || 0})` },
            { value: 'PENDING', label: `${t('offers.pending')} (${count(['PENDING', 'SENT'])})` },
            { value: 'ACCEPTED', label: `${t('offers.accepted')} (${count(['ACCEPTED'])})` },
            { value: 'DECLINED', label: `${t('offers.declined')} (${count(['DECLINED'])})` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {!rows ? <Loader /> : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={{ padding: space.lg }}
          ListHeaderComponent={<ErrorNote onRetry={load}>{error}</ErrorNote>}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}
              onPress={() => navigation.navigate('OfferStatusDetail', { offerId: item.id })}
            >
              <Row align="flex-start">
                <Avatar name={item.workerName} size={46} />
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{item.workerName}</Text>
                  <Small style={{ marginTop: 2 }}>{item.jobTitle}</Small>
                  <Small style={{ marginTop: 4 }}>
                    Sent {formatDate(item.sentAt || item.createdAt)}
                  </Small>
                  <Text style={s.pay}>{money(item.salary)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                  <Badge label={item.status} tone={TONE[item.status] || 'grey'} />
                  <Ionicons name="chevron-forward" size={19} color={colors.muted} />
                </View>
              </Row>
            </Pressable>
          )}
          ListEmptyComponent={!error ? (
            <EmptyState icon="mail-outline" title={t('offers.none')}
              sub="Shortlist someone and send them an offer." />
          ) : null}
        />
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.line, padding: space.md, marginBottom: space.md,
  },
  name: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
  pay: { fontSize: 15, fontWeight: '800', color: colors.ink, marginTop: 4 },
})
