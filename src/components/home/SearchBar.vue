<template>
  <div ref="searchContainer" class="search-container" v-click-outside="closeDropdown">
    <div class="search-bar" :class="{ 'has-query': searchQuery.length > 0 }">
      <button class="search-submit-btn" :disabled="searchQuery.length < 2" @click="handleEnter" aria-label="Buscar">
        <Transition name="scale" mode="out-in">
          <icon-mdi-magnify v-if="searchQuery.length < 2" key="mag" />
          <icon-mdi-arrow-right v-else key="arrow" />
        </Transition>
      </button>

      <input ref="searchInput" :value="searchQuery" @input="e => searchQuery = e.target.value" type="text"
        placeholder="Buscar spot..." @focus="openDropdown" @keyup.enter="handleEnter" />

      <button v-if="searchQuery" class="clear-btn" @click="clearSearch" aria-label="Limpiar">
        <icon-mdi-close-circle />
      </button>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <ul v-if="searchQuery.length >= 2 && isDropdownOpen" class="search-results floating-results"
          :style="dropdownStyle">
          <li v-for="spot in filteredSpots" :key="spot.id" @click="selectSpot(spot)">
            <icon-mdi-map-marker-outline class="result-icon" />
            <div class="result-info">
              <span class="result-name">{{ spot.name }}</span>
            </div>
          </li>

          <li v-if="filteredSpots.length === 0" class="no-results">
            <icon-mdi-emoticon-sad-outline />
            <span>No hay spots con "{{ searchQuery }}"</span>
          </li>
        </ul>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useTranslator } from '@/composables/useTranslator'

const props = defineProps({
  spots: { type: Array, required: true }
})

const emit = defineEmits(['select-spot'])
const { t } = useTranslator()

const searchContainer = ref(null)
const searchQuery = ref('')
const isDropdownOpen = ref(false)
const dropdownStyle = ref({ top: '0px', left: '0px', width: '0px' })
const searchInput = ref(null)

const filteredSpots = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (query.length < 2) return []

  return props.spots.filter(spot => {
    const nameMatch = spot.name.toLowerCase().includes(query)
    const categoryMatch = t('categories', spot.category).toLowerCase().includes(query)
    const tagsMatch = spot.tags?.some(tag => t('tags', tag).toLowerCase().includes(query))
    return nameMatch || categoryMatch || tagsMatch
  }).slice(0, 5)
})

const updateDropdownPosition = () => {
  if (searchContainer.value && isDropdownOpen.value) {
    const rect = searchContainer.value.getBoundingClientRect()
    dropdownStyle.value = {
      top: `${rect.bottom + 8}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`
    }
  }
}

const openDropdown = () => {
  isDropdownOpen.value = true
  nextTick(updateDropdownPosition)
}

const closeDropdown = () => {
  isDropdownOpen.value = false
}

const selectSpot = (spot) => {
  searchQuery.value = ''
  isDropdownOpen.value = false
  emit('select-spot', spot)
}

const handleEnter = () => {
  if (filteredSpots.value.length > 0) {
    selectSpot(filteredSpots.value[0])

    if (searchInput.value) {
      searchInput.value.blur()
    }
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  isDropdownOpen.value = false
}

watch([searchQuery, isDropdownOpen], () => {
  if (isDropdownOpen.value) updateDropdownPosition()
})

onMounted(() => {
  window.addEventListener('resize', updateDropdownPosition)
  window.addEventListener('scroll', updateDropdownPosition, true)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateDropdownPosition)
  window.removeEventListener('scroll', updateDropdownPosition, true)
})

const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      const resultsEl = document.querySelector('.floating-results')
      if (!(el === event.target || el.contains(event.target) || resultsEl?.contains(event.target))) {
        binding.value()
      }
    }
    document.addEventListener("click", el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener("click", el.clickOutsideEvent)
  }
}
</script>

<style scoped>
.search-container {
  flex: 1;
  min-width: 0;
  max-width: var(--max-width-search);
  position: relative;
  overflow: visible;
}

.search-bar {
  position: relative;
  background: var(--clr-white);
  /* Fallback */
  background: var(--clr-glass-strong);
  border-radius: 1rem;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 4px;
  /* Tightened padding for internal buttons */
  border: 1px solid var(--clr-border);
  transition: box-shadow 0.2s;
  isolation: isolate;
}

/* Move the blur to a pseudo-element so it doesn't clip children on Samsung */
.search-bar::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 1rem;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: -1;
}

.search-bar:focus-within {
  box-shadow: var(--shadow-md);
  background: var(--clr-white);
}

.search-bar input {
  flex: 1;
  min-width: 0;
  /* Critical for flex stability */
  border: none;
  background: transparent;
  outline: none;
  font-size: 1rem;
  font-weight: 500;
  color: var(--clr-text);
  padding: 0 8px;
}

.search-submit-btn,
.clear-btn {
  width: 44px;
  /* Explicit size for touch targets and Samsung visibility */
  height: 44px;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
}

.search-submit-btn {
  color: var(--clr-primary);
}

.clear-btn {
  color: var(--clr-grey);
  opacity: 0.7;
}

.search-bar svg {
  display: block;
  width: 1.4rem;
  height: 1.4rem;
}
</style>

<style>
/* Global styles for the teleported results */
.search-results.floating-results {
  position: fixed;
  z-index: 99999;
  background: var(--clr-white);
  border-radius: 1.25rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  list-style: none;
  padding: 0.5rem;
  margin: 0;
  border: 1px solid var(--clr-border);
  pointer-events: auto;
}

.search-results li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 0.8rem;
  cursor: pointer;
}

.search-results li:active {
  background: var(--clr-background-alt);
}

.result-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--clr-dark);
}

.result-icon {
  color: var(--clr-text-muted);
  font-size: 1.2rem;
}

.no-results {
  padding: 1.5rem !important;
  justify-content: center;
  color: var(--clr-text-muted);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from {
  opacity: 0;
  transform: scale(0.5) rotate(-45deg);
}

.scale-leave-to {
  opacity: 0;
  transform: scale(0.5) rotate(45deg);
}
</style>