import client from './client'

export const applicants = (jobId, status = 'ALL', sort = 'MATCH') =>
  client.get(`/employer/jobs/${jobId}/applicants`, { params: { status, sort } }).then((r) => r.data)
export const shortlist = (jobId) =>
  client.get(`/employer/jobs/${jobId}/shortlist`).then((r) => r.data)
export const allApplications = () => client.get('/employer/applications').then((r) => r.data)
export const decide = (applicationId, body) =>
  client.patch(`/employer/applications/${applicationId}`, body).then((r) => r.data)
export const bulkDecide = (applicationIds, status, message) =>
  client.post('/employer/applications/bulk', { applicationIds, status, message }).then((r) => r.data)

export const worker = (workerId, jobId) =>
  client.get(`/employer/workers/${workerId}`, { params: { jobId } }).then((r) => r.data)
export const workHistory = (workerId) =>
  client.get(`/employer/workers/${workerId}/work-history`).then((r) => r.data)
export const recommended = (jobId, tab = 'TOP') =>
  client.get(`/employer/jobs/${jobId}/recommended`, { params: { tab } }).then((r) => r.data)
export const compare = (workerIds, jobId) =>
  client.post('/employer/compare', { workerIds, jobId }).then((r) => r.data)
export const invite = (jobId, workerId) =>
  client.post(`/employer/jobs/${jobId}/invite`, { workerId }).then((r) => r.data)
