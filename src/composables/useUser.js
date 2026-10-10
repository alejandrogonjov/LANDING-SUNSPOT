import { ref, readonly, computed } from 'vue'
import { loadFirebase } from '@/firebaseLazy'
import { readAuthSnapshot, writeAuthSnapshot, resetAuthSnapshot } from '@/utils/authCache'

// Read once, at module load, purely to seed the initial render. Anything that
// needs the *current* snapshot must re-read it — this one goes stale the moment
// the user signs in or out.
const initialSnapshot = readAuthSnapshot()

const user = ref(null)
// Seeded from the cached snapshot so the header paints the right avatar on the
// first frame instead of flashing the signed-out icon while Firebase resolves.
// The live Firestore document replaces it as soon as it arrives.
const userData = ref(initialSnapshot?.userData ?? null)
const loading = ref(true)
const authResolved = ref(false)

// Firebase arrives on demand (see firebaseLazy.js). Until it does, the state
// above is whatever the cached snapshot said — which is what lets the header
// render on the first frame without Firebase in the entry graph.
loadFirebase().then(({ auth, db, onAuthStateChanged, doc, onSnapshot }) => {
  // The live listener on the signed-in user's document. Dropped on every auth
  // change: left running past a sign-out, Firestore re-runs it without
  // credentials and the rules answer permission-denied (logged as an error on
  // every logout).
  let unsubscribeUserDoc = null

  onAuthStateChanged(auth, (firebaseUser) => {
    authResolved.value = true

    if (unsubscribeUserDoc) {
      unsubscribeUserDoc()
      unsubscribeUserDoc = null
    }

    if (!firebaseUser) {
      user.value = null
      userData.value = null
      loading.value = false
      resetAuthSnapshot(null)
      return
    }

    loading.value = true
    user.value = firebaseUser

    // A different account on this device must not inherit the cached one's
    // document, so drop the seed rather than showing the wrong person. Read
    // the snapshot fresh: signing out and back in within one page session
    // leaves `initialSnapshot` pointing at a state two transitions old.
    if (readAuthSnapshot()?.uid !== firebaseUser.uid) {
      userData.value = null
      resetAuthSnapshot(firebaseUser.uid)
    }

    const userRef = doc(db, 'users', firebaseUser.uid)

    // Add the error callback (the second argument)
    unsubscribeUserDoc = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        userData.value = { uid: firebaseUser.uid, ...docSnap.data() }
        writeAuthSnapshot({ userData: userData.value }, firebaseUser.uid)
      }
      loading.value = false // SUCCESS: Turn off loader
    }, (error) => {
      // ERROR: This is critical. If Firestore fails, we MUST stop loading.
      console.error("Firestore Snapshot Error:", error)
      loading.value = false
    })
  })
}).catch(() => {
  // Firebase unavailable (see firebaseLazy.js, which logs why). Settle the
  // state instead of leaving `loading` on forever.
  authResolved.value = true
  loading.value = false
})

export function useUser() {
  /**
   * Scans a Spot QR to mark it as visited.
   * @param {String} spotId 
   */
  const scanSpot = async (spotId) => {
    if (!user.value || !userData.value) return

    // 1. Prevent duplicate points (Minimalist security)
    const alreadyVisited = userData.value.visited_spots?.[spotId]
    if (alreadyVisited) {
      console.log("Spot ya visitado")
      return
    }

    const { db, doc, updateDoc, serverTimestamp } = await loadFirebase()
    const userRef = doc(db, 'users', user.value.uid)

    try {
      await updateDoc(userRef, {
        // Uses dot notation to add a new key to the visited_spots map
        [`visited_spots.${spotId}`]: serverTimestamp(),
        updated_at: serverTimestamp()
      })
    } catch (error) {
      console.error("Error scanning spot:", error)
      throw error
    }
  }

  return {
    user: readonly(user),
    userData: readonly(userData),
    loading: readonly(loading),
    authResolved: readonly(authResolved),
    // Optimistic *only* during the resolution window: until Firebase answers
    // we trust the cached snapshot, after which this is the plain truth. Keeps
    // the header from flashing signed-out at a signed-in user on every load.
    isLoggedIn: computed(() => authResolved.value ? !!user.value : !!initialSnapshot?.uid),
    scanSpot
  }
}