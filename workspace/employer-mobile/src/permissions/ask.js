import { Linking, PermissionsAndroid, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'

/**
 * The permissions this app actually uses, asked for once, up front.
 *
 * Android only shows a system dialog the first time. If someone says no, the
 * app must keep working and send them to Settings rather than asking again -
 * repeating the prompt is how people learn to tap "Deny" without reading.
 *
 * Each one is asked separately and failure is never fatal: the point of the
 * screen is to explain, not to gate.
 */

const DONE_KEY = 'jobon.permissions.asked.v1'

/** True once the first-run screen has run, however the person answered. */
export async function alreadyAsked() {
  try { return (await AsyncStorage.getItem(DONE_KEY)) === 'yes' } catch { return false }
}

export async function markAsked() {
  try { await AsyncStorage.setItem(DONE_KEY, 'yes') } catch { /* not fatal */ }
}

/** Alerts about offers, shifts and replies from the office. */
export async function askNotifications() {
  try {
    const { status } = await Notifications.requestPermissionsAsync()
    return status === 'granted'
  } catch { return false }
}

/** Needed to rank work by how close it is. */
export async function askLocation() {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync()
    return granted
  } catch { return false }
}

/**
 * Dialling an employer from inside the app.
 *
 * Without it a tap still works - it just hands the number to the dialler and
 * waits for a second press. With it, the call starts straight away, which is
 * one less step for someone standing at a building site.
 */
export async function askPhone() {
  if (Platform.OS !== 'android') return false
  try {
    const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CALL_PHONE)
    return res === PermissionsAndroid.RESULTS.GRANTED
  } catch { return false }
}

/** For when someone said no and now wants to change it. */
export const openSettings = () => Linking.openSettings().catch(() => {})
