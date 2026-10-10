import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Supplied at build time from `.env` locally and from the host's environment
// variables in production — see `.env.example` and docs/dev/environment.md.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

const firebaseApp = initializeApp(firebaseConfig)

const auth = getAuth(firebaseApp)
const db = getFirestore(firebaseApp)

/**
 * The signed-in user, once Firebase has actually resolved who that is.
 *
 * Always prefer this over reading `auth.currentUser` directly: the app renders
 * before auth resolves (see router/index.js), so a bare `auth.currentUser` can
 * be null at setup for a user who is in fact signed in.
 */
const getCurrentUser = async () => {
  await auth.authStateReady()
  return auth.currentUser
}

export { auth, db, getCurrentUser }

// Re-exported so `loadFirebase()` can hand a caller everything it needs from a
// single dynamic import — see firebaseLazy.js. Named re-exports (rather than a
// namespace) keep these tree-shakeable. Modules already off the critical path
// are free to import them from 'firebase/*' directly instead.
export { onAuthStateChanged, signOut } from 'firebase/auth'
export {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'