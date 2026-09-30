/**
 * Shared vocabulary for the signup, onboarding and worker screens.
 *
 * These are the strings a worker actually reads on their way through the app,
 * kept apart from the older `i18n.js` resources so the two can be reviewed
 * independently. Every language here must carry the same keys — a missing one
 * silently falls back to English, which reads worse than a plain translation.
 *
 * Telugu is written the way people speak in and around Tirupati: short
 * sentences, everyday words, and the English term kept where that is what is
 * actually said out loud (OTP, ఫోన్, ఈమెయిల్).
 */

export const en = {
  common: {
    continue: 'Continue',
    back: 'Back',
    skip: 'Skip for now',
    save: 'Save',
    cancel: 'Cancel',
    logIn: 'Log In',
    signUp: 'Sign Up',
    loading: 'Loading…',
    pleaseWait: 'Please wait…',
    retry: 'Try again',
    optional: 'Optional',
    required: 'Required',
    comingSoon: 'Coming soon',
    alreadyHaveAccount: 'Already have an account?',
    safe: 'Your information is safe with us.',
    or: 'or continue with',
  },

  ob: {
    steps: { account: 'Account', verify: 'Verify', profile: 'Profile', complete: 'Complete' },

    lang: {
      title: 'Choose your language',
      sub: 'You can change this anytime in settings.',
      listLabel: 'Languages',
      note: 'Languages marked “Coming soon” are on the way — we’ll remember your choice and switch you over the moment they land.',
    },

    account: {
      title: 'How would you like to use JobOn?',
      sub: 'Choose the option that best describes you.',
      workerTitle: 'I am looking for work',
      workerPoints: ['Find local jobs', 'Apply and get hired', 'Build your work history', 'Get paid safely'],
      employerTitle: 'I am a business owner',
      employerPoints: ['Hire local workers', 'Post jobs easily', 'Manage attendance & payments', 'Grow your business'],
    },

    create: {
      title: 'Create your account',
      sub: 'Let’s get started! It only takes a minute.',
      name: 'Full Name',
      namePlaceholder: 'Enter your full name',
      phone: 'Mobile Number',
      email: 'Email (Optional)',
      emailPlaceholder: 'Enter your email',
      password: 'Password',
      passwordPlaceholder: 'Create a password',
      terms: 'I agree to the <1>Terms & Conditions</1> and <3>Privacy Policy</3>',
      submit: 'Create Account',
      submitting: 'Creating your account…',
      socialSoon: 'Google and Apple sign-in are coming soon. Please use your mobile number for now.',
      errName: 'Please enter your full name',
      errPhone: 'Enter a 10-digit mobile number',
      errEmail: 'That email does not look right',
      errPassword: 'Use at least 6 characters',
      errTerms: 'Please accept the Terms & Conditions to continue.',
      errFailed: 'We could not create your account. Please try again.',
    },

    otp: {
      title: 'Verify your mobile number',
      sub: 'We have sent a 6-digit OTP to {{phone}}',
      demo: 'Demo mode:',
      demoText: 'no SMS provider is connected yet, so your code is',
      resendIn: 'Resend OTP in {{time}}',
      resend: 'Resend OTP',
      submit: 'Verify & Continue',
      submitting: 'Verifying…',
      errWrong: 'That code is not right. Please check and try again.',
      errSend: 'Could not send the code. Please try again shortly.',
    },
  },
}

