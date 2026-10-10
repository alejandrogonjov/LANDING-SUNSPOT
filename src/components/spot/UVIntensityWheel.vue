<template>
  <section class="uv-card">
    <div class="skin-selector-header">
      <p v-if="!selectedSkinTone" class="selector-prompt">Elige tu tono de piel para ver recomendaciones</p>
      <div class="skin-dots" :class="{ 'has-selection': selectedSkinTone }" role="group" aria-label="Tono de piel">
        <button v-for="tone in skinTones" :key="tone.id" type="button" class="skin-dot"
          :class="{ active: selectedSkinTone?.id === tone.id }" :style="{ backgroundColor: tone.color }"
          @click="selectedSkinTone = tone" :title="tone.label" :aria-label="tone.label"
          :aria-pressed="selectedSkinTone?.id === tone.id"></button>
      </div>
    </div>

    <Transition name="fade-slide" mode="out-in">
      <div v-if="selectedSkinTone" key="wheel-active">
        <div class="exposure-selector">
          <p class="selector-prompt exposure-prompt">Área expuesta: <span class="exposure-current">{{ selectedExposure.label }}</span></p>
          <div class="exposure-options" role="group" aria-label="Área expuesta">
            <button v-for="exp in exposureLevels" :key="exp.id" type="button" class="exposure-btn"
              :class="{ active: selectedExposure.id === exp.id }" @click="selectedExposure = exp"
              :title="exp.label" :aria-label="exp.label" :aria-pressed="selectedExposure.id === exp.id">
              <icon-mdi-face-man v-if="exp.id === 'face'" />
              <icon-mdi-tshirt-crew v-if="exp.id === 'torso'" />
              <icon-iconoir-short-pants-pockets v-if="exp.id === 'legs'" />
              <icon-mdi-human v-if="exp.id === 'body'" />
            </button>
          </div>
        </div>

        <div class="uv-display">
          <div class="wheel-container">
            <svg viewBox="0 0 100 100" class="wheel-svg">
              <!-- Background Arc -->
              <circle class="wheel-track" cx="50" cy="50" r="42" fill="none" stroke-width="6" stroke-dasharray="197.9 66"
                stroke-linecap="round" transform="rotate(135 50 50)" />
              <!-- Progress Arc -->
              <circle cx="50" cy="50" r="42" fill="none" :stroke="riskColor" stroke-width="6"
                :stroke-dasharray="`${197.9 * Math.min(exposureFactor, 1)} 263.9`" stroke-linecap="round"
                transform="rotate(135 50 50)"
                style="transition: stroke-dasharray 0.5s ease-out, stroke 0.5s ease-out;" />
            </svg>
            <div class="wheel-content">
              <span class="wheel-title">RIESGO DE<br>EXPOSICIÓN</span>
              <div class="wheel-burn-info" :style="{ color: riskColor }">
                <div v-if="burnTimeMinutes" class="wheel-burn-inner">
                  <div class="wheel-burn-label">
                    Enrojecimiento a partir de
                  </div>
                  <div class="wheel-burn-val">{{ burnTimeMinutes >= 120 ? '> 120' : burnTimeMinutes }} <span
                      class="wheel-burn-unit">min</span></div>
                </div>
                <div v-else class="wheel-burn-safe">
                  Sin riesgo
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="controls">
          <!-- Exposure duration -->
          <div class="slider-row">
            <div class="slider-header">
              <icon-mdi-timer-outline />
              <span class="slider-label">Tiempo de exposición</span>
              <span class="slider-value">{{ stayDuration >= 120 ? '> 2 h' : formatDuration(stayDuration) }}</span>
            </div>
            <input type="range" :min="0" :max="durationSteps.length - 1" step="1" :value="currentStepIndex"
              @input="updateDuration" class="time-slider" />
          </div>

          <!-- Hour of day -->
          <div class="slider-row">
            <div class="slider-header">
              <icon-mdi-weather-sunny />
              <span class="slider-label">Hora del día</span>
              <span class="slider-value">{{ formatHour(selectedHour) }} · IUV {{ currentUV.toFixed(1) }}</span>
            </div>
            <input type="range" min="6" max="20" step="0.25" :value="selectedHour"
              @input="selectedHour = +$event.target.value" class="time-slider hour-slider" />
          </div>

          <div class="recommendation-box" :style="{ borderColor: riskColor }">
            <p class="uv-risk" :style="{ color: riskColor }">{{ riskLevel }}</p>
            <p class="personalized-tip">{{ personalizedRecommendation }}</p>
          </div>
        </div>
      </div>
    </Transition>

    <p v-if="selectedSkinTone" class="uv-disclaimer">
      <icon-mdi-information-outline class="uv-disclaimer-icon" />
      <span>
        No somos profesionales sanitarios y SUNspot no es un producto médico.
        Estas cifras son estimaciones orientativas basadas en tu fototipo y en
        condiciones solares aproximadas; ante cualquier duda, consulta con un
        especialista.
      </span>
    </p>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useOnboarding } from '@/composables/useOnboarding'
