import Constants from 'expo-constants'
import { Platform } from 'react-native'

/**
 * Where the backend lives.
 *
 * A phone cannot reach "localhost" - that is the phone itself - so in dev we
 * take the IP Expo is already serving the bundle from, which is the same
 * machine the API runs on. A real build reads it from app.json instead, so
 * shipping never depends on this guess.
 */
function devHost() {
  const uri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || ''
  const host = uri.split(':')[0]
  return host && host !== 'localhost' ? host : null
}

function resolveBaseUrl() {
  // Only a real string counts. Expo normalises an unset `extra` value into an
  // empty object, and handing that to axios produces "baseURL.slice is not a
  // function" - an error that says nothing about the actual cause.
  const configured = Constants.expoConfig?.extra?.apiUrl
  if (typeof configured === 'string' && configured.trim()) return configured.trim()

  if (Platform.OS === 'web') return 'http://localhost:8080/api'
  const host = devHost()
  // 10.0.2.2 is how the Android emulator reaches the host machine.
  return host ? `http://${host}:8080/api` : 'http://10.0.2.2:8080/api'
}

export const API_URL = resolveBaseUrl()

/** Where the brand's own assets live, for job and business photos. */
export const PLACEHOLDER_JOB = null
