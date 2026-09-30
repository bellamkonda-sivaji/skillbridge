import client from './client'

export const dashboard = () => client.get('/worker/dashboard').then((r) => r.data)

export const searchJobs = (body = {}) =>
  client.post('/worker/jobs/search', body).then((r) => r.data)

export const jobDetail = (id) => client.get(`/jobs/${id}`).then((r) => r.data)

export const savedJobs = () => client.get('/worker/saved-jobs').then((r) => r.data)
export const saveJob = (id) => client.post(`/worker/saved-jobs/${id}`).then((r) => r.data)
export const unsaveJob = (id) => client.delete(`/worker/saved-jobs/${id}`).then((r) => r.data)

export const applyToJob = (jobId, body = {}) =>
  client.post(`/worker/jobs/${jobId}/apply`, body).then((r) => r.data)

export const matches = () => client.get('/worker/matches').then((r) => r.data)

export const employerProfile = (employerId) =>
  client.get(`/employers/${employerId}`).then((r) => r.data)
