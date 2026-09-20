/** Options for the Post a Job wizard. Values are what the API stores. */

export const WORKER_CATEGORIES = [
  { value: 'STORE_HELPER', label: 'Store Helper', sub: 'Retail / Supermarket', icon: 'store', tone: 'blue' },
  { value: 'CASHIER', label: 'Cashier', sub: 'Retail / POS', icon: 'rupee', tone: 'rose' },
  { value: 'DELIVERY_PARTNER', label: 'Delivery Partner', sub: 'Delivery & Logistics', icon: 'truck', tone: 'amber' },
  { value: 'KITCHEN_STAFF', label: 'Cook / Kitchen Staff', sub: 'Restaurant / Cafe', icon: 'cup', tone: 'orange' },
  { value: 'SERVICE_STAFF', label: 'Waiter / Service Staff', sub: 'Restaurant / Cafe', icon: 'users', tone: 'violet' },
  { value: 'CLEANING_STAFF', label: 'Cleaner / Housekeeping', sub: 'Cleaning & Maintenance', icon: 'broom', tone: 'green' },
  { value: 'SECURITY', label: 'Security', sub: 'Security / Safety', icon: 'shield', tone: 'sky' },
  { value: 'DRIVER', label: 'Driver', sub: 'Transport', icon: 'car', tone: 'slate' },
  { value: 'OTHER', label: 'Other', sub: 'Custom Requirement', icon: 'grid', tone: 'teal' },
]

export const EMPLOYMENT_TYPES = [
  { value: 'DAILY', label: 'Daily Work', sub: 'For short-term or one-time work', icon: 'clock' },
  { value: 'PART_TIME', label: 'Part-time', sub: 'Few hours per day/week', icon: 'clock' },
  { value: 'FULL_TIME', label: 'Full-time', sub: 'Regular long-term employment', icon: 'briefcase' },
  { value: 'TEMPORARY', label: 'Temporary', sub: 'For a specific period', icon: 'calendar' },
  { value: 'PERMANENT', label: 'Permanent', sub: 'Long-term position', icon: 'checkCircle' },
]

export const DAYS = [
  { value: 'MON', label: 'Mon' }, { value: 'TUE', label: 'Tue' },
  { value: 'WED', label: 'Wed' }, { value: 'THU', label: 'Thu' },
  { value: 'FRI', label: 'Fri' }, { value: 'SAT', label: 'Sat' },
  { value: 'SUN', label: 'Sun' },
]

export const SALARY_UNITS = [
  { value: 'PER_DAY', label: 'Per Day' },
  { value: 'PER_HOUR', label: 'Per Hour' },
  { value: 'PER_MONTH', label: 'Per Month' },
]

export const BENEFITS = [
  { value: 'MEALS', label: 'Meals / Food' },
  { value: 'TRAVEL', label: 'Travel Allowance' },
  { value: 'BONUS', label: 'Performance Bonus' },
  { value: 'OTHER', label: 'Other' },
]

export const PAYMENT_MODES = [
  {
    value: 'SKILLBRIDGE',
    label: 'SkillBridge Payment (Recommended)',
    sub: 'We handle secure payments to workers.',
  },
  {
    value: 'CASH',
    label: 'Cash / Direct Payment',
    sub: 'You pay the worker directly. No wage protection.',
  },
]

export const EXPERIENCE_LEVELS = [
  { value: 0, label: 'No prior experience required' },
  { value: 1, label: '6 months – 1 year' },
  { value: 2, label: '1 – 2 years' },
  { value: 3, label: '2 – 3 years' },
  { value: 5, label: '3 – 5 years' },
  { value: 8, label: 'More than 5 years' },
]

export const LANGUAGE_OPTIONS = ['Telugu', 'Hindi', 'English', 'Tamil', 'Kannada', 'Malayalam', 'Marathi']

export const GENDER_PREFS = [
  { value: 'ANY', label: 'Any' },
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
]

export const AGE_RANGES = [
  { value: '', label: 'Any age' },
  { value: '18-25', label: '18 - 25 years' },
  { value: '18-45', label: '18 - 45 years' },
  { value: '25-40', label: '25 - 40 years' },
  { value: '30-55', label: '30 - 55 years' },
]

export const INTERVIEW_TYPES = [
  { value: 'NONE', label: 'No Interview (Direct Hire)', sub: 'Hire based on profile and application', icon: 'checkCircle' },
  { value: 'PHONE', label: 'Phone Interview', sub: 'Short phone call', icon: 'phone' },
  { value: 'IN_PERSON', label: 'In-person Interview', sub: 'Meet at your location', icon: 'users' },
  { value: 'SKILL_TEST', label: 'Skill Test', sub: 'Practical test or trial shift', icon: 'sparkles' },
]

/** Common starting points so an employer rarely types a responsibility from scratch. */
export const RESPONSIBILITY_SUGGESTIONS = {
  STORE_HELPER: ['Arrange items on shelves', 'Assist customers', 'Maintain cleanliness', 'Support billing area'],
  CASHIER: ['Handle billing and cash', 'Operate the POS machine', 'Reconcile daily sales', 'Assist customers'],
  DELIVERY_PARTNER: ['Deliver orders on time', 'Handle cash on delivery', 'Maintain the vehicle', 'Update delivery status'],
  KITCHEN_STAFF: ['Prepare food items', 'Maintain kitchen hygiene', 'Manage stock of ingredients', 'Support the head cook'],
  SERVICE_STAFF: ['Take customer orders', 'Serve food and beverages', 'Keep tables clean', 'Handle customer requests'],
  CLEANING_STAFF: ['Clean assigned areas', 'Manage cleaning supplies', 'Dispose of waste safely', 'Report maintenance issues'],
  SECURITY: ['Monitor entry and exit', 'Maintain the visitor register', 'Patrol the premises', 'Report incidents'],
  DRIVER: ['Drive safely and on time', 'Maintain the vehicle', 'Keep trip records', 'Assist with loading'],
  OTHER: [],
}

export const SKILL_SUGGESTIONS = [
  'Shelf Arrangement', 'Customer Service', 'Basic Computer', 'Cash Handling', 'POS Machine',
  'Stock Management', 'Cleaning', 'Food Preparation', 'Serving', 'Driving', 'Packing',
  'Loading/Unloading', 'Inventory', 'Communication', 'Teamwork',
]

export const WIZARD_STEPS = [
  'Worker Type', 'Employment', 'Details', 'Schedule',
  'Salary', 'Requirements', 'Interview', 'Review',
]

/** A blank posting. Kept here so the wizard and the edit screen agree. */
export const EMPTY_JOB = {
  workerCategory: '',
  engagementModel: '',
  employmentType: '',
  workDate: '',
  title: '',
  workersNeeded: 1,
  description: '',
  responsibilities: [],
  workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  shifts: [{ label: 'Shift 1', startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00' }],
  shiftArrangement: 'ALL_SHIFTS',
  breakPaid: false,
  durationType: 'ONGOING',
  startDate: '',
  endDate: '',
  salary: '',
  salaryUnit: 'PER_DAY',
  benefits: [],
  overtimeExpected: false,
  overtimePayBasis: null,
  overtimeRate: '',
  paymentMode: 'SKILLBRIDGE',
  requiredSkills: [],
  minExperienceYears: 0,
  languages: [],
  genderPreference: 'ANY',
  ageRange: '',
  interviewType: 'NONE',
  applicationDeadline: '',
  autoCloseWhenFilled: true,
}
