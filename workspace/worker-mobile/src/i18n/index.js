import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import AsyncStorage from '@react-native-async-storage/async-storage'
import en from './en'
import te from './te'
import hi from './hi'

export const LANG_KEY = 'jobon.worker.lang'

/**
 * The languages offered at the very first screen, before anything else.
 *
 * `native` is what the option is labelled with - a Telugu speaker looking for
 * their language should see "తెలుగు", not "Telugu", because the English word
 * is exactly what they cannot read.
 */
export const LANGUAGES = [
  { code: 'en', native: 'English', english: 'English', flag: '🇬🇧' },
  { code: 'te', native: 'తెలుగు', english: 'Telugu', flag: '🇮🇳' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi', flag: '🇮🇳' },
]

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, te: { translation: te }, hi: { translation: hi } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
})

/** Restores the language the person picked last time they opened the app. */
export async function restoreLanguage() {
  try {
    const saved = await AsyncStorage.getItem(LANG_KEY)
    if (saved && LANGUAGES.some((l) => l.code === saved)) {
      await i18n.changeLanguage(saved)
      return saved
    }
  } catch { /* first run, or storage unavailable */ }
  return null
}

export async function setLanguage(code) {
  await i18n.changeLanguage(code)
  try { await AsyncStorage.setItem(LANG_KEY, code) } catch { /* not fatal */ }
}

export default i18n
