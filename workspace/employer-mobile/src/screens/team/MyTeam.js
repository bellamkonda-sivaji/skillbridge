import React, { useCallback, useState } from 'react'
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import {
  Avatar, Badge, Button, EmptyState, ErrorNote, H2, Input, Loader, Row, Small,
  formatDate, money,
} from '../../ui'
import * as teamApi from '../../api/team'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'
import { word } from '../../ui/words'

/** The people currently working for this business. */
export default function MyTeam({ navigation }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await teamApi.employments()
      setRows(Array.isArray(d) ? d : d?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load your team.'))
      setRows([])
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const filtered = (rows || []).filter((r) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return `${r.workerName} ${r.jobTitle}`.toLowerCase().includes(q)
  })

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <View style={s.head}>
        <Row style={{ marginBottom: space.md }}>
          <H2 style={{ flex: 1 }}>{t('team.title')} {rows ? `(${rows.length})` : ''}</H2>
        </Row>
        <Input value={query} onChangeText={setQuery} placeholder={t('common.search')} />
        <Row style={{ marginTop: space.md }}>
          <Button title={t('team.attendance')} icon="checkbox-outline" size="sm" style={{ flex: 1 }}
            onPress={() => navigation.navigate('Attendance')} />
          <Button title={t('team.payroll')} icon="cash-outline" size="sm" tone="outline"
            style={{ flex: 1 }} onPress={() => navigation.navigate('Payroll')} />
        </Row>
      </View>

      {!rows ? <Loader /> : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={{ padding: space.lg }}
          ListHeaderComponent={<ErrorNote onRetry={load}>{error}</ErrorNote>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <Row align="flex-start">
                <Avatar name={item.workerName} size={46} />
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{item.workerName}</Text>
                  <Small style={{ marginTop: 2 }}>{item.jobTitle}</Small>
                  {item.joinedAt || item.startDate ? (
                    <Small style={{ marginTop: 4 }}>
                      {t('team.joined')} {formatDate(item.joinedAt || item.startDate)}
                    </Small>
                  ) : null}
                  <Row gap={space.sm} style={{ marginTop: 7 }}>
                    <Badge
                      label={word(t, item.status)}
                      tone={['ACTIVE', 'JOINED', 'ONGOING'].includes(item.status) ? 'green' : 'grey'}
                    />
                    {item.salary ? <Small style={{ fontWeight: '700' }}>{money(item.salary)}</Small> : null}
                  </Row>
                </View>
                {/* No dial button on a list row: the office puts the two
                    sides in touch, and the number is not sent here anyway. */}
              </Row>
            </View>
          )}
          ListEmptyComponent={!error ? (
            <EmptyState icon="people-outline" title={t('team.none')}
              sub="People you hire will show here." />
          ) : null}
        />
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  head: {
    paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.md,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  card: {
    backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.line, padding: space.md, marginBottom: space.md,
  },
  name: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
  call: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
  },
})
