/**
 * Every string and list rendered by the public marketing site lives here.
 * Two reasons: copy changes never require touching a component, and adding a
 * language later means translating one file instead of fifteen pages.
 */

export const SITE = {
  name: 'JobOn',
  tagline: 'Local Jobs · Local Workers · Growing Together',
  promise: 'Employment infrastructure for local work.',
  email: 'support@skillbridge.com',
  phone: '+91 98765 43210',
  office: 'Tirupati, Andhra Pradesh, India',
  hours: 'Mon – Sat, 9:00 AM – 6:00 PM',
}

/**
 * Placeholder launch figures taken from the approved design.
 * Replace with real platform numbers before going live.
 */
export const STATS = [
  { num: '10K+', lbl: 'Workers' },
  { num: '2K+', lbl: 'Businesses' },
  { num: '50+', lbl: 'Job Categories' },
  { num: '25+', lbl: 'Cities' },
]

export const CATEGORIES = [
  { id: 'retail', name: 'Retail & Supermarket', icon: 'store', tone: 'rose', roles: 'Cashier, store helper, stock assistant' },
  { id: 'restaurant', name: 'Restaurant & Cafe', icon: 'cup', tone: 'orange', roles: 'Waiter, cook, kitchen helper' },
  { id: 'medical', name: 'Medical & Pharmacy', icon: 'cross', tone: 'sky', roles: 'Pharmacy assistant, front desk' },
  { id: 'delivery', name: 'Delivery & Logistics', icon: 'truck', tone: 'violet', roles: 'Delivery partner, loader' },
  { id: 'warehouse', name: 'Warehouse & Helper', icon: 'box', tone: 'slate', roles: 'Packer, picker, general helper' },
  { id: 'cleaning', name: 'Cleaning & Housekeeping', icon: 'broom', tone: 'green', roles: 'Cleaner, housekeeping staff' },
  { id: 'salon', name: 'Salon & Beauty', icon: 'scissors', tone: 'pink', roles: 'Beautician, salon assistant' },
  { id: 'security', name: 'Security', icon: 'shield', tone: 'sky', roles: 'Security guard, gatekeeper' },
  { id: 'driver', name: 'Driver', icon: 'car', tone: 'amber', roles: 'Car, auto and van drivers' },
  { id: 'construction', name: 'Construction', icon: 'hammer', tone: 'orange', roles: 'Mason, carpenter, painter' },
  { id: 'mechanic', name: 'Mechanic & Repair', icon: 'wrench', tone: 'slate', roles: 'Two-wheeler and auto repair' },
  { id: 'other', name: 'Other Services', icon: 'grid', tone: 'teal', roles: 'Office, tailoring, farm work' },
]

export const MORE_CATEGORIES = [
  { id: 'office', name: 'Office & Admin', icon: 'briefcase', tone: 'violet', roles: 'Data entry, receptionist, back office' },
  { id: 'bakery', name: 'Bakery & Sweets', icon: 'cup', tone: 'amber', roles: 'Baker, counter staff, packing' },
  { id: 'tailoring', name: 'Tailoring & Textile', icon: 'scissors', tone: 'pink', roles: 'Tailor, cutting master, helper' },
  { id: 'agriculture', name: 'Farm & Agriculture', icon: 'grid', tone: 'lime', roles: 'Farm hand, nursery, dairy' },
  { id: 'electrical', name: 'Electrical & Plumbing', icon: 'wrench', tone: 'sky', roles: 'Electrician, plumber, technician' },
  { id: 'events', name: 'Events & Catering', icon: 'sparkles', tone: 'rose', roles: 'Event helper, server, setup crew' },
  { id: 'petrol', name: 'Petrol & Service Station', icon: 'car', tone: 'slate', roles: 'Attendant, cashier, cleaner' },
  { id: 'care', name: 'Care & Support', icon: 'heart', tone: 'green', roles: 'Attendant, caretaker, home support' },
]

