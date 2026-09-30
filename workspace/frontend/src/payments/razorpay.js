import api from '../api'

/**
 * Razorpay, from the browser's side of the glass.
 *
 * THE BROWSER IS NOT A SOURCE OF TRUTH. Checkout hands back an order id, a
 * payment id and a signature: that proves the handshake was not forged, and
 * nothing else. It does not prove money moved, was captured, or was not
 * refunded a second later. Only the signed webhook does, and the server funds
 * a job's escrow from that alone.
 *
 * So `verify` is not an answer — it is us telling the server what came back.
 * The answer is the escrow's own status, read back afterwards.
 */

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'
let checkoutPromise = null

/**
 * Load the gateway's checkout once, lazily.
 *
 * Deliberately not in index.html: a script from a payment gateway on every page
 * of the app is a third-party dependency on screens that will never take money.
 */
export function loadCheckout() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay)
  checkoutPromise ??= new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${CHECKOUT_SRC}"]`)
    const el = existing || document.createElement('script')
    el.addEventListener('load', () => resolve(window.Razorpay))
    el.addEventListener('error', () => {
      // Cleared so a retry can try again — a failed load is usually a blocked
      // network or an ad blocker, not a permanent state.
      checkoutPromise = null
      el.remove()
      reject(new Error('Could not load the payment gateway. Check your connection or any ad blocker, then try again.'))
    })
    if (!existing) {
      el.src = CHECKOUT_SRC
      el.async = true
      document.head.appendChild(el)
    }
  })
  return checkoutPromise
}

/** Whether a checkout can be offered at all, plus the publishable half of the key. */
export const getPaymentConfig = () => api.get('/config/payments').then((r) => r.data)

/* ---------- employer: funding a job ---------- */
export const getEscrow = (jobId) =>
  api.get(`/employer/jobs/${jobId}/escrow`).then((r) => r.data)
export const createOrder = (jobId, amountMinor) =>
  api.post(`/employer/jobs/${jobId}/escrow/order`, { amountMinor }).then((r) => r.data)
/** The handshake, handed back for checking. Never a claim that anything is funded. */
export const verifyHandshake = (jobId, body) =>
  api.post(`/employer/jobs/${jobId}/escrow/verify`, body).then((r) => r.data)
/** The demo path when no gateway keys are configured. Same ledger entries. */
export const fundManually = (jobId, amountMinor) =>
  api.post(`/employer/jobs/${jobId}/escrow/fund-manual`, { amountMinor }).then((r) => r.data)
export const getBilling = () => api.get('/employer/billing').then((r) => r.data)

/* ---------- worker: getting paid ---------- */
export const getWorkerEarnings = () => api.get('/worker/earnings').then((r) => r.data)
export const listDestinations = () => api.get('/worker/payout-destinations').then((r) => r.data)
export const addDestination = (body) =>
  api.post('/worker/payout-destinations', body).then((r) => r.data)
export const verifyDestination = (id) =>
  api.post(`/worker/payout-destinations/${id}/verify`).then((r) => r.data)
export const makeDefaultDestination = (id) =>
  api.post(`/worker/payout-destinations/${id}/default`).then((r) => r.data)
export const removeDestination = (id) =>
  api.delete(`/worker/payout-destinations/${id}`).then((r) => r.data)
export const requestPayout = (amountMinor, destinationId) =>
  api.post('/worker/payouts', { amountMinor, destinationId }).then((r) => r.data)
export const listPayouts = () => api.get('/worker/payouts').then((r) => r.data)

/**
 * Runs the whole checkout for a job, then reads our own record back.
 *
 * Resolves with the escrow as the SERVER sees it — never with whatever the
 * checkout said. A dismissed modal resolves `{ dismissed: true }` rather than
 * rejecting, because the person closing it has not hit an error.
 */
