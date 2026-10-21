/**
 * The fixed lists the app offers as taps rather than free text.
 *
 * Typing is the step people abandon on a cheap phone, and a free-text skill
 * cannot be matched or translated. Every value here is one the backend already
 * understands, so what the worker taps is what an employer searches on.
 */

export const WORK_CATEGORIES = [
  { value: 'CASHIER', emoji: '🛒', icon: 'card-outline', en: 'Supermarket / Shop', te: 'సూపర్ మార్కెట్ / షాప్', hi: 'सुपरमार्केट / दुकान' },
  { value: 'KITCHEN_STAFF', emoji: '🍳', icon: 'restaurant-outline', en: 'Cook / Kitchen', te: 'వంట / కిచెన్', hi: 'रसोइया / किचन' },
  { value: 'SERVICE_STAFF', emoji: '🍽️', icon: 'cafe-outline', en: 'Hotel / Serving', te: 'హోటల్ / సర్వింగ్', hi: 'होटल / सर्विंग' },
  { value: 'DELIVERY_PARTNER', emoji: '🛵', icon: 'bicycle-outline', en: 'Delivery', te: 'డెలివరీ', hi: 'डिलीवरी' },
  { value: 'DRIVER', emoji: '🚗', icon: 'car-outline', en: 'Driver', te: 'డ్రైవర్', hi: 'ड्राइवर' },
  { value: 'CLEANING_STAFF', emoji: '🧹', icon: 'sparkles-outline', en: 'Cleaning', te: 'క్లీనింగ్', hi: 'सफ़ाई' },
  { value: 'STORE_HELPER', emoji: '📦', icon: 'cube-outline', en: 'Helper / Loading', te: 'హెల్పర్ / లోడింగ్', hi: 'हेल्पर / लोडिंग' },
  { value: 'SECURITY', emoji: '💂', icon: 'shield-checkmark-outline', en: 'Security', te: 'సెక్యూరిటీ', hi: 'सुरक्षा' },
  { value: 'OTHER', emoji: '🏗️', icon: 'construct-outline', en: 'Mestri / Building', te: 'మేస్త్రీ / కట్టడం', hi: 'मिस्त्री / निर्माण' },
]

/**
 * Every kind of work someone can say they do, for the "What work can you do?"
 * screen. Each one folds into one of the categories above, because that is
 * what jobs are posted under and what matching compares.
 */
