/** Choices and copy for the employer login + onboarding flow. */

export const PITCH = {
  title: 'Hire Local Talent. Build a Stronger Team.',
  lede: 'Post jobs, find verified workers, manage attendance and payments — all in one place.',
  points: [
    { icon: 'checkCircle', text: 'Verified & local workforce' },
    { icon: 'clock', text: 'Quick hiring process' },
    { icon: 'calendar', text: 'Attendance & payroll support' },
    { icon: 'trending', text: 'Grow your business with ease' },
  ],
  trust: { count: '10,000+', label: 'Businesses trust JobOn' },
}

export const EMPLOYER_KINDS = [
  {
    value: 'BUSINESS',
    icon: 'store',
    title: 'Business / Employer',
    text: 'I want to hire workers for my business (e.g. Retail, Restaurant, Construction, etc.)',
  },
  {
    value: 'INDIVIDUAL',
    icon: 'user',
    title: 'Individual / Self Employer',
    text: 'I hire for personal needs (e.g. Home help, Driver, Caretaker, etc.)',
  },
]

export const BUSINESS_CATEGORIES = [
  'Retail / Supermarket',
  'Restaurant / Cafe',
  'Medical / Pharmacy',
  'Delivery & Logistics',
  'Warehouse',
  'Cleaning & Housekeeping',
  'Salon & Beauty',
  'Security Services',
  'Construction',
  'Mechanic & Repair',
  'Office / Admin',
  'Other Services',
]

export const BUSINESS_SIZES = [
  '1 - 9 employees',
  '10 - 50 employees',
  '51 - 200 employees',
  '200+ employees',
]

export const PLANS = [
  {
    value: 'STARTER',
    name: 'Starter',
    price: 'Free',
    per: '',
    features: ['Post up to 3 jobs/month', 'Basic features'],
  },
  {
    value: 'GROWTH',
    name: 'Growth',
    price: '₹999',
    per: '/ month',
    popular: true,
    features: ['Unlimited job postings', 'Priority matching', 'Attendance & payroll', 'Email support'],
  },
  {
    value: 'BUSINESS',
    name: 'Business',
    price: '₹2,499',
    per: '/ month',
    features: ['All Growth features', 'Dedicated support', 'Advanced analytics', 'Multiple locations'],
  },
]

export const PAYMENT_METHODS = [
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Credit / Debit Card' },
  { value: 'NETBANKING', label: 'Net Banking' },
]

export const WIZARD_STEPS = ['Account Type', 'Business Details', 'Verification', 'Plan', 'Complete']

/** The four rules shown live under the new-password field. */
export const PASSWORD_RULES = [
  { key: 'len', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { key: 'number', label: 'One number', test: (v) => /\d/.test(v) },
  { key: 'special', label: 'One special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
]

export const passwordOk = (v) => PASSWORD_RULES.every((r) => r.test(v || ''))

/** Upload limits, matched to what the screens promise. */
export const UPLOAD_LIMITS = {
  doc: { bytes: 5 * 1024 * 1024, label: 'PDF, JPG, PNG (Max 5 MB)', accept: 'application/pdf,image/jpeg,image/png' },
  logo: { bytes: 2 * 1024 * 1024, label: 'JPG, PNG (Max 2 MB)', accept: 'image/jpeg,image/png' },
}
