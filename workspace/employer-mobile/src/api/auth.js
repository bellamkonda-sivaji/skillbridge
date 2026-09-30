import client from './client'

export const login = (identifier, password) =>
  client.post('/employer/auth/login', { identifier, password }).then((r) => r.data)
export const register = (body) =>
  client.post('/employer/auth/register', body).then((r) => r.data)
export const requestOtp = (phone) =>
  client.post('/employer/auth/otp/request', { phone }).then((r) => r.data)
export const verifyOtp = (phone, code) =>
  client.post('/employer/auth/otp/verify', { phone, code }).then((r) => r.data)
export const me = () => client.get('/employer/auth/me').then((r) => r.data)
