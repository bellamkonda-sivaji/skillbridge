import client from './client'

/** The help desk. One queue, shared by both apps. */
export const raiseTicket = (body) => client.post('/support/tickets', body).then((r) => r.data)
export const myTickets = () => client.get('/support/tickets').then((r) => r.data)
export const getTicket = (id) => client.get(`/support/tickets/${id}`).then((r) => r.data)
export const replyToTicket = (id, body) =>
  client.post(`/support/tickets/${id}/replies`, body).then((r) => r.data)
