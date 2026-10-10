<template>
  <div class="sheet-overlay" @click.self="$emit('close')">
    <div class="bottom-sheet" v-drag-close="() => $emit('close')">
      <!-- Tirador visual superior para denotar que es desplazable -->
      <div class="sheet-handle"></div>

      <div class="spot-hero-wrapper">
        <!-- 1. Capa de Imagen o Placeholder[cite: 1] -->
        <div v-if="spot.images?.length > 0" class="spot-hero">
          <img :src="getOptimizedImageUrl(spot.images[0], 600)" :alt="spot.name" class="hero-img" />
        </div>

        <div v-else class="spot-hero placeholder">
          <img src="/sunspot-skyline.svg" :alt="spot.name" class="hero-img-placeholder" />
        </div>

        <!-- 2. Badges Solares (Siempre visibles sobre la imagen) -->
        <div class="hero-badges">
          <div v-if="spot.is_sunrise" class="solar-badge sunrise">
            <icon-mdi-weather-sunset-up />
            <span>{{ t('ui.sunrise') }}</span>
          </div>
          <div v-if="spot.is_sunset" class="solar-badge sunset">
            <icon-mdi-weather-sunset-down />
            <span>{{ t('ui.sunset') }}</span>
          </div>
        </div>

        <!-- Botón de cierre integrado en el área del hero para ahorrar espacio -->
        <button class="btn-close btn-glass inner-close-btn" @click="$emit('close')" aria-label="Cerrar">
          <icon-mdi-close />
        </button>
      </div>

      <div class="sheet-content">
        <header class="sheet-header">
          <h2 class="spot-name">{{ spot.name }}</h2>
        </header>

        <p class="spot-desc line-clamp">{{ spot.description }}</p>

        <div v-if="sunInterval" class="sun-hours">
          <icon-mdi-weather-sunny class="sun-hours-icon" />
          <span>Sol directo hoy · {{ sunInterval }}</span>
        </div>

        <div class="sheet-actions">
          <router-link :to="`/spot/${spot.id}`" class="btn-full-details"
            :style="{ backgroundColor: getCategoryColor(spot.category) }" @click="$emit('close')">
            {{ t('ui.explore') }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useTranslator } from '@/composables/useTranslator'
import { useSpotSunInterval } from '@/composables/useSpotSunInterval'
import { getOptimizedImageUrl } from '@/utils/image'

const { t, getCategoryColor } = useTranslator()

const props = defineProps({
  spot: { type: Object, required: true }
})

// Season-aware sun window, derived live from today's date (no stored field)
const sunInterval = useSpotSunInterval(() => props.spot)

const emit = defineEmits(['close'])

// Accesibilidad: Cerrar con la tecla Escape
const handleEsc = (e) => { if (e.key === 'Escape') emit('close') }
onMounted(() => window.addEventListener('keydown', handleEsc))
onUnmounted(() => window.removeEventListener('keydown', handleEsc))
</script>

<style scoped>
/* Inheriting all sheet layout, scrim, bottom-sheet, and handle styles from global unified styles */

/* Área de Imagen / Hero[cite: 1] */
.spot-hero-wrapper {
  position: relative;
  height: 220px;
  background-color: var(--clr-background-alt);
}

.spot-hero,
.hero-img {
  width: 100%;
  height: 100%;
}

.hero-img {
  object-fit: cover;
}

.hero-img-placeholder {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 3rem;
  opacity: 0.4;
  filter: sepia(1) saturate(0.5) brightness(0.9);
}

/* Elementos sobre la imagen */
.inner-close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
}

.hero-badges {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  display: flex;
  gap: 0.5rem;
  z-index: 5;
}

.solar-badge {
  background-color: var(--clr-white);
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-md);
}

/* Contenido de texto */
.sheet-content {
  padding: 1.5rem;
}

.spot-name {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
  color: var(--clr-text);
}

.spot-desc {
  margin: 1rem 0 1.5rem;
  color: var(--clr-text-muted);
  font-size: 0.95rem;
  line-height: 1.5;
  /* Cap at 5 lines with an ellipsis */
  display: -webkit-box;
  -webkit-line-clamp: 5;
  line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sun-hours {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 1.5rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--clr-text);
}

.sun-hours-icon {
  font-size: 1.1rem;
  color: var(--clr-sunspot-400);
  flex-shrink: 0;
}

.btn-full-details {
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--clr-on-brand);
  border-radius: var(--radius-lg);
  font-weight: 700;
  padding: 1rem;
  text-decoration: none;
  transition: transform 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.btn-full-details:active {
  transform: scale(0.97);
}
</style>