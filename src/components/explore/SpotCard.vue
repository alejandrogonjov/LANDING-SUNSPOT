<script setup>
import { computed } from 'vue'
import { useTranslator } from '@/composables/useTranslator'
import { useSpotSunInterval } from '@/composables/useSpotSunInterval'
import { getOptimizedImageUrl } from '@/utils/image'

const { t, getCategoryColor, getCategoryIcon, getAccessIcon } = useTranslator()

const props = defineProps({
  spot: {
    type: Object,
    required: true
  },
  userLocation: {
    type: Object,
    default: null
  }
})

// Season-aware sun window, derived live from today's date (no stored field)
const sunInterval = useSpotSunInterval(() => props.spot)

const distance = computed(() => {
  if (!props.userLocation || !props.spot.location) return null
  const R = 6371
  const dLat = (props.spot.location.latitude - props.userLocation.lat) * Math.PI / 180
  const dLon = (props.spot.location.longitude - props.userLocation.lng) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(props.userLocation.lat * Math.PI / 180) * Math.cos(props.spot.location.latitude * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return (R * c).toFixed(1)
})
</script>

<template>
  <RouterLink :to="`/spot/${spot.id}`" class="spot-card">
    <div class="card-media">
      <img :src="getOptimizedImageUrl(spot.images?.[0], 600)" :alt="spot.name" loading="lazy" :class="{ 'has-photo': spot.images?.[0] }" />

      <div v-if="spot.is_sunrise || spot.is_sunset" class="sun-badge">
        <icon-mdi-weather-sunset-up v-if="spot.is_sunrise" class="sun-icon-mini sunrise" />
        <icon-mdi-weather-sunset-down v-if="spot.is_sunset" class="sun-icon-mini sunset" />
      </div>
    </div>

    <div class="card-info">
      <!-- 1. Meta Row: Category Badge & Access Badge -->
      <div class="card-meta-row">
        <div class="category-badge" :style="{
          backgroundColor: `color-mix(in srgb, ${getCategoryColor(spot.category)}, transparent 88%)`,
          color: getCategoryColor(spot.category)
        }">
          <component :is="getCategoryIcon(spot.category)" class="cat-icon" />
          <span>{{ t(`categories.${spot.category}`) }}</span>
        </div>

        <div class="access-badge" :class="spot.is_free ? 'is-free' : 'is-paid'">
          <component :is="getAccessIcon(spot.is_free)" />
          <span>{{ spot.is_free ? t('ui.free') : t('ui.paid') }}</span>
        </div>
      </div>

      <!-- 2. Spot Name Title -->
      <h3 class="spot-name">{{ spot.name || 'Sitio sin nombre' }}</h3>

      <!-- 3. Footer Row: Distance/Location + live sun window -->
      <div class="card-footer-row">
        <div class="distance-badge">
          <icon-mdi-map-marker class="meta-icon" />
          <span class="location-text">{{ distance ? `${distance}km` : (spot.address || 'Valencia') }}</span>
        </div>

        <div v-if="sunInterval" class="hours-badge">
          <icon-mdi-weather-sunny class="meta-icon sun" />
          <span>{{ sunInterval }}</span>
        </div>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.spot-card {
  display: block;
  background: var(--clr-white);
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--clr-border);
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  color: inherit;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.25s ease-in-out;
}

@media (hover: hover) {
  .spot-card:hover {
    transform: translateY(-4px) scale(1.015);
    box-shadow: var(--shadow-md);
  }
}

.spot-card:active {
  transform: scale(0.98);
}

.card-media {
  position: relative;
  height: 160px;
}

.card-media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: var(--clr-neutral-soft);
  transition: transform 0.3s ease;
}

.card-media img.has-photo {
  object-fit: cover;
}

.spot-card:hover .card-media img.has-photo {
  transform: scale(1.03);
}

.sun-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  gap: 4px;
  padding: 5px;
  background: var(--clr-glass-strong);
  backdrop-filter: blur(4px);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
}

.sunrise {
  color: #ff9800;
}

.sunset {
  color: #f44336;
}

/* Redesigned Card Info Section */
.card-info {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: var(--clr-white);
}

.card-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cat-icon {
  font-size: 0.9rem;
}

.distance-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--clr-text-muted);
}

.location-text {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta-icon {
  font-size: 0.95rem;
  color: var(--clr-primary);
  flex-shrink: 0;
}

.spot-name {
  font-size: 1.15rem;
  font-weight: 800;
  margin: 0;
  color: var(--clr-dark);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.15rem;
}

.hours-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--clr-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.hours-badge .meta-icon.sun {
  color: var(--clr-sunspot-400);
}

.access-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.access-badge.is-free {
  background-color: var(--clr-success-soft);
  color: var(--clr-success);
}

.access-badge.is-paid {
  background-color: var(--clr-warn-soft);
  color: var(--clr-warn);
}

.access-badge svg {
  font-size: 0.9rem;
}
</style>