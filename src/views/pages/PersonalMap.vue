<template>
  <AltLayout>
    <div id="personal-map-page">
      <Transition name="fade-fast">
        <div v-if="isMapLoading" class="map-skeleton">
          <div class="skeleton-pulse"></div>
        </div>
      </Transition>

      <div ref="mapContainer" class="leaflet-map-element"></div>

      <div v-if="mapBaseError" class="map-base-error" role="status">
        <icon-mdi-map-marker-alert-outline aria-hidden="true" />
        <span>{{ t('map.base_error') }}</span>
      </div>

      <!-- Floating header -->
      <PersonalFloat @select-spot="flyToSpot" />

      <!-- Map controls -->
      <div class="map-controls">
        <button v-show="isWithinRadius" class="map-btn" @click="locateUser" aria-label="Mi ubicación">
          <icon-mdi-crosshairs-gps />
        </button>
      </div>

      <div v-if="isDesktop" class="map-controls-left">
        <button class="map-btn" @click="zoomIn" aria-label="Aumentar zoom">
          <icon-mdi-plus />
        </button>
        <button class="map-btn" @click="zoomOut" aria-label="Disminuir zoom">
          <icon-mdi-minus />
        </button>
      </div>

      <!-- Empty overlay -->
      <Transition name="fade">
        <div v-if="geoSpots.length === 0 && !isMapLoading" class="empty-overlay">
          <div class="empty-card">
            <icon-mdi-map-marker-off-outline class="empty-icon" />
            <p>Tus spots aparecerán aquí cuando les añadas ubicación.</p>
            <router-link to="/personal-spots" class="btn-primary">
              <icon-mdi-format-list-bulleted />
              Ir a Mis Spots
            </router-link>
          </div>
        </div>
      </Transition>

      <!-- Spot bottom sheet -->
      <Teleport to="body">
        <Transition name="slide-up">
          <PersonalSpotBottomSheet v-if="selectedSpot" :spot="selectedSpot" @close="selectedSpot = null"
            @deleted="selectedSpot = null" />
        </Transition>
      </Teleport>
    </div>
  </AltLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@maplibre/maplibre-gl-leaflet'
import AltLayout from '@/layouts/AltLayout.vue'
import PersonalFloat from '@/components/personal/Float.vue'
import PersonalSpotBottomSheet from '@/components/personal/PersonalSpotBottomSheet.vue'
import { usePersonalSpots } from '@/composables/usePersonalSpots'
import { useSettings } from '@/composables/useSettings'
import { useToast } from '@/composables/useToast'
import { useTranslator } from '@/composables/useTranslator'
import { calculateDistance } from '@/utils/geo'
import { MAP_STYLE_URL, loadLastView, saveLastView } from '@/utils/map'

const { spots } = usePersonalSpots()
const { geolocationEnabled } = useSettings()
const { triggerToast, triggerLocationDeniedToast } = useToast()
const { t } = useTranslator()

const VALENCIA_LAT = 39.4699
const VALENCIA_LNG = -0.3763
const RADIUS_KM = 20

const mapContainer = ref(null)
const isMapLoading = ref(true)
const mapBaseError = ref(false)
const selectedSpot = ref(null)
const userLocation = ref(null)
const isWithinRadius = ref(false)
const hasInitialLocation = ref(false)
const isDesktop = ref(false)

let map = null
let markerLayer = null
let loadingFallback = null
const userMarker = ref(null)
const userCircle = ref(null)

// Only spots with coordinates
const geoSpots = computed(() => spots.value.filter(s => s.lat != null && s.lng != null))

const renderMarkers = () => {
  if (!map) return
  if (markerLayer) markerLayer.clearLayers()
  else markerLayer = L.layerGroup().addTo(map)

  geoSpots.value.forEach(spot => {
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="marker-dot personal-marker">
          <img src="/sunspot-skyline.svg" class="marker-internal-logo"/>
        </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })

    const marker = L.marker([spot.lat, spot.lng], { icon: customIcon })
    marker.on('click', () => flyToSpot(spot))
    markerLayer.addLayer(marker)
  })
}

