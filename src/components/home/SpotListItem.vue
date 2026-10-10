<template>
  <button type="button" class="spot-row" :class="{ 'is-active': active }" :aria-pressed="active"
    @click="$emit('select', spot)" @mouseenter="$emit('hover', spot.id)" @mouseleave="$emit('hover', null)"
    @focus="$emit('hover', spot.id)" @blur="$emit('hover', null)">
    <span class="row-thumb">
      <img :src="getOptimizedImageUrl(spot.images?.[0], 160)" :alt="''" loading="lazy"
        :class="{ 'has-photo': spot.images?.[0] }" />
    </span>

    <span class="row-body">
      <span class="row-name">{{ spot.name || 'Sitio sin nombre' }}</span>

      <span class="row-meta">
        <span class="row-category">
          <component :is="getCategoryIcon(spot.category)" class="row-cat-icon" aria-hidden="true"
            :style="{ color: getCategoryColor(spot.category) }" />
          {{ t(`categories.${spot.category}`) }}
        </span>
        <span v-if="sunInterval" class="row-sun">
          <icon-mdi-weather-sunny class="row-sun-icon" aria-hidden="true" />
          {{ sunInterval }}
        </span>
      </span>
    </span>

    <span class="row-flags" aria-hidden="true">
      <icon-mdi-weather-sunset-up v-if="spot.is_sunrise" class="flag sunrise" />
      <icon-mdi-weather-sunset-down v-if="spot.is_sunset" class="flag sunset" />
    </span>
  </button>
</template>

<script setup>
import { useTranslator } from '@/composables/useTranslator'
import { useSpotSunInterval } from '@/composables/useSpotSunInterval'
import { getOptimizedImageUrl } from '@/utils/image'

// One row of the desktop map panel's spot list (MapExplorerPanel.vue).
const props = defineProps({
  spot: { type: Object, required: true },
  active: { type: Boolean, default: false },
})

defineEmits(['select', 'hover'])

const { t, getCategoryColor, getCategoryIcon } = useTranslator()

// Same network-free sun window the explore cards show (useSpotSunInterval).
const sunInterval = useSpotSunInterval(() => props.spot)
</script>

<style scoped>
.spot-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.6rem;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  text-align: left;
  transition: background-color var(--transition), border-color var(--transition);
}

.spot-row:hover {
  background: var(--clr-primary-soft);
}

.spot-row.is-active {
  background: var(--clr-primary-soft);
  border-color: color-mix(in srgb, var(--clr-primary), transparent 60%);
}

.row-thumb {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--clr-neutral-soft);
  border: 1px solid var(--clr-border);
}

.row-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 6px;
}

.row-thumb img.has-photo {
  object-fit: cover;
  padding: 0;
}

.row-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.row-name {
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--clr-dark);
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.row-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.row-category {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--clr-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.row-cat-icon {
  font-size: 0.95rem;
}

.row-sun {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--clr-text-muted);
  white-space: nowrap;
}

.row-sun-icon {
  color: var(--clr-sunspot-400);
}

.row-flags {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 1rem;
}

.flag.sunrise {
  color: var(--clr-sunrise);
}

.flag.sunset {
  color: var(--clr-sunset);
}
</style>
