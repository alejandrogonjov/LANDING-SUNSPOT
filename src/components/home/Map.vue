<template>
  <main id="map-container">
    <Transition name="fade-fast">
      <MapSkeleton v-if="isMapLoading" />
    </Transition>

    <div ref="mapContainer" class="leaflet-map-element"></div>

    <div class="map-controls">
      <button class="map-btn" @click="openWeather" aria-label="Ver tiempo">
        <icon-mdi-weather-sunny v-if="isDay" />
        <icon-mdi-weather-night v-else />
      </button>

      <button v-show="isWithinRadius" class="map-btn" @click="locateUser" aria-label="Mi ubicación">
        <icon-mdi-crosshairs-gps />
      </button>
    </div>

    <div class="map-legend">
      <div v-for="cat in categoryKeys" :key="cat" class="legend-item">
        <span class="legend-dot" :style="{ backgroundColor: getCategoryColor(cat) }"></span>
        <span class="legend-label">{{ t(`categories.${cat}`) }}</span>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="slide-up">
        <SpotBottomSheet v-if="selectedSpot && !isWeatherOpen" :key="selectedSpot.id" :spot="selectedSpot"
          :user-location="userLocation" @close="selectedSpot = null" />

        <Weather v-else-if="isWeatherOpen" key="weather-sheet" @close="isWeatherOpen = false" />
      </Transition>
    </Teleport>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, onActivated, nextTick, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import SpotBottomSheet from '@/components/home/SpotBottomSheet.vue'
import Weather from '@/components/home/Weather.vue'
import '@maplibre/maplibre-gl-leaflet'
import MapSkeleton from '@/components/ui/MapSkeleton.vue'
import { useTranslator } from '@/composables/useTranslator'
import { useSettings } from '@/composables/useSettings'
import { useToast } from '@/composables/useToast'
import { calculateDistance } from '@/utils/geo'
import { MAP_STYLE_URL, loadLastView, saveLastView } from '@/utils/map'

const props = defineProps({
  spots: { type: Array, required: true }
})

const { t, categoryKeys, getCategoryColor } = useTranslator()

const VALENCIA_LAT = 39.4699
const VALENCIA_LNG = -0.3763
const RADIUS_KM = 20

const mapContainer = ref(null)
const isWeatherOpen = ref(false)
const selectedSpot = ref(null)
const userLocation = ref(null)
const isWithinRadius = ref(false)
const hasInitialLocation = ref(false)
const isMapLoading = ref(true)
const { geolocationEnabled } = useSettings()
const { triggerToast, triggerLocationDeniedToast } = useToast()

let map = null
let markerLayer = null
let loadingFallback = null
const userMarker = ref(null)
const userCircle = ref(null)

// 🔥 Helper to handle Firestore Geopoint -> Leaflet LatLng
const getLatLng = (spot) => {
  if (spot.location && spot.location.latitude) {
    return [spot.location.latitude, spot.location.longitude]
  }
  return [0, 0]
}

const renderMarkers = () => {
  if (!map || !props.spots) return
  if (markerLayer) markerLayer.clearLayers()
  else markerLayer = L.layerGroup().addTo(map)

  props.spots.forEach(spot => {
    const coords = getLatLng(spot)
    const spotColor = getCategoryColor(spot.category)

    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="marker-dot" style="background-color: ${spotColor}">
          <img src="/sunspot-skyline.svg" class="marker-internal-logo"/>
        </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })

    const marker = L.marker(coords, { icon: customIcon })
    marker.on('click', () => flyToSpot(spot))
    markerLayer.addLayer(marker)
  })
}

// Watch for real-time changes
watch(() => props.spots, () => {
  renderMarkers()
}, { deep: true })

const flyToSpot = (spot) => {
  if (!map) return
  const coords = getLatLng(spot)
  isWeatherOpen.value = false
  selectedSpot.value = spot
  map.flyTo([coords[0] - 0.002, coords[1]], 16, {
    animate: true,
    duration: 1.5
  })
}

