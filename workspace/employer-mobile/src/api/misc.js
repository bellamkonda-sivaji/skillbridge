import client from './client'

/* ---------------------------------------------------------------- workers */

/** Every registered worker, for browsing rather than waiting for applicants. */
export const searchWorkers = (params) => client.get('/workers', { params }).then((r) => r.data)

/* ---------------------------------------------------------------- reviews */

export const reviewsAbout = (accountId) =>
  client.get(`/reviews/target/EMPLOYER/${accountId}`).then((r) => r.data)
export const myReviews = () => client.get('/reviews/mine').then((r) => r.data)
export const writeReview = (body) => client.post('/reviews', body).then((r) => r.data)

/* ----------------------------------------------------------- notifications */

export const notifications = () => client.get('/notifications').then((r) => r.data)
export const markRead = (id) => client.patch(`/notifications/${id}/read`).then((r) => r.data)
export const markAllRead = () => client.patch('/notifications/read-all').then((r) => r.data)

/* ----------------------------------------------------------------- wallet */

export const wallet = () => client.get('/wallet').then((r) => r.data)
export const fundWallet = (amount) => client.post('/wallet/fund', { amount }).then((r) => r.data)
