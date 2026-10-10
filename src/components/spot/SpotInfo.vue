<template>
  <section class="spot-info">
    <div class="info-header">
      <h1 class="spot-name">{{ spot?.name }}</h1>

      <div class="badges-row">
        <div class="category-wrapper" :style="{
          backgroundColor: `color-mix(in srgb, ${getCategoryColor(spot?.category)}, transparent 88%)`,
          color: getCategoryColor(spot?.category)
        }">
          <component :is="getCategoryIcon(spot?.category)" class="cat-icon" />
          <span class="category-text">{{ t(`categories.${spot?.category}`) }}</span>
        </div>

        <div :class="['access-badge', spot?.is_free ? 'is-free' : 'is-paid']">
          <component :is="getAccessIcon(spot?.is_free)" />
          <span>{{ spot?.is_free ? t('ui.free') : t('ui.paid') }}</span>
        </div>
      </div>
    </div>

    <div class="location-row">
      <div class="address-line">
        <icon-mdi-map-marker-outline class="loc-icon" />
        <p class="address-text">
          {{ spot?.address }}
          <span v-if="formattedDistance" class="distance-inline">
            ({{ formattedDistance }})
          </span>
        </p>
      </div>

      <div v-if="spot?.web" class="address-line web-line">
        <icon-mdi-earth class="loc-icon" />
        <a :href="spot.web" target="_blank" rel="noopener noreferrer" class="web-link">
          {{ spot.web.replace(/^https?:\/\//, '').replace(/\/$/, '') }}
        </a>
      </div>
    </div>

    <p class="description">{{ spot?.description }}</p>

    <div class="features-row" v-if="spot?.has_shadow || spot?.has_natural_shadow || spot?.is_quiet || spot?.is_windy || spot?.is_sunrise || spot?.is_sunset">
      <div v-if="spot.has_shadow" class="feature-badge shadow">
        <icon-mdi-umbrella class="feat-icon" />
        <span>{{ t('ui.shadow') }}</span>
      </div>
      <div v-if="spot.has_natural_shadow" class="feature-badge natural-shadow">
        <icon-mdi-tree class="feat-icon" />
        <span>{{ t('ui.natural_shadow') }}</span>
      </div>
      <div v-if="spot.is_quiet" class="feature-badge quiet">
        <icon-tabler-ear-off class="feat-icon" />
        <span>{{ t('ui.quiet') }}</span>
      </div>
      <div v-if="spot.is_windy" class="feature-badge windy">
        <icon-tabler-wind class="feat-icon" />
        <span>{{ t('ui.wind') }}</span>
      </div>
      <div v-if="spot.is_sunrise" class="feature-badge sunrise">
        <icon-mdi-weather-sunset-up class="feat-icon" />
        <span>{{ t('ui.sunrise') }}</span>
      </div>
      <div v-if="spot.is_sunset" class="feature-badge sunset">
        <icon-mdi-weather-sunset-down class="feat-icon" />
        <span>{{ t('ui.sunset') }}</span>
      </div>
    </div>

    <div v-if="spot?.tags?.length" class="tags-container no-scrollbar">
      <span v-for="tag in spot.tags" :key="tag" class="tag-pill">
        {{ t(`tags.${tag}`) }}
      </span>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTranslator } from '@/composables/useTranslator'
import { calculateDistance } from '@/utils/geo'
import { useSettings } from '@/composables/useSettings'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  spot: { type: Object, required: true }
})

const { t, getCategoryColor, getCategoryIcon, getAccessIcon } = useTranslator()
const userCoords = ref(null)
const { geolocationEnabled } = useSettings()
const { triggerLocationDeniedToast } = useToast()

onMounted(() => {
  if (geolocationEnabled.value && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userCoords.value = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
      },
      (error) => {
        console.log('Location access denied/failed', error)
        if (error.code === error.PERMISSION_DENIED) {
          triggerLocationDeniedToast()
        }
      },
      { enableHighAccuracy: true }
    )
  }
})

const formattedDistance = computed(() => {
  if (!userCoords.value || !props.spot?.location) return null

  const dist = calculateDistance(
    userCoords.value.latitude,
    userCoords.value.longitude,
    props.spot.location.latitude,
    props.spot.location.longitude
  )

  return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`
})
</script>

<style scoped>
.spot-info {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.spot-name {
  font-size: 1.85rem;
  font-weight: 900;
  color: var(--clr-dark);
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 0.75rem;
}

.badges-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.category-wrapper {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  width: fit-content;
  justify-content: center;
  line-height: 1;
}

.cat-icon {
  font-size: 0.95rem;
  margin-right: 4px;
}

.access-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
  font-size: 1.1rem;
}

.sun-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: var(--clr-background-alt);
  border-radius: var(--radius-full);
}

.sun-icon-mini {
  font-size: 1.1rem;
}

.sunrise {
  color: #ff9800;
}

.sunset {
  color: #f44336;
}

.location-row {
  display: flex;
  flex-direction: column;
}

.address-line {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--clr-text-muted);
}

.loc-icon {
  font-size: 1.1rem;
  color: var(--clr-primary);
  flex-shrink: 0;
  margin-top: 1px;
}

.address-text {
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.4;
}

.web-line {
  margin-top: 0.5rem;
}

.web-link {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--clr-primary);
  text-decoration: none;
  word-break: break-all;
}

.web-link:hover {
  text-decoration: underline;
}

.description {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--clr-text);
  margin-top: 0.25rem;
}

.features-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: -0.5rem;
}

.feature-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 12px;
}

.feature-badge.shadow {
  background: color-mix(in srgb, var(--clr-shadow), transparent 88%);
  color: var(--clr-shadow);
}

.feature-badge.natural-shadow {
  background: color-mix(in srgb, var(--clr-natural-shadow), transparent 88%);
  color: var(--clr-natural-shadow);
}

.feature-badge.quiet {
  color: var(--clr-quiet);
  background: color-mix(in srgb, var(--clr-quiet), transparent 85%);
}

.feature-badge.windy {
  color: var(--clr-windy);
  background: color-mix(in srgb, var(--clr-windy), transparent 85%);
}

.feature-badge.sunrise {
  color: var(--clr-sunrise);
  background: color-mix(in srgb, var(--clr-sunrise), transparent 85%);
}

.feature-badge.sunset {
  color: var(--clr-sunset);
  background: color-mix(in srgb, var(--clr-sunset), transparent 85%);
}

.feat-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.tags-container {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.tag-pill {
  white-space: nowrap;
  color: var(--clr-text-muted);
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--clr-border);
}
</style>