export const STEPS = {
  worker: [
    { icon: 'user', title: 'Create Profile', text: 'Sign up with your mobile number and add your skills, area and availability.' },
    { icon: 'search', title: 'Find Jobs', text: 'Get matched with local opportunities within the distance you choose.' },
    { icon: 'chat', title: 'Apply & Talk', text: 'Apply in one tap, then talk to the employer and agree when to start.' },
    { icon: 'wallet', title: 'Work & Earn', text: 'Complete the work, mark attendance and receive payment through JobOn.' },
  ],
  employer: [
    { icon: 'briefcase', title: 'Post a Requirement', text: 'Pick a category, set the wage and duration, and publish in under two minutes.' },
    { icon: 'users', title: 'Get Matched Workers', text: 'We rank nearby verified workers by skills, distance, availability and history.' },
    { icon: 'calendar', title: 'Shortlist & Talk', text: 'Shortlist, ring them, or ask them to come to the shop.' },
    { icon: 'checkCircle', title: 'Hire & Pay Safely', text: 'Track attendance and release payment through the platform once work is done.' },
  ],
}

export const WORKER_BENEFITS = [
  { title: 'Jobs near your home', text: 'Choose a working radius of 1, 3, 5 or 10 km and only see work you can actually reach.' },
  { title: 'Daily, weekly or permanent', text: 'Take a single shift, a few days, or a full-time role — your choice, every time.' },
  { title: 'Verified employers', text: 'Every business is checked before it can post, so you know who you are working for.' },
  { title: 'Payment through the platform', text: 'Wages are released through JobOn after your work is confirmed. No chasing.' },
  { title: 'Your work history, saved', text: 'Every completed job builds a record you can show the next employer.' },
  { title: 'In your language', text: 'Use JobOn in the language you are most comfortable with.' },
]

export const EMPLOYER_BENEFITS = [
  { title: 'Local talent, fast', text: 'Reach workers in your neighbourhood instead of sorting through irrelevant applications.' },
  { title: 'Verified profiles & documents', text: 'See identity and document checks before you invite anyone to your shop.' },
  { title: 'Talk to the people who applied', text: 'Message or ring them, or ask them to come to the shop — all in one place.' },
  { title: 'Manage attendance & payments', text: 'Track who turned up, approve the work and release wages from one screen.' },
  { title: 'Hire for a day or for good', text: 'Post one shift or a permanent vacancy — the same workflow handles both.' },
  { title: 'Build a trusted workforce', text: 'Rehire the people who worked well for you, with their full history attached.' },
]

export const HIGHLIGHTS = [
  { icon: 'clock', tone: '', title: 'Flexible Work', text: 'Daily, weekly, monthly and permanent roles' },
  { icon: 'grid', tone: 'violet', title: 'Multiple Categories', text: '50+ local job types across the city' },
  { icon: 'lock', tone: 'green', title: 'Secure Payments', text: 'Wages released through JobOn' },
]

export const TESTIMONIALS = [
  { quote: 'I got a job near my home within 2 days. JobOn is really helpful.', name: 'Ramesh', role: 'Store Helper', rating: 5 },
  { quote: 'I found a part-time job near my home. The process was very simple and secure. I got paid on time.', name: 'Suresh', role: 'Delivery Partner', rating: 5 },
  { quote: 'We hired 5 staff members for our restaurant within a week. Very easy to use.', name: 'Priya', role: 'Restaurant Owner', rating: 5 },
  { quote: 'Earlier I waited at the labour chowk every morning. Now the work comes to my phone.', name: 'Lakshmi', role: 'Housekeeping Staff', rating: 5 },
  { quote: 'The verified profiles saved us time. We knew who was coming before they arrived.', name: 'Arun', role: 'Supermarket Manager', rating: 4 },
  { quote: 'My work history is all in one place now. The next shop hired me without asking for papers.', name: 'Venkat', role: 'Warehouse Helper', rating: 5 },
]

