import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { I18nextProvider } from 'react-i18next'
import i18n from './src/i18n'
import { SessionProvider } from './src/session/SessionProvider'
import RootNavigator from './src/navigation'

/**
 * JobOn for Employers.
 *
 * Post work, see who is nearby, ring them, hire and track attendance and pay -
 * built for the supermarkets, restaurants, shops and building sites around
 * Tirupati that hire a few people at a time.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <SessionProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </SessionProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  )
}
