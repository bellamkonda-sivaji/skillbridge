import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../api'

const AuthContext = createContext(null)

/**
 * Worker, employer and admin are separate accounts in separate tables, each
 * with its own auth namespace. The stored account type decides which one a
 * token belongs to, so every call goes to the right endpoint.
 */
export const ACCOUNT_TYPES = ['WORKER', 'EMPLOYER', 'ADMIN']

const authBase = (accountType) => `/${String(accountType || 'WORKER').toLowerCase()}/auth`

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('sb_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [accountType, setAccountType] = useState(
    () => localStorage.getItem('sb_account_type') || null
  )
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('sb_token')))

  useEffect(() => {
    const token = localStorage.getItem('sb_token')
    const type = localStorage.getItem('sb_account_type')
    if (!token || !type) { setLoading(false); return }
    api.get(`${authBase(type)}/me`)
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('sb_user', JSON.stringify(res.data))
      })
      .catch((err) => {
        // A 401 is handled by the interceptor; anything else keeps the cached user.
        if (err?.response?.status === 401) clearSession()
      })
      .finally(() => setLoading(false))
  }, [])

  const clearSession = () => {
    localStorage.removeItem('sb_token')
    localStorage.removeItem('sb_user')
    localStorage.removeItem('sb_account_type')
    setUser(null)
    setAccountType(null)
  }

  /** Stores a freshly issued token + account. Used by login, register and OTP verify. */
  const applySession = (token, account, type) => {
    const resolved = type || account?.accountType || accountType || 'WORKER'
    localStorage.setItem('sb_token', token)
    localStorage.setItem('sb_user', JSON.stringify(account))
    localStorage.setItem('sb_account_type', resolved)
    setUser(account)
    setAccountType(resolved)
    return account
  }

  // identifier is a mobile number or an email address
  const login = async (type, identifier, password) => {
    const res = await api.post(`${authBase(type)}/login`, { identifier, password })
    return applySession(res.data.token, res.data.account, type)
  }

  const register = async (type, payload) => {
    const res = await api.post(`${authBase(type)}/register`, payload)
    return applySession(res.data.token, res.data.account, type)
  }

  const logout = () => clearSession()

  const refresh = async () => {
    const type = accountType || localStorage.getItem('sb_account_type') || 'WORKER'
    const res = await api.get(`${authBase(type)}/me`)
    setUser(res.data)
    localStorage.setItem('sb_user', JSON.stringify(res.data))
    return res.data
  }

  /** Home route for the signed-in account. */
  const homePath = () =>
    accountType === 'ADMIN' ? '/admin' : accountType === 'EMPLOYER' ? '/dashboard' : '/worker'

  return (
    <AuthContext.Provider
      value={{
        user, setUser, accountType, login, register, logout, refresh,
        applySession, authBase, homePath, loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
