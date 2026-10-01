import React from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Button, Screen, Spacer, SuccessPanel } from '../../ui'
import { space } from '../../theme'

export default function OfferSent({ navigation, route }) {
  const { t } = useTranslation()
  const workerName = route?.params?.workerName

  return (
    <Screen
      bg="#FFFFFF"
      footer={(
        <View style={{ gap: space.md }}>
          <Button title={t('offers.goToTracking')} onPress={() => navigation.replace('OfferTracking')} />
          <Button title={t('common.done')} tone="outline"
            onPress={() => navigation.navigate('ApplicantsTab', { screen: 'Applications' })} />
        </View>
      )}
    >
      <SuccessPanel
        icon="send"
        title={t('offers.sentTitle')}
        sub={workerName ? `${t('offers.sentSub')} (${workerName})` : t('offers.sentSub')}
      />
      <Spacer h={space.lg} />
    </Screen>
  )
}
