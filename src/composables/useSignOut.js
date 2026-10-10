import { useRouter } from 'vue-router'
import { loadFirebase } from '@/firebaseLazy'

/**
 * Sign-out as the navigation chrome does it (menu drawer, user menu, desktop
 * sidebar): sign out, then land on the map with the `logged-out` toast.
 * Goes through `loadFirebase()` because these components are in the entry
 * graph — see firebaseLazy.js.
 */
export function useSignOut() {
  const router = useRouter()

  const signOutAndGoHome = async () => {
    try {
      const { auth, signOut } = await loadFirebase()
      await signOut(auth)
      router.push({ path: '/', query: { action: 'logged-out' } })
      return true
    } catch (error) {
      console.error('Error signing out:', error)
      return false
    }
  }

  return { signOutAndGoHome }
}
