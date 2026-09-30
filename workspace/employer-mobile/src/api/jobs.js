import client from './client'

export const dashboard = () => client.get('/employer/dashboard').then((r) => r.data)

export const listJobs = (status = 'ALL', q = '') =>
  client.get('/employer/jobs', { params: { status, q } }).then((r) => r.data)
export const getJob = (id) => client.get(`/employer/jobs/${id}`).then((r) => r.data)
export const createJob = (body) => client.post('/employer/jobs', body).then((r) => r.data)
export const updateJob = (id, body) => client.put(`/employer/jobs/${id}`, body).then((r) => r.data)
export const setJobStatus = (id, status) =>
  client.patch(`/employer/jobs/${id}/status`, { status }).then((r) => r.data)
export const deleteJob = (id) => client.delete(`/employer/jobs/${id}`).then((r) => r.data)

export const estimate = (body) => client.post('/employer/jobs/estimate', body).then((r) => r.data)

// ---- pricing: the commission slabs and what a price actually splits into
export const quotePrice = (salary, unit) =>
  client.get('/employer/pricing/quote', { params: { salary, unit } }).then((r) => r.data)
export const slabs = () => client.get('/employer/pricing/slabs').then((r) => r.data)
export const jobPricing = (jobId) =>
  client.get(`/employer/jobs/${jobId}/pricing`).then((r) => r.data)
export const changePrice = (jobId, salary, reason) =>
  client.patch(`/employer/jobs/${jobId}/price`, { salary, reason }).then((r) => r.data)

// ---- demand advice: whether a live job is going to fill
export const jobDemand = (jobId) => client.get(`/employer/jobs/${jobId}/demand`).then((r) => r.data)
export const demandAlerts = () => client.get('/employer/demand-alerts').then((r) => r.data)