watch(geoSpots, () => renderMarkers(), { deep: true })

const flyToSpot = (spot) => {
  if (!map) return
  selectedSpot.value = spot
  map.flyTo([spot.lat - 0.002, spot.lng], 16, {
    animate: true,
    duration: 1.5
  })
}

const locateUser = () => {
  if (!map) return
  if (!geolocationEnabled.value) {
    triggerToast("La geolocalización está desactivada en Ajustes", "Ajustes", "/ajustes")
    return
  }
  if (!userLocation.value) {
    triggerToast("Buscando señal GPS...")
    return
  }
  map.flyTo([userLocation.value.lat, userLocation.value.lng], 16)
}

const zoomIn = () => map?.zoomIn()
const zoomOut = () => map?.zoomOut()

const checkDesktop = () => {
  isDesktop.value = window.matchMedia('(pointer: fine)').matches
}

onMounted(async () => {
  if (map) return
  await nextTick()
  if (!mapContainer.value) return

  const corner1 = L.latLng(39.2899, -0.6096) // ~20km South and West
  const corner2 = L.latLng(39.6499, -0.1430) // ~20km North and East
  const valenciaBounds = L.latLngBounds(corner1, corner2)
  // Open on the last known view (centre and zoom) so the first tile set we
  // fetch is usually the one we keep. See utils/map.js.
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

  // Reveal on the GL map's first visually complete frame ('load'). Leaflet's
  // own 'load' fires before MapLibre paints; the GL 'idle' event waits for
  // every pending tile request to settle, well past the point the visible area
  // is painted. Timeout is a safety net for slow/failed networks.
  const revealMap = () => {
    if (!isMapLoading.value) return
    if (loadingFallback) { clearTimeout(loadingFallback); loadingFallback = null }
    if (map) map.invalidateSize()
    isMapLoading.value = false
  }
  const glMap = glLayer.getMaplibreMap?.()
  if (glMap) {
    glMap.once('load', revealMap)
    glMap.once('error', () => {
      // Style didn't load before the first frame — see components/home/Map.vue.
      if (isMapLoading.value) mapBaseError.value = true
      revealMap()
    })
  }
  loadingFallback = setTimeout(revealMap, 3000)

  renderMarkers()

  // If we have geo spots, fit bounds to show all of them
  if (geoSpots.value.length > 0) {
    const bounds = L.latLngBounds(geoSpots.value.map(s => [s.lat, s.lng]))
    map.fitBounds(bounds.pad(0.3), { maxZoom: 16, animate: false })
    hasInitialLocation.value = true
  }

  map.on('locationfound', (e) => {
    const dist = calculateDistance(e.latlng.lat, e.latlng.lng, VALENCIA_LAT, VALENCIA_LNG)
    const withinRadius = dist <= RADIUS_KM
    isWithinRadius.value = withinRadius
    userLocation.value = { lat: e.latlng.lat, lng: e.latlng.lng }

    if (withinRadius) {
      saveLastView(e.latlng.lat, e.latlng.lng, map.getZoom())

      if (!hasInitialLocation.value && !selectedSpot.value) {
        // Nothing is on screen yet while the skeleton is up, so jump rather
        // than animate — a flyTo here would fetch a second tile set along a
        // path the user never sees. Animate only once the map is visible.
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
    if (e.message.toLowerCase().includes("denied") || e.message.toLowerCase().includes("blocked") || e.message.toLowerCase().includes("permission")) {
      triggerLocationDeniedToast()
    }
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

  checkDesktop()
  window.addEventListener('resize', checkDesktop)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkDesktop)
  if (loadingFallback) { clearTimeout(loadingFallback); loadingFallback = null }
  if (map) {
    map.stopLocate()
    map.remove()
    map = null
  }
})
</script>

<style scoped>
#personal-map-page {
  width: 100%;
  height: 100dvh;
  position: relative;
  background-color: var(--clr-background);
}

.leaflet-map-element {
  width: 100%;
  height: 100%;
}

/* --- Skeleton --- */
.map-skeleton {
  position: absolute;
  inset: 0;
  z-index: 800;
  background: var(--clr-background);
  display: flex;
  align-items: center;
  justify-content: center;
}

.skeleton-pulse {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--clr-sunspot-400) 0%, var(--clr-primary) 100%);
  animation: sk-pulse 1.4s ease-in-out infinite;
}

