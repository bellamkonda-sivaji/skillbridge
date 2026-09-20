/**
 * Choices offered during signup and worker onboarding.
 * Values are the exact strings the API expects; labels are what the user sees.
 */

/**
 * `ready` marks languages the app is actually translated into today. The rest
 * are on the roadmap — we still store the preference so the person keeps their
 * choice when the translation ships, but we say so rather than silently
 * showing English.
 */
export const LANGUAGES = [
  { code: 'en', native: 'English', label: 'English', flag: '🇬🇧', ready: true },
  { code: 'te', native: 'తెలుగు', label: 'Telugu', flag: '🇮🇳' },
  { code: 'hi', native: 'हिन्दी', label: 'Hindi', flag: '🇮🇳', ready: true },
  { code: 'kn', native: 'ಕನ್ನಡ', label: 'Kannada', flag: '🇮🇳' },
  { code: 'ta', native: 'தமிழ்', label: 'Tamil', flag: '🇮🇳' },
  { code: 'ml', native: 'മലയാളം', label: 'Malayalam', flag: '🇮🇳' },
  { code: 'mr', native: 'मराठी', label: 'Marathi', flag: '🇮🇳' },
  { code: 'bn', native: 'বাংলা', label: 'Bengali', flag: '🇮🇳' },
]

export const ACCOUNT_TYPES = [
  {
    role: 'WORKER',
    icon: 'user',
    title: 'I am looking for work',
    points: ['Find local jobs', 'Apply and get hired', 'Build your work history', 'Get paid safely'],
  },
  {
    role: 'EMPLOYER',
    icon: 'store',
    title: 'I am a business owner',
    points: ['Hire local workers', 'Post jobs easily', 'Manage attendance & payments', 'Grow your business'],
  },
]

export const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
]

/** Job categories a worker can be matched against. */
export const JOB_CATEGORIES = [
  { value: 'RETAIL', label: 'Supermarket / Retail', icon: 'store', tone: 'rose' },
  { value: 'RESTAURANT', label: 'Restaurant / Cafe', icon: 'cup', tone: 'orange' },
  { value: 'MEDICAL', label: 'Medical Store', icon: 'cross', tone: 'sky' },
  { value: 'DELIVERY', label: 'Delivery', icon: 'truck', tone: 'violet' },
  { value: 'WAREHOUSE', label: 'Warehouse / Helper', icon: 'box', tone: 'slate' },
  { value: 'CLEANING', label: 'Cleaner / Housekeeping', icon: 'broom', tone: 'green' },
  { value: 'KITCHEN', label: 'Cook / Kitchen Staff', icon: 'cup', tone: 'amber' },
  { value: 'SALES', label: 'Salesperson', icon: 'briefcase', tone: 'teal' },
  { value: 'DRIVER', label: 'Driver', icon: 'car', tone: 'amber' },
  { value: 'SALON', label: 'Salon / Beauty', icon: 'scissors', tone: 'pink' },
  { value: 'SECURITY', label: 'Security', icon: 'shield', tone: 'sky' },
  { value: 'OTHER', label: 'Other', icon: 'grid', tone: 'slate' },
]

export const EMPLOYMENT_TYPES = [
  { value: 'DAILY', label: 'Daily Work' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'PERMANENT', label: 'Permanent' },
]

/**
 * Suggested skills shown before the worker searches. The full catalogue is
 * fetched from GET /api/skills and merged in, so picks stay in the same shared
 * vocabulary employers use when posting a job.
 */
export const SUGGESTED_SKILLS = [
  'Customer Service', 'Shelf Arrangement', 'Cash Handling', 'POS Machine',
  'Stock Management', 'Cleaning', 'Food Preparation', 'Serving',
  'Basic Cooking', 'Delivery', 'Driving', 'Printing', 'Packing',
  'Loading/Unloading', 'Inventory', 'Communication', 'Teamwork',
  'Time Management',
]

export const EXPERIENCE_OPTIONS = [
  { value: 0, label: 'Less than 1 year' },
  { value: 2, label: '1 - 3 years' },
  { value: 4, label: '3 - 5 years' },
  { value: 7, label: '5 - 10 years' },
  { value: 12, label: 'More than 10 years' },
]

/** null means "anywhere in the city". */
export const RADIUS_OPTIONS = [
  { value: 1, label: '1 km' },
  { value: 3, label: '3 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: null, label: 'Anywhere' },
]

export const AVAILABILITY_OPTIONS = [
  { value: 'IMMEDIATE', label: 'Available immediately' },
  { value: 'FULL_TIME', label: 'Available for full-time work' },
  { value: 'PART_TIME', label: 'Available for part-time work' },
  { value: 'WEEKENDS_ONLY', label: 'Weekends only' },
  { value: 'EVENINGS', label: 'Evenings only' },
]

/** Map centre when a worker has not dropped a pin yet. */
export const DEFAULT_MAP_CENTER = [13.6288, 79.4192] // Tirupati
