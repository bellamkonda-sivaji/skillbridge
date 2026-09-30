import client from './client'

export const list = (from, to) =>
  client.get('/employer/interviews', { params: { from, to } }).then((r) => r.data)
export const schedule = (body) => client.post('/employer/interviews', body).then((r) => r.data)
export const complete = (id) =>
  client.patch(`/employer/interviews/${id}/complete`).then((r) => r.data)
export const cancel = (id) => client.patch(`/employer/interviews/${id}/cancel`).then((r) => r.data)
export const results = (jobId) =>
  client.get(`/employer/jobs/${jobId}/interview-results`).then((r) => r.data)
export const setResult = (applicationId, result, feedback) =>
  client.patch(`/employer/applications/${applicationId}/interview-result`, { result, feedback })
    .then((r) => r.data)
