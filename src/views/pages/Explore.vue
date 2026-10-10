<template>
  <DefaultLayout>
    <div id="explore-page">
      <header class="explore-header">
        <button @click="showFilters = true" class="filter-btn" :class="{ 'has-filters': hasActiveFilters }"
          aria-label="Filtros">
          <icon-mdi-tune />
        </button>
      </header>

      <div class="spots-list">
        <div v-if="loading" class="loading-state">
          <div class="sun-loader"></div>
          <p>Buscando rincones con sol...</p>
        </div>

        <template v-else-if="filteredSpots.length > 0">
          <SpotCard v-for="spot in pagedSpots" :key="spot.id" :spot="spot" :user-location="userLocation" />
          <div v-if="hasMore" ref="sentinel" class="load-more">
            <div class="sun-loader"></div>
          </div>
        </template>

        <div v-else class="empty-state">
          <div class="empty-icon">☁️</div>
          <h3>No hay resultados</h3>
          <p>Prueba a ajustar tus filtros</p>
          <button @click="clearFilters" class="reset-link">Limpiar filtros</button>
        </div>
      </div>

      <ExploreFilters :show="showFilters" :filters="filters" @close="showFilters = false" @clear="clearFilters"
        @update:filters="val => Object.assign(filters, val)" />
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import SpotCard from '@/components/explore/SpotCard.vue' // New Component
import ExploreFilters from '@/components/explore/ExploreFilters.vue'
import { db } from '@/firebase'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { useSettings } from '@/composables/useSettings'
import { useToast } from '@/composables/useToast'

// State
const spots = ref([])
const loading = ref(true)
const userLocation = ref(null)
const showFilters = ref(false)
let watchId = null

// Pagination (endless scroll): render 20 spots at a time, load 20 more at the end
const PAGE_SIZE = 20
const visibleCount = ref(PAGE_SIZE)
const sentinel = ref(null)
let observer = null

const { geolocationEnabled } = useSettings()
const { triggerLocationDeniedToast } = useToast()

const filters = reactive({
  category: '',
  sunType: 'all',
  accessType: 'all',
  hasShadow: false,
  hasNaturalShadow: false,
  isQuiet: false,
  isWindy: false
})

// Computed
const hasActiveFilters = computed(() =>
  filters.category !== '' ||
  filters.sunType !== 'all' ||
  filters.accessType !== 'all' ||
  filters.hasShadow ||
  filters.hasNaturalShadow ||
  filters.isQuiet ||
  filters.isWindy
)

const filteredSpots = computed(() => {
  return spots.value.filter(spot => {
    const matchCat = !filters.category || spot.category === filters.category
    const matchSun = filters.sunType === 'all' ||
      (filters.sunType === 'sunrise' && spot.is_sunrise) ||
      (filters.sunType === 'sunset' && spot.is_sunset)

    let matchAccess = true
    if (filters.accessType === 'free') {
      matchAccess = spot.is_free === true
    } else if (filters.accessType === 'paid') {
      matchAccess = spot.is_free === false
    }

    const matchShadow = !filters.hasShadow || spot.has_shadow
    const matchNaturalShadow = !filters.hasNaturalShadow || spot.has_natural_shadow
    const matchQuiet = !filters.isQuiet || spot.is_quiet
    const matchWindy = !filters.isWindy || spot.is_windy

    return matchCat && matchSun && matchAccess && matchShadow && matchNaturalShadow && matchQuiet && matchWindy
  })
})

const pagedSpots = computed(() => filteredSpots.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleCount.value < filteredSpots.value.length)

const loadMore = () => {
  if (hasMore.value) visibleCount.value += PAGE_SIZE
}

// Reset to the first page whenever the filters change
watch(filters, () => { visibleCount.value = PAGE_SIZE }, { deep: true })

// (Re)observe the sentinel whenever it mounts/unmounts
watch(sentinel, (el) => {
  if (!observer) return
  observer.disconnect()
  if (el) observer.observe(el)
})

// Methods
const clearFilters = () => {
  filters.category = ''
  filters.sunType = 'all'
  filters.accessType = 'all'
  filters.hasShadow = false
  filters.hasNaturalShadow = false
  filters.isQuiet = false
  filters.isWindy = false
}

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting || !hasMore.value) return
    loadMore()
    // Re-arm so short lists (sentinel still on screen) keep loading
    const el = sentinel.value
    if (el) {
      observer.unobserve(el)
      nextTick(() => { if (sentinel.value && hasMore.value) observer.observe(sentinel.value) })
    }
  }, { rootMargin: '300px' })

  const q = query(collection(db, 'spots'))
  onSnapshot(q, (snapshot) => {
    spots.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    loading.value = false
  })

  if (geolocationEnabled.value && "geolocation" in navigator) {
    watchId = navigator.geolocation.watchPosition((pos) => {
      userLocation.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    }, (err) => {
      console.warn("Geo error:", err)
      if (err.code === err.PERMISSION_DENIED) {
        triggerLocationDeniedToast()
      }
      userLocation.value = null
    })
  }
})

onBeforeUnmount(() => {
  if (watchId) navigator.geolocation.clearWatch(watchId)
  if (observer) observer.disconnect()
})
</script>

<style scoped>
#explore-page {
  background-color: var(--clr-background);
  min-height: 100dvh;
}

.explore-header {
  text-align: right;
  padding: 0 1.25rem 1rem;
}

.filter-btn {
  color: var(--clr-text-muted);
  font-size: 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
}

.filter-btn.has-filters {
  color: var(--clr-primary);
}

.spots-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0 1.25rem 2rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--clr-text-muted);
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}

.sun-loader {
  width: 32px;
  height: 32px;
  margin: 0 auto;
  border: 3px solid var(--clr-primary-soft);
  border-top: 3px solid var(--clr-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.reset-link {
  margin-top: 1rem;
  background: var(--clr-primary);
  color: var(--clr-on-brand);
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
}
</style>