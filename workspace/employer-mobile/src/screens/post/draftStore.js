import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * The half-finished job post, kept on the phone.
 *
 * Posting a job is eight steps, and people are interrupted: a customer walks
 * in, the phone rings, the app is swiped away. Losing all of it means they
 * start again, and mostly they do not.
 *
 * It is stored here rather than on the server because what has to come back is
 * the wizard itself - which step they were on, and every half-typed field.
 * A server draft is a JobPost, and rebuilding the wizard from one loses
 * anything the job record has no column for.
 *
 * Keyed per account: a shared phone must not show one business another's
 * unfinished posting.
 */

const KEY = (accountId) => `jobon.postDraft.${accountId || 'anon'}`

export async function saveDraft(accountId, draft, step) {
  try {
    await AsyncStorage.setItem(KEY(accountId), JSON.stringify({
      draft, step, savedAt: Date.now(),
    }))
  } catch { /* a draft that cannot be saved must not break the form */ }
}

export async function loadDraft(accountId) {
  try {
    const raw = await AsyncStorage.getItem(KEY(accountId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.draft) return null
    return parsed
  } catch {
    return null
  }
}

export async function clearDraft(accountId) {
  try { await AsyncStorage.removeItem(KEY(accountId)) } catch { /* nothing to undo */ }
}

/** Enough typed in to be worth keeping. An untouched form is not a draft. */
export function worthSaving(draft) {
  if (!draft) return false
  return Boolean(
    draft.workerCategory || draft.engagementModel
    || String(draft.title || '').trim() || String(draft.salary || '').trim(),
  )
}

/** A short line for the card: "Store helper · step 3 of 8". */
export function draftLabel(saved, t) {
  const title = String(saved?.draft?.title || '').trim()
  return title || t('post.untitledDraft')
}