export const PRICING = [
  {
    audience: 'For Workers',
    icon: 'user',
    price: 'Free',
    note: 'Always free for workers. No fee to apply, ever.',
    cta: 'Get Started',
    to: '/register',
    features: [
      'Create a verified profile',
      'Apply to unlimited jobs',
      'Chat with employers',
      'Track your earnings',
      'Build a portable work history',
      'Get rated and rehired',
    ],
  },
  {
    audience: 'For Employers',
    icon: 'briefcase',
    price: 'Start Free',
    note: 'Post your first jobs free. Paid plans as your hiring grows.',
    cta: 'Create Account',
    to: '/register',
    featured: true,
    features: [
      'Post jobs in 50+ categories',
      'Get ranked, matched workers',
      'Talk to candidates',
      'Manage attendance',
      'Make secure payments',
      'Access hiring reports',
    ],
  },
]

export const SAFETY = [
  {
    icon: 'shield',
    tone: 'green',
    title: 'Identity Verification',
    text: 'Workers and employers verify their mobile number and identity before they can transact on JobOn.',
  },
  {
    icon: 'doc',
    tone: 'sky',
    title: 'Document Check',
    text: 'Aadhaar, GST and role-specific documents such as driving licences are checked where they apply.',
  },
  {
    icon: 'lock',
    tone: 'amber',
    title: 'Secure Payments',
    text: 'Wages move through JobOn and are released once work and attendance are confirmed.',
  },
]

export const SAFETY_PRACTICES = [
  { title: 'Verified before visible', text: 'A business must complete verification before its jobs reach workers.' },
  { title: 'Two-way ratings', text: 'Workers rate employers on pay and conditions, not just the other way round.' },
  { title: 'Wage protection', text: 'Money is confirmed before work begins, so a completed shift always has a payment behind it.' },
  { title: 'Grievance redressal', text: 'A named team reviews disputes over pay, hours or conduct within defined timelines.' },
  { title: 'Data minimisation', text: 'We collect only what a job legally requires, and handle identity documents to UIDAI norms.' },
  { title: 'Report and block', text: 'Either side can report a listing, a message or a user from anywhere in the app.' },
]

export const APP_FEATURES = [
  'Job alerts in real time',
  'Chat on the go',
  'Check attendance',
  'Track earnings & payments',
]

export const VALUES = [
  { icon: 'target', title: 'Our Mission', text: 'Enable local employment opportunities for everyone, in every neighbourhood.' },
  { icon: 'eye', title: 'Our Vision', text: 'A world where local work creates better, more secure lives.' },
  { icon: 'heart', title: 'Our Values', text: 'Trust, inclusion, simplicity and measurable impact in every decision.' },
]

export const ABOUT_STORY = [
  'JobOn was created with a simple belief — everyone deserves access to good work, and every business deserves access to reliable talent.',
  'Most hiring platforms were built for corporate careers. The people who run our supermarkets, kitchens, pharmacies, warehouses and salons were left with notice boards, word of mouth and the labour chowk. Good work went unfilled and good workers went unseen.',
  'We started JobOn to close that gap. Not just to list jobs, but to carry the whole employment relationship: finding the right person nearby, verifying both sides, making the call, recording attendance, releasing the wage, and turning all of it into a work history the worker owns and can carry to the next job.',
]

export const ABOUT_FACTS = [
  { num: '2026', lbl: 'Founded' },
  { num: 'Tirupati', lbl: 'Headquarters' },
  { num: '7', lbl: 'Languages planned' },
  { num: '50+', lbl: 'Job categories' },
]

