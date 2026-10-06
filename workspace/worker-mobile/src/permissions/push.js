import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import client from '../api/client'

/**
 * Real push, through Firebase.
 *
 * The phone asks Firebase for a token that identifies this install, and we hand
 * that token to our own server. The server later asks FCM to deliver to it.
 * Nothing here talks to Firebase again after registration.
 *
 * `getDevicePushTokenAsync` returns the raw FCM token on Android, which is what
 * a backend sending through FCM needs - the Expo push token is a different
 * thing, routed through Expo's servers, and would need their service instead.
 *
 * Tokens rotate. Firebase reissues one when the app is restored to a new phone,
 * or data is cleared, so this runs on every launch and the server upserts.
 */

/** How a notification behaves while the person is already looking at the app. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function registerPushToken() {
  // An emulator without Play Services has no token to give, and that is not an
  // error worth showing anyone.
  if (!Device.isDevice && Platform.OS === 'android') {
    // Emulators with Play Services do work, so we still try - we just do not
    // treat failure as a problem.
  }
  try {
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== 'granted') return null

    const token = await Notifications.getDevicePushTokenAsync()
    if (!token?.data) return null

    await client.post('/push/tokens', {
      token: token.data,
      platform: Platform.OS.toUpperCase(),
    })
    return token.data
  } catch {
    // No Play Services, no network, or the person is signed out. The app is
    // perfectly usable without push; it just will not ring.
    return null
  }
}
