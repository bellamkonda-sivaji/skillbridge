/**
 * The fixed lists the posting wizard offers as taps.
 *
 * Free-text job titles cannot be translated or searched, so a shop owner
 * picks a worker type and the title is suggested from it. They can still edit
 * it, but the category behind it stays something the matcher understands.
 */

export const WORKER_TYPES = [
  { value: 'CASHIER', icon: 'card-outline', en: 'Cashier', te: 'క్యాషియర్', hi: 'कैशियर', suggests: 'Cashier' },
  { value: 'STORE_HELPER', icon: 'cube-outline', en: 'Store helper', te: 'స్టోర్ హెల్పర్', hi: 'स्टोर हेल्पर', suggests: 'Store Helper' },
  { value: 'KITCHEN_STAFF', icon: 'restaurant-outline', en: 'Cook / Kitchen', te: 'వంట / కిచెన్', hi: 'रसोइया / किचन', suggests: 'Kitchen Staff' },
  { value: 'SERVICE_STAFF', icon: 'cafe-outline', en: 'Waiter / Service', te: 'వెయిటర్ / సర్వీస్', hi: 'वेटर / सर्विस', suggests: 'Service Staff' },
  { value: 'DELIVERY_PARTNER', icon: 'bicycle-outline', en: 'Delivery', te: 'డెలివరీ', hi: 'डिलीवरी', suggests: 'Delivery Partner' },
  { value: 'DRIVER', icon: 'car-outline', en: 'Driver', te: 'డ్రైవర్', hi: 'ड्राइवर', suggests: 'Driver' },
  { value: 'CLEANING_STAFF', icon: 'sparkles-outline', en: 'Cleaning', te: 'క్లీనింగ్', hi: 'सफ़ाई', suggests: 'Cleaning Staff' },
  { value: 'SECURITY', icon: 'shield-checkmark-outline', en: 'Security', te: 'సెక్యూరిటీ', hi: 'सुरक्षा', suggests: 'Security Guard' },
  { value: 'OTHER', icon: 'construct-outline', en: 'Other work', te: 'ఇతర పని', hi: 'दूसरा काम', suggests: '' },
]

export const ENGAGEMENT_MODELS = [
  {
    value: 'ONE_DAY', icon: 'today-outline',
    en: 'One day', te: 'ఒక రోజు', hi: 'एक दिन',
    subEn: 'A single day or one shift', units: ['DAILY', 'PER_SHIFT'], defaultUnit: 'DAILY',
  },
  {
    value: 'FEW_DAYS', icon: 'calendar-outline',
    en: 'A few days', te: 'కొన్ని రోజులు', hi: 'कुछ दिन',
    subEn: 'Less than a month', units: ['DAILY', 'HOURLY', 'PER_SHIFT'], defaultUnit: 'DAILY',
  },
  {
    value: 'FEW_WEEKS', icon: 'calendar-number-outline',
    en: 'A few weeks', te: 'కొన్ని వారాలు', hi: 'कुछ हफ़्ते',
    subEn: 'A set period of weeks', units: ['DAILY', 'PER_WEEK', 'HOURLY'], defaultUnit: 'DAILY',
  },
  {
    value: 'MONTHS', icon: 'briefcase-outline',
    en: 'Monthly', te: 'నెలవారీ', hi: 'महीने का',
    subEn: 'Regular monthly work', units: ['MONTHLY', 'DAILY'], defaultUnit: 'MONTHLY',
  },
  {
    value: 'PERMANENT', icon: 'infinite-outline',
    en: 'Permanent', te: 'శాశ్వతం', hi: 'पक्की नौकरी',
    subEn: 'Long term, no end date', units: ['MONTHLY'], defaultUnit: 'MONTHLY',
  },
]

export const HIRING_METHODS = [
  { value: 'DIRECT', icon: 'flash-outline', titleKey: 'direct', subKey: 'directSub' },
  { value: 'TALK_FIRST', icon: 'call-outline', titleKey: 'talk', subKey: 'talkSub' },
  { value: 'INTERVIEW', icon: 'people-outline', titleKey: 'visit', subKey: 'visitSub' },
]

export const DAYS = [
  { value: 'MON', en: 'Mon' }, { value: 'TUE', en: 'Tue' }, { value: 'WED', en: 'Wed' },
  { value: 'THU', en: 'Thu' }, { value: 'FRI', en: 'Fri' }, { value: 'SAT', en: 'Sat' },
  { value: 'SUN', en: 'Sun' },
]

export const SALARY_UNITS = [
  { value: 'DAILY', key: 'perDay' },
  { value: 'HOURLY', key: 'perHour' },
  { value: 'MONTHLY', key: 'perMonth' },
]

export const BENEFITS = [
  { value: 'MEALS', icon: 'fast-food-outline', key: 'meals' },
  { value: 'TRAVEL_ALLOWANCE', icon: 'bus-outline', key: 'travel' },
  { value: 'ACCOMMODATION', icon: 'home-outline', key: 'accommodation' },
  { value: 'PERFORMANCE_BONUS', icon: 'trophy-outline', key: 'bonus' },
  { value: 'OVERTIME_PAY', icon: 'time-outline', key: 'overtime' },
]

export const BUSINESS_TYPES = [
  'Supermarket / Retail', 'Restaurant / Cafe', 'Medical Store', 'Hotel / Lodge',
  'Construction', 'Warehouse / Logistics', 'Salon / Beauty', 'Other',
]

export const SKILLS = [
  'Customer Service', 'Billing', 'Shelf Arrangement', 'Cash Handling', 'Stock Management',
  'Basic Cooking', 'Food Preparation', 'Serving', 'Cleaning', 'Loading / Unloading',
  'Two Wheeler', 'Car', 'Heavy Vehicle', 'Masonry', 'Painting', 'Plumbing',
  'Electrical Wiring', 'Welding', 'Security', 'Packing',
]

export const LANGUAGE_OPTIONS = ['Telugu', 'Hindi', 'English', 'Tamil', 'Kannada', 'Urdu']

/**
 * The commission bands, mirrored from PricingService on the server so the
 * wizard can show a split as the employer types. The server recalculates on
 * save and is the authority - if these ever drift, the job carries the
 * server's figure, not this one.
 */
export const FEE_SLABS = [
  { upTo: 499.99, percent: 7, label: 'Under ₹500' },
  { upTo: 1000, percent: 10, label: '₹500 – ₹1,000' },
  { upTo: 4000, percent: 13, label: '₹1,000 – ₹4,000' },
  { upTo: 10000, percent: 16, label: '₹4,000 – ₹10,000' },
  { upTo: null, percent: 20, label: 'Above ₹10,000' },
]

export function splitPrice(postedAmount) {
  const total = Number(postedAmount) || 0
  if (!total) return { total: 0, fee: 0, workerPay: 0, percent: 0, slab: null }
  const slab = FEE_SLABS.find((x) => x.upTo === null || total <= x.upTo) || FEE_SLABS[FEE_SLABS.length - 1]
  // Whole rupees, matching the server: these wages are handed over as cash.
  const fee = Math.round(total * (slab.percent / 100))
  return { total, fee, workerPay: total - fee, percent: slab.percent, slab }
}
