/**
 * Turns the server's enum names into words people actually say.
 *
 * `INTERVIEW_SCHEDULED` is a database value that leaked onto screens meant for
 * someone who may read slowly, in their second or third language. The fix is
 * not a prettier font - it is saying "They want to meet you".
 *
 * Unknown values fall back to a readable form rather than disappearing, so a
 * status added on the server later shows as "Something new" instead of a blank
 * badge or a crash.
 */
export function word(t, value) {
  if (value === null || value === undefined) return ''
  const key = String(value).trim().toUpperCase()
  if (!key) return ''
  const translated = t(`words.${key}`, { defaultValue: '' })
  if (translated) return translated
  // Last resort: FULL_TIME -> Full time. Still better than shouting.
  const plain = key.replace(/_/g, ' ').toLowerCase()
  return plain.charAt(0).toUpperCase() + plain.slice(1)
}

/**
 * Gender as a word, not the column value: "MALE" on a card reads like a form
 * field nobody filled in properly. "Prefer not to say" shows nothing at all -
 * printing it would undo the choice.
 */
export function genderWord(t, value) {
  const key = String(value || '').trim().toUpperCase()
  if (!['MALE', 'FEMALE', 'OTHER'].includes(key)) return ''
  return t ? t(`gender.${key}`) : ''
}