export const te = {
  common: {
    continue: 'కొనసాగించండి',
    back: 'వెనుకకు',
    skip: 'ప్రస్తుతానికి వదిలేయండి',
    save: 'సేవ్ చేయండి',
    cancel: 'రద్దు చేయండి',
    logIn: 'లాగిన్',
    signUp: 'ఖాతా తెరవండి',
    loading: 'లోడ్ అవుతోంది…',
    pleaseWait: 'కొద్దిసేపు ఆగండి…',
    retry: 'మళ్ళీ ప్రయత్నించండి',
    optional: 'ఐచ్ఛికం',
    required: 'తప్పనిసరి',
    comingSoon: 'త్వరలో',
    alreadyHaveAccount: 'ఇప్పటికే ఖాతా ఉందా?',
    safe: 'మీ వివరాలు మా దగ్గర సురక్షితం.',
    or: 'లేదా దీనితో కొనసాగండి',
  },

  ob: {
    steps: { account: 'ఖాతా', verify: 'ధృవీకరణ', profile: 'ప్రొఫైల్', complete: 'పూర్తి' },

    lang: {
      title: 'మీ భాషను ఎంచుకోండి',
      sub: 'దీన్ని ఎప్పుడైనా సెట్టింగ్స్‌లో మార్చుకోవచ్చు.',
      listLabel: 'భాషలు',
      note: '“త్వరలో” అని ఉన్న భాషలు ఇంకా సిద్ధం కావడం లేదు — మీ ఎంపికను గుర్తుంచుకుని, అవి వచ్చిన వెంటనే మార్చేస్తాం.',
    },

    account: {
      title: 'JobOn ను ఎలా ఉపయోగించాలనుకుంటున్నారు?',
      sub: 'మీకు సరిపోయే ఎంపికను ఎంచుకోండి.',
      workerTitle: 'నేను పని వెతుకుతున్నాను',
      workerPoints: ['దగ్గరలోని పనులు చూడండి', 'దరఖాస్తు చేసి పని పొందండి', 'మీ పని చరిత్రను పెంచుకోండి', 'సురక్షితంగా జీతం పొందండి'],
      employerTitle: 'నేను వ్యాపారం నడుపుతున్నాను',
      employerPoints: ['స్థానిక పనివారిని తీసుకోండి', 'సులభంగా ఉద్యోగం పోస్ట్ చేయండి', 'హాజరు, జీతం చూసుకోండి', 'మీ వ్యాపారాన్ని పెంచుకోండి'],
    },

    create: {
      title: 'మీ ఖాతాను తెరవండి',
      sub: 'మొదలుపెడదాం! ఒక నిమిషం చాలు.',
      name: 'పూర్తి పేరు',
      namePlaceholder: 'మీ పూర్తి పేరు రాయండి',
      phone: 'మొబైల్ నంబర్',
      email: 'ఈమెయిల్ (ఐచ్ఛికం)',
      emailPlaceholder: 'మీ ఈమెయిల్ రాయండి',
      password: 'పాస్‌వర్డ్',
      passwordPlaceholder: 'కొత్త పాస్‌వర్డ్ పెట్టండి',
      terms: 'నేను <1>నిబంధనలు & షరతులు</1> మరియు <3>గోప్యతా విధానం</3> అంగీకరిస్తున్నాను',
      submit: 'ఖాతా తెరవండి',
      submitting: 'మీ ఖాతా తెరుస్తున్నాం…',
      socialSoon: 'Google, Apple లాగిన్ త్వరలో వస్తుంది. ప్రస్తుతానికి మొబైల్ నంబర్ వాడండి.',
      errName: 'దయచేసి మీ పూర్తి పేరు రాయండి',
      errPhone: '10 అంకెల మొబైల్ నంబర్ రాయండి',
      errEmail: 'ఈ ఈమెయిల్ సరిగ్గా లేదు',
      errPassword: 'కనీసం 6 అక్షరాలు వాడండి',
      errTerms: 'కొనసాగడానికి నిబంధనలు & షరతులు అంగీకరించండి.',
      errFailed: 'మీ ఖాతా తెరవలేకపోయాం. దయచేసి మళ్ళీ ప్రయత్నించండి.',
    },

    otp: {
      title: 'మీ మొబైల్ నంబర్ ధృవీకరించండి',
      sub: '{{phone}} కు 6 అంకెల OTP పంపాం',
      demo: 'డెమో మోడ్:',
      demoText: 'ఇంకా SMS సర్వీస్ కలపలేదు, కాబట్టి మీ కోడ్',
      resendIn: '{{time}} తర్వాత OTP మళ్ళీ పంపండి',
      resend: 'OTP మళ్ళీ పంపండి',
      submit: 'ధృవీకరించి కొనసాగండి',
      submitting: 'ధృవీకరిస్తున్నాం…',
      errWrong: 'ఈ కోడ్ సరైనది కాదు. చూసి మళ్ళీ ప్రయత్నించండి.',
      errSend: 'కోడ్ పంపలేకపోయాం. కొద్దిసేపటి తర్వాత ప్రయత్నించండి.',
    },
  },
}