const locateUser = () => {
  if (!map) return
  if (!geolocationEnabled.value) {
    triggerToast("La geolocalización está desactivada en Ajustes", "Ajustes", "/settings")
    return
  }
  if (!userLocation.value) {
    triggerToast("Buscando señal GPS...")
    return
  }
  map.flyTo([userLocation.value.lat, userLocation.value.lng], 16)
}

const isDay = computed(() => {
  const hour = new Date().getHours()
  return hour > 7 && hour < 20
})

const openWeather = () => {
  isWeatherOpen.value = !isWeatherOpen.value
  if (isWeatherOpen.value) selectedSpot.value = null
}

onActivated(() => {
  if (map) {
    // Recalculates the container size instantly when the component is re-shown
    map.invalidateSize()

    // Resume location tracking if enabled
    if (geolocationEnabled.value) {
      map.locate({ watch: true, enableHighAccuracy: true })
    }
  }
})

onMounted(async () => {
  if (map) return

  await nextTick()
  if (!mapContainer.value) return

  const corner1 = L.latLng(39.2899, -0.6096) // ~20km South and West
  const corner2 = L.latLng(39.6499, -0.1430) // ~20km North and East
  const valenciaBounds = L.latLngBounds(corner1, corner2)
  // Opening on the last known view (not just its centre — the zoom too) means
  // the tiles we fetch first are usually the ones we keep, so GPS reporting in
  // a moment later doesn't invalidate them.
  const lastView = loadLastView()
  const startCoords = [lastView.lat, lastView.lng]

  map = L.map(mapContainer.value, {
    center: startCoords,
    zoom: lastView.zoom,
    minZoom: 12,
    maxBounds: valenciaBounds,
    maxBoundsViscosity: 1.0,
    zoomControl: false,
    attributionControl: false
  })

  const glLayer = L.maplibreGL({
    style: MAP_STYLE_URL,
    pane: 'tilePane'
  }).addTo(map)

  // Reveal the map on the GL map's first visually complete frame. Leaflet's own
  // 'load' fires before MapLibre paints anything, so it's too early; the GL
  // 'idle' event is too late — it waits for *every* pending tile request to
  // settle, long past the point the visible area is painted and usable. GL
  // 'load' is exactly the frame where the visible tiles are on screen.
  // The timeout is a safety net for slow/failed networks.
  const revealMap = () => {
    if (!isMapLoading.value) return
    if (loadingFallback) { clearTimeout(loadingFallback); loadingFallback = null }
    if (map) map.invalidateSize()
    isMapLoading.value = false
  }
  const glMap = glLayer.getMaplibreMap?.()
  if (glMap) {
    glMap.once('load', revealMap)
    glMap.once('error', revealMap)
  }
  loadingFallback = setTimeout(revealMap, 3000)

  renderMarkers()

  map.on('locationfound', (e) => {
    const dist = calculateDistance(e.latlng.lat, e.latlng.lng, VALENCIA_LAT, VALENCIA_LNG)
    const withinRadius = dist <= RADIUS_KM
    isWithinRadius.value = withinRadius
    userLocation.value = { lat: e.latlng.lat, lng: e.latlng.lng }

    if (withinRadius) {
      saveLastView(e.latlng.lat, e.latlng.lng, map.getZoom())

      if (!hasInitialLocation.value && !selectedSpot.value) {
        // While the skeleton is still up there is nothing on screen to animate,
        // and an animated flyTo would fetch tiles for every frame along the
        // path — a whole extra tile set, mid-load, that the user never sees.
        // Jump instead; MapLibre then drops the abandoned view's requests.
        // Once the map is visible, animate as before.
        if (isMapLoading.value) map.setView(e.latlng, lastView.zoom, { animate: false })
        else map.flyTo(e.latlng, lastView.zoom)
        hasInitialLocation.value = true
      }

      if (!userMarker.value) {
        userCircle.value = L.circle(e.latlng, { radius: e.accuracy / 2, color: '#3b82f6', weight: 1, fillOpacity: 0.1 }).addTo(map)
        userMarker.value = L.circleMarker(e.latlng, { radius: 7, fillColor: '#3b82f6', color: 'white', weight: 3, fillOpacity: 1 }).addTo(map)
      } else {
        userCircle.value.setLatLng(e.latlng)
        userCircle.value.setRadius(e.accuracy / 2)
        userMarker.value.setLatLng(e.latlng)
      }
    } else {
      // Outside radius — remove blue dot if it was previously shown
      if (userMarker.value) { userMarker.value.remove(); userMarker.value = null }
      if (userCircle.value) { userCircle.value.remove(); userCircle.value = null }

      if (!hasInitialLocation.value && !selectedSpot.value) {
        map.setView(startCoords, lastView.zoom, { animate: false })
        hasInitialLocation.value = true
      }
    }
  })

  map.on('locationerror', (e) => {
    console.warn("Leaflet geolocation error:", e.message)
    // Only show "location denied" alert if permission is the issue
    if (e.message.toLowerCase().includes("denied") || e.message.toLowerCase().includes("blocked") || e.message.toLowerCase().includes("permission")) {
      triggerLocationDeniedToast()
    }
    
    // Set fallback default view
    if (!hasInitialLocation.value && !selectedSpot.value) {
      map.setView(startCoords, lastView.zoom, { animate: false })
      hasInitialLocation.value = true
    }
  })

  if (geolocationEnabled.value) {
    map.locate({ watch: true, enableHighAccuracy: true })
  } else {
    // Geolocation disabled in Settings — the view the map opened on is final.
    hasInitialLocation.value = true
  }

})

