import React, { useState } from 'react'
import { Alert } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Button } from './index'
import * as supportApi from '../api/support'

/**
 * Asking the office to put the two sides in touch.
 *
 * Replaces every "call" button that used to dial the other party directly.
 * A worker and an employer who have each other's numbers can agree the next
 * job privately, and the one who loses by that is always the worker: no
 * record of the shift, no confirmed day, nobody to chase when the money does
 * not arrive. Standing between them is the service.
 *
 * It raises a support request rather than opening a dialler, so the office
 * sees who wants to speak to whom and about which job, and can ring both.
 */
export default function AskForCall({ about, topic = 'WORK', tone = 'outline', style, size }) {
  const { t } = useTranslation()
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const ask = async () => {
    if (sent || busy) return
    setBusy(true)
    try {
      await supportApi.raiseTicket({
        topic,
        message: about,
        callBack: true,
      })
      setSent(true)
      Alert.alert(t('callRequest.sentTitle'), t('callRequest.sentBody'))
    } catch {
      Alert.alert(t('callRequest.failedTitle'), t('callRequest.failedBody'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      title={sent ? t('callRequest.sent') : t('callRequest.ask')}
      icon={sent ? 'checkmark' : 'call-outline'}
      tone={sent ? 'quiet' : tone}
      size={size}
      loading={busy}
      disabled={sent}
      onPress={ask}
      style={style}
    />
  )
}
