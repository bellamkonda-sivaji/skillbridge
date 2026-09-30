import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as common from './locales/common'
import * as flow from './locales/flow'

const resources = {
  en: {
    translation: {
      brand: 'JobOn',
      tagline: 'Local Jobs · Local Workers · Growing Together',
      nav: {
        jobs: 'Find Jobs',
        workers: 'Find Workers',
        dashboard: 'Dashboard',
        chat: 'Messages',
        admin: 'Admin',
        login: 'Log In',
        register: 'Sign Up',
        logout: 'Log Out'
      },
      auth: {
        loginTitle: 'Welcome back',
        registerTitle: 'Create your account',
        name: 'Full Name',
        email: 'Email',
        password: 'Password',
        phone: 'Phone',
        role: 'I am a',
        roleWorker: 'Worker looking for work',
        roleEmployer: 'Employer / Business owner',
        login: 'Log In',
        register: 'Create Account',
        or: 'or',
        haveAccount: 'Already have an account?',
        noAccount: 'New to JobOn?'
      },
      home: {
        heroTitle: 'Find the right worker. Or the right job.',
        heroSub: 'JobOn connects local businesses with skilled and unskilled workers in real time — powered by AI matching, verified profiles and instant chat.',
        ctaWorker: 'I need work',
        ctaEmployer: 'I need to hire',
        statsWorkers: 'Skilled workers',
        statsJobs: 'Jobs posted',
        statsMatches: 'AI matches made',
        featuresTitle: 'Everything you need to hire and get hired',
        f1: 'AI Smart Matching',
        f1d: 'Our engine scores compatibility by skills, distance, experience, availability, salary and ratings.',
        f2: 'Verified Profiles',
        f2d: 'Workers verify their identity and skills. Know who you are hiring.',
        f3: 'Real-time Chat',
        f3d: 'Negotiate, clarify and schedule interviews instantly with in-app messaging.',
        f4: 'GPS & Nearby Search',
        f4d: 'Find jobs and workers near you, sorted by real distance.',
        f5: 'Ratings & Reviews',
        f5d: 'Build reputation. Both sides review after work is done.',
        f6: 'Multi-language',
        f6d: 'Available in English, Kiswahili and Hindi.'
      },
      worker: {
        title: 'Worker Dashboard',
        profile: 'My Profile',
        matches: 'AI Job Matches',
        jobs: 'Browse Jobs',
        applications: 'My Applications',
        interviews: 'Interviews',
        skills: 'Skills',
        jobWorked: 'Job Worked',
        mySkills: 'My Skills',
        jobWorkedEmpty: 'No jobs worked yet — apply and get accepted to see your jobs here',
        noSkills: 'No skills selected. Pick from the catalog below.',
        skillCatalog: 'Skill Catalog',
        skillsHint: 'Choose your skills from the catalog. These power AI matching.',
        jobTitle: 'Job Title',
        experience: 'Years of Experience',
        bio: 'About Me',
        city: 'City',
        area: 'Neighborhood / Area',
        location: 'Set Location on Map',
        availability: 'Availability',
        expectedSalary: 'Expected Salary',
        salaryUnit: 'Per',
        verifyDoc: 'Verification Document (e.g. ID no / license)',
        save: 'Save Profile',
        profileHint: 'Complete your profile (skills + title + location) to unlock job applications and AI matches.',
        apply: 'Apply Now',
        applied: 'Applied',
        matchBars: 'Match Breakdown',
        skillMatch: 'Skills',
        distanceMatch: 'Distance',
        experienceMatch: 'Experience',
        availabilityMatch: 'Availability',
        salaryMatch: 'Salary',
        ratingMatch: 'Rating'
      },
      employer: {
        title: 'Employer Dashboard',
        profile: 'Business Profile',
        postJob: 'Post a Job',
        myJobs: 'My Jobs',
        applicants: 'Applications',
        findWorkers: 'Find Workers',
        interviews: 'Interviews',
        businessName: 'Business Name',
        businessType: 'Business Type',
        description: 'About the Business',
        website: 'Website',
        jobTitle: 'Job Title',
        jobDescription: 'Description',
        requiredSkills: 'Required Skills (comma separated)',
        workType: 'Work Type',
        salary: 'Salary',
        city: 'City',
        area: 'Area',
        workersNeeded: 'Workers Needed',
        urgent: 'Mark as urgent',
        post: 'Post Job',
        update: 'Update Job',
        close: 'Close Job',
        applicantsCount: 'applicants',
        noApplicants: 'No applicants yet',
        contact: 'Message',
        interview: 'Interview',
        accept: 'Accept',
        reject: 'Reject',
        schedule: 'Schedule Interview'
      },
      workType: { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly', PERMANENT: 'Permanent' },
      salaryUnit: { DAILY: 'per day', PER_WEEK: 'per week', MONTHLY: 'per month' },
      availability: {
        IMMEDIATE: 'Immediately', PART_TIME: 'Part-time', FULL_TIME: 'Full-time',
        WEEKENDS_ONLY: 'Weekends only', EVENINGS: 'Evenings'
      },
      jobStatus: { OPEN: 'Open', CLOSED: 'Closed', FILLED: 'Filled', CANCELLED: 'Cancelled' },
      appStatus: { PENDING: 'Pending', ACCEPTED: 'Accepted', REJECTED: 'Rejected', WITHDRAWN: 'Withdrawn' },
      verification: {
        UNVERIFIED: 'Unverified', PENDING: 'Verification pending', VERIFIED: 'Verified', REJECTED: 'Rejected'
      },
      common: {
        loading: 'Loading...',
        search: 'Search',
        filters: 'Filters',
        distance: 'Max distance (km)',
        rating: 'Min rating',
        verifiedOnly: 'Verified only',
        minExperience: 'Min experience (years)',
        all: 'All',
        apply: 'Apply',
        clear: 'Clear',
        cancel: 'Cancel',
        send: 'Send',
        back: 'Back',
        close: 'Close',
        save: 'Save',
        type: 'Type',
        status: 'Status',
        location: 'Location',
        salary: 'Salary',
        rating: 'Rating',
        kmAway: 'km away',
        view: 'View',
        reviews: 'Reviews',
        message: 'Message',
        invite: 'Invite to interview',
        confirm: 'Confirm',
        complete: 'Mark complete',
        unread: 'unread'
      },
      chat: { title: 'Messages', placeholder: 'Type a message...', noConversation: 'Select a conversation' },
      interview: {
        scheduledAt: 'Date & Time',
        mode: 'Mode',
        notes: 'Notes',
        location: 'Location',
        inviteTitle: 'Schedule an Interview',
        modeInPerson: 'In person', modeVideo: 'Video call', modePhone: 'Phone'
      },
      notifications: { title: 'Notifications', empty: 'No notifications yet', markAll: 'Mark all read' },
      admin: {
        title: 'Admin Dashboard',
        overview: 'Overview',
        users: 'Users',
        verifications: 'Verifications',
        jobs: 'All Jobs',
        totalUsers: 'Total Users',
        workers: 'Workers',
        employers: 'Employers',
        totalJobs: 'Total Jobs',
        openJobs: 'Open Jobs',
        applications: 'Applications',
        matches: 'Matches',
        pendingVerifications: 'Pending Verifications',
        interviews: 'Interviews',
        reviews: 'Reviews',
        newUsers: 'New users (7d)',
        newJobs: 'New jobs (7d)',
        jobsByType: 'Jobs by Work Type',
        topSkills: 'Top Required Skills',
        jobsByCity: 'Jobs by City',
        approve: 'Approve',
        reject: 'Reject',
        enable: 'Enable',
        disable: 'Disable',
        pending: 'Pending review',
        postedJobs: 'Posted Jobs',
        findWorkers: 'Find Workers',
        matchWorkers: 'Match Workers',
        interviewsScheduled: 'Interviews Scheduled',
        businessProfiles: 'Business Profiles',
        reviewsForWorkers: 'Reviews for Workers',
        reviewsOfEmployers: 'Reviews of Employers',
        payments: 'Payments / Wallet',
        postJob: 'Post a Job',
        postSkill: 'Post a Skill',
        noReviews: 'No reviews yet',
        wallets: 'User Wallets',
        skillName: 'Skill Name',
        skillCategory: 'Category',
        addSkill: 'Add Skill',
        skillCreated: 'Skill added to catalog'
      },
      wallet: {
        title: 'Wallet',
        balance: 'Balance',
        amount: 'Amount',
        fund: 'Fund',
        withdraw: 'Withdraw',
        fundTitle: 'Add funds to wallet',
        withdrawTitle: 'Withdraw to M-Pesa / bank',
        transactions: 'Transactions',
        reference: 'Reference',
        detail: 'Details',
        jobPayment: 'Job payment',
        paid: 'Paid',
        paymentPending: 'Payment pending — awaiting employer acceptance or funding',
        positive: 'Enter a positive amount',
        noTransactions: 'No transactions yet'
      },
      errors: {
        loginFailed: 'Invalid email or password',
        generic: 'Something went wrong'
      }
    }
  },
  sw: {
    translation: {
      brand: 'JobOn',
      tagline: 'Kazi za hapa · Wafanyakazi wa hapa · Tukue pamoja',
      nav: {
        jobs: 'Tafuta Kazi',
        workers: 'Tafuta Wafanyakazi',
        dashboard: 'Dashibodi',
        chat: 'Ujumbe',
        admin: 'Msimamizi',
        login: 'Ingia',
        register: 'Jisajili',
        logout: 'Toka'
      },
      auth: {
        loginTitle: 'Karibu tena',
        registerTitle: 'Unda akaunti yako',
        name: 'Jina Kamili',
        email: 'Barua pepe',
        password: 'Nenosiri',
        phone: 'Simu',
        role: 'Mimi ni',
        roleWorker: 'Mfanyakazi anayetafuta kazi',
        roleEmployer: 'Mwenye biashara',
        login: 'Ingia',
        register: 'Fungua Akaunti',
        or: 'au',
        haveAccount: 'Una akaunti tayari?',
        noAccount: 'Mpya kwenye JobOn?'
      },
      home: {
        heroTitle: 'Pata mfanyakazi sahihi. Au kazi sahihi.',
        heroSub: 'JobOn inaunganisha biashara za ndani na wafanyakazi wenye ujuzi kwa wakati halisi — ikiendeshwa na upatanishi wa AI, wasifu uliothibitishwa na mazungumzo ya haraka.',
        ctaWorker: 'Nahitaji kazi',
        ctaEmployer: 'Nahitaji kuajiri',
        featuresTitle: 'Kila unachohitaji kuajiri na kuajiriwa',
        f1: 'Upatanishi wa AI',
        f1d: 'Injini yetu inakagua ujuzi, umbali, uzoefu, upatikanaji, mshahara na makadirio.',
        f2: 'Wasifu Uliothibitishwa',
        f2d: 'Wafanyakazi huthibitisha utambulisho na ujuzi wao.',
        f3: 'Mazungumzo ya Wakati Halisi',
        f3d: 'Jadiliana na panga mahojiano kupitia ujumbe wa ndani.',
        f4: 'GPS na Utafutaji wa Karibu',
        f4d: 'Tafuta kazi na wafanyakazi karibu nawe.',
        f5: 'Makadirio na Maoni',
        f5d: 'Jenga sifa. Wote wawili hutathmini baada ya kazi.',
        f6: 'Lugha Nyingi',
        f6d: 'Inapatikana kwa Kiingereza, Kiswahili na Kihindi.'
      },
      worker: {
        title: 'Dashibodi ya Mfanyakazi',
        profile: 'Wasifu Wangu',
        matches: 'Upatanishi wa Kazi',
        jobs: 'Vinjari Kazi',
        applications: 'Maombi Yangu',
        interviews: 'Mahojiano',
        skills: 'Ujuzi',
        jobWorked: 'Kazi Iliyofanyiwa',
        mySkills: 'Ujuzi Wangu',
        jobWorkedEmpty: 'Hakuna kazi iliyofanyiwa bado — omba na ukubaliwe kuona kazi zako hapa',
        noSkills: 'Hakuna ujuzi uliochaguliwa. Chagua kutoka katalogi hapa chini.',
        skillCatalog: 'Katalogi ya Ujuzi',
        skillsHint: 'Chagua ujuzi wako kutoka katalogi. Hizi huendesha upatanishi wa AI.',
        jobTitle: 'Cheo cha Kazi',
        experience: 'Miaka ya Uzoefu',
        bio: 'Kuhusu Mimi',
        city: 'Mji',
        area: 'Eneo',
        location: 'Weka Eneo kwenye Ramani',
        availability: 'Upatikanaji',
        expectedSalary: 'Mshahara UnaoTarajia',
        salaryUnit: 'Kwa',
        verifyDoc: 'Hati ya Uthibitisho',
        save: 'Hifadhi Wasifu',
        apply: 'Omba Sasa',
        applied: 'Umeomba'
      },
      employer: {
        title: 'Dashibodi ya Mwajiri',
        profile: 'Wasifu wa Biashara',
        postJob: 'Chapisha Kazi',
        myJobs: 'Kazi Zangu',
        applicants: 'Waombaji',
        findWorkers: 'Tafuta Wafanyakazi',
        interviews: 'Mahojiano',
        businessName: 'Jina la Biashara',
        businessType: 'Aina ya Biashara',
        description: 'Kuhusu Biashara',
        jobTitle: 'Cheo cha Kazi',
        jobDescription: 'Maelezo',
        requiredSkills: 'Ujuzi Unaohitajika',
        workType: 'Aina ya Kazi',
        salary: 'Mshahara',
        workersNeeded: 'Wafanyakazi Wanahitajika',
        urgent: 'Weka kama ya haraka',
        post: 'Chapisha',
        contact: 'Tuma Ujumbe',
        noApplicants: 'Hakuna waombaji bado',
        interview: 'Mahojiano',
        accept: 'Kubali',
        reject: 'Kataa'
      },
      workType: { DAILY: 'Kila Siku', WEEKLY: 'Kila Wiki', MONTHLY: 'Kila Mwezi', PERMANENT: 'Kudumu' },
      salaryUnit: { DAILY: 'kwa siku', PER_WEEK: 'kwa wiki', MONTHLY: 'kwa mwezi' },
      availability: {
        IMMEDIATE: 'Mara moja', PART_TIME: 'Sehemu ya muda', FULL_TIME: 'Muda wote',
        WEEKENDS_ONLY: 'Wikendi tu', EVENINGS: 'Jioni'
      },
      jobStatus: { OPEN: 'Funguliwa', CLOSED: 'Imefungwa', FILLED: 'Imejazwa', CANCELLED: 'Imefutwa' },
      verification: { UNVERIFIED: 'Haijathibitishwa', PENDING: 'Inasubiri', VERIFIED: 'Imethibitishwa', REJECTED: 'Imekataliwa' },
      common: {
        loading: 'Inapakia...', search: 'Tafuta', filters: 'Vichujio', distance: 'Umbali wa juu (km)',
        rating: 'Kiwango cha chini', verifiedOnly: 'Walio thibitishwa tu', minExperience: 'Uzoefu wa chini (miaka)',
        send: 'Tuma', save: 'Hifadhi', cancel: 'Ghairi', close: 'Funga', status: 'Hali', salary: 'Mshahara',
        location: 'Eneo', kmAway: 'km mbali', view: 'Angalia', reviews: 'Maoni', message: 'Ujumbe', unread: 'ambazo hazijasomwa'
      },
      chat: { title: 'Ujumbe', placeholder: 'Andika ujumbe...' },
      interview: { scheduledAt: 'Tarehe na Wakati', mode: 'Njia', notes: 'Maelezo', location: 'Mahali' },
      notifications: { title: 'Arifa', empty: 'Hakuna arifa bado', markAll: 'Weka zote kama zimesomwa' },
      admin: {
        title: 'Dashibodi ya Msimamizi', users: 'Watumiaji', verifications: 'Uthibitishaji', jobs: 'Kazi Zote',
        approve: 'Kubali', reject: 'Kataa', enable: 'Washa', disable: 'Zima',
        postedJobs: 'Kazi Zilizochapishwa', findWorkers: 'Tafuta Wafanyakazi',
        matchWorkers: 'Wafanyi Kazi Waliopendekezwa', interviewsScheduled: 'Mahojiano Yaliyoratibiwa',
        businessProfiles: 'Profaili za Biashara', reviewsForWorkers: 'Maoni kwa Wafanyakazi',
        reviewsOfEmployers: 'Maoni kwa Waajiri', payments: 'Malipo / Kifuko', postJob: 'Chapisha Kazi',
        postSkill: 'Chapisha Ujuzi', noReviews: 'Hakuna maoni bado', wallets: 'Kifuko cha Watumiaji',
        skillName: 'Jina la Ujuzi', skillCategory: 'Kategoria', addSkill: 'Ongeza Ujuzi',
        skillCreated: 'Ujuzi umeongezwa kwenye katalogi'
      },
      wallet: {
        title: 'Kifuko', balance: 'Mizani', amount: 'Kiasi', fund: 'Weka', withdraw: 'Toa',
        fundTitle: 'Ongeza fedha kwenye kifuko', withdrawTitle: 'Toa kwa M-Pesa / benki',
        transactions: 'Shughuli', reference: 'Rejeleo', detail: 'Maelezo', jobPayment: 'Malipo ya kazi',
        paid: 'Imelipwa', paymentPending: 'Malipo yanasubiri', positive: 'Weka kiasi chanya',
        noTransactions: 'Hakuna shughuli bado'
      }
    }
  },
  hi: {
    translation: {
      brand: 'JobOn',
      tagline: 'स्थानीय काम · स्थानीय कामगार · साथ बढ़ें',
      nav: {
        jobs: 'नौकरी खोजें',
        workers: 'कर्मचारी खोजें',
        dashboard: 'डैशबोर्ड',
        chat: 'संदेश',
        admin: 'एडमिन',
        login: 'लॉगिन',
        register: 'साइन अप',
        logout: 'लॉग आउट'
      },
      auth: {
        loginTitle: 'फिर से स्वागत है',
        registerTitle: 'अपना खाता बनाएं',
        name: 'पूरा नाम',
        email: 'ईमेल',
        password: 'पासवर्ड',
        phone: 'फ़ोन',
        role: 'मैं हूँ',
        roleWorker: 'काम की तलाश में कर्मचारी',
        roleEmployer: 'मालिक / व्यापार मालिक',
        login: 'लॉगिन',
        register: 'खाता बनाएं',
        or: 'या',
        haveAccount: 'पहले से खाता है?',
        noAccount: 'JobOn पर नए हैं?'
      },
      home: {
        heroTitle: 'सही कर्मचारी खोजें। या सही नौकरी।',
        heroSub: 'JobOn स्थानीय व्यवसायों को कुशल और अकुशल कर्मचारियों से वास्तविक समय में जोड़ता है — AI मिलान, सत्यापित प्रोफ़ाइल और तुरंत चैट के साथ।',
        ctaWorker: 'मुझे काम चाहिए',
        ctaEmployer: 'मुझे काम पर रखना है',
        featuresTitle: 'काम पर रखने और काम पाने के लिए सब कुछ',
        f1: 'AI स्मार्ट मिलान',
        f1d: 'हमारा इंजन कौशल, दूरी, अनुभव, उपलब्धता, वेतन और रेटिंग से स्कोर करता है।',
        f2: 'सत्यापित प्रोफ़ाइल',
        f2d: 'कर्मचारी अपनी पहचान और कौशल सत्यापित करते हैं।',
        f3: 'रीयल-टाइम चैट',
        f3d: 'इन-ऐप संदेशों से तुरंत बातचीत और साक्षात्कार का समय निर्धारित करें।',
        f4: 'GPS और निकट खोज',
        f4d: 'वास्तविक दूरी से क्रमबद्ध, पास की नौकरियां और कर्मचारी खोजें।',
        f5: 'रेटिंग्स और समीक्षाएं',
        f5d: 'प्रतिष्ठा बनाएं। काम के बाद दोनों पक्ष समीक्षा करते हैं।',
        f6: 'बहु-भाषा',
        f6d: 'अंग्रेजी, हिंदी और स्वाहिली में उपलब्ध।'
      },
      worker: {
        title: 'कर्मचारी डैशबोर्ड',
        profile: 'मेरी प्रोफ़ाइल',
        matches: 'AI नौकरी मिलान',
        jobs: 'नौकरियां देखें',
        applications: 'मेरे आवेदन',
        interviews: 'साक्षात्कार',
        skills: 'कौशल',
        jobWorked: 'काम किया',
        mySkills: 'मेरे कौशल',
        jobWorkedEmpty: 'अभी कोई काम नहीं — आवेदन करें और स्वीकृत होने पर यहां देखें',
        noSkills: 'कोई कौशल चयनित नहीं। नीचे कैटलॉग से चुनें।',
        skillCatalog: 'कौशल कैटलॉग',
        skillsHint: 'कैटलॉग से अपने कौशल चुनें। ये AI मिलान को बेहतर बनाते हैं।',
        jobTitle: 'नौकरी का शीर्षक',
        experience: 'अनुभव के वर्ष',
        bio: 'मेरे बारे में',
        city: 'शहर',
        area: 'क्षेत्र',
        location: 'मानचित्र पर स्थान सेट करें',
        availability: 'उपलब्धता',
        expectedSalary: 'अपेक्षित वेतन',
        salaryUnit: 'प्रति',
        verifyDoc: 'सत्यापन दस्तावेज़',
        save: 'प्रोफ़ाइल सहेजें',
        apply: 'अभी आवेदन करें',
        applied: 'आवेदन किया गया'
      },
      employer: {
        title: 'मालिक डैशबोर्ड',
        profile: 'व्यवसाय प्रोफ़ाइल',
        postJob: 'नौकरी पोस्ट करें',
        myJobs: 'मेरी नौकरियां',
        applicants: 'आवेदन',
        findWorkers: 'कर्मचारी खोजें',
        interviews: 'साक्षात्कार',
        businessName: 'व्यवसाय का नाम',
        businessType: 'व्यवसाय प्रकार',
        description: 'व्यवसाय के बारे में',
        jobTitle: 'नौकरी का शीर्षक',
        jobDescription: 'विवरण',
        requiredSkills: 'आवश्यक कौशल',
        workType: 'कार्य प्रकार',
        salary: 'वेतन',
        workersNeeded: 'आवश्यक कर्मचारी',
        urgent: 'अत्यावश्यक के रूप में चिह्नित करें',
        post: 'पोस्ट करें',
        contact: 'संदेश',
        noApplicants: 'अभी कोई आवेदक नहीं',
        interview: 'साक्षात्कार',
        accept: 'स्वीकार करें',
        reject: 'अस्वीकार करें'
      },
      workType: { DAILY: 'दैनिक', WEEKLY: 'साप्ताहिक', MONTHLY: 'मासिक', PERMANENT: 'स्थायी' },
      salaryUnit: { DAILY: 'प्रति दिन', PER_WEEK: 'प्रति सप्ताह', MONTHLY: 'प्रति माह' },
      availability: {
        IMMEDIATE: 'तुरंत', PART_TIME: 'अंशकालिक', FULL_TIME: 'पूर्णकालिक',
        WEEKENDS_ONLY: 'केवल सप्ताहांत', EVENINGS: 'शाम'
      },
      jobStatus: { OPEN: 'खुला', CLOSED: 'बंद', FILLED: 'भरा हुआ', CANCELLED: 'रद्द' },
      verification: { UNVERIFIED: 'असत्यापित', PENDING: 'लंबित', VERIFIED: 'सत्यापित', REJECTED: 'अस्वीकृत' },
      common: {
        loading: 'लोड हो रहा है...', search: 'खोजें', filters: 'फ़िल्टर', distance: 'अधिकतम दूरी (किमी)',
        rating: 'न्यूनतम रेटिंग', verifiedOnly: 'केवल सत्यापित', minExperience: 'न्यूनतम अनुभव (वर्ष)',
        send: 'भेजें', save: 'सहेजें', cancel: 'रद्द करें', close: 'बंद करें', status: 'स्थिति', salary: 'वेतन',
        location: 'स्थान', kmAway: 'किमी दूर', view: 'देखें', reviews: 'समीक्षाएं', message: 'संदेश', unread: 'अपठित'
      },
      chat: { title: 'संदेश', placeholder: 'संदेश लिखें...' },
      interview: { scheduledAt: 'दिनांक और समय', mode: 'माध्यम', notes: 'नोट्स', location: 'स्थान' },
      notifications: { title: 'सूचनाएं', empty: 'अभी कोई सूचना नहीं', markAll: 'सभी पढ़ी हुई करें' },
      admin: {
        title: 'एडमिन डैशबोर्ड', users: 'उपयोगकर्ता', verifications: 'सत्यापन', jobs: 'सभी नौकरियां',
        approve: 'स्वीकृत', reject: 'अस्वीकृत', enable: 'सक्षम', disable: 'अक्षम',
        postedJobs: 'पोस्ट की गई नौकरियां', findWorkers: 'कर्मचारी खोजें',
        matchWorkers: 'मैच कर्मचारी', interviewsScheduled: 'निर्धारित साक्षात्कार',
        businessProfiles: 'व्यापार प्रोफाइल', reviewsForWorkers: 'कर्मचारियों के लिए समीक्षाएं',
        reviewsOfEmployers: 'मालिकों की समीक्षाएं', payments: 'भुगतान / वॉलेट', postJob: 'नौकरी पोस्ट करें',
        postSkill: 'कौशल पोस्ट करें', noReviews: 'अभी कोई समीक्षा नहीं', wallets: 'उपयोगकर्ता वॉलेट',
        skillName: 'कौशल नाम', skillCategory: 'श्रेणी', addSkill: 'कौशल जोड़ें',
        skillCreated: 'कौशल कैटलॉग में जोड़ा गया'
      },
      wallet: {
        title: 'वॉलेट', balance: 'शेष राशि', amount: 'राशि', fund: 'जमा करें', withdraw: 'निकालें',
        fundTitle: 'वॉलेट में धन जोड़ें', withdrawTitle: 'एम-पेसा / बैंक में निकालें',
        transactions: 'लेनदेन', reference: 'संदर्भ', detail: 'विवरण', jobPayment: 'नौकरी भुगतान',
        paid: 'भुगतान किया', paymentPending: 'भुगतान लंबित', positive: 'सकारात्मक राशि दर्ज करें',
        noTransactions: 'अभी कोई लेनदेन नहीं'
      }
    }
  }
}

/**
 * The signup, onboarding and worker strings live in `./locales`, so they can be
 * reviewed per language without wading through the older resources above.
 * Merging happens here rather than in the files themselves, which keeps each
 * locale file a plain data module.
 */
function merge(target, source) {
  for (const [k, v] of Object.entries(source || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      target[k] = merge(target[k] && typeof target[k] === 'object' ? target[k] : {}, v)
    } else {
      target[k] = v
    }
  }
  return target
}

for (const [code, packs] of Object.entries({
  en: [common.en, flow.en],
  te: [common.te, flow.te],
  hi: [common.hi, flow.hi],
})) {
  resources[code] = resources[code] || { translation: {} }
  for (const pack of packs) merge(resources[code].translation, pack)
}

/**
 * Languages the app is genuinely translated into. `onboarding/data.js` reads
 * this to decide which options are offered without a "Coming soon" badge, so
 * the two can never drift apart.
 */
export const READY_LANGUAGES = ['en', 'te', 'hi']

/**
 * What every language switcher in the app offers. Labels are in the language
 * itself, because someone looking for Telugu is looking for "తెలుగు".
 * Keep this the single source — the switchers used to each carry their own
 * copy, which is how Telugu went missing from some of them.
 */
export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिन्दी' },
]

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('sb_lang') || 'en',
  fallbackLng: 'en',
  supportedLngs: Object.keys(resources),
  interpolation: { escapeValue: false }
})

export default i18n