onBeforeUnmount(() => {
  if (loadingFallback) { clearTimeout(loadingFallback); loadingFallback = null }
  if (map) {
    map.stopLocate()
  }
})

defineExpose({ flyToSpot })
</script>

<style scoped>
#map-container {
  width: 100%;
  height: 100dvh;
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--clr-background);
  z-index: 1;
  touch-action: pan-x pan-y;
}

.leaflet-map-element {
  width: 100%;
  height: 100%;
}

/* Stacked Controls */
.map-controls {
  position: absolute;
  /* #map-container is absolute inside #app, which body's safe-area-top padding
     pushes down — so the container's bottom edge overflows the viewport by
     safe-area-top. Add it back here so the gap above the Nav stays constant
     across iOS (notch) and Android. */
  bottom: calc(var(--total-nav-height) + var(--safe-area-top) + 2.5rem);
  right: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 900;
}

.map-btn {
  background: var(--clr-white);
  color: var(--clr-primary);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--clr-border);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.map-btn:active {
  transform: scale(0.9);
}

/* Legend Pill */
.map-legend {
  position: absolute;
  left: 1.5rem;
  /* Same safe-area-top compensation as .map-controls (see note above). */
  bottom: calc(var(--total-nav-height) + var(--safe-area-top) + 2.5rem);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.7rem 0.6rem;
  background: var(--clr-glass-strong);
  backdrop-filter: blur(8px);
  border-radius: 14px;
  border: 1px solid var(--clr-glass-border);
  box-shadow: var(--shadow-sm);
  z-index: 900;
  pointer-events: none;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid var(--clr-glass-border);
  flex-shrink: 0;
}

.legend-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--clr-dark);
  white-space: nowrap;
  letter-spacing: 0.01em;
}

/* Markers */
:deep(.custom-marker) {
  background: none !important;
  border: none !important;
}

:deep(.marker-dot) {
  width: 26px;
  height: 26px;
  border: 2px solid white;
  /* Slightly thinner border looks cleaner with colors */
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: transform 0.2s ease;
}

:deep(.marker-internal-logo) {
  width: 90%;
  height: 90%;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

/* Skeleton fade-out */
.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.4s ease;
}

.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}

/* Teleport Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
}

.slide-up-enter-from :deep(.bottom-sheet),
.slide-up-leave-to :deep(.bottom-sheet) {
  transform: translateY(100%);
}
</style>