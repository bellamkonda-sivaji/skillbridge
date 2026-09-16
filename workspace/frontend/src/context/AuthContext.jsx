import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sb_user')) || null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('sb_token')))

  useEffect(() => {
    const token = localStorage.getItem('sb_token')
    if (token) {
      api.get('/me')
        .then((res) => {
          setUser(res.data)
          localStorage.setItem('sb_user', JSON.stringify(res.data))
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('sb_token', res.data.token)
    localStorage.setItem('sb_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload)
    localStorage.setItem('sb_token', res.data.token)
    localStorage.setItem('sb_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }

  const logout = () => {
    localStorage.removeItem('sb_token')
    localStorage.removeItem('sb_user')
    setUser(null)
  }

  const refresh = async () => {
    const res = await api.get('/me')
    setUser(res.data)
    localStorage.setItem('sb_user', JSON.stringify(res.data))
    return res.data
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, refresh, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
