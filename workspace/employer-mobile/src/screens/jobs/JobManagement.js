import React, { useCallback, useEffect, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Badge, Body, Button, Card, ErrorNote, H3, Input, KV, Loader, Row,
  Screen, SegTabs, Small, Spacer, formatDate, hhmm, money,
} from '../../ui'
import { splitPrice } from '../../ui/catalog'
import * as jobsApi from '../../api/jobs'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

/**
 * One job: how it is doing, what it pays, and the advice when it is not
 * filling. The advice sits above the counters because it is the only thing
 * here the owner can act on today.
 */
export default function JobManagement({ navigation, route }) {
  const { t } = useTranslation()
  const jobId = route?.params?.jobId
  const raiseTo = route?.params?.raiseTo

  const [job, setJob] = useState(null)
  const [pricing, setPricing] = useState(null)
  const [demand, setDemand] = useState(null)
  const [tab, setTab] = useState('overview')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(raiseTo ? String(raiseTo) : null)
  const [reason, setReason] = useState(raiseTo ? 'Raised to attract more workers' : '')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const [detail, price, advice] = await Promise.all([
        jobsApi.getJob(jobId),
        jobsApi.jobPricing(jobId).catch(() => null),
        jobsApi.jobDemand(jobId).catch(() => null),
      ])
      setJob(detail); setPricing(price); setDemand(advice)
    } catch (err) {
      setError(errorText(err, 'We could not load this job.'))
    }
  }, [jobId])

  useEffect(() => { load() }, [load])

  const changeStatus = async (status) => {
    const before = job.status
    setJob((j) => ({ ...j, status }))
    try { await jobsApi.setJobStatus(jobId, status) } catch (err) {
      setJob((j) => ({ ...j, status: before }))
      Alert.alert('', errorText(err))
    }
  }

  const savePrice = async () => {
    const value = Number(editing)
    if (!(value > 0)) return
    setBusy(true)
    try {
      const next = await jobsApi.changePrice(jobId, value, reason || undefined)
      setPricing(next)
      setJob((j) => ({ ...j, salary: next.postedSalary }))
      setEditing(null)
      load()
    } catch (err) {
      Alert.alert('', errorText(err, 'We could not change the pay.'))
    } finally { setBusy(false) }
  }

  if (!job && !error) return <Screen scroll={false}><Loader /></Screen>
  if (!job) {
    return <Screen padded={false}><AppBar onBack={navigation.goBack} />
      <View style={{ padding: space.lg }}><ErrorNote onRetry={load}>{error}</ErrorNote></View></Screen>
  }

  const live = ['OPEN', 'ACTIVE'].includes(job.status)
  const shift = job.shifts?.[0]
  const split = splitPrice(editing || job.salary)
  const step = split.total >= 10000 ? 500 : split.total >= 4000 ? 250 : split.total >= 1000 ? 50 : 20

  return (
    <Screen padded={false}>
      <AppBar title={job.title} onBack={navigation.goBack}
        subtitle={[job.area, job.city].filter(Boolean).join(', ')} />

      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Row gap={space.sm} style={{ marginBottom: space.lg, flexWrap: 'wrap' }}>
          <Badge label={job.status} tone={live ? 'green' : 'grey'} />
          {live ? (
            <Button title={t('jobs.pause')} tone="quiet" size="sm" full={false}
              onPress={() => changeStatus('PAUSED')} />
          ) : job.status === 'PAUSED' ? (
            <Button title={t('jobs.reopen')} tone="outline" size="sm" full={false}
              onPress={() => changeStatus('OPEN')} />
          ) : null}
          {job.status !== 'CLOSED' ? (
            <Button title={t('jobs.close')} tone="dangerQuiet" size="sm" full={false}
              onPress={() => changeStatus('CLOSED')} />
          ) : null}
        </Row>

        {/* Advice first: this is the part that changes an outcome. */}
        {demand && ['SLOW', 'STALLED'].includes(demand.verdict) ? (
          <View style={[s.advice, demand.verdict === 'STALLED' ? s.adviceBad : s.adviceWarn]}>
            <Text style={s.adviceTitle}>{demand.headline}</Text>
            <Body style={{ fontSize: 13.5, marginTop: 4 }}>{demand.detail}</Body>
            {demand.reachNow != null && demand.reachAtSuggested > demand.reachNow ? (
              <Small style={{ marginTop: 6 }}>
                At {money(demand.currentSalary)} this job suits {demand.reachNow} worker
                {demand.reachNow === 1 ? '' : 's'} near you. At {money(demand.suggestedSalary)} it
                suits {demand.reachAtSuggested}.
              </Small>
            ) : null}
            {demand.suggestedSalary > 0 ? (
              <Button
                title={`Raise to ${money(demand.suggestedSalary)}`}
                size="sm"
                full={false}
                style={{ marginTop: space.md, alignSelf: 'flex-start' }}
                onPress={() => { setEditing(String(demand.suggestedSalary)); setTab('overview') }}
              />
            ) : null}
          </View>
        ) : null}

        <SegTabs
          tabs={[
            { value: 'overview', label: t('jobs.overview') },
            { value: 'pay', label: t('post.salaryTitle') },
            { value: 'details', label: t('post.detailsTitle') },
          ]}
          value={tab}
          onChange={setTab}
        />
        <Spacer h={space.lg} />

        {tab === 'overview' ? (
          <>
            <View style={s.tiles}>
              <Tile value={job.applicationsCount ?? 0} label={t('dashboard.applications')} icon="document-text-outline" />
              <Tile value={job.jobViews ?? 0} label={t('jobs.jobViews')} icon="eye-outline" />
              <Tile value={job.shortlistedCount ?? 0} label={t('jobs.shortlisted')} icon="star-outline" />
              <Tile value={job.hiredCount ?? 0} label={t('jobs.hiredCount')} icon="people-outline" />
            </View>
            <Button
              title={t('applicants.title')}
              icon="people-outline"
              style={{ marginTop: space.lg }}
              onPress={() => navigation.navigate('JobApplicants', { jobId, jobTitle: job.title })}
            />
            <Button
              title={t('applicants.recommended')}
              icon="sparkles-outline"
              tone="outline"
              style={{ marginTop: space.md }}
              onPress={() => navigation.navigate('Recommended', { jobId, jobTitle: job.title })}
            />
          </>
        ) : null}

        {tab === 'pay' ? (
          <>
            <Card padded={false}>
              <View style={s.splitRow}>
                <Text style={s.splitKey}>{t('post.youPay')}</Text>
                <Text style={s.splitValue}>{money(pricing?.postedSalary ?? job.salary)}</Text>
              </View>
              <View style={[s.splitRow, { backgroundColor: colors.soft }]}>
                <Text style={s.splitKey}>
                  {t('post.jobonFee')} ({pricing?.feePercent ?? split.percent}%)
                </Text>
                <Text style={[s.splitValue, { color: colors.orangeText }]}>
                  − {money(pricing?.platformFee ?? split.fee)}
                </Text>
              </View>
              <View style={[s.splitRow, s.splitTotal]}>
                <Text style={[s.splitKey, { color: colors.greenText, fontWeight: '700' }]}>
                  {t('post.workerGets')}
                </Text>
                <Text style={[s.splitValue, { color: colors.greenText, fontSize: 19 }]}>
                  {money(pricing?.workerSalary ?? split.workerPay)}
                </Text>
              </View>
            </Card>

            {editing === null ? (
              live || job.status === 'DRAFT' ? (
                <Button title={t('jobs.changePay')} tone="outline" style={{ marginTop: space.lg }}
                  onPress={() => setEditing(String(job.salary))} />
              ) : null
            ) : (
              <Card style={{ marginTop: space.lg }}>
                <H3 style={{ fontSize: 16 }}>{t('jobs.changePay')}</H3>
                <Row style={{ marginTop: space.md }}>
                  <Button title="−" tone="quiet" full={false} style={{ width: 56 }}
                    onPress={() => setEditing(String(Math.max(0, Number(editing) - step)))} />
                  <Input
                    value={String(editing)}
                    onChangeText={(v) => setEditing(v.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    prefix="₹"
                    style={{ flex: 1 }}
                  />
                  <Button title="+" tone="quiet" full={false} style={{ width: 56 }}
                    onPress={() => setEditing(String(Number(editing) + step))} />
                </Row>
                <View style={{ marginTop: space.md }}>
                  <KV k={t('post.youPay')} v={money(split.total)} />
                  <KV k={`${t('post.jobonFee')} (${split.percent}%)`} v={`− ${money(split.fee)}`} />
                  <KV k={t('post.workerGets')} v={money(split.workerPay)} strong />
                </View>
                <Input value={reason} onChangeText={setReason}
                  placeholder={t('jobs.whyChange')} style={{ marginTop: space.md }} />
                <Row style={{ marginTop: space.md }}>
                  <Button title={t('common.cancel')} tone="quiet" style={{ flex: 1 }}
                    onPress={() => setEditing(null)} />
                  <Button title={t('jobs.savePay')} style={{ flex: 2 }} loading={busy} onPress={savePrice} />
                </Row>
              </Card>
            )}
          </>
        ) : null}

        {tab === 'details' ? (
          <Card>
            <KV k={t('post.jobTitle')} v={job.title} strong />
            <KV k={t('post.openings')} v={String(job.workersNeeded ?? 1)} />
            <KV k={t('post.employmentType')} v={job.engagementModel || job.employmentType} />
            <KV k={t('post.workingDays')} v={(job.workingDays || []).join(', ') || '—'} />
            {shift?.startTime ? (
              <KV k={t('post.shiftTimings')} v={`${hhmm(shift.startTime)} – ${hhmm(shift.endTime)}`} />
            ) : null}
            <KV k={t('business.address')} v={[job.area, job.city].filter(Boolean).join(', ')} />
            {job.postedAt ? <KV k={t('jobs.posted')} v={formatDate(job.postedAt)} /> : null}
            {job.description ? (
              <>
                <Spacer h={space.md} />
                <Small>{t('post.description')}</Small>
                <Body style={{ marginTop: 4, fontSize: 14.5 }}>{job.description}</Body>
              </>
            ) : null}
          </Card>
        ) : null}

        <Spacer h={space.xxl} />
      </View>
    </Screen>
  )
}

const Tile = ({ value, label, icon }) => (
  <View style={s.tile}>
    <Ionicons name={icon} size={18} color={colors.blue} />
    <Text style={s.tileValue}>{value}</Text>
    <Small numberOfLines={1}>{label}</Small>
  </View>
)

const s = StyleSheet.create({
  advice: {
    borderRadius: radius.lg, borderWidth: 1, borderLeftWidth: 4,
    padding: space.lg, marginBottom: space.lg,
  },
  adviceWarn: { backgroundColor: colors.orangeSoft, borderColor: '#FDE68A', borderLeftColor: colors.orange },
  adviceBad: { backgroundColor: colors.redSoft, borderColor: colors.redLine, borderLeftColor: colors.red },
  adviceTitle: { fontSize: 15.5, fontWeight: '800', color: colors.ink },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: {
    width: '47%', backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.line, padding: space.md, gap: 4,
  },
  tileValue: { fontSize: 21, fontWeight: '800', color: colors.ink },
  splitRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: space.lg, paddingVertical: space.md,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  splitTotal: { backgroundColor: colors.greenSoft, borderBottomWidth: 0 },
  splitKey: { fontSize: 14.5, color: colors.body },
  splitValue: { fontSize: 16, fontWeight: '800', color: colors.ink },
})
