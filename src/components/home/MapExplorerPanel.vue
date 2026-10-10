<template>
  <aside class="map-panel" aria-label="Spots del mapa">
    <div class="panel-search" role="search">
      <icon-mdi-magnify class="search-icon" aria-hidden="true" />
      <input ref="searchInput" v-model="query" type="search" :placeholder="t('map.search')"
        :aria-label="t('map.search')" @keydown.enter.prevent="selectFirst" @keydown.esc="clearQuery" />
      <button v-if="query" type="button" class="clear-btn" :aria-label="t('map.clear_search')" @click="clearQuery">
        <icon-mdi-close-circle />
      </button>
    </div>

    <!-- Selected spot: the same preview the mobile bottom sheet shows. -->
    <div v-if="selectedSpot" class="panel-detail">
      <button type="button" class="panel-back" @click="$emit('clear')">
        <icon-mdi-arrow-left aria-hidden="true" />
        <span>{{ t('map.all_spots') }}</span>
      </button>
      <div class="detail-card">
        <SpotPreview :key="selectedSpot.id" :spot="selectedSpot" :closable="false" />
      </div>
    </div>

    <!-- v-show, not v-if: coming back from a spot keeps the list where it was. -->
    <div v-show="!selectedSpot" class="panel-list" ref="listEl">
      <p v-if="error" class="panel-state is-error" role="alert">
        <icon-mdi-alert-circle-outline aria-hidden="true" />
        <span>{{ t('map.load_error') }}</span>
      </p>

      <div v-else-if="loading" class="panel-state" role="status">
        <div class="sun-loader"></div>
        <span>{{ t('map.syncing') }}</span>
      </div>

      <template v-else>
        <p class="panel-count">
          {{ filteredSpots.length }} {{ filteredSpots.length === 1 ? t('map.spot') : t('map.spots') }}
        </p>

        <ul v-if="filteredSpots.length" class="spot-list">
          <li v-for="spot in filteredSpots" :key="spot.id">
            <SpotListItem :spot="spot" :active="spot.id === selectedSpot?.id" @select="$emit('select', $event)"
              @hover="$emit('hover', $event)" />
          </li>
        </ul>

        <p v-else class="panel-state">
          <icon-mdi-emoticon-sad-outline aria-hidden="true" />
          <span>{{ t('map.no_results') }} "{{ query }}"</span>
        </p>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import SpotPreview from '@/components/home/SpotPreview.vue'
import SpotListItem from '@/components/home/SpotListItem.vue'
import { useTranslator } from '@/composables/useTranslator'
import { spotMatchesQuery } from '@/utils/spotSearch'

/**
 * Desktop side panel of the home map. It brings together what the phone
 * splits across the floating search bar and the spot bottom sheet: search,
 * the list of every spot on the map, and the preview of the selected one.
 * Selection lives in Home.vue and is shared with Map.vue, so a click on a
 * marker and a click on a row are the same action.
 */
const props = defineProps({
  spots: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  selectedSpot: { type: Object, default: null },
})

const emit = defineEmits(['select', 'clear', 'hover'])

const { t } = useTranslator()
const query = ref('')
const searchInput = ref(null)
const listEl = ref(null)

const filteredSpots = computed(() => props.spots.filter(spot => spotMatchesQuery(spot, query.value, t)))

const selectFirst = () => {
  if (filteredSpots.value.length) emit('select', filteredSpots.value[0])
}

const clearQuery = () => {
  query.value = ''
}

// Typing is a new search: leave the preview and show the matching list.
watch(query, () => {
  if (props.selectedSpot) emit('clear')
  if (listEl.value) listEl.value.scrollTop = 0
})
</script>

<style scoped>
.map-panel {
  flex-shrink: 0;
  width: 380px;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--clr-background);
  border-right: 1px solid var(--clr-border);
  position: relative;
  z-index: 2;
}

.panel-search {
  position: relative;
  display: flex;
  align-items: center;
  margin: 1.25rem 1.25rem 0.75rem;
  height: 48px;
  padding: 0 4px 0 14px;
  border-radius: 1rem;
  background: var(--clr-white);
  border: 1px solid var(--clr-border);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition), border-color var(--transition);
}

.panel-search:focus-within {
  border-color: color-mix(in srgb, var(--clr-primary), transparent 50%);
  box-shadow: var(--shadow-md);
}

.search-icon {
  flex-shrink: 0;
  width: 1.4rem;
  height: 1.4rem;
  color: var(--clr-primary);
}

.panel-search input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  background: transparent;
  outline: none;
  padding: 0 10px;
  font-size: 1rem;
  font-weight: 500;
}

.panel-search input::-webkit-search-cancel-button {
  display: none;
}

.clear-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--clr-grey);
  border-radius: 50%;
}

.clear-btn:hover {
  color: var(--clr-text-muted);
}

.clear-btn svg {
  width: 1.3rem;
  height: 1.3rem;
}

.panel-list,
.panel-detail {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 1rem 1.5rem;
}

.panel-count {
  padding: 0.25rem 0.5rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--clr-text-muted);
}

.spot-list {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.panel-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
  text-align: center;
  color: var(--clr-text-muted);
  font-size: 0.9rem;
}

.panel-state svg {
  width: 1.75rem;
  height: 1.75rem;
}

.panel-state.is-error {
  color: var(--clr-danger);
}

.sun-loader {
  width: 32px;
  height: 32px;
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

.panel-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem 0.25rem;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--clr-text-muted);
  transition: background-color var(--transition), color var(--transition);
}

.panel-back:hover {
  background: var(--clr-primary-soft);
  color: var(--clr-primary);
}

.detail-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--clr-white);
  border: 1px solid var(--clr-border);
  box-shadow: var(--shadow-sm);
}

@media (max-width: 1279px) {
  .map-panel {
    width: 340px;
  }
}
</style>
