<template>
  <MainLayout>
    <!-- Mobile chrome. On desktop the sidebar (App.vue) and the side panel
         below carry the menu, the account entry point and the search. -->
    <Header v-if="!isDesktop" :spots="spots" @toggle-menu="isDrawerOpen = true" @select-spot="handleSpotSelection" />

    <!-- Both wrappers are `display: contents` on mobile, so the map keeps
         filling #app exactly as before; on desktop they lay out panel | map.
         The Map is never re-parented, so crossing the breakpoint keeps it. -->
    <div class="home-layout">
      <MapExplorerPanel v-if="isDesktop" :spots="spots" :loading="loading" :error="error"
        :selected-spot="selectedSpot" @select="handleSpotSelection" @clear="selectedSpot = null"
        @hover="hoveredSpotId = $event" />

      <div class="home-map">
        <Map ref="mapRef" v-model:selected-spot="selectedSpot" :spots="spots" :highlighted-spot-id="hoveredSpotId" />
      </div>
    </div>

    <MenuDrawer v-if="!isDesktop" :is-open="isDrawerOpen" @close="isDrawerOpen = false" />

    <Transition name="fade">
      <div v-if="loading && !showToast && !isDesktop" class="data-status-toast">
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
import MapExplorerPanel from '@/components/home/MapExplorerPanel.vue'
import { useToast } from '@/composables/useToast'
import { useViewport } from '@/composables/useViewport'

defineOptions({
  name: 'Home'
})

const isDrawerOpen = ref(false)
const mapRef = ref(null)
const { spots, loading, error } = useSpots()
const { isDesktop } = useViewport()

// Shared by the map (markers, mobile bottom sheet) and the desktop side panel.
const selectedSpot = ref(null)
const hoveredSpotId = ref(null)

// The drawer doesn't exist on desktop; don't let it reappear open on the way back.
watch(isDesktop, () => { isDrawerOpen.value = false })
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
.home-layout,
.home-map {
  display: contents;
}

@media (min-width: 1024px) {
  .home-layout {
    display: flex;
    height: 100dvh;
  }

  .home-map {
    display: block;
    position: relative;
    flex: 1;
    min-width: 0;
  }
}

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