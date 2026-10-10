<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="show" class="sheet-overlay" @click.self="$emit('close')">
        <div class="bottom-sheet" v-drag-close="() => $emit('close')">
          <div class="sheet-handle"></div>

          <div class="sheet-content">
            <header class="sheet-header">
              <h2 class="sheet-title">{{ t('ui.filters') }}</h2>
              <button @click="$emit('close')" class="btn-close close-x-btn">
                <icon-mdi-close />
              </button>
            </header>

            <div class="filter-group">
              <label>{{ t('ui.category') }}</label>
              <div class="pill-grid no-scrollbar">
                <button v-for="cat in categoryKeys" :key="cat" @click="updateFilter('category', cat)"
                  :class="['pill-btn', { active: filters.category === cat }]"
                  :style="filters.category === cat ? getActivePillStyle(cat) : {}">
                  {{ t(`categories.${cat}`) }}
                </button>
              </div>
            </div>

            <div class="filter-group">
              <label>{{ t('ui.access') }}</label>
              <div class="toggle-group">
                <button @click="updateFilter('accessType', 'free')" class="type-btn"
                  :class="{ 'active-free': filters.accessType === 'free' }">
                  <icon-mdi-currency-eur-off />
                  <span>{{ t('ui.free') }}</span>
                </button>
                <button @click="updateFilter('accessType', 'paid')" class="type-btn"
                  :class="{ 'active-paid': filters.accessType === 'paid' }">
                  <icon-bxs-door-open />
                  <span>{{ t('ui.paid') }}</span>
                </button>
              </div>
            </div>

            <div class="filter-group">
              <label>{{ t('ui.moment') }}</label>
              <div class="toggle-group">
                <button @click="updateFilter('sunType', 'sunrise')" class="sun-filter-btn"
                  :class="{ 'active-sunrise': filters.sunType === 'sunrise' }">
                  <icon-mdi-weather-sunset-up />
                  <span>{{ t('ui.sunrise') }}</span>
                </button>
                <button @click="updateFilter('sunType', 'sunset')" class="sun-filter-btn"
                  :class="{ 'active-sunset': filters.sunType === 'sunset' }">
                  <icon-mdi-weather-sunset-down />
                  <span>{{ t('ui.sunset') }}</span>
                </button>
              </div>
            </div>

            <div class="filter-group">
              <label>Características</label>
              <div class="toggle-group features-group">
                <button @click="updateFilter('hasShadow', true)" class="type-btn"
                  :class="{ 'active-shadow': filters.hasShadow }">
                  <icon-mdi-umbrella-beach />
                  <span>{{ t('ui.shadow') }}</span>
                </button>
                <button @click="updateFilter('hasNaturalShadow', true)" class="type-btn"
                  :class="{ 'active-natural-shadow': filters.hasNaturalShadow }">
                  <icon-mdi-tree />
                  <span>{{ t('ui.natural_shadow') }}</span>
                </button>
                <button @click="updateFilter('isQuiet', true)" class="type-btn"
                  :class="{ 'active-quiet': filters.isQuiet }">
                  <icon-tabler-ear-off />
                  <span>{{ t('ui.quiet') }}</span>
                </button>
                <button @click="updateFilter('isWindy', true)" class="type-btn"
                  :class="{ 'active-windy': filters.isWindy }">
                  <icon-tabler-wind />
                  <span>{{ t('ui.wind') }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="$emit('clear')" class="btn-text">{{ t('ui.clear') }}</button>
            <button @click="$emit('close')" class="btn-primary">{{ t('ui.results') }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useTranslator } from '@/composables/useTranslator'

const { t, categoryKeys, getCategoryColor } = useTranslator()
const props = defineProps({
  show: Boolean,
  filters: Object // Expects { category: '', accessType: 'all', sunType: 'all' }
})

const emit = defineEmits(['close', 'clear', 'update:filters'])

const updateFilter = (key, value) => {
  const newFilters = { ...props.filters }
  // Toggle logic
  if (typeof value === 'boolean') {
    newFilters[key] = !props.filters[key]
  } else if (props.filters[key] === value) {
    newFilters[key] = (key === 'category') ? '' : 'all'
  } else {
    newFilters[key] = value
  }
  emit('update:filters', newFilters)
}

const getActivePillStyle = (cat) => {
  const color = getCategoryColor(cat)
  return { backgroundColor: `${color}20`, borderColor: color, color: color }
}
</script>

<style scoped>
/* Inheriting modal overlay, content, header, title, and body layout from global unified styles */

.filter-group {
  margin-bottom: 2rem;
}

.filter-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--clr-dark);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-bottom: 0.75rem;
}

.pill-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.pill-btn {
  padding: 0.6rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--clr-border);
  background: var(--clr-white);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--clr-text-muted);
  transition: var(--transition);
}

.pill-btn:active {
  transform: scale(0.95);
}

.toggle-group {
  display: flex;
  gap: 0.75rem;
}

.features-group {
  flex-wrap: wrap;
}

.features-group .type-btn {
  flex: 1 1 calc(50% - 0.5rem);
}

.sun-filter-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0.85rem;
  border-radius: var(--radius-md);
  background: var(--clr-white);
  border: 1px solid var(--clr-border);
  color: var(--clr-text-muted);
  font-weight: 700;
  transition: var(--transition);
}

.sun-filter-btn svg {
  font-size: 1.25rem;
}

.type-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0.85rem;
  border-radius: var(--radius-md);
  background: var(--clr-white);
  border: 1px solid var(--clr-border);
  color: var(--clr-text-muted);
  font-weight: 700;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.type-btn:active {
  transform: scale(0.96);
}

.type-btn.active-free {
  background: color-mix(in srgb, var(--clr-free), transparent 90%);
  color: var(--clr-free);
  border-color: var(--clr-free);
}

.type-btn.active-paid {
  background: color-mix(in srgb, var(--clr-paid), transparent 90%);
  color: var(--clr-paid);
  border-color: var(--clr-paid);
}

.type-btn.active-shadow {
  background: color-mix(in srgb, var(--clr-shadow), transparent 90%);
  color: var(--clr-shadow);
  border-color: var(--clr-shadow);
}

.type-btn.active-natural-shadow {
  background: color-mix(in srgb, var(--clr-natural-shadow), transparent 90%);
  color: var(--clr-natural-shadow);
  border-color: var(--clr-natural-shadow);
}

.type-btn.active-quiet {
  background: color-mix(in srgb, var(--clr-quiet), transparent 90%);
  color: var(--clr-quiet);
  border-color: var(--clr-quiet);
}

.type-btn.active-windy {
  background: color-mix(in srgb, var(--clr-windy), transparent 90%);
  color: var(--clr-windy);
  border-color: var(--clr-windy);
}

/* Active State: Sunrise (Brand Orange) */
.sun-filter-btn.active-sunrise {
  background: color-mix(in srgb, var(--clr-sunrise), transparent 90%);
  color: var(--clr-sunrise);
  border-color: var(--clr-sunrise);
}

/* Active State: Sunset (Deep Brand Red) */
.sun-filter-btn.active-sunset {
  background: color-mix(in srgb, var(--clr-sunset), transparent 90%);
  color: var(--clr-sunset);
  border-color: var(--clr-sunset);
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 1rem;
  flex-shrink: 0;
  padding: 1rem;
  padding-bottom: max(1rem, var(--safe-area-bottom));
  border-top: 1px solid var(--clr-border);
  position: sticky;
  bottom: 0;
}

.btn-primary {
  flex: 2;
}

.btn-text {
  flex: 1;
}

/* Transition Logic */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.32, 1, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>