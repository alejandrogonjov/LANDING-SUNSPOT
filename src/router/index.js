import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/pages/Home.vue'
import { loadFirebase, loadFirebaseOrNull } from '@/firebaseLazy'
import { hasAnsweredOnboarding, wasPromptedThisSession, markPromptedThisSession } from '@/composables/useOnboarding'
import { readAuthSnapshot, resetAuthSnapshot } from '@/utils/authCache'
import { useToast } from '@/composables/useToast'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { wide: true },
  },
  {
    path: '/registro',
    name: 'login',
    component: () => import('@/views/auth/Auth.vue'),
    alias: '/register',
    meta: { title: 'Registro' }
  },
  {
    path: '/explorar',
    name: 'explore',
    component: () => import('@/views/pages/Explore.vue'),
    meta: { desktopWide: true, title: 'Explorar' }
  },
  {
    path: '/escanear',
    name: 'scan',
    component: () => import('@/views/pages/Scan.vue'),
  },
  {
    path: '/cuenta',
    name: 'account',
    meta: { desktopWide: true, requiresAuth: true },
    component: () => import('@/views/pages/Account.vue'),
  },
  {
    path: '/notificacion',
    name: 'notification',
    meta: { requiresAuth: true, title: 'Notificación' },
    component: () => import('@/views/pages/Notification.vue'),
  },
  {
    // Public: the appearance (dark mode) and geolocation preferences are
    // device-level and belong to a guest as much as to an account. The
    // account-only rows inside the page hide themselves when signed out.
    path: '/ajustes',
    name: 'settings',
    component: () => import('@/views/pages/Settings.vue'),
  },
  {
    path: '/perfil',
    name: 'profile',
    meta: { requiresAuth: true, title: 'Perfil' },
    component: () => import('@/views/pages/Profile.vue'),
  },
  {
    path: '/avatar',
    name: 'avatar',
    meta: { requiresAuth: true },
    component: () => import('@/views/pages/AvatarSelector.vue')
  },
  {
    path: '/spot/:id',
    name: 'spot',
    meta: { desktopWide: true },
    component: () => import('@/views/pages/Spot.vue'),
    props: true
  },
  {
    path: '/personal-spots',
    name: 'personal-spots',
    meta: { desktopWide: true, requiresAuth: true, title: 'Mis Spots' },
    component: () => import('@/views/pages/PersonalSpots.vue'),
  },
  {
    path: '/personal-spot/:id',
    name: 'personal-spot',
    meta: { requiresAuth: true, title: 'Spot Personal' },
    component: () => import('@/views/pages/PersonalSpot.vue'),
    props: true
  },
  {
    path: '/personal-map',
    name: 'personal-map',
    meta: { requiresAuth: true, title: 'Mapa Personal', wide: true },
    component: () => import('@/views/pages/PersonalMap.vue'),
  },
  {
    path: '/suncronizacion',
    name: 'circadian',
    component: () => import('@/views/pages/Circadian.vue'),
    meta: { title: 'Suncronización' }
  },
  {
    path: '/embajadores',
    name: 'ambassadors',
    meta: { desktopWide: true, title: 'Embajadores' },
    component: () => import('@/views/pages/Ambassadors.vue'),
  },
  {
    path: '/embajador/:id',
    name: 'ambassador',
    meta: { title: 'Embajador' },
    component: () => import('@/views/pages/Ambassador.vue'),
    props: true
  },
  {
    path: '/mis-favoritos',
    name: 'bookmarks',
    meta: { desktopWide: true, requiresAuth: true, title: 'Mis favoritos' },
    component: () => import('@/views/pages/Bookmarks.vue'),
  },
  {
    path: '/panel',
    name: 'dashboard',
    component: () => import('@/views/admin/Dashboard.vue'),
    meta: { desktopWide: true, requiresAdmin: true, title: 'Admin' }
  },
  {
    path: '/panel/spot/nuevo',
    name: 'admin-spot-new',
    component: () => import('@/views/admin/SpotManager.vue'),
    meta: { requiresAdmin: true, title: 'Nuevo Spot' }
  },
  {
    path: '/panel/spot/:id',
    name: 'admin-spot-edit',
    component: () => import('@/views/admin/SpotManager.vue'),
    meta: { requiresAdmin: true, title: 'Editar Spot' }
  },
  {
    path: '/panel/notificacion/nueva',
    name: 'admin-notif-new',
    component: () => import('@/views/admin/NotificationManager.vue'),
    meta: { requiresAdmin: true, title: 'Nueva Notificación' }
  },
  {
    path: '/panel/notificacion/:id',
    name: 'admin-notif-edit',
    component: () => import('@/views/admin/NotificationManager.vue'),
    meta: { requiresAdmin: true, title: 'Editar Notificación' }
  },
  {
    path: '/bienvenida',
    name: 'onboarding',
    component: () => import('@/views/pages/Onboarding.vue'),
    meta: { chrome: false, requiresAuth: true, title: 'Bienvenida' }
  },
  {
    path: '/descargar',
    name: 'descargar',
    component: () => import('@/views/pages/Download.vue'),
    meta: { title: 'Instalar SUNspot' }
  },
  // Keep last: catch-all for unmatched paths.
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/pages/StateError.vue'),
    meta: { title: 'No Encontrado' }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

/**
 * Confirms, after a navigation we allowed on the strength of the cached auth
 * snapshot, that the snapshot told the truth — and corrects course if it
 * didn't. When the snapshot was right, which is the overwhelming majority of
 * loads, this does nothing visible.
 */
