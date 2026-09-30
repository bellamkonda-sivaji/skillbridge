import client from './client'

export const getProfile = () => client.get('/employer/profile').then((r) => r.data)
export const updateProfile = (body) => client.put('/employer/profile', body).then((r) => r.data)
export const getOnboarding = () => client.get('/employer/onboarding').then((r) => r.data)
export const saveOnboardingStep = (body) =>
  client.patch('/employer/onboarding', body).then((r) => r.data)