@keyframes sk-pulse {

  0%,
  100% {
    transform: scale(0.85);
    opacity: 0.4;
  }

  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

/* --- Controls --- */
.map-controls,
.map-controls-left {
  position: absolute;
  bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 900;
}

.map-controls {
  right: 1.5rem;
}

.map-controls-left {
  left: 1.5rem;
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

/* --- Markers --- */
:deep(.custom-marker) {
  background: none !important;
  border: none !important;
}

:deep(.marker-dot) {
  width: 26px;
  height: 26px;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: transform 0.2s ease;
}

:deep(.personal-marker) {
  background-color: var(--clr-primary);
}

:deep(.marker-internal-logo) {
  width: 90%;
  height: 90%;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

/* --- Empty Overlay --- */
.empty-overlay {
  position: absolute;
  inset: 0;
  z-index: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.empty-card {
  background: var(--clr-glass-strong);
  backdrop-filter: blur(12px);
  border-radius: 24px;
  padding: 2rem 1.75rem;
  text-align: center;
  max-width: 280px;
  box-shadow: var(--shadow-md);
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.empty-icon {
  font-size: 2.5rem;
  color: var(--clr-grey);
  opacity: 0.5;
}

.empty-card p {
  font-size: 0.85rem;
  color: var(--clr-grey);
  line-height: 1.5;
  margin: 0;
}

.empty-card .btn-primary {
  margin-top: 0.25rem;
  font-size: 0.85rem;
}

/* --- Bottom Sheet --- */
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
}

.personal-sheet {
  width: 100%;
  max-width: var(--max-width);
  margin: 0 auto;
  background: var(--clr-white);
  border-radius: 24px 24px 0 0;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.sheet-handle {
  width: 40px;
  height: 4px;
  border-radius: 4px;
  background: var(--clr-border);
  margin: 0.75rem auto 0;
}

.sheet-content {
  padding: 1.25rem 1.5rem 1.75rem;
}

.psheet-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.psheet-media {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 16px;
  background: var(--clr-background-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

.psheet-media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.55;
}

.psheet-info {
  flex: 1;
  min-width: 0;
}

.psheet-info h3 {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--clr-dark);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.psheet-info p {
  font-size: 0.85rem;
  color: var(--clr-grey);
  margin: 0.2rem 0 0;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.psheet-info .muted {
  opacity: 0.5;
  font-style: italic;
}

.btn-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--clr-background-alt);
  color: var(--clr-grey);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background: var(--clr-border);
}

/* --- Transitions --- */
.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.3s ease;
}

.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: opacity 0.3s ease;
}

.slide-up-enter-active .personal-sheet,
.slide-up-leave-active .personal-sheet {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
}

.slide-up-enter-from .personal-sheet,
.slide-up-leave-to .personal-sheet {
  transform: translateY(100%);
}

/* Desktop: the spot sheet opens as a centred dialog, like every other sheet
   (style.css › Desktop); this page's own overlay rule would pin it low. */
@media (min-width: 1024px) {
  .sheet-overlay {
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
}

/* The base map (style/tiles) failed to load — markers and controls still work. */
.map-base-error {
  position: absolute;
  top: calc(var(--safe-area-top) + 5rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: 950;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: max-content;
  max-width: calc(100% - 2rem);
  padding: 0.6rem 0.9rem;
  border-radius: var(--radius-md);
  background: var(--clr-glass-strong);
  border: 1px solid var(--clr-border);
  box-shadow: var(--shadow-md);
  color: var(--clr-text);
  font-size: 0.8rem;
  font-weight: 700;
  pointer-events: none;
}

.map-base-error svg {
  flex-shrink: 0;
  color: var(--clr-danger);
}
</style>
