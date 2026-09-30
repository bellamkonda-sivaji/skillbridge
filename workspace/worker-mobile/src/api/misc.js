import client from './client'

/* ---------------------------------------------------------------- reviews */

/** Reviews written about this worker by the businesses they worked for. */
export const reviewsAbout = (accountId) =>
  client.get(`/reviews/target/WORKER/${accountId}`).then((r) => r.data)

/** Reviews this worker has written. */
export const myReviews = () => client.get('/reviews/mine').then((r) => r.data)

export const writeReview = (body) => client.post('/reviews', body).then((r) => r.data)

/* ---------------------------------------------------------- notifications */

export const notifications = () => client.get('/notifications').then((r) => r.data)
export const unreadCount = () => client.get('/notifications/unread-count').then((r) => r.data)
export const markRead = (id) => client.patch(`/notifications/${id}/read`).then((r) => r.data)
export const markAllRead = () => client.patch('/notifications/read-all').then((r) => r.data)
