import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Avatar, Button, ErrorNote, Loader, Row, Screen, Small, distance, money,
} from '../../ui'
import * as applicantsApi from '../../api/applicants'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

/**
 * Two or three workers side by side.
 *
 * On a phone this has to scroll sideways rather than shrink, because a
 * comparison where every column is too narrow to read compares nothing.
 */
export default function Compare({ navigation, route }) {
  const { t } = useTranslation()
  const { workerIds = [], jobId } = route?.params || {}
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    applicantsApi.compare(workerIds, jobId)
      .then((d) => setRows(Array.isArray(d) ? d : d?.workers || []))
      .catch((err) => { setError(errorText(err, 'We could not compare these workers.')); setRows([]) })
  }, [])

  if (!rows) return <Screen scroll={false}><Loader /></Screen>

  const FIELDS = [
    { key: 'matchScore', label: t('applicants.match'), fmt: (v) => (v == null ? '—' : `${Math.round(v)}%`) },
    { key: 'experienceYears', label: t('applicants.profileExperience'), fmt: (v) => (v == null ? '—' : `${v} yr`) },
    { key: 'distanceKm', label: t('applicants.distanceAway'), fmt: (v) => distance(v) || '—' },
    { key: 'expectedSalary', label: t('applicants.expectedPay'), fmt: (v) => (v ? money(v) : '—') },
    { key: 'availability', label: t('applicants.availability'), fmt: (v) => v || '—' },
    { key: 'rating', label: 'Rating', fmt: (v) => (v ? `${Number(v).toFixed(1)}★` : '—') },
    { key: 'verified', label: t('applicants.verified'), fmt: (v) => (v ? 'Yes' : 'No') },
  ]

  return (
    <Screen padded={false} scroll={false}>
      <AppBar title={t('applicants.compareTitle')} onBack={navigation.goBack} />
      <ErrorNote>{error}</ErrorNote>
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ padding: space.lg }}>
        <View>
          <Row gap={space.md} align="flex-start">
            <View style={s.labelCol} />
            {rows.map((w) => (
              <View key={w.id || w.workerId} style={s.col}>
                <Avatar uri={w.photoUrl} name={w.name} size={54} />
                <Text style={s.name} numberOfLines={2}>{w.name}</Text>
              </View>
            ))}
          </Row>

          {FIELDS.map((f) => (
            <Row key={f.key} gap={space.md} style={s.row} align="flex-start">
              <Small style={s.labelCol}>{f.label}</Small>
              {rows.map((w) => (
                <Text key={(w.id || w.workerId) + f.key} style={s.value}>
                  {f.fmt(w[f.key])}
                </Text>
              ))}
            </Row>
          ))}

          <Row gap={space.md} style={{ marginTop: space.lg }} align="flex-start">
            <View style={s.labelCol} />
            {rows.map((w) => (
              <View key={`act-${w.id || w.workerId}`} style={s.col}>
                <Button
                  title={t('applicants.viewProfile')}
                  size="sm"
                  tone="outline"
                  onPress={() => navigation.navigate('ApplicantProfile', {
                    workerId: w.workerId || w.id, jobId,
                  })}
                />
              </View>
            ))}
          </Row>
        </View>
      </ScrollView>
    </Screen>
  )
}

const s = StyleSheet.create({
  labelCol: { width: 110 },
  col: { width: 130, alignItems: 'center', gap: 6 },
  name: { fontSize: 14.5, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  row: {
    paddingVertical: space.md, borderTopWidth: 1, borderTopColor: colors.line, marginTop: space.md,
  },
  value: { width: 130, fontSize: 14, fontWeight: '600', color: colors.ink, textAlign: 'center' },
})
