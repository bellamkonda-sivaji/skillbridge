import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { setToken, setUnauthorisedHandler, TOKEN_KEY, USER_KEY } from '../api/client'
import * as authApi from '../api/auth'
import { restoreLanguage } from '../i18n'

const SessionContext = createContext(null)

/**
 * Who is signed in, and whether they have finished setting up.
 *
 * The token is kept in storage so the app opens straight into work rather than
 * a login screen - these are people checking for a shift on the way to the bus
 * stop, and making them type a password every morning would lose them.
 */
export function SessionProvider({ children }) {
  const [booting, setBooting] = useState(true)
  const [token, setTokenState] = useState(null)
  const [user, setUser] = useState(null)
  const [language, setLanguageState] = useState(null)

  const signOut = useCallback(async () => {
    setToken(null)
    setTokenState(null)
    setUser(null)
    try { await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]) } catch { /* nothing to clear */ }
  }, [])

  useEffect(() => { setUnauthorisedHandler(signOut) }, [signOut])

  // Restore the previous session before the first screen paints.
  useEffect(() => {
    let alive = true
    ;(async () => {
      const lang = await restoreLanguage()
      let stored = null
      let storedUser = null
      try {
        stored = await AsyncStorage.getItem(TOKEN_KEY)
        const raw = await AsyncStorage.getItem(USER_KEY)
        storedUser = raw ? JSON.parse(raw) : null
      } catch { /* first run */ }

      if (!alive) return
      setLanguageState(lang)

      if (stored) {
        setToken(stored)
        setTokenState(stored)
        setUser(storedUser)
        // Confirm the token is still good, but never block the UI on it.
        authApi.me()
          .then((fresh) => {
            if (!alive) return
            setUser(fresh)
            AsyncStorage.setItem(USER_KEY, JSON.stringify(fresh)).catch(() => {})
          })
          .catch(() => { /* the 401 interceptor signs out if it is really dead */ })
      }
      setBooting(false)
    })()
    return () => { alive = false }
  }, [])

  const signIn = useCallback(async (auth) => {
    const nextToken = auth?.token
    const account = auth?.account || auth?.user || null
    if (!nextToken) throw new Error('No token in the sign-in response')
    setToken(nextToken)
    setTokenState(nextToken)
    setUser(account)
    try {
      await AsyncStorage.setItem(TOKEN_KEY, nextToken)
      if (account) await AsyncStorage.setItem(USER_KEY, JSON.stringify(account))
    } catch { /* the session still works for this run */ }
  }, [])

  const updateUser = useCallback(async (patch) => {
    setUser((current) => {
      const next = { ...(current || {}), ...patch }
      AsyncStorage.setItem(USER_KEY, JSON.stringify(next)).catch(() => {})
      return next
    })
  }, [])

  const value = useMemo(() => ({
    booting, token, user, language,
    signedIn: Boolean(token),
    setLanguageState,
    signIn, signOut, updateUser,
  }), [booting, token, user, language, signIn, signOut, updateUser])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}
