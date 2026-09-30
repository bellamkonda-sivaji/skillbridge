import client from './client'

export const getProfile = () => client.get('/worker/profile').then((r) => r.data)
export const updateProfile = (body) => client.put('/worker/profile', body).then((r) => r.data)

/** The onboarding wizard saves a step at a time, so a drop-off loses nothing. */
export const saveOnboardingStep = (body) =>
  client.patch('/worker/onboarding', body).then((r) => r.data)
