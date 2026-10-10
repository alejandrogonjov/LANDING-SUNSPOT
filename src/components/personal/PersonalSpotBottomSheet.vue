<template>
  <div class="sheet-overlay" @click.self="$emit('close')">
    <div class="bottom-sheet" v-drag-close="() => $emit('close')">
      <div class="sheet-handle"></div>

      <div class="spot-hero-wrapper">
        <div class="spot-hero placeholder">
          <img src="/sunspot-skyline.svg" :alt="spot.name" class="hero-img-placeholder" />
        </div>

        <button class="btn-close btn-glass inner-close-btn" @click="$emit('close')" aria-label="Cerrar">
          <icon-mdi-close />
        </button>
      </div>

      <div class="sheet-content">
        <h2 class="spot-name">{{ spot.name }}</h2>
        <p v-if="spot.description" class="spot-desc line-clamp-4">{{ spot.description }}</p>
        <p v-else class="spot-desc muted line-clamp-4">Sin descripción</p>

        <router-link :to="`/personal-spot/${spot.id}`" class="btn-full-details" @click="$emit('close')">
          Ver mi spot
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

defineProps({
  spot: { type: Object, required: true }
})

const emit = defineEmits(['close'])

const handleEsc = (e) => { if (e.key === 'Escape') emit('close') }
onMounted(() => window.addEventListener('keydown', handleEsc))
onUnmounted(() => window.removeEventListener('keydown', handleEsc))
</script>

<style scoped>
.spot-hero-wrapper {
  position: relative;
  height: 220px;
  flex-shrink: 0;
  background-color: var(--clr-background-alt);
}

.spot-hero {
  width: 100%;
  height: 100%;
}

.hero-img-placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
  padding: 3rem;
  opacity: 0.4;
  filter: sepia(1) saturate(0.5) brightness(0.9);
}

.inner-close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
}

.sheet-content {
  padding: 1.25rem 1.5rem 1.75rem;
}

.spot-name {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0 0 0.75rem;
  color: var(--clr-text);
}

.spot-desc {
  color: var(--clr-text-muted);
  font-size: 0.95rem;
  line-height: 1.55;
  margin: 0 0 1.25rem;
}

.spot-desc.muted {
  opacity: 0.45;
  font-style: italic;
}

.line-clamp-4 {
  display: -webkit-box;
  line-clamp: 4;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.btn-full-details {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 1rem;
  background: var(--clr-primary);
  color: var(--clr-on-brand);
  border-radius: var(--radius-lg);
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  transition: transform 0.2s ease;
  box-sizing: border-box;
}

.btn-full-details:active {
  transform: scale(0.97);
}
</style>
