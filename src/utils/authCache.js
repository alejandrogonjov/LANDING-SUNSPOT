/**
 * A synchronous, self-correcting snapshot of the auth facts the first frame
 * needs.
 *
 * Firebase can only answer "who is signed in?" asynchronously — an IndexedDB
 * read, and for an expired token a network refresh. Waiting for that answer
 * before rendering puts it in front of every first paint; rendering without it
 * means guessing. So we cache last time's answer in localStorage (synchronous)
 * and render from that immediately, then let the real answer correct anything
 * we got wrong.
 *
 * Three states, and the difference between the last two matters:
 *   null              — never seen this browser before. Nothing to render
 *                       optimistically; callers must wait for Firebase.
 *   { uid: null }     — known signed out.
 *   { uid: '…', … }   — known signed in, with the last-known user document.
 *
 * A stale snapshot can only ever cost a correction (a redirect, or a value
 * being replaced once the live data lands) — never a wrong access decision,
 * because Firestore rules, not this cache, are what actually guard data.
 */

const KEY = 'sunspot_auth_snapshot'

// The user document is small (name, avatar, level, bookmarks, visited spots),
// but refuse to persist a pathological one rather than blow the storage quota
// that the map tile cache also lives in.
const MAX_BYTES = 64 * 1024

/** @returns {null | { uid: string|null, onboarded?: boolean, userData?: object }} */
export function readAuthSnapshot() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    // `uid` must be present and either a string or an explicit null; anything
    // else is a corrupt entry and is safer treated as "never seen".
    if (!parsed || !('uid' in parsed)) return null
    if (parsed.uid !== null && typeof parsed.uid !== 'string') return null

    return parsed
  } catch {
    return null
  }
}

/**
 * Merges fields into the current snapshot, leaving the rest untouched.
 *
 * `expectedUid` is not optional in spirit: async writers (a Firestore snapshot,
 * an onboarding read) can land after the user switched accounts or signed out,
 * and must not staple their result onto a different identity.
 */
export function writeAuthSnapshot(patch, expectedUid) {
  const current = readAuthSnapshot()
  if (!current) return // No identity established yet — `resetAuthSnapshot` first.
  if (current.uid !== expectedUid) return
  persist({ ...current, ...patch })
}

/**
 * Replaces the snapshot wholesale. Use on sign-in, sign-out, and account
 * switches — anything carried over from the previous identity must not
 * survive, or a second account on the same device inherits the first's state.
 *
 * @param {string|null} uid - null records "known signed out".
 */
export function resetAuthSnapshot(uid) {
  persist({ uid })
}

function persist(snapshot) {
  try {
    const raw = JSON.stringify(snapshot)
    if (raw.length > MAX_BYTES) {
      // Keep the identity and drop the payload: the fast path only needs
      // `uid` and `onboarded`, and the live document will fill the rest in.
      const { userData, ...rest } = snapshot
      localStorage.setItem(KEY, JSON.stringify(rest))
      return
    }
    localStorage.setItem(KEY, raw)
  } catch {
    // Storage full or blocked (private mode). Everything still works; it just
    // takes the blocking path, which is where we started.
  }
}
