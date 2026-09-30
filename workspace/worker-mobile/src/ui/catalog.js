/**
 * The fixed lists the app offers as taps rather than free text.
 *
 * Typing is the step people abandon on a cheap phone, and a free-text skill
 * cannot be matched or translated. Every value here is one the backend already
 * understands, so what the worker taps is what an employer searches on.
 */

export const WORK_CATEGORIES = [
  { value: 'CASHIER', icon: 'card-outline', en: 'Supermarket / Shop', te: 'సూపర్ మార్కెట్ / షాప్', hi: 'सुपरमार्केट / दुकान' },
  { value: 'KITCHEN_STAFF', icon: 'restaurant-outline', en: 'Cook / Kitchen', te: 'వంట / కిచెన్', hi: 'रसोइया / किचन' },
  { value: 'SERVICE_STAFF', icon: 'cafe-outline', en: 'Hotel / Serving', te: 'హోటల్ / సర్వింగ్', hi: 'होटल / सर्विंग' },
  { value: 'DELIVERY_PARTNER', icon: 'bicycle-outline', en: 'Delivery', te: 'డెలివరీ', hi: 'डिलीवरी' },
  { value: 'DRIVER', icon: 'car-outline', en: 'Driver', te: 'డ్రైవర్', hi: 'ड्राइवर' },
  { value: 'CLEANING_STAFF', icon: 'sparkles-outline', en: 'Cleaning', te: 'క్లీనింగ్', hi: 'सफ़ाई' },
  { value: 'STORE_HELPER', icon: 'cube-outline', en: 'Helper / Loading', te: 'హెల్పర్ / లోడింగ్', hi: 'हेल्पर / लोडिंग' },
  { value: 'SECURITY', icon: 'shield-checkmark-outline', en: 'Security', te: 'సెక్యూరిటీ', hi: 'सुरक्षा' },
  { value: 'OTHER', icon: 'construct-outline', en: 'Mestri / Building', te: 'మేస్త్రీ / కట్టడం', hi: 'मिस्त्री / निर्माण' },
]

export const categoryLabel = (value, lang = 'en') => {
  const c = WORK_CATEGORIES.find((x) => x.value === value)
  return c ? (c[lang] || c.en) : value
}

export const EMPLOYMENT_TYPES = [
  { value: 'ONE_DAY', en: 'One day', te: 'ఒక రోజు', hi: 'एक दिन' },
  { value: 'FEW_DAYS', en: 'A few days', te: 'కొన్ని రోజులు', hi: 'कुछ दिन' },
  { value: 'FEW_WEEKS', en: 'A few weeks', te: 'కొన్ని వారాలు', hi: 'कुछ हफ़्ते' },
  { value: 'MONTHS', en: 'Monthly', te: 'నెలవారీ', hi: 'महीने का' },
  { value: 'PERMANENT', en: 'Permanent', te: 'శాశ్వతం', hi: 'पक्की' },
]

/** Grouped so the skills screen is scannable instead of a wall of 40 pills. */
export const SKILLS = [
  { group: 'Shop', items: ['Customer Service', 'Billing', 'Shelf Arrangement', 'Cash Handling', 'Stock Management', 'POS Machine'] },
  { group: 'Kitchen', items: ['Basic Cooking', 'Food Preparation', 'Serving', 'Dish Washing', 'Tandoor', 'South Indian Tiffin'] },
  { group: 'Driving', items: ['Two Wheeler', 'Auto', 'Car', 'Tempo / Van', 'Heavy Vehicle', 'Driving Licence'] },
  { group: 'Building', items: ['Masonry', 'Painting', 'Plumbing', 'Electrical Wiring', 'Carpentry', 'Welding'] },
  { group: 'General', items: ['Loading / Unloading', 'Packing', 'Cleaning', 'Security', 'Gardening', 'Teamwork'] },
]

export const RADIUS_OPTIONS = [1, 3, 5, 10, 20]

export const AVAILABILITY = [
  { value: 'IMMEDIATE', key: 'availableNow' },
  { value: 'WITHIN_WEEK', key: 'availableWeek' },
  { value: 'WITHIN_MONTH', key: 'availableMonth' },
]

export const WITHDRAW_REASONS = [
  'I found other work',
  'The pay is too low',
  'It is too far from me',
  'The timing does not suit me',
  'I applied by mistake',
  'Other',
]