import { skinTones } from '@/data/skinTones'
import { clearSkyUV } from '@/utils/uv'
import { DEFAULT_VIEW } from '@/utils/map'

// The spot's coordinates; Valencia centre until they are known.
const props = defineProps({
  lat: { type: Number, default: DEFAULT_VIEW.lat },
  lng: { type: Number, default: DEFAULT_VIEW.lng },
})

const emit = defineEmits(['update'])

const selectedSkinTone = ref(null)
const stayDuration = ref(60) // Default 60 minutes

const exposureLevels = [
  { id: 'face', label: 'cara', fraction: 0.10 },
  { id: 'torso', label: 'brazos', fraction: 0.18 },
  { id: 'legs', label: 'brazos y piernas', fraction: 0.36 },
  { id: 'body', label: 'cuerpo completo', fraction: 1.0 },
]
const selectedExposure = ref(exposureLevels[3]) // Default to body

// Hour slider: default to current local hour, clamped to 6–20
const selectedHour = ref(Math.min(Math.max(new Date().getHours() + new Date().getMinutes() / 60, 6), 20))

const formatHour = (h) => {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

const durationSteps = [0, 5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 120]

const currentStepIndex = computed(() => {
  return durationSteps.indexOf(stayDuration.value)
})

const updateDuration = (e) => {
  stayDuration.value = durationSteps[e.target.value]
}

// Question 5 of the onboarding questionnaire captures the Fitzpatrick
// phototype, so the wheel can arrive already calculated instead of waiting for
// the user to pick a skin tone by hand. Ids match `skinTones` 1:1.
// The payload is fetched with the user document, so it may land after mount —
// hence a watcher rather than a one-off read. A tone the user picked by hand
// always wins.
const { phototype: onboardingPhototype } = useOnboarding()
watch(onboardingPhototype, (id) => {
  if (id && !selectedSkinTone.value) {
    selectedSkinTone.value = skinTones.find(t => t.id === id) || null
  }
}, { immediate: true })

// Clear-sky UV index for today at the hour on the slider (not the live clock),
// from the sun's actual height over the spot — so it follows the season. A
// fixed curve can't: one tuned for May reads ~9 at midday in October, when the
// real figure is ~5.
const currentUV = computed(() => {
  const date = new Date()
  date.setHours(0, Math.round(selectedHour.value * 60), 0, 0)
  return clearSkyUV(date, props.lat, props.lng)
})

const exposureFactor = computed(() => {
  if (!selectedSkinTone.value) return 0
  const uv = currentUV.value
  const medConstant = selectedSkinTone.value.medConstant
  const minutes = stayDuration.value

  if (minutes === 0 || uv <= 0) return 0

  // Safe exposure time formula:
  // Safe exposure time (min) = skin constant / UV Index
  // Risk ratio = actual exposure / safe exposure (capped at 1 = MED reached)
  const safeTimeMinutes = medConstant / uv
  const baseRisk = minutes / safeTimeMinutes
  return Math.min(baseRisk * selectedExposure.value.fraction, 1)
})

const riskLevel = computed(() => {
  const f = exposureFactor.value
  if (f < 0.2) return 'Bajo'
  if (f < 0.4) return 'Moderado'
  if (f < 0.7) return 'Alto'
  if (f < 0.9) return 'Muy Alto'
  return 'Peligro'
})

const burnTimeMinutes = computed(() => {
  if (!selectedSkinTone.value || currentUV.value < 0.5) return null
  return Math.round(selectedSkinTone.value.medConstant / currentUV.value)
})

const personalizedRecommendation = computed(() => {
  if (!selectedSkinTone.value) return ''

  const uv = currentUV.value
  const medConstant = selectedSkinTone.value.medConstant
  const minutes = stayDuration.value

  if (minutes === 0) return 'Indica cuánto tiempo estarás expuesto para calcular tu riesgo.'
  if (uv < 0.5) return 'El índice UV es muy bajo a esta hora. Sin riesgo de quemadura.'

  // safeTimeMinutes = MED_constant / UV_index  (dermatological standard)
  const safeTimeMinutes = medConstant / uv
  const burnMins = Math.round(safeTimeMinutes)
  const durationLabel = minutes >= 120 ? 'más de 2h' : `${minutes} min`

  if (minutes <= safeTimeMinutes) {
    if (uv >= 8 && minutes > 30) return `Con IUV ${uv.toFixed(1)} la exposición acumula daño UV progresivo. Tu piel toleraría hasta ~${burnMins} min en este momento.`
    return `Tu piel tolera ${durationLabel} sin quemarse ahora mismo (quemadura estimada desde ~${burnMins} min).`
  } else {
    // overExposureRatio: how many times the planned duration exceeds the safe exposure time
    const overExposureRatio = minutes / safeTimeMinutes
    if (overExposureRatio > 2.0) return `Estimamos quemadura en ~${burnMins} min con este IUV. Considera buscar sombra o reducir el tiempo.`
    if (overExposureRatio > 1.5) return `Para ${durationLabel} la exposición superaría el límite estimado para tu fototipo. Te sugerimos limitar el tiempo.`
    if (overExposureRatio > 1.2) return `Para ${durationLabel} la exposición está por encima del límite estimado para tu piel.`
    return `Para ${durationLabel} estás cerca del límite estimado. Considera salir en un momento de menor IUV.`
  }
})

const riskColor = computed(() => {
  const f = exposureFactor.value
  if (f < 0.25) return '#4ade80' // Green
  if (f < 0.5) return '#facc15' // Yellow
  if (f < 0.8) return '#fb923c' // Orange
  if (f < 1.0) return '#ef4444' // Red
  return '#a855f7' // Purple (Danger)
})

const formatDuration = (min) => {
  if (min < 60) return `${min} minutos`
  const hours = Math.floor(min / 60)
  const remaining = min % 60
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours} hora${hours > 1 ? 's' : ''}`
}

watch([selectedSkinTone, stayDuration, selectedExposure, currentUV], () => {
  emit('update', {
    hasSelection: !!selectedSkinTone.value,
    uvIndex: currentUV.value,
    phototype: selectedSkinTone.value ? selectedSkinTone.value.id : 3,
    exposedArea: selectedExposure.value ? selectedExposure.value.fraction : 1.0,
    exposureTime: stayDuration.value,
    burnTime: burnTimeMinutes.value
  })
}, { immediate: true })
</script>

<style scoped>
.wheel-track {
  stroke: var(--clr-border);
}

.uv-card {
  text-align: center;
  display: flex;
  flex-direction: column;
}

.skin-selector-header {
  margin-bottom: 1.5rem;
}

.selector-prompt {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--clr-text-muted);
  margin-bottom: 1rem;
}

.skin-dots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: clamp(10px, 3vw, 14px);
  /* Room for the scaled-up active ring so it never clips against siblings */
  padding: 8px;
}

.skin-dot {
  width: clamp(30px, 8vw, 34px);
  height: clamp(30px, 8vw, 34px);
  border-radius: 50%;
  border: 2px solid var(--clr-white);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
  position: relative;
  flex-shrink: 0;
}

.skin-dot:hover {
  transform: scale(1.2);
}

.skin-dot:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--clr-white), 0 0 0 4px var(--clr-primary);
}

.skin-dot.active {
  transform: scale(1.3);
  box-shadow: 0 0 0 2px white, 0 0 0 4px var(--clr-primary);
  z-index: 2;
}

.exposure-selector {
  margin-bottom: 1.5rem;
}

.exposure-prompt {
  margin-top: 0.5rem;
  margin-bottom: 0.75rem;
}

.exposure-current {
  color: var(--clr-primary);
  text-transform: capitalize;
}

.exposure-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: clamp(10px, 3vw, 14px);
}

.exposure-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(44px, 12vw, 48px);
  height: clamp(44px, 12vw, 48px);
  border-radius: 50%;
  border: 2px solid var(--clr-border);
  background: var(--clr-white);
  color: var(--clr-text-muted);
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.exposure-btn:hover {
  border-color: var(--clr-primary);
  color: var(--clr-primary);
}

.exposure-btn:focus-visible {
  outline: none;
  border-color: var(--clr-primary);
  box-shadow: 0 0 0 3px var(--clr-primary-soft);
}

.exposure-btn.active {
  background: var(--clr-primary);
  color: var(--clr-on-brand);
  border-color: var(--clr-primary);
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

.uv-display {
  padding: 1.5rem 0;
  display: flex;
  justify-content: center;
}

.wheel-container {
  position: relative;
  width: clamp(190px, 60vw, 220px);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wheel-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.wheel-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  z-index: 1;
  margin-top: 10px;
}

.wheel-title {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--clr-dark);
  line-height: 1.2;
  margin-bottom: 8px;
}

.wheel-burn-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wheel-burn-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wheel-burn-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--clr-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}

.wheel-burn-val {
  font-size: 2.5rem;
  font-weight: 900;
  line-height: 1;
}

.wheel-burn-unit {
  font-size: 1rem;
  font-weight: 700;
}

.wheel-burn-safe {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--clr-free);
}

.controls {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slider-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.slider-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
}

.slider-label {
  font-weight: 600;
  color: var(--clr-text-muted);
  flex: 1;
  min-width: 0;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slider-value {
  font-weight: 700;
  color: var(--clr-text);
  font-size: 0.8rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.time-slider {
  width: 100%;
  accent-color: var(--clr-primary);
  margin: 0.25rem 0;
}

.hour-slider {
  accent-color: var(--clr-primary);
}

.uv-disclaimer {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 1.5rem 0 0;
  padding-top: 1rem;
  border-top: 1px solid var(--clr-border);
  font-size: 0.7rem;
  line-height: 1.4;
  font-weight: 500;
  color: var(--clr-text-muted);
  text-align: left;
}

.uv-disclaimer-icon {
  flex-shrink: 0;
  font-size: 0.95rem;
  margin-top: 1px;
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>