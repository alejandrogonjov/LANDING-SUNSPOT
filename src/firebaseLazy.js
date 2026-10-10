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

let pending

/**
 * @returns {Promise} the module: `auth`, `db`, `getCurrentUser`, plus the
 *   Firestore/Auth functions re-exported from firebase.js. Cached, so repeat
 *   calls are free and the chunk is fetched once.
 */
export const loadFirebase = () => (pending ??= import('@/firebase'))
