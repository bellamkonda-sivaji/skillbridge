import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Badge, Body, Button, Card, ErrorNote, Fact, H3, Loader, Row, Screen,
  Small, Spacer, formatDate, timeOnly,
} from '../../ui'
import { modeIcon, modeLabel, modeTone } from '../../ui/interviewMode'
import * as appsApi from '../../api/applications'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

/** One talk or visit, with the two things a worker may need to do about it. */
export default function InterviewDetails({ navigation, route }) {
  const { t } = useTranslation()
  const id = route?.params?.id
  const [item, setItem] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    setError('')
    try { setItem(await appsApi.interviewDetail(id)) } catch (err) {
      setError(errorText(err, 'We could not load this.'))
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const act = (kind) => {
    const isCancel = kind === 'cancel'
    Alert.alert(
      isCancel ? t('interviews.confirmCancel') : t('interviews.reschedule'),
      '',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: isCancel ? t('interviews.cancelInterview') : t('interviews.reschedule'),
          style: isCancel ? 'destructive' : 'default',
          onPress: async () => {
            setBusy(kind)
            try {
              await (isCancel ? appsApi.cancelInterview(id) : appsApi.rescheduleInterview(id))
              await load()
            } catch (err) {
              Alert.alert('', errorText(err))
            } finally { setBusy('') }
          },
        },
      ],
    )
  }

  if (!item && !error) return <Screen scroll={false}><Loader /></Screen>
  if (!item) {
    return <Screen padded={false}><AppBar onBack={navigation.goBack} />
      <View style={{ padding: space.lg }}><ErrorNote onRetry={load}>{error}</ErrorNote></View></Screen>
  }

  const open = !['COMPLETED', 'CANCELLED', 'DONE'].includes(item.status)
  const place = item.location || item.workLocation
  const openMaps = () => {
    const q = encodeURIComponent(place || item.businessName || '')
    Linking.openURL(Platform.select({
      ios: `http://maps.apple.com/?q=${q}`,
      default: `https://www.google.com/maps/search/?api=1&query=${q}`,
    })).catch(() => {})
  }

  return (
    <Screen
      padded={false}
      footer={open ? (
        <Row>
          <Button title={t('interviews.cancelInterview')} tone="dangerQuiet" style={{ flex: 1 }}
            loading={busy === 'cancel'} onPress={() => act('cancel')} />
          <Button title={t('interviews.reschedule')} tone="outline" style={{ flex: 1 }}
            loading={busy === 'reschedule'} onPress={() => act('reschedule')} />
        </Row>
      ) : null}
    >
      <AppBar title={t('interviews.title')} onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Row align="flex-start">
          <View style={[s.icon, { backgroundColor: modeTone(item.mode)[1] }]}>
            <Ionicons name={modeIcon(item.mode)} size={24} color={modeTone(item.mode)[0]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{item.jobTitle}</Text>
            <Small style={{ marginTop: 2 }}>{item.businessName}</Small>
          </View>
          {item.status ? <Badge label={item.status} tone={open ? 'violet' : 'grey'} /> : null}
        </Row>

        <Card style={s.when}>
          <Small style={{ color: colors.violet }}>{t('interviews.when')}</Small>
          <Text style={s.whenValue}>
            {formatDate(item.scheduledAt)} · {timeOnly(item.scheduledAt)}
          </Text>
          <Small style={{ marginTop: 4 }}>{modeLabel(item)}</Small>
        </Card>

        {place ? (
          <>
            <H3 style={{ marginTop: space.xl, marginBottom: space.sm }}>{t('interviews.where')}</H3>
            <Card>
              <Row gap={space.sm} align="flex-start">
                <Ionicons name="location-outline" size={19} color={colors.blue} />
                <Body style={{ flex: 1, fontSize: 14.5 }}>{place}</Body>
              </Row>
              <Button title={t('offers.directions')} icon="navigate-outline" tone="outline"
                size="sm" style={{ marginTop: space.md }} onPress={openMaps} />
            </Card>
          </>
        ) : null}

        {item.contactPersonPhone || item.employerPhone ? (
          <>
            <H3 style={{ marginTop: space.xl, marginBottom: space.sm }}>{t('interviews.whoToAsk')}</H3>
            <Card>
              <Row>
                <View style={s.person}><Ionicons name="person" size={19} color={colors.blue} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.personName}>
                    {item.contactPersonName || item.employerName || 'Owner'}
                  </Text>
                  <Small style={{ marginTop: 2 }}>
                    {item.contactPersonPhone || item.employerPhone}
                  </Small>
                </View>
                <Button title="" icon="call" tone="success" full={false} size="sm"
                  style={{ paddingHorizontal: space.lg }}
                  onPress={() => Linking.openURL(`tel:${item.contactPersonPhone || item.employerPhone}`)} />
              </Row>
            </Card>
          </>
        ) : null}

        {item.notes ? (
          <>
            <H3 style={{ marginTop: space.xl, marginBottom: space.sm }}>
              {t('interviews.notesFromEmployer')}
            </H3>
            <Card style={{ backgroundColor: colors.blueSoft, borderColor: colors.blueLine }}>
              <Body style={{ fontSize: 14.5, color: colors.ink }}>{item.notes}</Body>
            </Card>
          </>
        ) : null}

        <Spacer h={space.xxl} />
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  icon: {
    width: 54, height: 54, borderRadius: 14, backgroundColor: colors.violetSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink },
  when: { marginTop: space.lg, backgroundColor: colors.violetSoft, borderColor: '#DDD6FE' },
  whenValue: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: 3 },
  person: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: colors.blueSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  personName: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
})
