import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { I18nextProvider } from 'react-i18next'
import i18n from './src/i18n'
import { SessionProvider } from './src/session/SessionProvider'
import RootNavigator from './src/navigation'

/**
 * JobOn for Workers.
 *
 * Find work near home, apply with one tap, mark attendance and get paid -
 * built for shop workers, drivers, cooks, cleaners and masons around Tirupati.
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
