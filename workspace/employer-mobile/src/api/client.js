import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../config'

export const TOKEN_KEY = 'jobon.employer.token'
export const USER_KEY = 'jobon.employer.user'

const client = axios.create({ baseURL: API_URL, timeout: 20000 })

let memoryToken = null
export function setToken(token) { memoryToken = token || null }

client.interceptors.request.use(async (cfg) => {
  if (!memoryToken) {
    try { memoryToken = await AsyncStorage.getItem(TOKEN_KEY) } catch { /* first run */ }
  }
  if (memoryToken) cfg.headers.Authorization = `Bearer ${memoryToken}`
  return cfg
})

let onUnauthorised = null
export function setUnauthorisedHandler(fn) { onUnauthorised = fn }

client.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401) { memoryToken = null; onUnauthorised?.() }
    return Promise.reject(error)
  },
)

/** The one place an error becomes something a shop owner can read. */
export function errorText(error, fallback = 'Something went wrong. Please try again.') {
  const fromServer = error?.response?.data?.message
  if (fromServer) return fromServer
  if (error?.code === 'ECONNABORTED') return 'That took too long. Check your internet and try again.'
  if (!error?.response) return 'No internet. Check your connection and try again.'
  return fallback
}

export default client