export const PERKS = [
  { icon: 'heart', title: 'Meaningful work', text: 'What you build changes how people find their next job and their next wage.' },
  { icon: 'trending', title: 'Impact at scale', text: 'India’s local workforce is enormous and barely served by software.' },
  { icon: 'sparkles', title: 'Learn and grow', text: 'Small team, real ownership, and problems that have no textbook answer.' },
  { icon: 'users', title: 'Flexible culture', text: 'Outcomes over hours, with the trust and tools to do your best work.' },
]

export const OPEN_ROLES = [
  { title: 'Senior Backend Engineer', team: 'Engineering', location: 'Tirupati / Remote', type: 'Full time' },
  { title: 'Android Engineer', team: 'Engineering', location: 'Tirupati / Remote', type: 'Full time' },
  { title: 'Product Designer', team: 'Design', location: 'Remote (India)', type: 'Full time' },
  { title: 'City Operations Manager', team: 'Operations', location: 'Tirupati', type: 'Full time' },
  { title: 'Trust & Verification Associate', team: 'Operations', location: 'Tirupati', type: 'Full time' },
  { title: 'Regional Language Content Lead', team: 'Marketing', location: 'Hybrid — Hyderabad', type: 'Contract' },
]

export const BLOG_FILTERS = ['All', 'For Workers', 'For Employers', 'Career Tips', 'Success Stories']

export const POSTS = [
  {
    id: 'get-hired-faster',
    tag: 'For Workers',
    title: '5 Tips to Get Hired Faster',
    date: 'April 10, 2026',
    excerpt: 'Small changes to your profile that make employers call you first.',
    tone: '#2563eb',
    icon: 'trending',
  },
  {
    id: 'reliable-employee',
    tag: 'Career Tips',
    title: 'How to Be a Reliable Employee',
    date: 'April 5, 2026',
    excerpt: 'Attendance, punctuality and the habits that turn a shift into a steady job.',
    tone: '#0f766e',
    icon: 'checkCircle',
  },
  {
    id: 'hiring-small-business',
    tag: 'For Employers',
    title: 'Hiring for Your Small Business',
    date: 'March 28, 2026',
    excerpt: 'How to write a local job post that brings the right people to your door.',
    tone: '#b45309',
    icon: 'store',
  },
  {
    id: 'daily-wage-rights',
    tag: 'For Workers',
    title: 'Know Your Wages: A Plain Guide',
    date: 'March 19, 2026',
    excerpt: 'What you should be paid, when, and what to do when a wage is delayed.',
    tone: '#6d28d9',
    icon: 'rupee',
  },
  {
    id: 'festival-staffing',
    tag: 'For Employers',
    title: 'Staffing Up for Festival Season',
    date: 'March 8, 2026',
    excerpt: 'Plan temporary hiring so a busy week does not turn into a short-staffed one.',
    tone: '#be123c',
    icon: 'sparkles',
  },
  {
    id: 'from-shift-to-career',
    tag: 'Success Stories',
    title: 'From One Shift to a Full-Time Role',
    date: 'February 26, 2026',
    excerpt: 'How Venkat turned a weekend warehouse shift into a permanent job.',
    tone: '#047857',
    icon: 'star',
  },
]

