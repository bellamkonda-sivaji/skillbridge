import React, { useCallback, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Avatar, Body, Card, EmptyState, ErrorNote, Loader, ProgressBar, Row,
  Screen, Small, Spacer, formatDate,
} from '../ui'
import * as miscApi from '../api/misc'
import { errorText } from '../api/client'
import { useSession } from '../session/SessionProvider'
import { colors, space } from '../theme'

/** What the workers who worked here said about this business. */
export default function Reviews({ navigation }) {
  const { t } = useTranslation()
  const { user } = useSession()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const d = user?.id ? await miscApi.reviewsAbout(user.id) : []
      setRows(Array.isArray(d) ? d : d?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load reviews.'))
      setRows([])
    }
  }, [user?.id])

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (!rows) return <Screen scroll={false}><Loader /></Screen>

  const average = rows.length
    ? Math.round((rows.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / rows.length) * 10) / 10
    : null
  const buckets = [5, 4, 3, 2, 1].map((star) => ({
    star, count: rows.filter((r) => Math.round(Number(r.rating)) === star).length,
  }))

  return (
    <Screen padded={false}>
      <AppBar title={t('empReviews.title')}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <ErrorNote onRetry={load}>{error}</ErrorNote>

        {average !== null ? (
          <Card style={{ marginBottom: space.lg }}>
            <Row align="flex-start">
              <View style={{ alignItems: 'center', width: 96 }}>
                <Text style={s.big}>{average.toFixed(1)}</Text>
                <Row gap={2}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Ionicons key={i} name={i <= Math.round(average) ? 'star' : 'star-outline'}
                      size={14} color={colors.orange} />
                  ))}
                </Row>
                <Small style={{ marginTop: 4 }}>({rows.length})</Small>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                {buckets.map((b) => (
                  <Row key={b.star} gap={space.sm}>
                    <Small style={{ width: 12 }}>{b.star}</Small>
                    <View style={{ flex: 1 }}>
                      <ProgressBar value={rows.length ? (b.count / rows.length) * 100 : 0}
                        tone={colors.orange} />
                    </View>
                    <Small style={{ width: 22, textAlign: 'right' }}>{b.count}</Small>
                  </Row>
                ))}
              </View>
            </Row>
          </Card>
        ) : null}

        {rows.length ? rows.map((r, i) => (
          <Card key={r.id ?? `rev-${i}`} style={{ marginBottom: space.md }}>
            <Row align="flex-start">
              <Avatar name={r.reviewerName || r.workerName} size={42} />
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{r.reviewerName || r.workerName || 'Worker'}</Text>
                {r.jobTitle ? <Small style={{ marginTop: 2 }}>{r.jobTitle}</Small> : null}
                <Row gap={2} style={{ marginTop: 5 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Ionicons key={n} name={n <= Math.round(Number(r.rating) || 0) ? 'star' : 'star-outline'}
                      size={13} color={colors.orange} />
                  ))}
                  <Small style={{ marginLeft: 6 }}>{formatDate(r.createdAt)}</Small>
                </Row>
              </View>
            </Row>
            {r.comment ? <Body style={{ fontSize: 14.5, marginTop: space.md }}>{r.comment}</Body> : null}
          </Card>
        )) : (
          <Card>
            <EmptyState icon="star-outline" title={t('empReviews.none')} sub={t('empReviews.noneSub')} />
          </Card>
        )}

        <Spacer h={space.xxl} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  big: { fontSize: 38, fontWeight: '800', color: colors.ink },
  name: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
})
