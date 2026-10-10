import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { vDragClose } from '@/directives/dragClose'
// Imported for its side effect: registers the beforeinstallprompt listener
// immediately, before the app mounts. See composables/usePwaInstall.js.
import '@/composables/usePwaInstall'
import { registerSW } from 'virtual:pwa-register'

// Mount immediately. Auth state is not a prerequisite for rendering: the
// router guard awaits `auth.authStateReady()` for the routes that actually
// need it, and `useUser()` exposes auth reactively to everything else.
// Waiting for the first onAuthStateChanged callback here put an IndexedDB
// read — plus, for an expired token, a network refresh — in front of the
// first paint of every page, the map included.
createApp(App)
  .use(router)
  .directive('drag-close', vDragClose)
  .mount('#app')

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nueva versión disponible. ¿Actualizar?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App lista para uso offline')
  },
})