<template>
  <div class="location-action-container">
    <button @click="openMaps" class="btn-maps">
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ffffff"/>
        <circle cx="12" cy="9" r="2.5" fill="rgba(224,120,32,0.9)"/>
      </svg>
      <span>Abrir en Google Maps</span>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  spotName: { type: String, required: true }
})

const openMaps = () => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${props.lat},${props.lng}`
  window.open(url, '_blank')
}
</script>

<style scoped>
.btn-maps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  width: 100%;
  padding: 1rem;
  border-radius: var(--radius-md);
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.04em;
  background: linear-gradient(135deg, var(--clr-sunspot-400) 0%, var(--clr-primary) 100%);
  color: var(--clr-white);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(224, 120, 32, 0.25);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
}

.btn-maps:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(224, 120, 32, 0.35);
}

.btn-maps:active {
  transform: scale(0.96);
  box-shadow: 0 2px 8px rgba(224, 120, 32, 0.15);
}

.btn-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}
</style>