/** Article bodies, keyed by post id. Kept separate so the card list stays light. */
export const POST_BODIES = {
  'get-hired-faster': [
    'Employers on JobOn do not read résumés. They look at a card that shows your skills, how far away you are, when you are free and what you have completed before. Getting hired faster is mostly about making that card easy to say yes to.',
    'Pick your skills from the list rather than typing your own words. When an employer searches for a “store helper”, the system matches the shared term — a profile that says “shop work” will not surface.',
    'Set your location pin accurately and choose an honest radius. A worker who says they will travel 10 km and then declines jobs 8 km away gets fewer invitations over time than one who sets 3 km and accepts.',
    'Keep your availability current. “Immediate” tells employers hiring for tomorrow that you are worth calling; leaving it stale after you have taken a full-time role wastes everyone’s time.',
    'Finally, finish what you start. Attendance is the single strongest signal on the platform. Five completed shifts will get you more offers than any description you could write.',
  ],
  'reliable-employee': [
    'In local work, reliability beats experience more often than people expect. A shop owner who has been let down twice this month is looking for someone who turns up, not someone with a longer list of past jobs.',
    'Arrive ten minutes early for the first shift. You will need to find the entrance, meet whoever is in charge and mark your attendance without eating into working time.',
    'If you cannot make it, say so as early as you can, in the app. A message at 6 AM lets the employer find cover. Silence is what ends a working relationship, not the absence itself.',
    'Ask what “done” looks like at the start of the shift. Most disputes we see are not about effort — they are about two people having different pictures of the job.',
    'Every shift you complete cleanly is recorded and visible to the next employer. Reliability compounds here in a way it never did on a notice board.',
  ],
  'hiring-small-business': [
    'A good local job post answers four questions in the first glance: what the work is, when it is, what it pays and how far away it is. Everything else can wait for the chat.',
    'Be specific about the role. “Helper” could mean stocking shelves or carrying sacks; the person who accepts the first and arrives to the second will not come back.',
    'State the wage plainly and pick the right unit — per day for a shift, per month for a permanent role. Posts with a clear wage get substantially more qualified applicants than posts asking candidates to negotiate.',
    'Say whether experience is genuinely required. Marking a job “experience optional” when it is widens your shortlist considerably, and for many roles the reliability record matters more than the years.',
    'If you need someone tomorrow, mark the job urgent and keep the requirements tight. The fewer must-haves, the faster the platform can find someone nearby who is actually free.',
  ],
  'daily-wage-rights': [
    'Knowing what you are owed is the first step to being paid it. This is a plain-language guide, not legal advice — but it covers what most daily-wage workers should expect.',
    'Agree the wage before the work. On JobOn the wage is fixed in the job post and cannot be changed after you are confirmed, which removes the most common source of dispute.',
    'Understand the unit. A ₹700 daily wage for a ten-hour shift is not the same as ₹700 for a six-hour one. The hours are in the post — read them before you accept.',
    'Payment should follow completed work, not a promise. The platform holds the employer’s funds from the moment you are confirmed, so the money exists before your first hour.',
    'If a payment is delayed, raise it in the app rather than in person. There is a record of your attendance and the agreed amount, and our team can see both.',
  ],
  'festival-staffing': [
    'Festival weeks are when local businesses make their margin and when staffing goes wrong most often. Planning two weeks ahead changes the outcome more than paying a premium on the day.',
    'Post early. The same workers are being approached by every shop on your street, and the ones with good records are confirmed first.',
    'Hire in blocks rather than day by day. A worker offered five days will prioritise you over a shop offering one, and you will not repeat the briefing five times.',
    'Over-hire slightly for the first day. Some no-shows are inevitable; a spare helper on day one costs less than a queue nobody is serving.',
    'Rate everyone afterwards. Next festival, you can go straight back to the people who worked well — and they will remember that you paid on time.',
  ],
  'from-shift-to-career': [
    'Venkat took a single Saturday shift at a city warehouse because it was 3 km from home and paid ₹750 for the day. He had no résumé and no references.',
    'What he had, after that first shift, was a record: attendance marked, wage released, a rating from the employer. He took four more over the following month.',
    'By the fifth, the warehouse manager was not looking at a stranger. He was looking at a worker with a 100% attendance rate and a consistent rating across five shifts.',
    'When a permanent helper role opened two months later, they never advertised it. They offered it to Venkat.',
    'This is what the work history is for. Not a document you write about yourself, but a record of what actually happened — one that the next employer can trust.',
  ],
}

export const HELP_TOPICS = [
  { icon: 'user', tone: 'sky', title: 'For Workers', text: 'Account, applications, payments and more.' },
  { icon: 'briefcase', tone: 'violet', title: 'For Employers', text: 'Posting jobs, hiring, payments and more.' },
  { icon: 'shield', tone: 'green', title: 'Safety & Security', text: 'Verification, privacy and policies.' },
  { icon: 'chat', tone: 'amber', title: 'Contact Support', text: 'Chat or email us for assistance.' },
]

