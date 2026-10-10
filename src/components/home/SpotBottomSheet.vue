<template>
  <div class="sheet-overlay" @click.self="$emit('close')">
    <div class="bottom-sheet" v-drag-close="() => $emit('close')">
      <!-- Tirador visual superior para denotar que es desplazable -->
      <div class="sheet-handle"></div>

      <!-- Shared with the desktop map panel (MapExplorerPanel.vue) -->
      <SpotPreview :spot="spot" @close="$emit('close')" @open-details="$emit('close')" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import SpotPreview from '@/components/home/SpotPreview.vue'

defineProps({
  spot: { type: Object, required: true }
})

const emit = defineEmits(['close'])

// Accesibilidad: Cerrar con la tecla Escape
const handleEsc = (e) => { if (e.key === 'Escape') emit('close') }
onMounted(() => window.addEventListener('keydown', handleEsc))
onUnmounted(() => window.removeEventListener('keydown', handleEsc))
</script>
