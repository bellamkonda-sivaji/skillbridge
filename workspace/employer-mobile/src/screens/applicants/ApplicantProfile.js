import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Linking, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Avatar, Badge, Body, Button, Card, ErrorNote, H3, KV, Loader, Row,
  Screen, SegTabs, Small, Spacer, distance, formatDate, money,
} from '../../ui'
import * as applicantsApi from '../../api/applicants'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

/**
 * One worker, in full - including where they have worked before and what the
 * shop owners there said. That history is the whole reason an employer trusts
 * a stranger enough to hand them a shift.
 */
export default function ApplicantProfile({ navigation, route }) {
  const { t } = useTranslation()
  const { workerId, applicationId, jobId } = route?.params || {}
  const [worker, setWorker] = useState(null)
  const [history, setHistory] = useState([])
  const [tab, setTab] = useState('about')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [w, h] = await Promise.all([
        applicantsApi.worker(workerId, jobId),
        applicantsApi.workHistory(workerId).catch(() => []),
      ])
      setWorker(w)
      setHistory(Array.isArray(h) ? h : h?.content || [])
    } catch (err) {
      setError(errorText(err, 'We could not load this worker.'))
    }
  }, [workerId, jobId])

  useEffect(() => { load() }, [load])

  const decide = async (status) => {
    if (!applicationId) return
    setBusy(status)
    try {
      await applicantsApi.decide(applicationId, { status })
      Alert.alert('', status === 'SHORTLISTED' ? 'Shortlisted.' : 'Saved.')
      load()
    } catch (err) {
      Alert.alert('', errorText(err, 'We could not save that.'))
    } finally { setBusy('') }
  }

  if (!worker && !error) return <Screen scroll={false}><Loader /></Screen>
  if (!worker) {
    return <Screen padded={false}><AppBar onBack={navigation.goBack} />
      <View style={{ padding: space.lg }}><ErrorNote onRetry={load}>{error}</ErrorNote></View></Screen>
  }

  return (
    <Screen
      padded={false}
      footer={applicationId ? (
        <Row>
          <Button title={t('applicants.reject')} tone="dangerQuiet" style={{ flex: 1 }}
            loading={busy === 'REJECTED'} onPress={() => decide('REJECTED')} />
          <Button title={t('applicants.shortlistAction')} style={{ flex: 1 }}
            loading={busy === 'SHORTLISTED'} onPress={() => decide('SHORTLISTED')} />
          <Button title={t('applicants.sendOffer')} tone="success" style={{ flex: 1 }}
            onPress={() => navigation.navigate('CreateOffer', { applicationId, workerId, jobId })} />
        </Row>
      ) : null}
    >
      <AppBar onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Row align="flex-start">
          <Avatar uri={worker.photoUrl} name={worker.name} size={70} />
          <View style={{ flex: 1 }}>
            <Row gap={6}>
              <Text style={s.name}>{worker.name}</Text>
              {worker.verified ? <Ionicons name="checkmark-circle" size={17} color={colors.green} /> : null}
            </Row>
            {worker.rating ? (
              <Row gap={4} style={{ marginTop: 4 }}>
                <Ionicons name="star" size={15} color={colors.orange} />
                <Small style={{ fontWeight: '700', color: colors.ink }}>
                  {Number(worker.rating).toFixed(1)}
                </Small>
                <Small>({worker.ratingCount || 0})</Small>
              </Row>
            ) : null}
            <Row gap={6} style={{ marginTop: 7, flexWrap: 'wrap' }}>
              {worker.matchScore != null ? (
                <Badge label={`${Math.round(worker.matchScore)}% ${t('applicants.match')}`} tone="blue" />
              ) : null}
              {worker.availableNow ? <Badge label={t('applicants.availableNow')} tone="green" /> : null}
            </Row>
          </View>
        </Row>

        {worker.phone ? (
          <Button
            title={`${t('applicants.call')} ${worker.name}`}
            icon="call"
            tone="success"
            style={{ marginTop: space.lg }}
            onPress={() => Linking.openURL(`tel:${worker.phone}`)}
          />
        ) : null}

        <Spacer h={space.lg} />
        <SegTabs
          tabs={[
            { value: 'about', label: t('applicants.profileAbout') },
            { value: 'history', label: `${t('applicants.workHistory')} (${history.length})` },
            { value: 'skills', label: t('applicants.profileSkills') },
          ]}
          value={tab}
          onChange={setTab}
        />
        <Spacer h={space.lg} />

        {tab === 'about' ? (
          <>
            {worker.about ? <Body style={{ marginBottom: space.md }}>{worker.about}</Body> : null}
            <Card>
              {worker.age ? <KV k="Age" v={`${worker.age} years`} /> : null}
              <KV k={t('applicants.profileExperience')}
                v={worker.experienceYears != null ? `${worker.experienceYears} years` : '—'} />
              <KV k={t('post.languages')} v={(worker.languages || []).join(', ') || '—'} />
              <KV k={t('applicants.distanceAway')} v={distance(worker.distanceKm) || '—'} />
              <KV k={t('applicants.expectedPay')}
                v={worker.expectedSalary ? money(worker.expectedSalary) : '—'} />
              <KV k={t('applicants.availability')} v={worker.availability || '—'} />
              <KV k="ID check" v={worker.verified ? 'Verified' : 'Not done'} />
            </Card>
          </>
        ) : null}

        {tab === 'history' ? (
          history.length ? history.map((h, i) => (
            <Card key={h.id || i} style={{ marginBottom: space.md }}>
              <Row align="flex-start">
                <View style={{ flex: 1 }}>
                  <Text style={s.histTitle}>{h.businessName}</Text>
                  <Small style={{ marginTop: 2 }}>{h.jobTitle}</Small>
                  <Small style={{ marginTop: 4 }}>
                    {formatDate(h.startDate)} – {h.endDate ? formatDate(h.endDate) : 'now'}
                    {h.daysWorked ? ` · ${h.daysWorked} days` : ''}
                  </Small>
                  {h.salary ? (
                    <Text style={s.histPay}>{money(h.salary)}</Text>
                  ) : null}
                </View>
                {h.rating ? (
                  <Row gap={3} style={s.ratingPill}>
                    <Ionicons name="star" size={13} color={colors.orangeText} />
                    <Small style={{ fontWeight: '800', color: colors.orangeText }}>
                      {Number(h.rating).toFixed(1)}
                    </Small>
                  </Row>
                ) : null}
              </Row>
              {h.review || h.comment ? (
                <View style={s.quote}>
                  <Body style={{ fontSize: 13.5, fontStyle: 'italic' }}>
                    “{h.review || h.comment}”
                  </Body>
                  <Small style={{ marginTop: 4 }}>— {h.reviewerName || 'Owner'}</Small>
                </View>
              ) : null}
            </Card>
          )) : <Body>No previous work recorded yet.</Body>
        ) : null}

        {tab === 'skills' ? (
          <View style={s.skills}>
            {(worker.skills || []).length
              ? worker.skills.map((sk) => (
                <View key={sk} style={s.skill}><Text style={s.skillText}>{sk}</Text></View>
              ))
              : <Body>No skills listed.</Body>}
          </View>
        ) : null}

        <Spacer h={space.xxl} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  name: { fontSize: 20, fontWeight: '800', color: colors.ink, flexShrink: 1 },
  histTitle: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
  histPay: { fontSize: 14.5, fontWeight: '800', color: colors.greenText, marginTop: 4 },
  ratingPill: {
    backgroundColor: colors.orangeSoft, borderRadius: radius.pill,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  quote: {
    backgroundColor: colors.soft, borderRadius: radius.md, padding: space.md, marginTop: space.md,
  },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  skill: {
    backgroundColor: colors.blueSoft, borderRadius: radius.pill,
    paddingHorizontal: space.md, paddingVertical: 8,
  },
  skillText: { fontSize: 13.5, fontWeight: '600', color: colors.blueDark },
})
