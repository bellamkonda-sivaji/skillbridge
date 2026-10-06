import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Badge, Body, Button, Card, ErrorNote, Fact, H1, H3, Loader, Row, Screen,
  Small, Spacer, SuccessPanel, distance, formatDate, hhmm, pay, paySpoken, timeAgo, workerPay,
} from '../../ui'
import Photo from '../../ui/Photo'
import Listen from '../../ui/Listen'
import { workArt } from '../../ui/workArt'
import * as jobsApi from '../../api/jobs'
import * as appsApi from '../../api/applications'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

/**
 * One job, in full.
 *
 * The pay line is the largest thing on the screen and it is the take-home,
 * stated as "You get" rather than "Salary" - the difference between what the
 * employer pays and what arrives is the thing most likely to cause a fight
 * later, so it is settled here, before anyone applies.
 */
export default function JobDetails({ navigation, route }) {
  const { t } = useTranslation()
  const jobId = route?.params?.jobId
  const [job, setJob] = useState(null)
  const [error, setError] = useState('')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [justApplied, setJustApplied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      // The job record carries neither `saved` nor `applied` - those live on
      // the card shape and the two list endpoints. Without this the heart and
      // the Apply button show the wrong state on a job the worker has
      // already saved or applied to.
      const [d, savedList, applications] = await Promise.all([
        jobsApi.jobDetail(jobId),
        jobsApi.savedJobs().catch(() => []),
        appsApi.listApplications().catch(() => []),
      ])
      setJob(d)
      const savedIds = (Array.isArray(savedList) ? savedList : savedList?.content || [])
        .map((j) => j.id)
      const appliedIds = (Array.isArray(applications) ? applications : applications?.content || [])
        .map((a) => a.jobId ?? a.job?.id)
      setSaved(savedIds.includes(Number(jobId)))
      setApplied(appliedIds.includes(Number(jobId)))
    } catch (err) {
      setError(errorText(err, 'We could not load this work.'))
    }
  }, [jobId])

  useEffect(() => { load() }, [load])

  const apply = async () => {
    setApplying(true)
    try {
      await jobsApi.applyToJob(jobId, {})
      setApplied(true)
      setJustApplied(true)
    } catch (err) {
      Alert.alert('', errorText(err, 'We could not send your application.'))
    } finally {
      setApplying(false)
    }
  }

  const toggleSave = async () => {
    const on = saved
    setSaved(!on)
    try { await (on ? jobsApi.unsaveJob(jobId) : jobsApi.saveJob(jobId)) } catch { setSaved(on) }
  }

  if (!job && !error) return <Screen scroll={false}><Loader /></Screen>
  if (!job) return <Screen><AppBar onBack={navigation.goBack} /><ErrorNote onRetry={load}>{error}</ErrorNote></Screen>

  // The success panel is for the moment of applying. Arriving at a job that
  // was applied to days ago should show the job, with the button saying so.
  if (applied && justApplied) {
    return (
      <Screen padded={false} bg={colors.white}>
        <AppBar onBack={navigation.goBack} />
        <SuccessPanel title={t('jobs.applySuccess')} sub={t('jobs.applySuccessSub')}>
          <View style={{ alignSelf: 'stretch', marginTop: space.xxl, gap: space.md }}>
            <Button title={t('applications.title')}
              onPress={() => navigation.navigate('ApplicationsTab')} />
            <Button title={t('jobs.title')} tone="outline" onPress={() => navigation.navigate('JobsTab', { screen: 'FindJobs' })} />
          </View>
        </SuccessPanel>
      </Screen>
    )
  }

  const shift = job.shifts?.[0]
  const description = job.description || ''
  const long = description.length > 180

  return (
    <Screen
      padded={false}
      footer={(
        <Row>
          <Button
            title={saved ? t('jobs.saved2') : t('jobs.save')}
            icon={saved ? 'heart' : 'heart-outline'}
            tone="quiet"
            onPress={toggleSave}
            style={{ flex: 1 }}
          />
          <Button
            title={applied ? t('jobs.applied2') : t('jobs.applyNow')}
            onPress={apply}
            loading={applying}
            disabled={applied}
            style={{ flex: 2 }}
          />
        </Row>
      )}
    >
      <AppBar onBack={navigation.goBack} />

      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Photo
          uri={job.photoUrl || job.employerLogoUrl || job.employerPhotos?.[0]}
          art={workArt(job)}
          width="100%"
          height={170}
          radius={radius.lg}
          icon="briefcase-outline"
          iconSize={38}
        />

        <Row style={{ marginTop: space.lg }} align="flex-start">
          <View style={{ flex: 1 }}>
            <H1 style={{ fontSize: 23 }}>{job.title}</H1>
            <Pressable
              style={s.bizRow}
              onPress={() => job.employerId && navigation.navigate('EmployerProfile', { employerId: job.employerId })}
            >
              <Text style={s.biz}>{job.businessName}</Text>
              {job.employerVerified ? (
                <Ionicons name="checkmark-circle" size={15} color={colors.green} />
              ) : null}
            </Pressable>
          </View>
          {job.urgent ? <Badge label={t('jobs.urgent')} tone="red" /> : null}
        </Row>

        {/* The take-home, said plainly and made unmissable. Money is the one
            thing nobody should have to guess at, so it can also be heard. */}
        <Card style={s.payCard} padded>
          <Small style={{ color: colors.greenText }}>{t('jobs.youGet')}</Small>
          <Text style={s.payBig}>{pay(workerPay(job), job.salaryUnit)}</Text>
          {job.platformFee > 0 ? (
            <Small style={{ marginTop: 4 }}>
              {t('jobs.feeNote', { percent: job.feePercent })}
            </Small>
          ) : null}
          <Listen
            style={{ marginTop: space.md }}
            text={[
              job.title,
              `${t('jobs.youGet')} ${paySpoken(workerPay(job), job.salaryUnit, t)}`,
              job.platformFee > 0 ? t('jobs.feeNote', { percent: job.feePercent }) : '',
            ].filter(Boolean).join('. ')}
          />
        </Card>

        <View style={s.facts}>
          <Fact icon="time-outline" label={t('jobs.type')} value={job.employmentType || job.workType} />
          {/* Only claim a distance when we have one - falling back to the city
              under a "Distance" label reads as "Distance: Tirupati", which is
              not a distance and not an answer. */}
          {distance(job.distanceKm) ? (
            <Fact icon="location-outline" label={t('jobs.distance')} value={distance(job.distanceKm)} />
          ) : null}
          {shift?.startTime ? (
            <Fact icon="alarm-outline" label={t('myWork.shiftTime')}
              value={`${hhmm(shift.startTime)} – ${hhmm(shift.endTime)}`} />
          ) : null}
          <Fact icon="business-outline" label={t('jobs.location')}
            value={[job.area, job.city].filter(Boolean).join(', ') || '—'} />
          {job.workersNeeded ? (
            <Fact icon="people-outline" label="Openings" value={String(job.workersNeeded)} />
          ) : null}
          {job.workDate ? (
            <Fact icon="calendar-outline" label={t('offers.workDate')} value={formatDate(job.workDate)} />
          ) : null}
        </View>

        {description ? (
          <>
            <H3 style={{ marginTop: space.xl }}>{t('jobs.description')}</H3>
            <Body style={{ marginTop: space.sm }}>
              {long && !expanded ? `${description.slice(0, 180)}…` : description}
            </Body>
            {long ? (
              <Text style={s.link} onPress={() => setExpanded((e) => !e)}>
                {expanded ? t('jobs.showLess') : t('jobs.showMore')}
              </Text>
            ) : null}
          </>
        ) : null}

        {job.responsibilities?.length ? (
          <>
            <H3 style={{ marginTop: space.xl }}>{t('jobs.responsibilities')}</H3>
            <View style={{ marginTop: space.sm, gap: 8 }}>
              {job.responsibilities.map((r) => (
                <Row key={r} align="flex-start" gap={8}>
                  <Ionicons name="checkmark-circle" size={17} color={colors.green} style={{ marginTop: 2 }} />
                  <Body style={{ flex: 1, fontSize: 14.5 }}>{r}</Body>
                </Row>
              ))}
            </View>
          </>
        ) : null}

        {job.requiredSkills?.length ? (
          <>
            <H3 style={{ marginTop: space.xl }}>{t('profile.skills')}</H3>
            <View style={s.skills}>
              {job.requiredSkills.map((sk) => (
                <View key={sk} style={s.skill}><Text style={s.skillText}>{sk}</Text></View>
              ))}
            </View>
          </>
        ) : null}

        {job.postedAt ? (
          <Small style={{ marginTop: space.xl }}>{t('jobs.postedAgo')} {timeAgo(job.postedAt)}</Small>
        ) : null}
        <Spacer h={space.xl} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  bizRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  biz: { fontSize: 15, color: colors.body, fontWeight: '600' },
  payCard: {
    marginTop: space.lg, backgroundColor: colors.greenSoft, borderColor: colors.greenLine,
  },
  payBig: { fontSize: 30, fontWeight: '800', color: colors.greenText, marginTop: 2 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, marginTop: space.xl },
  link: { fontSize: 14, fontWeight: '700', color: colors.blue, marginTop: 8 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  skill: {
    backgroundColor: colors.soft, borderRadius: radius.pill,
    paddingHorizontal: space.md, paddingVertical: 7,
  },
  skillText: { fontSize: 13, color: colors.body, fontWeight: '600' },
})
