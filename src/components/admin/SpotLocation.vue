<template>
  <div class="spot-location">
    <div class="quick-paste-box">
      <div class="paste-header">
        <icon-mdi-content-paste class="paste-icon animate-pulse" />
        <div class="paste-title-group">
          <label class="section-label-accent">Pegado rápido (Google Maps)</label>
          <span class="paste-hint">Pega un enlace de Maps o texto de coordenadas "lat, lng"</span>
        </div>
      </div>
      <div class="paste-input-wrapper">
        <input 
          v-model="quickCoords" 
          type="text" 
          placeholder="Ej: 39.4699, -0.3763 o URL de Maps..." 
          class="modern-input-glow" 
        />
        <icon-mdi-google-maps class="brand-maps-icon" />
      </div>
      <div class="maps-helper">
        <a 
          href="https://www.google.com/maps/@39.46975,-0.3762881,14z" 
          target="_blank" 
          class="helper-link"
        >
          <icon-mdi-open-in-new class="helper-icon" />
          Abrir Google Maps en Valencia
        </a>
      </div>
    </div>

    <div class="location-toggle-card">
      <div class="card-title-row">
        <icon-mdi-crosshairs-gps class="card-icon-primary" />
        <span class="card-title">Tu ubicación</span>
      </div>
      <button type="button" class="location-toggle" :class="{ active: form.lat != null }"
        @click="toggleLocation">
        <icon-mdi-crosshairs-gps v-if="!locating" />
        <div v-else class="loc-spinner"></div>
        <span v-if="form.lat != null">Ubicación guardada</span>
        <span v-else-if="locating">Localizando...</span>
        <span v-else>Usar mi ubicación</span>
        <icon-mdi-check-circle v-if="form.lat != null" class="loc-check" />
      </button>
    </div>

    <div class="coords-card">
      <div class="card-title-row">
        <icon-mdi-map-marker-radius class="card-icon-primary" />
        <span class="card-title">Coordenadas del Sunspot</span>
      </div>
      
      <div class="coords-grid">
        <div class="input-group">
          <label class="section-label">Latitud</label>
          <div class="input-wrapper">
            <input 
              v-model.number="form.lat" 
              type="number" 
              step="any" 
              placeholder="39.4699" 
              required 
              class="modern-input" 
            />
            <span class="coords-badge">N / S</span>
          </div>
        </div>
        
        <div class="input-group">
          <label class="section-label">Longitud</label>
          <div class="input-wrapper">
            <input 
              v-model.number="form.lng" 
              type="number" 
              step="any" 
              placeholder="-0.3763" 
              required 
              class="modern-input" 
            />
            <span class="coords-badge">E / O</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  form: {
    type: Object,
    required: true
  }
})

const locating = ref(false)
const quickCoords = ref('')

function toggleLocation() {
  if (props.form.lat != null) {
    props.form.lat = null
    props.form.lng = null
    return
  }
  if (!('geolocation' in navigator)) return
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      props.form.lat = pos.coords.latitude
      props.form.lng = pos.coords.longitude
      locating.value = false
    },
    () => { locating.value = false },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

watch(quickCoords, (val) => {
  if (!val) return
  
  // 1. Check for coordinates in text like "39.4699, -0.3763"
  const match = val.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/)
  if (match) {
    props.form.lat = parseFloat(match[1])
    props.form.lng = parseFloat(match[2])
    quickCoords.value = ''
    return
  }

  // 2. Check for coordinates in Google Maps URLs (e.g. @39.4699,-0.3763)
  const urlMatch = val.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (urlMatch) {
    props.form.lat = parseFloat(urlMatch[1])
    props.form.lng = parseFloat(urlMatch[2])
    quickCoords.value = ''
  }
})
</script>

