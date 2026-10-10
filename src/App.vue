<template>
  <AppLoader :show="internalLoading" />
  <Toast :show="toastShow" :message="toastMessage" :action-text="toastActionText" :action-route="toastActionRoute" />

  <router-view v-slot="{ Component }">
    <keep-alive include="Home">
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { loadFirebase } from '@/firebaseLazy'
import { readAuthSnapshot } from '@/utils/authCache'
import AppLoader from '@/components/ui/AppLoader.vue'
import Toast from '@/components/ui/Toast.vue'
import { useToast } from '@/composables/useToast'

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
  else loadFirebase().then(({ auth }) => auth.authStateReady()).then(floor)

  safety = setTimeout(finish, maxWait)
})
</script>