export const FAQS = [
  {
    q: 'Is JobOn free for workers?',
    a: 'Yes. Creating a profile, applying to jobs, chatting with employers and receiving payments are free for workers. We never charge a worker a placement fee.',
  },
  {
    q: 'How do I get paid?',
    a: 'The employer funds the job through JobOn before the work begins. Once your attendance and work completion are confirmed, the wage is released to you and appears in your Earnings tab with a receipt.',
  },
  {
    q: 'How far away are the jobs shown to me?',
    a: 'You choose your working radius — 1 km, 3 km, 5 km, 10 km or anywhere in the city. Every job card shows how far it is from your saved location.',
  },
  {
    q: 'What documents do I need to sign up?',
    a: 'A mobile number is enough to create a profile and browse. Identity verification is needed before you can be hired, and some roles need extra documents — a driving licence for delivery work, for example.',
  },
  {
    q: 'How does an employer verify a worker?',
    a: 'Every profile shows what JobOn has actually checked: mobile number, identity, documents and completed work history. Employers see verification badges, ratings and attendance record before inviting anyone.',
  },
  {
    q: 'Can I hire someone for just one day?',
    a: 'Yes. You can post a single shift, a few days, a week, a month or a permanent role. Short assignments use a faster flow — match, confirm, work, pay — without any interview round at all.',
  },
  {
    q: 'What if a worker does not turn up, or an employer does not pay?',
    a: 'Report it from the job screen. Because payment is confirmed up front and attendance is recorded, our operations team can see what happened and resolve it. Repeated failures affect that account’s rating and access.',
  },
  {
    q: 'Which languages does JobOn support?',
    a: 'The app is being built multilingual from the start. English is live today, with Telugu, Hindi, Kannada, Tamil, Malayalam and Marathi rolling out as we expand city by city.',
  },
]

export const CONTACT_SUBJECTS = [
  'General enquiry',
  'I need help finding work',
  'I want to hire workers',
  'Payment or wage issue',
  'Report a safety concern',
  'Partnership or press',
]

/**
 * Plain-language policy drafts. These are written to be understandable by the
 * people who use JobOn — they still need review by counsel before launch,
 * which is why every page carries the draft notice.
 */
