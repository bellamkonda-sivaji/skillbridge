import client from './client'

/** Pass `{ lat, lng }` to measure "near you" from the phone instead of home. */
export const dashboard = (near = {}) =>
  client.get('/worker/dashboard', { params: pointOnly(near) }).then((r) => r.data)

/** `lat`/`lng` in the body move the distance origin off the saved home. */
export const searchJobs = (body = {}) =>
  client.post('/worker/jobs/search', { ...body, ...pointOnly(body) }).then((r) => r.data)

/** Sends a point only when it is a real one; half a point is no point. */
function pointOnly(p) {
  const lat = Number(p?.lat)
  const lng = Number(p?.lng)
  if (p?.lat == null || p?.lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { lat: undefined, lng: undefined }
  }
  return { lat, lng }
}

export const jobDetail = (id) => client.get(`/jobs/${id}`).then((r) => r.data)

export const savedJobs = () => client.get('/worker/saved-jobs').then((r) => r.data)
export const saveJob = (id) => client.post(`/worker/saved-jobs/${id}`).then((r) => r.data)
export const unsaveJob = (id) => client.delete(`/worker/saved-jobs/${id}`).then((r) => r.data)

export const applyToJob = (jobId, body = {}) =>
  client.post(`/worker/jobs/${jobId}/apply`, body).then((r) => r.data)

export const matches = () => client.get('/worker/matches').then((r) => r.data)

export const employerProfile = (employerId) =>
  client.get(`/employers/${employerId}`).then((r) => r.data)
