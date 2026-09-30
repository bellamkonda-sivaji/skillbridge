import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../config'

export const TOKEN_KEY = 'jobon.worker.token'
export const USER_KEY = 'jobon.worker.user'

const client = axios.create({ baseURL: API_URL, timeout: 20000 })

/** Attached on every call once the worker has signed in. */
let memoryToken = null

export function setToken(token) {
  memoryToken = token || null
}

client.interceptors.request.use(async (cfg) => {
  if (!memoryToken) {
    try { memoryToken = await AsyncStorage.getItem(TOKEN_KEY) } catch { /* first run */ }
  }
  if (memoryToken) cfg.headers.Authorization = `Bearer ${memoryToken}`
  return cfg
})

/** Handlers the session provider registers so a dead token logs the app out. */
let onUnauthorised = null
export function setUnauthorisedHandler(fn) { onUnauthorised = fn }

client.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401) {
      memoryToken = null
      onUnauthorised?.()
    }
    return Promise.reject(error)
  },
)

/**
 * The one place an error becomes something a person can read.
 *
 * Axios messages ("Request failed with status code 500") mean nothing to a
 * shop worker, so we prefer the server's own sentence and fall back to plain
 * language about the connection - which is the real cause most of the time.
 */
export function errorText(error, fallback = 'Something went wrong. Please try again.') {
  const fromServer = error?.response?.data?.message
  if (fromServer) return fromServer
  if (error?.code === 'ECONNABORTED') return 'That took too long. Check your internet and try again.'
  if (!error?.response) return 'No internet. Check your connection and try again.'
  return fallback
}

export default client
