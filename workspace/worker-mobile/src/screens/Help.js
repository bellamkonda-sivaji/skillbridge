import React, { useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Badge, Body, Button, Card, ChoiceCard, ErrorNote, Field, H1, H3,
  Input, Screen, Small, SuccessPanel, timeAgo,
} from '../ui'
import Listen from '../ui/Listen'
import { word } from '../ui/words'
import * as supportApi from '../api/support'
import { errorText } from '../api/client'
import { colors, radius, space } from '../theme'

/**
 * Asking a person for help.
 *
 * The whole screen assumes the worst case: someone worried about money, who
 * reads slowly, on a phone they may have borrowed. So the topics are pictures
 * and short words rather than a list of categories, the box asks one plain
 * question, and the default is a phone call back - because for most of these
 * problems, being rung by a person beats a written reply they then have to read.
 */

const TOPICS = [
  { key: 'MONEY', icon: 'wallet-outline' },
  { key: 'WORK', icon: 'briefcase-outline' },
  { key: 'OFFER', icon: 'mail-outline' },
  { key: 'ATTENDANCE', icon: 'calendar-outline' },
  { key: 'DOCUMENTS', icon: 'document-text-outline' },
  { key: 'ACCOUNT', icon: 'person-outline' },
  { key: 'OTHER', icon: 'help-circle-outline' },
]

export default function Help({ navigation }) {
  const { t, i18n } = useTranslation()
  const [topic, setTopic] = useState(null)
  const [message, setMessage] = useState('')
  const [callBack, setCallBack] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [mine, setMine] = useState([])

  const load = useCallback(() => {
    supportApi.myTickets().then(setMine).catch(() => {})
  }, [])
  useFocusEffect(load)

  const send = async () => {
    if (!message.trim()) { setError(t('help.needWords')); return }
    setBusy(true); setError('')
    try {
      await supportApi.raiseTicket({
        topic: topic || 'OTHER',
        message: message.trim(),
        callBack,
        languageCode: (i18n.language || 'en').split('-')[0],
      })
      setSent(true)
      setMessage('')
      setTopic(null)
      load()
    } catch (err) {
      setError(errorText(err, t('help.failed')))
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <Screen padded={false} bg={colors.white}>
        <AppBar onBack={navigation.goBack} title={t('help.title')} />
        <View style={{ paddingHorizontal: space.lg }}>
          <SuccessPanel title={t('help.sentTitle')} sub={t('help.sentSub')}>
            <Listen text={`${t('help.sentTitle')}. ${t('help.sentSub')}`} />
            <Button title={t('common.done')} onPress={() => setSent(false)} style={{ marginTop: space.lg }} />
          </SuccessPanel>
        </View>
      </Screen>
    )
  }

  return (
    <Screen
      padded={false}
      bg={colors.white}
      footer={<Button title={t('help.send')} icon="send" onPress={send} loading={busy} />}
    >
      <AppBar onBack={navigation.goBack} title={t('help.title')} />
      <View style={{ paddingHorizontal: space.lg }}>
        <H1>{t('help.heading')}</H1>
        <Body style={{ marginTop: 5 }}>{t('help.sub')}</Body>
        <Listen style={{ marginTop: space.md }} text={`${t('help.heading')}. ${t('help.sub')}`} />

        <ErrorNote>{error}</ErrorNote>

        <Field label={t('help.whatAbout')}>
          <View style={s.topics}>
            {TOPICS.map((o) => {
              const on = topic === o.key
              return (
                <View key={o.key} style={s.topicWrap}>
                  <Card
                    onPress={() => setTopic(o.key)}
                    style={[s.topic, on && s.topicOn]}
                    padded={false}
                  >
                    <Ionicons
                      name={o.icon}
                      size={26}
                      color={on ? colors.white : colors.blue}
                    />
                    <Small style={[s.topicLabel, on && { color: colors.white }]}>
                      {t(`help.topic_${o.key}`)}
                    </Small>
                  </Card>
                </View>
              )
            })}
          </View>
        </Field>

        <Field label={t('help.tellUs')}>
          <Input
            value={message}
            onChangeText={setMessage}
            placeholder={t('help.placeholder')}
            multiline
            style={{ minHeight: 110, alignItems: 'flex-start' }}
          />
        </Field>

        {/* Default on, because a call is the right answer for most of these. */}
        <ChoiceCard
          selected={callBack}
          onPress={() => setCallBack(!callBack)}
          title={t('help.callMe')}
          sub={t('help.callMeSub')}
          icon="call-outline"
        />

        {mine.length ? (
          <>
            <H3 style={{ marginTop: space.xl }}>{t('help.myRequests')}</H3>
            {mine.map((r) => (
              <Card key={r.id} style={{ marginTop: space.sm }} padded>
                <Badge label={word(t, r.status)} tone="blue" />
                <Body style={{ marginTop: 6 }}>{r.message}</Body>
                <Small style={{ marginTop: 4 }}>{timeAgo(r.createdAt)}</Small>
                {r.messages?.length ? (
                  <View style={s.reply}>
                    <Small style={{ color: colors.greenText, fontWeight: '700' }}>
                      {t('help.theySaid')}
                    </Small>
                    <Body>{r.messages[r.messages.length - 1].body || t('help.theyCalled')}</Body>
                    <Listen
                      style={{ marginTop: space.sm }}
                      text={r.messages[r.messages.length - 1].body || t('help.theyCalled')}
                    />
                  </View>
                ) : null}
              </Card>
            ))}
          </>
        ) : null}
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  topicWrap: { width: '31%' },
  topic: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: space.md,
    borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.blueLine,
    backgroundColor: colors.blueSoft, minHeight: 86,
  },
  topicOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  topicLabel: { marginTop: 5, textAlign: 'center', color: colors.blue, fontWeight: '700' },
  reply: {
    marginTop: space.md, padding: space.md, borderRadius: radius.md,
    backgroundColor: colors.greenSoft,
  },
})
