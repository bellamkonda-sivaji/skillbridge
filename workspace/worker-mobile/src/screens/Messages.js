import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { AppBar, Card, EmptyState, Screen } from '../ui'
import { space } from '../theme'

/**
 * Messages.
 *
 * The backend has no worker-facing conversation endpoint yet, so rather than
 * inventing a chat that would show fabricated threads, this states plainly
 * that calling is how contact happens today - which is true, and is how the
 * employers actually reach people.
 */
export default function Messages({ navigation }) {
  const { t } = useTranslation()
  return (
    <Screen padded={false}>
      <AppBar title={t('messages.title')} onBack={navigation.goBack} />
      <View style={{ padding: space.lg }}>
        <Card>
          <EmptyState
            icon="chatbubbles-outline"
            title={t('messages.none')}
            sub="Shop owners ring you directly. You will find their number on your work and offer screens."
          />
        </Card>
      </View>
    </Screen>
  )
}