<style scoped>
.spot-location {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  animation: fadeIn 0.35s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Pegado Rápido Box */
.quick-paste-box {
  background: color-mix(in srgb, var(--clr-primary), transparent 92%);
  padding: 1.25rem;
  border-radius: var(--radius-md);
  border: 1.5px dashed var(--clr-primary);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.25s ease;
}

.quick-paste-box:focus-within {
  border-style: solid;
  box-shadow: 0 4px 20px rgba(224, 120, 32, 0.15);
  background: color-mix(in srgb, var(--clr-primary), transparent 88%);
}

.paste-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.paste-icon {
  font-size: 1.4rem;
  color: var(--clr-primary);
  margin-top: 2px;
}

.paste-title-group {
  display: flex;
  flex-direction: column;
}

.section-label-accent {
  display: block;
  font-size: 0.8rem;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--clr-sunspot-700);
  letter-spacing: 0.5px;
}

.paste-hint {
  font-size: 0.7rem;
  color: var(--clr-text-muted);
  font-weight: 500;
  margin-top: 1px;
}

.paste-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.modern-input-glow {
  padding: 0.85rem 2.5rem 0.85rem 1rem;
  border-radius: 12px;
  border: 1.5px solid color-mix(in srgb, var(--clr-primary), transparent 80%);
  background: var(--clr-glass-strong);
  font-size: 0.9rem;
  font-weight: 600;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.2s ease;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}

.modern-input-glow:focus {
  outline: none;
  border-color: var(--clr-primary);
  background: var(--clr-input-bg-focus);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--clr-primary), transparent 88%);
}

.brand-maps-icon {
  position: absolute;
  right: 12px;
  font-size: 1.25rem;
  color: #4285F4; /* Google Maps Blue */
}

.maps-helper {
  display: flex;
  justify-content: flex-end;
}

.helper-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #4285F4;
  transition: all 0.2s ease;
}

.helper-link:hover {
  text-decoration: underline;
  transform: translateX(-2px);
}

.helper-icon {
  font-size: 0.85rem;
}

/* Coords Card */
.coords-card {
  background: var(--clr-white);
  padding: 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--clr-border);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform 0.2s ease;
}

.coords-card:hover {
  box-shadow: var(--shadow-md);
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1.5px solid var(--clr-border);
  padding-bottom: 0.6rem;
}

.card-icon-primary {
  font-size: 1.2rem;
  color: var(--clr-primary);
}

.card-title {
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--clr-text);
  letter-spacing: 0.5px;
}

.coords-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--clr-text-muted);
  letter-spacing: 0.5px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.modern-input {
  padding: 0.85rem 2.8rem 0.85rem 0.85rem;
  border-radius: 12px;
  border: 1.5px solid var(--clr-input-border);
  background: var(--clr-input-bg);
  font-size: 0.95rem;
  font-weight: 700;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.modern-input:focus {
  outline: none;
  border-color: var(--clr-primary-soft);
  background: var(--clr-input-bg-focus);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--clr-primary), transparent 92%);
}

.coords-badge {
  position: absolute;
  right: 8px;
  font-size: 0.65rem;
  font-weight: 800;
  background: var(--clr-neutral-soft);
  color: var(--clr-text-muted);
  padding: 4px 6px;
  border-radius: 6px;
  pointer-events: none;
}

/* --- Location Toggle Card --- */
.location-toggle-card {
  background: var(--clr-white);
  padding: 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--clr-border);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.location-toggle-card:hover {
  box-shadow: var(--shadow-md);
}

.location-toggle {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.85rem 1rem;
  border: 1.5px dashed var(--clr-border);
  border-radius: var(--radius-md);
  background: var(--clr-background-alt);
  color: var(--clr-grey);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.location-toggle:hover {
  border-color: var(--clr-primary);
  color: var(--clr-primary);
}

.location-toggle.active {
  border-color: var(--clr-primary);
  border-style: solid;
  background: color-mix(in srgb, var(--clr-primary), transparent 94%);
  color: var(--clr-primary);
}

.loc-check {
  margin-left: auto;
  font-size: 1.1rem;
  color: var(--clr-primary);
}

.loc-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--clr-border);
  border-top-color: var(--clr-primary);
  border-radius: 50%;
  animation: loc-spin 0.8s linear infinite;
}

@keyframes loc-spin {
  to { transform: rotate(360deg); }
}
</style>
