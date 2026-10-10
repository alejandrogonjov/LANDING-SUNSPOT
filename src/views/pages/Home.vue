<template>
  <MainLayout>
    <Header :spots="spots" @toggle-menu="isDrawerOpen = true" @select-spot="handleSpotSelection" />
    <Map ref="mapRef" :spots="spots" />
    <MenuDrawer :is-open="isDrawerOpen" @close="isDrawerOpen = false" />

    <Transition name="fade">
      <div v-if="loading && !showToast" class="data-status-toast">
        Sincronizando puntos...
      </div>
    </Transition>
  </MainLayout>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useSpots } from '@/composables/useSpots'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import Header from '@/components/home/Header.vue'
import Map from '@/components/home/Map.vue'
import MenuDrawer from '@/components/inc/MenuDrawer.vue'
import { useToast } from '@/composables/useToast'

defineOptions({
  name: 'Home'
})

const isDrawerOpen = ref(false)
const mapRef = ref(null)
const { spots, loading } = useSpots()
const route = useRoute()
const router = useRouter()

const { show: showToast, triggerToast } = useToast()

// Unified Watcher: Handles initial load and URL changes
watch(
  () => route.query.action,
  (action) => {
    if (!action) return

    const messages = {
      'logged-out': '¡Gracias por visitarnos!',
      'logged-in': '¡Qué bueno verte de nuevo!',
      'signed-up': '¡Bienvenido a SUNspot, Explorador!'
    }

    if (messages[action]) {
      triggerToast(messages[action])
      // Clean URL so the toast doesn't repeat on refresh after standard timeout
      setTimeout(() => {
        router.replace({ query: {} })
      }, 3000)
    }
  },
  { immediate: true }
)

const handleSpotSelection = (spot) => {
  mapRef.value?.flyToSpot(spot)
}
</script>

<style scoped>
.data-status-toast {
  position: fixed;
  bottom: calc(var(--total-nav-height) + 0.5rem);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 1900;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
</style>