export const LEGAL_DOCS = [
  {
    id: 'terms',
    title: 'Terms of Service',
    summary: 'The rules for using JobOn as a worker or an employer.',
    updated: 'April 1, 2026',
    sections: [
      { h: 'Who can use JobOn', p: 'You must be of legal working age in your state and able to enter a binding agreement. Employers must represent a real, operating business and give accurate details about it.' },
      { h: 'What JobOn does', p: 'We connect local businesses with local workers and support the employment relationship — matching, calls and visits, verification, attendance and payment records. The employment contract itself is between the worker and the employer.' },
      { h: 'Your account', p: 'Keep your login details private and your profile truthful. You are responsible for activity on your account. Misrepresenting identity, skills or business details can lead to suspension.' },
      { h: 'Acceptable use', p: 'Do not post illegal work, discriminatory requirements, jobs for minors, or requirements that demand payment from a worker. Do not harass other users or take conversations off-platform to avoid wage protection.' },
      { h: 'Fees', p: 'JobOn is free for workers. Employers may be charged for posting, hiring or premium features; any fee is shown before you confirm.' },
      { h: 'Ending your use', p: 'You can close your account at any time. We may suspend accounts that break these terms or put other users at risk, and will tell you why where we lawfully can.' },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    summary: 'What we collect, why we collect it, and the choices you have.',
    updated: 'April 1, 2026',
    sections: [
      { h: 'What we collect', p: 'Account details such as your name, mobile number and language; profile details such as skills, experience, availability and working area; and platform activity such as applications, attendance and payment records.' },
      { h: 'Location', p: 'We use your saved location to show jobs near you and to calculate distance. You control the precision, and exact addresses are shared only once a hire is confirmed.' },
      { h: 'Identity documents', p: 'Identity documents are collected only where a job or the law requires them, are used solely for verification, and are handled according to applicable UIDAI and data-protection requirements. We do not display document numbers to other users.' },
      { h: 'What we never share', p: 'We do not sell personal data. Your past wages are private and are not disclosed to a future employer unless you choose to share them.' },
      { h: 'Your rights', p: 'You can access, correct, export or delete your data from your profile, or by writing to us. Some employment and payment records are retained where the law requires.' },
    ],
  },
  {
    id: 'refund',
    title: 'Refund & Cancellation Policy',
    summary: 'What happens when a job or a payment is cancelled.',
    updated: 'April 1, 2026',
    sections: [
      { h: 'Cancelling a job post', p: 'An employer can cancel a job before a worker is confirmed at no cost. Any amount held for that job is returned to the employer wallet.' },
      { h: 'Cancelling after confirmation', p: 'If an employer cancels a confirmed assignment at short notice, a portion of the agreed wage may be released to the worker to recognise the lost day, as shown at the time of cancellation.' },
      { h: 'If a worker does not attend', p: 'Where attendance is not recorded and the work was not performed, held funds return to the employer. Repeated no-shows affect a worker’s reliability score.' },
      { h: 'Disputed work', p: 'If either side disputes whether work was completed, funds stay held until our operations team reviews attendance records and both accounts.' },
      { h: 'How long refunds take', p: 'Wallet refunds are immediate. Transfers back to a bank or UPI account follow your provider’s timelines, typically 3–7 working days.' },
    ],
  },
  {
    id: 'payments',
    title: 'Payment Terms',
    summary: 'How money moves between employers, JobOn and workers.',
    updated: 'April 1, 2026',
    sections: [
      { h: 'Funding a job', p: 'An employer funds the agreed wage before work begins. The amount is held against that assignment and cannot be spent elsewhere.' },
      { h: 'Releasing a wage', p: 'Wages are released once attendance and work completion are confirmed. For daily work this is per shift; for monthly roles it follows the payroll cycle with a payslip.' },
      { h: 'Withdrawals', p: 'Workers can withdraw their balance to a linked bank or UPI account. Withdrawal limits and processing times are shown at the time of the request.' },
      { h: 'Deductions', p: 'Any statutory deduction is itemised on the payslip. JobOn does not deduct a fee from a worker’s wage.' },
      { h: 'Records', p: 'Every fund, release, withdrawal and refund is recorded and visible to both sides, with a reference you can quote to support.' },
    ],
  },
  {
    id: 'community',
    title: 'Community Guidelines',
    summary: 'How we expect people to treat each other on JobOn.',
    updated: 'April 1, 2026',
    sections: [
      { h: 'Respect', p: 'Communicate professionally. Harassment, threats, casteist, communal or sexist remarks are removed and can end an account immediately.' },
      { h: 'Honesty', p: 'Describe the job as it really is — the hours, the wage, the work. A job that does not match its description can be reported by the worker.' },
      { h: 'Fair hiring', p: 'Selection must be based on skills, availability and reliability. Requirements based on caste, religion, gender or region are not permitted.' },
      { h: 'No off-platform pressure', p: 'Do not pressure anyone to move a confirmed job off JobOn. It removes the wage protection and record that both sides rely on.' },
      { h: 'Reporting', p: 'Use the report option on any job, message or profile. We review every report and tell the reporter what action was taken.' },
    ],
  },
  {
    id: 'cookies',
    title: 'Cookie Policy',
    summary: 'The small files we store in your browser and why.',
    updated: 'April 1, 2026',
    sections: [
      { h: 'Essential cookies', p: 'Keep you signed in, remember your chosen language and keep the site secure. These cannot be switched off without breaking the service.' },
      { h: 'Preference storage', p: 'Remembers choices such as your language and last-used filters so you do not set them again on every visit.' },
      { h: 'Analytics', p: 'Helps us understand which pages help people find work and where they get stuck. Collected in aggregate.' },
      { h: 'Your control', p: 'You can clear or block cookies in your browser settings. Blocking essential cookies will sign you out and may prevent applying to jobs.' },
    ],
  },
  {
    id: 'grievance',
    title: 'Grievance Redressal',
    summary: 'How to raise a complaint and what happens next.',
    updated: 'April 1, 2026',
    sections: [
      { h: 'How to raise a grievance', p: 'Write to ' + SITE.email + ' or use Contact Support in the app, with the job reference and what went wrong. Wage complaints are prioritised.' },
      { h: 'Acknowledgement', p: 'We acknowledge every grievance within 48 hours and give you a reference number to follow it.' },
      { h: 'Resolution', p: 'Most matters are resolved within 15 working days. Where a dispute needs records from both sides, we tell you what we are waiting on.' },
      { h: 'Grievance Officer', p: 'A named Grievance Officer is responsible for complaints under applicable Indian IT and consumer rules. Contact details are published here and in the app before launch.' },
      { h: 'If you are not satisfied', p: 'You can escalate to the appropriate consumer or labour authority. We will provide the records you need to do so.' },
    ],
  },
  {
    id: 'compliance',
    title: 'Compliance & Disclosures',
    summary: 'Our regulatory position and the commitments behind it.',
    updated: 'April 1, 2026',
    sections: [
      { h: 'Our role', p: 'JobOn operates an employment marketplace and supporting services. The employment relationship is between the worker and the employer; we provide matching, verification, records and payment facilitation.' },
      { h: 'Payments', p: 'Money movement is carried out through regulated payment partners. JobOn does not operate as a bank and does not hold deposits.' },
      { h: 'Worker classification', p: 'Employers are responsible for correctly classifying the people they hire and for meeting applicable wage, hours and workplace obligations.' },
      { h: 'Identity handling', p: 'Identity verification follows applicable UIDAI guidance. We do not store identity document images beyond the verification period.' },
      { h: 'Contact', p: 'Compliance queries can be sent to ' + SITE.email + ' marked for the attention of the Compliance team.' },
    ],
  },
]

export const FOOTER_NAV = [
  {
    h: 'Product',
    links: [
      { to: '/how-it-works', t: 'How It Works' },
      { to: '/for-workers', t: 'For Workers' },
      { to: '/for-employers', t: 'For Employers' },
      { to: '/categories', t: 'Job Categories' },
      { to: '/pricing', t: 'Pricing' },
      { to: '/app', t: 'Mobile App' },
    ],
  },
  {
    h: 'Company',
    links: [
      { to: '/about', t: 'About Us' },
      { to: '/careers', t: 'Careers' },
      { to: '/stories', t: 'Success Stories' },
      { to: '/blog', t: 'Blog' },
      { to: '/contact', t: 'Contact' },
    ],
  },
  {
    h: 'Support',
    links: [
      { to: '/help', t: 'Help Centre' },
      { to: '/safety', t: 'Safety & Verification' },
      { to: '/legal/privacy', t: 'Privacy Policy' },
      { to: '/legal/terms', t: 'Terms of Service' },
      { to: '/legal', t: 'All Policies' },
    ],
  },
]

export const NAV_LINKS = [
  { to: '/jobs', t: 'Find Jobs' },
  { to: '/workers', t: 'Find Workers' },
  { to: '/how-it-works', t: 'How It Works' },
  { to: '/for-employers', t: 'For Business' },
  { to: '/blog', t: 'Resources' },
]