export async function payForJob({ jobId, amountMinor, config, prefill = {}, jobTitle }) {
  const Razorpay = await loadCheckout()
  const order = await createOrder(jobId, amountMinor)

  const handshake = await new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: config.keyId,
      order_id: order.providerOrderId,
      amount: order.amountMinor,
      currency: order.currency || 'INR',
      name: 'JobOn',
      description: jobTitle ? `Funding for ${jobTitle}` : 'Job funding',
      prefill,
      theme: { color: '#2563eb' },
      handler: (r) => resolve({
        providerOrderId: r.razorpay_order_id,
        providerPaymentId: r.razorpay_payment_id,
        signature: r.razorpay_signature,
      }),
      modal: { ondismiss: () => resolve(null) },
    })
    rzp.on('payment.failed', (e) =>
      reject(new Error(e?.error?.description || 'The payment did not go through.')))
    rzp.open()
  })

  if (!handshake) return { dismissed: true }

  // Tell the server what came back. Its answer is advisory — the webhook is
  // what actually funds the escrow, so we read the escrow itself afterwards.
  await verifyHandshake(jobId, handshake).catch(() => {})
  return { dismissed: false, escrow: await getEscrow(jobId) }
}

/* ---------- money formatting ---------- */

/**
 * Minor units in, rupees out. Money crosses the wire in paise so no part of
 * this app ever does floating-point arithmetic on it.
 */
export const rupees = (minor) => (Number(minor) || 0) / 100
export const money = (minor) =>
  '₹' + rupees(minor).toLocaleString('en-IN', { maximumFractionDigits: 2 })
/** Rupees typed by a person, back to paise. Rounds, never truncates. */
export const toMinor = (r) => Math.round((Number(r) || 0) * 100)

export const ESCROW_STATUS = {
  UNFUNDED: { label: 'Not funded', tone: 'withdrawn' },
  FUNDED: { label: 'Funded', tone: 'accepted' },
  PARTIALLY_RELEASED: { label: 'Partly released', tone: 'pending' },
  RELEASED: { label: 'Released', tone: 'accepted' },
  REFUNDED: { label: 'Refunded', tone: 'viewed' },
}

export const EARNING_STATUS = {
  ACCRUED: { label: 'Reserved for you', tone: 'pending', hint: 'Held against the job until the work is signed off.' },
  HELD: { label: 'On hold', tone: 'rejected', hint: 'Paused while something is being checked.' },
  PAYABLE: { label: 'Ready to withdraw', tone: 'accepted', hint: 'Yours to take out whenever you like.' },
  IN_BATCH: { label: 'Being paid', tone: 'interview', hint: 'On its way to your account.' },
  PAID: { label: 'Paid', tone: 'accepted', hint: 'Sent to your account.' },
  FAILED: { label: 'Failed', tone: 'rejected', hint: 'It did not go through — check your account details.' },
  REVERSED: { label: 'Reversed', tone: 'withdrawn', hint: 'This earning was cancelled.' },
}

export const PAYOUT_STATUS = {
  REQUESTED: { label: 'Requested', tone: 'pending' },
  VALIDATING: { label: 'Checking account', tone: 'pending' },
  QUEUED: { label: 'Queued', tone: 'pending' },
  PROCESSING: { label: 'Processing', tone: 'interview' },
  PAID: { label: 'Paid', tone: 'accepted' },
  FAILED: { label: 'Failed', tone: 'rejected' },
  RETURNED: { label: 'Returned by bank', tone: 'rejected' },
  CANCELLED: { label: 'Cancelled', tone: 'withdrawn' },
  ON_HOLD: { label: 'On hold', tone: 'pending' },
}

export const VERIFICATION_STATUS = {
  UNVERIFIED: { label: 'Not checked', tone: 'withdrawn' },
  PENDING: { label: 'Checking…', tone: 'pending' },
  VERIFIED: { label: 'Verified', tone: 'accepted' },
  FAILED: { label: 'Check failed', tone: 'rejected' },
  NAME_MISMATCH: { label: 'Name does not match', tone: 'rejected' },
}
