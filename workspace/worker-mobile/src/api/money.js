import client from './client'

export const earnings = () => client.get('/worker/earnings').then((r) => r.data)
export const payoutDestinations = () => client.get('/worker/payout-destinations').then((r) => r.data)
export const addPayoutDestination = (body) =>
  client.post('/worker/payout-destinations', body).then((r) => r.data)
export const payouts = () => client.get('/worker/payouts').then((r) => r.data)
