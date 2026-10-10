<template>
  <AppLoader :show="internalLoading" />
  <Toast :show="toastShow" :message="toastMessage" :action-text="toastActionText" :action-route="toastActionRoute" />

  <!-- Firebase couldn't load: say so, rather than leave a page whose data
       never arrives and whose account actions silently fail. -->
  <div v-if="firebaseStatus === 'unavailable'" class="service-banner" role="alert">
    <icon-mdi-cloud-off-outline class="service-banner-icon" aria-hidden="true" />
    <span>{{ t('service.unavailable') }}</span>
  </div>

  <!-- Desktop only (≥ 1024px): replaces the bottom nav and the menu drawer. -->
  <DesktopSidebar v-if="showSidebar" />

  <!-- Layout-transparent on mobile (`display: contents`), so pages stay direct
       children of #app exactly as before. On desktop it is the content column
       next to the sidebar, sized by the route — see style.css › Desktop. -->
  <div class="app-view">
    <router-view v-slot="{ Component }">
      <keep-alive include="Home">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { loadFirebase, firebaseStatus } from '@/firebaseLazy'
import { useTranslator } from '@/composables/useTranslator'
import { readAuthSnapshot } from '@/utils/authCache'
import AppLoader from '@/components/ui/AppLoader.vue'
import Toast from '@/components/ui/Toast.vue'
import DesktopSidebar from '@/components/inc/DesktopSidebar.vue'
import { useToast } from '@/composables/useToast'
import { useViewport } from '@/composables/useViewport'

const internalLoading = ref(true)
const { show: toastShow, message: toastMessage, actionText: toastActionText, actionRoute: toastActionRoute } = useToast()

// Map-first pages (home, personal map) widen the app band via the `wide` route meta.
const route = useRoute()
watch(
  () => route.meta.wide,
  (wide) => {
    document.getElementById('app')?.classList.toggle('app--wide', !!wide)
  },
  { immediate: true }
)

// Desktop composition. `chrome: false` routes (the onboarding questionnaire)
// keep their focused, full-screen flow; `desktopWide` routes get the wide
// content column instead of the default 768px one.
const { isDesktop } = useViewport()
const showSidebar = computed(() => isDesktop.value && route.meta.chrome !== false)
watch(showSidebar, (show) => {
  document.getElementById('app')?.classList.toggle('app--with-sidebar', show)
}, { immediate: true })
watch(
  () => route.meta.desktopWide,
  (wide) => {
    document.getElementById('app')?.classList.toggle('app--page-wide', !!wide)
  },
  { immediate: true }
)

const { t } = useTranslator()

onMounted(() => {
  // The splash covers the window where we don't yet know what to render. With
  // a cached auth snapshot we do — `useUser` seeds the signed-in state from it
  // synchronously — so the splash is down to its anti-flash floor and never
  // waits on Firebase (an IndexedDB read, sometimes a token refresh) or on the
  // Firestore user document (a network read).
  //
  // Without a snapshot — a genuinely first-ever load — there is nothing to
  // render optimistically, so wait for auth rather than flash a signed-out
  // header at a signed-in user. That happens once per browser.
  const startTime = Date.now()
  const minimumTime = 400
  const maxWait = 5000

  let safety = null
  const finish = () => {
    internalLoading.value = false
    if (safety) { clearTimeout(safety); safety = null }
  }

  const floor = () => setTimeout(finish, Math.max(0, minimumTime - (Date.now() - startTime)))

  if (readAuthSnapshot()) floor()
  // If Firebase can't load there is no answer to wait for — don't hold the
  // splash for the full safety timeout.
  else loadFirebase().then(({ auth }) => auth.authStateReady()).then(floor, floor)

  safety = setTimeout(finish, maxWait)
})
</script>

<style scoped>
.service-banner {
  position: fixed;
  top: calc(var(--safe-area-top) + 0.75rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: 2500;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: max-content;
  max-width: calc(100vw - 2rem);
  padding: 0.7rem 1rem;
  border-radius: var(--radius-md);
  background: var(--clr-danger-soft);
  border: 1px solid color-mix(in srgb, var(--clr-danger), transparent 60%);
  color: var(--clr-text);
  font-size: 0.85rem;
  font-weight: 700;
  box-shadow: var(--shadow-md);
}

.service-banner-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  color: var(--clr-danger);
}

@media (min-width: 1024px) {
  .service-banner {
    left: calc(50% + var(--sidebar-width) / 2);
  }
}
</style>
