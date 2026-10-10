import { ref, readonly, computed } from 'vue'
import { loadFirebase } from '@/firebaseLazy'
import { writeAuthSnapshot } from '@/utils/authCache'

/**
 * Post-login onboarding state.
 *
 * The questionnaire is *prompted* once, right after the user's first login, and
 * never again — but it stays reachable from the profile page, so a user who
 * skipped it can still answer, and one who answered can redo it (a retake
 * replaces the stored payload outright). The answers live on the user document
 * (`users/{uid}.onboarding`) — no local copy, so they follow the account across
 * devices. Feeds spot recommendations and preloads the phototype used by the
 * exposure wheel.
 */
const SESSION_PROMPTED_KEY = 'sunspot_onboarding_prompted'
const ONBOARDING_VERSION = 1

// Cached payload for `loadedUid`. Both reset on sign-out so a second account on
// the same device never inherits the first one's answers.
const state = ref(null)
const loadedUid = ref(null)
let inflight = null

loadFirebase().then(({ auth, onAuthStateChanged }) => {
  onAuthStateChanged(auth, (firebaseUser) => {
    if (!firebaseUser || firebaseUser.uid !== loadedUid.value) {
      state.value = null
      loadedUid.value = null
      inflight = null
    }
  })
}).catch(() => { /* Firebase unavailable — logged in firebaseLazy.js */ })

/**
 * Reads the onboarding payload for a user, once per session. The router guard
 * runs on every navigation, so repeat calls resolve from cache rather than
 * hitting Firestore again.
 */
const load = async (uid) => {
  if (loadedUid.value === uid) return state.value
  if (inflight?.uid === uid) return inflight.promise

  const promise = (async () => {
    try {
      const { db, doc, getDoc } = await loadFirebase()
      const snap = await getDoc(doc(db, 'users', uid))
      state.value = snap.exists() ? snap.data().onboarding ?? null : null
      loadedUid.value = uid
      // Recorded so the next cold load knows, synchronously, that this user
      // needs no onboarding redirect — which is what lets the router render
      // without waiting on Firebase. See utils/authCache.js.
      writeAuthSnapshot({ onboarded: !!state.value?.status }, uid)
    } catch (error) {
      // A failed read must not trap the user in the questionnaire: treat the
      // status as unknown and leave the cache empty so the next hop retries.
      console.error('Error reading onboarding answers:', error)
      state.value = null
    } finally {
      inflight = null
    }
    return state.value
  })()

  inflight = { uid, promise }
  return promise
}

const write = async (payload) => {
  const { db, doc, setDoc, serverTimestamp, getCurrentUser } = await loadFirebase()

  const currentUser = await getCurrentUser()
  if (!currentUser) throw new Error('No authenticated user found')

  // `mergeFields` rather than `merge: true`: Firestore deep-merges nested maps,
  // so a plain merge would leave keys from a previous run behind — a retake
  // that drops the "Otra" option would keep its stale `<id>_other` text.
  // Naming the fields replaces `onboarding` wholesale and touches nothing else.
  await setDoc(
    doc(db, 'users', currentUser.uid),
    { onboarding: payload, updated_at: serverTimestamp() },
    { mergeFields: ['onboarding', 'updated_at'] }
  )

  state.value = payload
  loadedUid.value = currentUser.uid
  writeAuthSnapshot({ onboarded: !!payload.status }, currentUser.uid)
}

export function useOnboarding() {
  const status = computed(() => state.value?.status ?? null)
  const isCompleted = computed(() => status.value === 'completed')
  const isAnswered = computed(() => !!status.value)

  /** Fitzpatrick phototype (1–6) from question 5, or null if unanswered. */
  const phototype = computed(() => state.value?.answers?.sun_sensitivity ?? null)

  /**
   * @param {Object} answers - keyed by question id. Ranking questions hold an
   *   ordered array of option values; `<id>_other` holds the free text typed
   *   when the "Otra" option was ranked.
   */
  const saveAnswers = (answers) =>
    write({
      version: ONBOARDING_VERSION,
      status: 'completed',
      completed_at: new Date().toISOString(),
      answers,
    })

  /** Records that the user dismissed the questionnaire so it stops appearing. */
  const skip = () =>
    write({
      version: ONBOARDING_VERSION,
      status: 'skipped',
      completed_at: new Date().toISOString(),
      answers: {},
    })

  return {
    onboarding: readonly(state),
    status,
    isCompleted,
    isAnswered,
    phototype,
    loadOnboarding: load,
    saveAnswers,
    skip,
  }
}

/**
 * True once the user has answered or dismissed the questionnaire. Used by the
 * router guard, which can't await a composable's computed state.
 */
export const hasAnsweredOnboarding = async (uid) => {
  const payload = await load(uid)
  return !!payload?.status
}

/**
 * True once per app session after the router has auto-redirected to the
 * questionnaire. Without this, a user who navigates away mid-questionnaire
 * gets bounced back on every route change.
 */
export const wasPromptedThisSession = () => {
  try {
    return sessionStorage.getItem(SESSION_PROMPTED_KEY) === 'true'
  } catch {
    return false
  }
}

export const markPromptedThisSession = () => {
  try {
    sessionStorage.setItem(SESSION_PROMPTED_KEY, 'true')
  } catch {
    // Session storage unavailable: the redirect simply repeats, which is still
    // bounded by the stored status once the user finishes or dismisses it.
  }
}
