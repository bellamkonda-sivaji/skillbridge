/**
 * Speech, for workers who cannot comfortably read.
 *
 * Uses the browser's own speech engines — nothing is sent to a server, it works
 * on a cheap Android in Chrome, and it costs nothing. Both APIs are optional
 * and patchily implemented, so every call here is defensive: if speech is
 * missing the app must still work exactly as before, just silently.
 */

const LANG = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN' }

export const speechSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window

export const listeningSupported = () =>
  typeof window !== 'undefined' &&
  Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)

/**
 * Voices load asynchronously, and on some Androids the list is empty until
 * `voiceschanged` fires. Resolving with whatever we have after a short wait is
 * better than never speaking.
 */
function voices() {
  return new Promise((resolve) => {
    const got = window.speechSynthesis.getVoices()
    if (got.length) return resolve(got)
    let done = false
    const finish = () => {
      if (done) return
      done = true
      resolve(window.speechSynthesis.getVoices())
    }
    window.speechSynthesis.addEventListener('voiceschanged', finish, { once: true })
    setTimeout(finish, 600)
  })
}

/** Closest available voice for a language, falling back to Indian English. */
async function pickVoice(lang) {
  const want = LANG[lang] || LANG.en
  const all = await voices()
  return all.find((v) => v.lang === want)
    || all.find((v) => v.lang?.startsWith(want.split('-')[0]))
    || all.find((v) => v.lang === 'en-IN')
    || all.find((v) => v.lang?.startsWith('en'))
    || null
}

let current = null

/**
 * Reads text aloud. Resolves when it finishes or is cancelled — never rejects,
 * because a failure to speak must not break the screen that asked.
 */
export async function speak(text, lang = 'en', { rate = 0.92 } = {}) {
  if (!speechSupported() || !text) return false
  try {
    stopSpeaking()
    const u = new SpeechSynthesisUtterance(String(text))
    u.lang = LANG[lang] || LANG.en
    // A little slower than default: these are instructions, not narration.
    u.rate = rate
    const v = await pickVoice(lang)
    if (v) u.voice = v
    current = u
    window.speechSynthesis.speak(u)
    return new Promise((resolve) => {
      u.onend = () => { current = null; resolve(true) }
      u.onerror = () => { current = null; resolve(false) }
    })
  } catch {
    return false
  }
}

export function stopSpeaking() {
  try {
    if (speechSupported()) window.speechSynthesis.cancel()
  } catch { /* some browsers throw when nothing is queued */ }
  current = null
}

export const isSpeaking = () => {
  try { return speechSupported() && window.speechSynthesis.speaking } catch { return false }
}

/**
 * Listens once and returns what was said.
 *
 * `onPartial` gets interim results so the UI can show words appearing, which
 * is the only feedback that the phone is actually hearing them.
 */
export function listenOnce(lang = 'en', { onPartial } = {}) {
  return new Promise((resolve, reject) => {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Rec) return reject(new Error('This phone cannot listen. Please type instead.'))
    stopSpeaking()   // never listen to ourselves
    const r = new Rec()
    r.lang = LANG[lang] || LANG.en
    r.interimResults = Boolean(onPartial)
    r.maxAlternatives = 1
    r.continuous = false

    let settled = false
    const done = (fn, v) => { if (!settled) { settled = true; try { r.stop() } catch {} ; fn(v) } }

    r.onresult = (e) => {
      const last = e.results[e.results.length - 1]
      const said = last[0]?.transcript?.trim() || ''
      if (!last.isFinal) { onPartial?.(said); return }
      done(resolve, said)
    }
    r.onerror = (e) => {
      const msg = e.error === 'not-allowed'
        ? 'Microphone permission is off. Turn it on to speak.'
        : e.error === 'no-speech'
          ? 'We did not hear anything. Try again.'
          : 'Could not hear you. Please try again.'
      done(reject, new Error(msg))
    }
    r.onend = () => { if (!settled) { settled = true; resolve('') } }

    try { r.start() } catch { done(reject, new Error('Could not start listening.')) }
  })
}

/* ---------------------------------------------------------------- phrasing */

const money = (n) => `${Math.round(Number(n) || 0)} rupees`

const UNIT_SPOKEN = {
  HOURLY: 'per hour', PER_SHIFT: 'per shift', DAILY: 'per day',
  PER_WEEK: 'per week', MONTHLY: 'per month',
}

/**
 * A job read aloud the way a person would say it — not the screen's text.
 * Short sentences, the pay first, because the pay is what people listen for.
 */
export function jobSpeech(job, t) {
  const bits = []
  if (job.title) bits.push(job.title)
  if (job.salary != null) bits.push(`${money(job.salary)} ${UNIT_SPOKEN[job.salaryUnit] || ''}`)
  if (job.businessName) bits.push(`at ${job.businessName}`)
  if (job.distanceKm != null) bits.push(`${Number(job.distanceKm).toFixed(1)} kilometres away`)
  if (job.city || job.area) bits.push([job.area, job.city].filter(Boolean).join(', '))
  return bits.join('. ')
}
