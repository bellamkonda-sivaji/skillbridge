import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  AppBar, Body, Button, ChoiceCard, ErrorNote, Field, H2, Input, Row, Screen, Small,
} from '../../ui'
import { WITHDRAW_REASONS } from '../../ui/catalog'
import * as appsApi from '../../api/applications'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

/**
 * Taking an application back.
 *
 * The reason is optional and offered as taps, because the useful signal here
 * ("the pay is too low", "it is too far") is a list we can act on, while a
 * free-text box would mostly come back empty.
 */
export default function WithdrawApplication({ navigation, route }) {
  const { t } = useTranslation()
  const id = route?.params?.id
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const confirm = async () => {
    setBusy(true); setError('')
    try {
      await appsApi.withdraw(id, reason || undefined, note || undefined)
      navigation.navigate('MyApplications')
    } catch (err) {
      setError(errorText(err, 'We could not take this back. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen
      padded={false}
      bg={colors.white}
      footer={(
        <Row>
          <Button title={t('common.cancel')} tone="quiet" onPress={navigation.goBack} style={{ flex: 1 }} />
          <Button title={t('applications.withdraw')} tone="danger" onPress={confirm}
            loading={busy} style={{ flex: 1 }} />
        </Row>
      )}
    >
      <AppBar title={t('applications.withdrawTitle')} onBack={navigation.goBack} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.xl }}>
        <View style={s.art}>
          <Ionicons name="document-text-outline" size={38} color={colors.redText} />
        </View>

        <H2 style={{ textAlign: 'center', marginTop: space.lg }}>{t('applications.withdrawAsk')}</H2>
        <Body style={{ textAlign: 'center', marginTop: space.sm }}>{t('applications.withdrawSub')}</Body>

        <View style={{ marginTop: space.xl }}>
          <ErrorNote>{error}</ErrorNote>
          <Field label={`${t('applications.reason')} (${t('common.optional')})`}>
            {WITHDRAW_REASONS.map((r) => (
              <ChoiceCard key={r} selected={reason === r} onPress={() => setReason(reason === r ? '' : r)}
                title={r} />
            ))}
          </Field>

          <Field label={t('applications.addDetails')}>
            <Input value={note} onChangeText={setNote} placeholder="…" multiline
              maxLength={200} style={{ minHeight: 84, alignItems: 'flex-start' }} />
            <Small style={{ alignSelf: 'flex-end', marginTop: 4 }}>{note.length}/200</Small>
          </Field>
        </View>
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  art: {
    width: 86, height: 86, borderRadius: 43, backgroundColor: colors.redSoft,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
})