export const JOB_ROLES = [
  { id: 'shop', category: 'CASHIER', emoji: '🛒', en: 'Supermarket / Shop', te: 'సూపర్ మార్కెట్ / షాప్', hi: 'सुपरमार्केट / दुकान' },
  { id: 'cashier', category: 'CASHIER', emoji: '🧾', en: 'Cashier / Billing', te: 'క్యాషియర్ / బిల్లింగ్', hi: 'कैशियर / बिलिंग' },
  { id: 'sales', category: 'CASHIER', emoji: '🛍️', en: 'Sales / Counter', te: 'సేల్స్ / కౌంటర్', hi: 'सेल्स / काउंटर' },
  { id: 'pharmacy', category: 'CASHIER', emoji: '💊', en: 'Medical shop', te: 'మెడికల్ షాప్', hi: 'मेडिकल दुकान' },
  { id: 'mobile', category: 'CASHIER', emoji: '📱', en: 'Mobile shop', te: 'మొబైల్ షాప్', hi: 'मोबाइल दुकान' },
  { id: 'cook', category: 'KITCHEN_STAFF', emoji: '🍳', en: 'Cook / Kitchen', te: 'వంట / కిచెన్', hi: 'रसोइया / किचन' },
  { id: 'tea', category: 'KITCHEN_STAFF', emoji: '☕', en: 'Tea / Coffee master', te: 'టీ / కాఫీ మాస్టర్', hi: 'चाय / कॉफ़ी मास्टर' },
  { id: 'chinese', category: 'KITCHEN_STAFF', emoji: '🍜', en: 'Chinese / Tandoor cook', te: 'చైనీస్ / తందూర్ వంట', hi: 'चाइनीज़ / तंदूर रसोइया' },
  { id: 'bakery', category: 'KITCHEN_STAFF', emoji: '🥐', en: 'Bakery / Sweets', te: 'బేకరీ / స్వీట్స్', hi: 'बेकरी / मिठाई' },
  { id: 'kitchenHelper', category: 'KITCHEN_STAFF', emoji: '🥘', en: 'Kitchen helper', te: 'కిచెన్ హెల్పర్', hi: 'किचन हेल्पर' },
  { id: 'serving', category: 'SERVICE_STAFF', emoji: '🍽️', en: 'Hotel / Serving', te: 'హోటల్ / సర్వింగ్', hi: 'होटल / सर्विंग' },
  { id: 'reception', category: 'SERVICE_STAFF', emoji: '🛎️', en: 'Receptionist', te: 'రిసెప్షనిస్ట్', hi: 'रिसेप्शनिस्ट' },
  { id: 'catering', category: 'SERVICE_STAFF', emoji: '🎉', en: 'Catering / Events', te: 'క్యాటరింగ్ / ఈవెంట్స్', hi: 'कैटरिंग / इवेंट' },
  { id: 'delivery', category: 'DELIVERY_PARTNER', emoji: '🛵', en: 'Delivery', te: 'డెలివరీ', hi: 'डिलीवरी' },
  { id: 'foodDelivery', category: 'DELIVERY_PARTNER', emoji: '🍕', en: 'Food delivery', te: 'ఫుడ్ డెలివరీ', hi: 'फ़ूड डिलीवरी' },
  { id: 'courier', category: 'DELIVERY_PARTNER', emoji: '📮', en: 'Courier', te: 'కొరియర్', hi: 'कूरियर' },
  { id: 'driver', category: 'DRIVER', emoji: '🚗', en: 'Car driver', te: 'కార్ డ్రైవర్', hi: 'कार ड्राइवर' },
  { id: 'auto', category: 'DRIVER', emoji: '🛺', en: 'Auto driver', te: 'ఆటో డ్రైవర్', hi: 'ऑटो ड्राइवर' },
  { id: 'truck', category: 'DRIVER', emoji: '🚚', en: 'Truck / Tempo driver', te: 'లారీ / టెంపో డ్రైవర్', hi: 'ट्रक / टेम्पो ड्राइवर' },
  { id: 'bus', category: 'DRIVER', emoji: '🚌', en: 'Bus driver', te: 'బస్ డ్రైవర్', hi: 'बस ड्राइवर' },
  { id: 'cleaning', category: 'CLEANING_STAFF', emoji: '🧹', en: 'Cleaning', te: 'క్లీనింగ్', hi: 'सफ़ाई' },
  { id: 'housekeeping', category: 'CLEANING_STAFF', emoji: '🛏️', en: 'Housekeeping', te: 'హౌస్ కీపింగ్', hi: 'हाउसकीपिंग' },
  { id: 'laundry', category: 'CLEANING_STAFF', emoji: '🧺', en: 'Laundry / Ironing', te: 'లాండ్రీ / ఇస్త్రీ', hi: 'लॉन्ड्री / इस्त्री' },
  { id: 'carWash', category: 'CLEANING_STAFF', emoji: '🧽', en: 'Car / Bike wash', te: 'కార్ / బైక్ వాష్', hi: 'कार / बाइक धुलाई' },
  { id: 'helper', category: 'STORE_HELPER', emoji: '📦', en: 'Helper / Loading', te: 'హెల్పర్ / లోడింగ్', hi: 'हेल्पर / लोडिंग' },
  { id: 'warehouse', category: 'STORE_HELPER', emoji: '🏭', en: 'Warehouse / Packing', te: 'గోడౌన్ / ప్యాకింగ్', hi: 'गोदाम / पैकिंग' },
  { id: 'officeBoy', category: 'STORE_HELPER', emoji: '🗂️', en: 'Office boy / Peon', te: 'ఆఫీస్ బాయ్ / ప్యూన్', hi: 'ऑफ़िस बॉय / चपरासी' },
  { id: 'security', category: 'SECURITY', emoji: '💂', en: 'Security guard', te: 'సెక్యూరిటీ గార్డ్', hi: 'सिक्योरिटी गार्ड' },
  { id: 'watchman', category: 'SECURITY', emoji: '🔦', en: 'Watchman', te: 'వాచ్‌మెన్', hi: 'चौकीदार' },
  { id: 'building', category: 'OTHER', emoji: '🏗️', en: 'Mestri / Building', te: 'మేస్త్రీ / కట్టడం', hi: 'मिस्त्री / निर्माण' },
  { id: 'electrician', category: 'OTHER', emoji: '💡', en: 'Electrician', te: 'ఎలక్ట్రీషియన్', hi: 'इलेक्ट्रीशियन' },
  { id: 'plumber', category: 'OTHER', emoji: '🚰', en: 'Plumber', te: 'ప్లంబర్', hi: 'प्लंबर' },
  { id: 'carpenter', category: 'OTHER', emoji: '🪚', en: 'Carpenter', te: 'వడ్రంగి', hi: 'बढ़ई' },
  { id: 'painter', category: 'OTHER', emoji: '🎨', en: 'Painter', te: 'పెయింటర్', hi: 'पेंटर' },
  { id: 'welder', category: 'OTHER', emoji: '🔥', en: 'Welder', te: 'వెల్డర్', hi: 'वेल्डर' },
  { id: 'mechanic', category: 'OTHER', emoji: '🔧', en: 'Mechanic', te: 'మెకానిక్', hi: 'मैकेनिक' },
  { id: 'acRepair', category: 'OTHER', emoji: '❄️', en: 'AC / Fridge repair', te: 'ఏసీ / ఫ్రిజ్ రిపేర్', hi: 'एसी / फ़्रिज रिपेयर' },
  { id: 'tailor', category: 'OTHER', emoji: '🧵', en: 'Tailor', te: 'టైలర్', hi: 'दर्ज़ी' },
  { id: 'beautician', category: 'OTHER', emoji: '💇', en: 'Beautician / Salon', te: 'బ్యూటీషియన్ / సెలూన్', hi: 'ब्यूटीशियन / सैलून' },
  { id: 'barber', category: 'OTHER', emoji: '💈', en: 'Barber', te: 'క్షురకుడు', hi: 'नाई' },
  { id: 'gardener', category: 'OTHER', emoji: '🌱', en: 'Gardener', te: 'తోటమాలి', hi: 'माली' },
  { id: 'nanny', category: 'OTHER', emoji: '🍼', en: 'Babysitter / Nanny', te: 'ఆయా / బేబీ సిట్టర్', hi: 'आया / बेबीसिटर' },
  { id: 'elderCare', category: 'OTHER', emoji: '🧓', en: 'Elder care', te: 'వృద్ధుల సంరక్షణ', hi: 'बुज़ुर्गों की देखभाल' },
  { id: 'dataEntry', category: 'OTHER', emoji: '💻', en: 'Data entry / Computer', te: 'డేటా ఎంట్రీ / కంప్యూటర్', hi: 'डेटा एंट्री / कंप्यूटर' },
  { id: 'factory', category: 'OTHER', emoji: '⚙️', en: 'Factory worker', te: 'ఫ్యాక్టరీ పని', hi: 'फ़ैक्टरी मज़दूर' },
  { id: 'farm', category: 'OTHER', emoji: '🌾', en: 'Farm work', te: 'వ్యవసాయ పని', hi: 'खेती का काम' },
]

/** What the matcher reads as each category when it sees a worker's title. */
export const CATEGORY_TITLE = {
  CASHIER: 'Cashier',
  KITCHEN_STAFF: 'Kitchen Staff',
  SERVICE_STAFF: 'Service Staff',
  DELIVERY_PARTNER: 'Delivery Partner',
  DRIVER: 'Driver',
  CLEANING_STAFF: 'Cleaning Staff',
  STORE_HELPER: 'Store Helper',
  SECURITY: 'Security',
}

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
