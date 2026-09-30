import client from './client'

export const login = (identifier, password) =>
  client.post('/worker/auth/login', { identifier, password }).then((r) => r.data)

export const register = (body) =>
  client.post('/worker/auth/register', body).then((r) => r.data)

export const requestOtp = (phone) =>
  client.post('/worker/auth/otp/request', { phone }).then((r) => r.data)

export const verifyOtp = (phone, code) =>
  client.post('/worker/auth/otp/verify', { phone, code }).then((r) => r.data)

export const me = () => client.get('/worker/auth/me').then((r) => r.data)

export const forgotPassword = (identifier) =>
  client.post('/worker/auth/password/forgot', { identifier }).then((r) => r.data)

export const resetPassword = (body) =>
  client.post('/worker/auth/password/reset', body).then((r) => r.data)