const verifyNavigation = async (to) => {
  // Nothing to verify against when Firebase can't load (see the guard below).
  const firebase = await loadFirebaseOrNull()
  if (!firebase) return
  const { auth } = firebase
  await auth.authStateReady()
  const currentUser = auth.currentUser

  // If the user has navigated on since, that navigation went through this
  // guard on its own and owns the decision — don't yank them out of it.
  const stillThere = () => router.currentRoute.value.fullPath === to.fullPath

  if (!currentUser) {
    // Snapshot claimed a session that no longer exists (signed out elsewhere,
    // or the token was revoked). Correct it here rather than relying on
    // `useUser` — not every route imports it, and a snapshot left claiming a
    // dead session would send this user to /registro on every load.
    resetAuthSnapshot(null)

    if (to.matched.some(record => record.meta.requiresAuth) && stillThere()) {
      return router.replace('/registro')
    }
    return
  }

  if (to.name === 'onboarding' || wasPromptedThisSession()) return

  // Loaded even when no redirect follows: the answers also preload the
  // exposure wheel's phototype, which reads them reactively.
  const answered = await hasAnsweredOnboarding(currentUser.uid)
  if (answered || !stillThere()) return

  markPromptedThisSession()
  router.replace('/bienvenida')
}

router.beforeEach(async (to, from, next) => {

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)

  // Fast path. `auth.authStateReady()` costs an IndexedDB read and, for an
  // expired token, a network refresh — and on the map routes that lands
  // squarely in front of the first tile request. The cached snapshot answers
  // the same question synchronously when it knows enough to be sure of the
  // outcome; `verifyNavigation` re-checks it against Firebase afterwards.
  //
  // Admin routes are excluded: they need a Firestore role read regardless, so
  // there is nothing to gain and a wrong guess would flash the admin panel.
  const snapshot = requiresAdmin ? null : readAuthSnapshot()

  if (snapshot?.uid && snapshot.onboarded) {
    // Known signed in and past onboarding: nothing left to gate on.
    verifyNavigation(to)
    return next()
  }

  if (snapshot && !snapshot.uid && !requiresAuth) {
    // Known signed out, on a route that doesn't care: no user means no
    // onboarding redirect to consider either.
    //
    // Deliberately *not* extended to `requiresAuth` routes — bouncing to
    // /registro on the strength of a cached "signed out" would strand a user
    // whose session the cache hasn't caught up with yet. Denying access is
    // the one decision worth waiting for the real answer on.
    verifyNavigation(to)
    return next()
  }

  // No snapshot yet (first ever load), or a signed-in user we haven't
  // confirmed finished onboarding. Wait for the real answer — which now means
  // waiting for Firebase to load as well. That's the point: the fast path
  // above never touches Firebase at all, so it isn't in the entry graph.
  const firebase = await loadFirebaseOrNull()

  if (!firebase) {
    // Firebase could not load (a deploy without its VITE_FIREBASE_* variables,
    // or the chunk failed to download). Rejecting here used to abort *every*
    // navigation: the page looked fine but no link or button went anywhere.
    // Nobody can be verified, so keep protected routes closed and let public
    // ones through; App.vue tells the user the data service is unavailable.
    return (requiresAuth || requiresAdmin) ? next({ name: 'home' }) : next()
  }

  const { auth } = firebase
  await auth.authStateReady()
  const currentUser = auth.currentUser

  // 1. Basic Auth Check
  if (requiresAuth && !currentUser) {
    return next('/registro')
  }

  // 2. Onboarding. Asked once, right after the user's first login.
  // `wasPromptedThisSession` only suppresses the redirect, so a user who
  // navigates away mid-questionnaire isn't bounced back on every route change.
  if (currentUser) {
    const answered = await hasAnsweredOnboarding(currentUser.uid)

    if (!answered && to.name !== 'onboarding' && !wasPromptedThisSession()) {
      markPromptedThisSession()
      return next('/bienvenida')
    }
  }

  // 3. Admin Check
  if (requiresAdmin) {
    if (!currentUser) return next('/registro')

    try {
      const { db, doc, getDoc } = await loadFirebase()
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid))

      if (userDoc.exists() && userDoc.data().role === 'admin') {
        next() // Authorized: Let them in
      } else {
        next('/cuenta') // Not an admin: Send to account
      }
    } catch (error) {
      console.error("Admin Guard Error:", error)
      next('/cuenta') // Error: Safety redirect
    }
    return // Important: Exit the function here
  }

  next() // Default: Proceed
})

// A lazy route whose chunk can't be loaded. After a new deploy, a tab opened on
// the previous one asks for chunk hashes that no longer exist; the navigation
// fails and, without this, the click simply does nothing. Reload once into the
// target URL to pick up the new build (guarded so a real outage can't loop).
const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i
const RELOAD_KEY = 'sunspot_chunk_reload'

router.onError((error, to) => {
  if (!CHUNK_ERROR.test(error?.message || '')) {
    // e.g. a page that needs Firebase on a deploy without its configuration.
    // Say so instead of leaving the click without any response.
    console.error('Navigation error:', error)
    useToast().triggerToast('No se ha podido abrir esta sección. Inténtalo de nuevo más tarde.')
    return
  }
  try {
    if (sessionStorage.getItem(RELOAD_KEY) === to.fullPath) return
    sessionStorage.setItem(RELOAD_KEY, to.fullPath)
  } catch { /* storage blocked — reload anyway, once per page life */ }
  window.location.assign(to.fullPath)
})

router.afterEach(() => {
  try { sessionStorage.removeItem(RELOAD_KEY) } catch { /* ignore */ }
})

export default router