export const hi = {
  common: {
    continue: 'आगे बढ़ें',
    back: 'वापस',
    skip: 'अभी छोड़ें',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    logIn: 'लॉग इन',
    signUp: 'खाता बनाएं',
    loading: 'लोड हो रहा है…',
    pleaseWait: 'कृपया प्रतीक्षा करें…',
    retry: 'फिर कोशिश करें',
    optional: 'वैकल्पिक',
    required: 'आवश्यक',
    comingSoon: 'जल्द आ रहा है',
    alreadyHaveAccount: 'पहले से खाता है?',
    safe: 'आपकी जानकारी हमारे पास सुरक्षित है।',
    or: 'या इससे जारी रखें',
  },

  ob: {
    steps: { account: 'खाता', verify: 'सत्यापन', profile: 'प्रोफ़ाइल', complete: 'पूरा' },

    lang: {
      title: 'अपनी भाषा चुनें',
      sub: 'आप इसे कभी भी सेटिंग्स में बदल सकते हैं।',
      listLabel: 'भाषाएं',
      note: '“जल्द आ रहा है” वाली भाषाएं अभी तैयार नहीं हैं — हम आपकी पसंद याद रखेंगे और आते ही बदल देंगे।',
    },

    account: {
      title: 'आप JobOn का उपयोग कैसे करना चाहते हैं?',
      sub: 'वह विकल्प चुनें जो आप पर सही बैठता हो।',
      workerTitle: 'मैं काम ढूंढ रहा हूं',
      workerPoints: ['आस-पास के काम देखें', 'आवेदन करें और काम पाएं', 'अपना कार्य इतिहास बनाएं', 'सुरक्षित रूप से भुगतान पाएं'],
      employerTitle: 'मैं व्यापार चलाता हूं',
      employerPoints: ['स्थानीय कामगार रखें', 'आसानी से नौकरी पोस्ट करें', 'हाज़िरी और भुगतान संभालें', 'अपना व्यापार बढ़ाएं'],
    },

    create: {
      title: 'अपना खाता बनाएं',
      sub: 'चलिए शुरू करें! बस एक मिनट लगेगा।',
      name: 'पूरा नाम',
      namePlaceholder: 'अपना पूरा नाम लिखें',
      phone: 'मोबाइल नंबर',
      email: 'ईमेल (वैकल्पिक)',
      emailPlaceholder: 'अपना ईमेल लिखें',
      password: 'पासवर्ड',
      passwordPlaceholder: 'नया पासवर्ड बनाएं',
      terms: 'मैं <1>नियम और शर्तें</1> तथा <3>गोपनीयता नीति</3> स्वीकार करता हूं',
      submit: 'खाता बनाएं',
      submitting: 'आपका खाता बन रहा है…',
      socialSoon: 'Google और Apple साइन-इन जल्द आ रहा है। अभी मोबाइल नंबर का उपयोग करें।',
      errName: 'कृपया अपना पूरा नाम लिखें',
      errPhone: '10 अंकों का मोबाइल नंबर लिखें',
      errEmail: 'यह ईमेल सही नहीं लग रहा',
      errPassword: 'कम से कम 6 अक्षर उपयोग करें',
      errTerms: 'जारी रखने के लिए नियम और शर्तें स्वीकार करें।',
      errFailed: 'हम आपका खाता नहीं बना सके। कृपया फिर कोशिश करें।',
    },

    otp: {
      title: 'अपना मोबाइल नंबर सत्यापित करें',
      sub: 'हमने {{phone}} पर 6 अंकों का OTP भेजा है',
      demo: 'डेमो मोड:',
      demoText: 'अभी SMS सेवा नहीं जुड़ी है, इसलिए आपका कोड है',
      resendIn: '{{time}} बाद OTP दोबारा भेजें',
      resend: 'OTP दोबारा भेजें',
      submit: 'सत्यापित करें और आगे बढ़ें',
      submitting: 'सत्यापित कर रहे हैं…',
      errWrong: 'यह कोड सही नहीं है। जांच कर फिर कोशिश करें।',
      errSend: 'कोड नहीं भेज सके। थोड़ी देर बाद कोशिश करें।',
    },
  },
}
