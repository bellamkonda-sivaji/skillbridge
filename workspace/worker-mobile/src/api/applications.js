import client from './client'

export const listApplications = () => client.get('/worker/applications').then((r) => r.data)
export const applicationDetail = (id) => client.get(`/worker/applications/${id}`).then((r) => r.data)
export const withdraw = (id, reason, note) =>
  client.post(`/worker/applications/${id}/withdraw`, { reason, note }).then((r) => r.data)

export const interviews = () => client.get('/worker/interviews').then((r) => r.data)
export const interviewDetail = (id) => client.get(`/worker/interviews/${id}`).then((r) => r.data)
