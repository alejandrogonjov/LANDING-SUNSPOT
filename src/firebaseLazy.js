/**
 * Firebase, on demand.
 *
 * Firebase is ~108KB gzipped, and nothing on the map's critical path needs it:
 * the tiles, the GL canvas and the controls all render without knowing who is
 * signed in. But a static `import` from anything in the entry graph puts its
 * download *and* its execution in front of the first frame — the whole static
 * graph has to run before Vue mounts.
 *
 * So the eagerly-loaded modules — the router guard, App.vue, the Home tree and
 * its composables — reach Firebase through here. The map paints while Firebase
 * is still arriving; spots and user state fill in behind it. What makes this
 * safe is that none of them need Firebase to decide what to *render*: the
 * cached auth snapshot (utils/authCache.js) answers that synchronously.
 *
 * Route components that are already lazy-loaded may keep importing
 * '@/firebase' directly — they're off the critical path by construction, and
 * resolve to the same module instance either way.
 */

import { ref, readonly } from 'vue'

let pending

// 'idle' → 'ready' | 'unavailable'. 'unavailable' means the Firebase module
// could not be loaded or initialised — in practice a deploy built without the
// VITE_FIREBASE_* variables (firebase.js throws a message naming them), or the
// chunk failing to download. App.vue shows a banner for it, and the router
// lets public pages through instead of aborting every navigation.
const status = ref('idle')

/**
 * @returns {Promise} the module: `auth`, `db`, `getCurrentUser`, plus the
 *   Firestore/Auth functions re-exported from firebase.js. Cached, so repeat
 *   calls are free and the chunk is fetched once. A failure is not cached, so
 *   a transient download error can recover on the next call.
 */
export const loadFirebase = () => (pending ??= import('@/firebase').then(
  (mod) => {
    status.value = 'ready'
    return mod
  },
  (error) => {
    if (status.value !== 'unavailable') {
      console.error('[SUNspot] Firebase no está disponible:', error?.message || error)
    }
    status.value = 'unavailable'
    pending = undefined
    throw error
  }
))

/** Resolves to the Firebase module, or `null` when it can't be loaded. */
export const loadFirebaseOrNull = () => loadFirebase().catch(() => null)

export const firebaseStatus = readonly(status)
