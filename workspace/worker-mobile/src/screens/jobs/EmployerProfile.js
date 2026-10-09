import React, { useCallback, useEffect, useState } from 'react'
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Avatar, Badge, Body, Button, Card, ErrorNote, H1, H3, KV, Loader,
  Row, Screen, SegTabs, Small, Spacer,
} from '../../ui'
import JobCard from '../../ui/JobCard'
import Photo from '../../ui/Photo'
import * as jobsApi from '../../api/jobs'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'
import AskForCall from '../../ui/AskForCall'

/** Who you would be working for, before you agree to work for them. */
export default function EmployerProfile({ navigation, route }) {
  const { t } = useTranslation()
  const employerId = route?.params?.employerId
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('about')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      setData(await jobsApi.employerProfile(employerId))
    } catch (err) {
      setError(errorText(err, 'We could not load this business.'))
    }
  }, [employerId])

  useEffect(() => { load() }, [load])

  if (!data && !error) return <Screen scroll={false}><Loader /></Screen>
  if (!data) {
    return <Screen padded={false}><AppBar onBack={navigation.goBack} />
      <View style={{ padding: space.lg }}><ErrorNote onRetry={load}>{error}</ErrorNote></View></Screen>
  }

  const jobs = data.openJobs || data.jobs || []
  const reviews = data.reviews || []

  return (
    <Screen padded={false}>
      <AppBar onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Photo
          uri={data.coverUrl || data.photos?.[0]}
          width="100%"
          height={140}
          radius={radius.lg}
          icon="storefront-outline"
          iconSize={38}
        />

        <Row style={{ marginTop: space.lg }} align="flex-start">
          <Avatar uri={data.logoUrl} name={data.businessName} size={58} />
          <View style={{ flex: 1 }}>
            <H1 style={{ fontSize: 21 }}>{data.businessName}</H1>
            <Row gap={6} style={{ marginTop: 5 }}>
              {data.verified ? <Badge label={t('jobs.verified')} tone="green" /> : null}
              {data.rating ? (
                <Row gap={3}>
                  <Ionicons name="star" size={14} color={colors.orange} />
                  <Small style={{ fontWeight: '700', color: colors.ink }}>
                    {Number(data.rating).toFixed(1)}
                  </Small>
                  <Small>({data.ratingCount || 0})</Small>
                </Row>
              ) : null}
            </Row>
          </View>
        </Row>

        <Spacer h={space.lg} />
        <SegTabs
          tabs={[
            { value: 'about', label: t('employer.about') },
            { value: 'jobs', label: `${t('employer.jobsTab')} (${jobs.length})` },
            { value: 'reviews', label: t('employer.reviews') },
          ]}
          value={tab}
          onChange={setTab}
        />
        <Spacer h={space.lg} />

        {tab === 'about' ? (
          <>
            {data.about ? <Body>{data.about}</Body> : null}
            <Card style={{ marginTop: space.lg }}>
              <KV k={t('employer.businessType')} v={data.businessType || data.employerKind} />
              <KV k={t('jobs.location')} v={[data.area, data.city].filter(Boolean).join(', ')} />
              {data.foundedYear ? <KV k={t('employer.founded')} v={String(data.foundedYear)} /> : null}
              {data.teamSize ? <KV k={t('employer.teamSize')} v={String(data.teamSize)} /> : null}
            </Card>
            {data.photos?.length ? (
              <>
                <H3 style={{ marginTop: space.xl, marginBottom: space.sm }}>{t('employer.photos')}</H3>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: space.sm }}>
                  {data.photos.map((src, i) => (
                    <Photo key={i} uri={src} width={110} height={86} radius={radius.md} />
                  ))}
                </ScrollView>
              </>
            ) : null}

            <AskForCall
              about={`Please arrange a call with ${data?.businessName || data?.name || 'this business'}.`}
              style={{ marginTop: space.lg }}
            />
          </>
        ) : null}

        {tab === 'jobs' ? (
          jobs.length ? jobs.map((j) => (
            <JobCard key={j.id} job={j} onPress={() => navigation.navigate('JobDetails', { jobId: j.id })} />
          )) : <Body>No open work right now.</Body>
        ) : null}

        {tab === 'reviews' ? (
          reviews.length ? reviews.map((r, i) => (
            <Card key={r.id || i} style={{ marginBottom: space.md }}>
              <Row gap={6}>
                <Ionicons name="star" size={15} color={colors.orange} />
                <Small style={{ fontWeight: '700', color: colors.ink }}>{r.rating}</Small>
                <Small>· {r.workerName || 'Worker'}</Small>
              </Row>
              {r.comment ? <Body style={{ marginTop: 6, fontSize: 14 }}>{r.comment}</Body> : null}
            </Card>
          )) : <Body>No reviews yet.</Body>
        ) : null}

        <Spacer h={space.xxl} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({})
