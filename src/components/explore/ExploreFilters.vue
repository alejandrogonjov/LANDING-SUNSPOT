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

            <ExploreFilterControls :filters="filters" @update:filters="val => $emit('update:filters', val)" />
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
import ExploreFilterControls from '@/components/explore/ExploreFilterControls.vue'

const { t } = useTranslator()
defineProps({
  show: Boolean,
  filters: Object // Expects { category: '', accessType: 'all', sunType: 'all' }
})

defineEmits(['close', 'clear', 'update:filters'])
</script>

<style scoped>
/* Inheriting modal overlay, content, header, title, and body layout from global unified styles */


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