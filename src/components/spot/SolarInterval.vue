<template>
  <div class="solar-section">

    <!-- Header -->
    <div class="section-header">
      <h3 class="section-title">Intervalo Solar</h3>
      <p v-if="sunInterval" class="section-interval">{{ sunInterval }}</p>
    </div>

    <!-- Arc shimmer -->
    <div v-if="loading" class="arc-shimmer"></div>

    <!-- Arc + Timeline (single container for pixel-perfect alignment) -->
    <div v-else class="arc-wrap">
      <svg viewBox="0 -30 320 170" class="arc-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="arcGrad" x1="0" y1="0" x2="320" y2="0" gradientUnits="userSpaceOnUse">
            <stop v-for="(stop, i) in arcGradientStops" :key="i"
              :offset="stop.offset" :stop-color="stop.color" />
          </linearGradient>
          <radialGradient id="innerGlow" :cx="ARC_CX" :cy="INNER_DISC_CY" :r="INNER_GLOW_R"
            gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FB923C" stop-opacity="0.65" />
            <stop offset="40%" stop-color="#FCD34D" stop-opacity="0.32" />
            <stop offset="75%" stop-color="#FEF3C7" stop-opacity="0.1" />
            <stop offset="100%" stop-color="#FEF9C3" stop-opacity="0" />
          </radialGradient>
        </defs>

        <!-- Inner filled half-disc (solar glow) -->
        <path
          :d="`M ${INNER_SX.toFixed(1)},${SLICE_Y} A ${INNER_R},${INNER_R} 0 0 1 ${INNER_EX.toFixed(1)},${SLICE_Y} Z`"
          fill="url(#innerGlow)" />

        <!-- Outer arc track — slot gradient -->
        <path :d="`M ${ARC_SX.toFixed(1)},${SLICE_Y} A ${ARC_R},${ARC_R} 0 0 1 ${ARC_EX.toFixed(1)},${SLICE_Y}`"
          fill="none" stroke="url(#arcGrad)" stroke-width="2.5" stroke-linecap="round" />

        <!-- Dashed vertical line from sun dot to SVG bottom edge -->
        <line v-if="isDaytime" :x1="sunX" :y1="sunY + 11" :x2="sunX" :y2="SLICE_Y" stroke="#FB923C"
          stroke-width="1.5" stroke-dasharray="4 3" opacity="0.55" />

        <!-- Sun dot halo + dot -->
        <circle v-if="isDaytime" :cx="sunX" :cy="sunY" r="15" fill="#FB923C" fill-opacity="0.12" />
        <circle v-if="isDaytime" class="sun-dot" :cx="sunX" :cy="sunY" r="9" fill="#FB923C" stroke-width="2.5" />

        <!-- Time label floating above sun dot -->
        <g v-if="isDaytime">
          <rect :x="sunX - 22" :y="sunY - 36" width="44" height="18" rx="9" fill="white" fill-opacity="0.92" />
          <text :x="sunX" :y="sunY - 23" text-anchor="middle" font-size="10.5" font-weight="700" fill="#FB923C"
            font-family="inherit">{{ currentTimeFormatted }}</text>
        </g>
      </svg>

      <!-- Timeline bar (flush below arc, same width) -->
      <div class="timeline-bar">
        <div class="tl-track" :style="{ background: timelineGradient }"></div>
        <template v-if="isWithinRange">
          <div class="tl-endpoint" :style="{ left: getArcXPct(sunrisePos) + '%' }"></div>
          <div class="tl-endpoint" :style="{ left: getArcXPct(sunsetPos) + '%' }"></div>
        </template>
        <template v-if="isDaytime">
          <div class="tl-marker" :style="{ left: getArcXPct(pointerPosition) + '%' }"></div>
        </template>
      </div>
      <div class="time-labels">
        <span v-for="(label, i) in timeLabels" :key="label" :style="{ left: getLabelPct(i) + '%' }">
          {{ label }}
        </span>
      </div>
    </div>

    <!-- Divider + sun stats -->
    <template v-if="!loading && sunStats">
      <div class="sun-stats">
        <div class="stat-item">
          <icon-mdi-weather-sunset-up class="stat-icon rise" />
          <span class="stat-label">Amanecer</span>
          <span class="stat-value">{{ sunStats.sunrise }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <icon-mdi-weather-sunny class="stat-icon noon" />
          <span class="stat-label">Sol más alto</span>
          <span class="stat-value">{{ sunStats.solarNoon }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <icon-mdi-weather-sunset-down class="stat-icon set" />
          <span class="stat-label">Atardecer</span>
          <span class="stat-value">{{ sunStats.sunset }}</span>
        </div>
      </div>
    </template>

    <!-- Legend + quality card -->
    <div class="legend-card">
      <template v-if="!loading && qualityCard">
        <h4 class="quality-title">{{ qualityCard.title }}</h4>
        <p class="quality-body">{{ qualityCard.body }}</p>
      </template>
      <div class="legend-row">
        <span class="legend-pill sunny-pill"></span>
        <span class="legend-text">Luz solar más fuerte (altura del sol)</span>
        <span class="legend-eq">= Más luz solar directa</span>
      </div>
      <div class="legend-row">
        <span class="legend-pill shadow-pill"></span>
        <span class="legend-text">Sombra de edificios</span>
        <span class="legend-eq">= Menos luz solar directa</span>
      </div>
      <div class="legend-row">
        <span class="legend-pill night-pill"></span>
        <span class="legend-text">Antes del amanecer o tras el atardecer</span>
        <span class="legend-eq">= Sin luz solar</span>
      </div>
    </div>

    <p v-if="isUsingFallback" class="fallback-note">
      * Usando estimación de sombras promedio para Valencia.
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import * as SunCalc from 'suncalc'
import { useSolarHorizon } from '@/composables/useSolarHorizon'
import { useSpotSunInterval } from '@/composables/useSpotSunInterval'

const props = defineProps({ spot: Object })

const { getProfileForSpot } = useSolarHorizon()

// Live "HH:MM - HH:MM" primary window for today (shared with the card UI)
const sunInterval = useSpotSunInterval(() => props.spot)

const loading = ref(true)
const isUsingFallback = ref(false)
const horizonProfile = ref(new Array(360).fill(0))
const now = ref(new Date())

// ── Arc geometry constants ───────────────────────────────────────
// Arc is inset by 1.25px (half of the 2.5px stroke width) on each side
// so the rounded stroke caps align exactly with the 0px and 320px boundaries
const ARC_CX = 160
const SLICE_D = 40                                                // px center sits below the cut line
const SLICE_Y = 140                                               // viewBox height = arc endpoint y
const ARC_CY = SLICE_Y + SLICE_D                                // 180 — center below viewBox
const ARC_SX = 1.25                                               // left edge of path (visual start at 0)
const ARC_EX = 318.75                                             // right edge of path (visual end at 320)
const ARC_HALF = ARC_CX - ARC_SX                                  // 158.75
const ARC_R = Math.sqrt(ARC_HALF * ARC_HALF + SLICE_D * SLICE_D) // ≈163.7 — derived from full-width span with stroke insets
const INNER_R = 127                                              // proportionally scaled inner disc
const INNER_H = Math.sqrt(INNER_R * INNER_R - SLICE_D * SLICE_D) // ≈120.5
const INNER_SX = ARC_CX - INNER_H                                // ≈39.5
const INNER_EX = ARC_CX + INNER_H                                // ≈280.5
const INNER_DISC_CY = SLICE_Y                                       // 140 — baseline (horizon)
const INNER_GLOW_R = 130                                           // proportionally scaled glow radius

// ── Day range ────────────────────────────────────────────────────
const dayTimes = computed(() => {
  if (!props.spot?.location) return null
  return SunCalc.getTimes(now.value, props.spot.location.latitude, props.spot.location.longitude)
})

const toH = (d) => d.getHours() + d.getMinutes() / 60

const range = computed(() => {
  const month = now.value.getMonth() // 0-indexed
  const isSummer = month >= 3 && month <= 8 // April–September
  return isSummer
    ? { start: 6, end: 22, total: 16 }
    : { start: 7, end: 21, total: 14 }
})

// Tick positions for actual sunrise/sunset within the seasonal window
const sunrisePos = computed(() => {
  if (!dayTimes.value) return 0
  return Math.min(Math.max((toH(dayTimes.value.sunrise) - range.value.start) / range.value.total * 100, 0), 100)
})
const sunsetPos = computed(() => {
  if (!dayTimes.value) return 100
  return Math.min(Math.max((toH(dayTimes.value.sunset) - range.value.start) / range.value.total * 100, 0), 100)
})

const isWithinRange = computed(() => {
  const h = now.value.getHours() + now.value.getMinutes() / 60
  return h >= range.value.start && h <= range.value.end
})

// True only during actual daylight (sunrise → sunset). The sun dot renders on this,
// so it never appears before sunrise or after sunset.
const isDaytime = computed(() => {
  if (!dayTimes.value) return false
  const h = now.value.getHours() + now.value.getMinutes() / 60
  return h >= toH(dayTimes.value.sunrise) && h <= toH(dayTimes.value.sunset)
})

const currentTimeFormatted = computed(() =>
  now.value.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
)

const pointerPosition = computed(() => {
  const current = now.value.getHours() + now.value.getMinutes() / 60
  const progress = (current - range.value.start) / range.value.total
  return Math.min(Math.max(progress * 100, 0), 100)
})

const timeLabels = computed(() => {
  const labels = []
  for (let i = Math.ceil(range.value.start); i <= Math.floor(range.value.end); i += 2)
    labels.push(`${i}:00`)
  return labels
})

// ── Arc horizontal projection helper (Linear horizontal scale) ────
const getArcXPct = (pct) => {
  const x = ARC_SX + (ARC_EX - ARC_SX) * (pct / 100)
  return (x / 320) * 100
}

const getLabelPct = (index) => {
  const pct = (index / (timeLabels.value.length - 1)) * 100
  return getArcXPct(pct)
}

// ── Non-sun greys ────────────────────────────────────────────────
const NIGHT_GREY = '#475569'   // outside daylight (before sunrise / after sunset) — dusk slate-blue
const SHADOW_GREY = '#CBD5E1'  // building shadow during daylight (sun blocked by horizon)

// ── Gradient stops (single source of truth for arc + timeline) ───
// Both the SVG arc and the timeline bar render from this exact same list,
// so their colouring is guaranteed to stay in sync. Each stop is
// { color, pct } where pct is the horizontal position (0–100) shared by
// both the arc's userSpaceOnUse gradient and the timeline's left offset.
const gradientStops = computed(() => {
  const slots = solarSlots.value
  if (!slots.length || !dayTimes.value) return null

  const srLinear = sunrisePos.value
  const ssLinear = sunsetPos.value
  if (ssLinear <= srLinear) return null

  const sr = getArcXPct(srLinear)
  const ss = getArcXPct(ssLinear)

  // Filter slots that fall within the astronomical daylight hours (sunrise to sunset)
  const sunriseHour = toH(dayTimes.value.sunrise)
  const sunsetHour = toH(dayTimes.value.sunset)
  const daylightSlots = slots.filter(s => s.hour >= sunriseHour && s.hour <= sunsetHour)
  if (!daylightSlots.length) return null

  const spanLinear = ssLinear - srLinear
  const stops = [
    { color: NIGHT_GREY, pct: 0 },   // night up to sunrise
    { color: NIGHT_GREY, pct: sr },
  ]

  daylightSlots.forEach((slot, i) => {
    // Distribute stops exactly from 0 to 1 across the daylight slots length
    const t_slot = daylightSlots.length > 1 ? i / (daylightSlots.length - 1) : 0.5
    const linearPct = srLinear + t_slot * spanLinear
    const projectedPct = getArcXPct(linearPct)
    // Daylight slot blocked by the horizon profile (buildings) → shadow grey; else sun colour
    const color = slot.isSunny ? sunColor(slot.alt) : SHADOW_GREY
    stops.push({ color, pct: projectedPct })
  })

  stops.push({ color: NIGHT_GREY, pct: ss }) // night from sunset onward
  stops.push({ color: NIGHT_GREY, pct: 100 })
  return stops
})

// ── Timeline gradient (CSS) — derived from gradientStops ─────────
const timelineGradient = computed(() => {
  const stops = gradientStops.value
  if (!stops) return NIGHT_GREY
  return `linear-gradient(to right, ${stops.map(s => `${s.color} ${s.pct.toFixed(2)}%`).join(', ')})`
})

// ── Arc gradient stops (SVG) — derived from gradientStops ────────
const arcGradientStops = computed(() => {
  const stops = gradientStops.value
  if (!stops) return []
  return stops.map(s => ({ color: s.color, offset: `${s.pct.toFixed(2)}%` }))
})


// ── Arc coordinates helper ───────────────────────────────────────
const getArcCoords = (pct) => {
  const t = pct / 100
  const x = ARC_SX + (ARC_EX - ARC_SX) * t
  const dx = x - ARC_CX
  const y = ARC_CY - Math.sqrt(Math.max(ARC_R * ARC_R - dx * dx, 0))
  return { x, y }
}

// ── Sun position on arc (Linear X with circle Y) ─────────────────
const sunPosition = computed(() => getArcCoords(pointerPosition.value))

const sunX = computed(() => sunPosition.value.x)
const sunY = computed(() => sunPosition.value.y)

// ── Sun stats (sunrise / solar noon / sunset) ────────────────────
const sunStats = computed(() => {
  if (!dayTimes.value) return null
  const fmt = (d) => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  return {
    sunrise: fmt(dayTimes.value.sunrise),
    solarNoon: fmt(dayTimes.value.solarNoon),
    sunset: fmt(dayTimes.value.sunset),
  }
})

// ── Solar slots (15-min resolution) ─────────────────────────────
const lerpRGB = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
]

// Matches sunny-pill: #FCD34D → #FB923C
const SUN_STOPS = [
  [253, 230, 138],  // #FDE68A — low sun (amber-200)
  [251, 146, 60],  // #FB923C — peak sun (orange-400)
]

const sunColor = (alt) => {
  const t = Math.min(Math.max(alt / 65, 0), 1)
  const seg = Math.min(Math.floor(t * (SUN_STOPS.length - 1)), SUN_STOPS.length - 2)
  const lt = t * (SUN_STOPS.length - 1) - seg
  const [r, g, b] = lerpRGB(SUN_STOPS[seg], SUN_STOPS[seg + 1], lt)
  return `rgb(${r},${g},${b})`
}

const solarSlots = computed(() => {
  if (!props.spot?.location) return []
  const slots = []
  for (let h = range.value.start; h < range.value.end; h += 0.25) {
    const d = new Date(now.value)
    d.setHours(Math.floor(h), Math.round((h % 1) * 60), 0, 0)
    const pos = SunCalc.getPosition(d, props.spot.location.latitude, props.spot.location.longitude)
    const alt = pos.altitude * (180 / Math.PI)
    const az = (pos.azimuth * (180 / Math.PI) + 180) % 360
    const limit = horizonProfile.value[Math.round(az) % 360] ?? 0
    const isSunny = alt > limit && alt > 0
    slots.push({ isSunny, hour: h, alt })
  }
  return slots
})

// ── Quality card ─────────────────────────────────────────────────
const qualityCard = computed(() => {
  if (!props.spot?.location) return null
  if (!isWithinRange.value) return {
    level: 'shadow',
    title: 'Sin luz solar directa ahora',
    body: 'El sol está por debajo del horizonte en este momento.',
  }
  const pos = SunCalc.getPosition(now.value, props.spot.location.latitude, props.spot.location.longitude)
  const alt = pos.altitude * (180 / Math.PI)
  const h = now.value.getHours() + now.value.getMinutes() / 60
  const idx = Math.floor((h - range.value.start) / 0.25)
  if (!solarSlots.value[idx]?.isSunny) return {
    level: 'shadow',
    title: 'Poca luz directa en esta franja',
    body: 'Hay sombra de edificios en este momento.',
  }
  if (alt > 50) return {
    level: 'high',
    title: 'Muy buena luz en esta franja',
    body: 'La luz solar estimada es alta y directa.',
  }
  if (alt > 25) return {
    level: 'medium',
    title: 'Buena luz solar ahora',
    body: 'El sol tiene una altura moderada en esta franja.',
  }
  return {
    level: 'low',
    title: 'Luz solar baja',
    body: 'El sol está cerca del horizonte en este momento.',
  }
})

// ── Horizon profile (stored profile, else flat fallback) ──────────
// Geometry lives in utils/solarHorizon.js via the useSolarHorizon composable.
// Always zero network calls here: a spot either has a stored horizon_profile
// (computed on save) or renders the Valencia fallback until re-saved in admin.
const loadHorizon = (spot) => {
  if (!spot?.location) return
  loading.value = true
  const { profile, source } = getProfileForSpot(spot)
  horizonProfile.value = profile
  isUsingFallback.value = source === 'fallback'
  loading.value = false
}

watch(() => props.spot, (s) => { if (s?.location) loadHorizon(s) }, { immediate: true })
</script>

<style scoped>
/* The ring reads as a cut-out of the card behind it, so it follows the surface. */
.sun-dot {
  stroke: var(--clr-white);
}

.solar-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* ── Section header ── */
.section-title {
  font-size: 1.3rem;
  font-weight: 900;
  color: var(--clr-dark);
  margin: 0;
  text-align: center;
}

.section-interval {
  margin: 0.15rem 0 0;
  text-align: center;
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--clr-sunspot-500);
}

/* Arc shimmer */
.arc-shimmer {
  aspect-ratio: 320 / 170;
  border-radius: 8px;
  background: var(--clr-neutral-soft);
  position: relative;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.arc-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--clr-white), transparent 45%), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

/* Arc wrap — contains both arc SVG and timeline */
.arc-wrap {
  position: relative;
}

.arc-svg {
  width: 100%;
  height: auto;
  display: block;
  /* negative margin so arc baseline overlaps timeline top */
  margin-bottom: -4px;
  overflow: visible;
}

.timeline-bar {
  position: relative;
  height: 8px;
  margin-bottom: 0.6rem;
}

.tl-track {
  position: absolute;
  inset: 0;
  border-radius: 99px;
  overflow: hidden;
}

.tl-endpoint {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 1.5px;
  height: 14px;
  border-radius: 1px;
  background: var(--clr-dark);
  pointer-events: none;
  z-index: 1;
}

.tl-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #FB923C;
  border: 2.5px solid var(--clr-white);
  box-shadow: 0 0 0 2px #FB923C, 0 2px 10px rgba(251, 146, 60, 0.45);
}

.time-labels {
  position: relative;
  height: 18px;
  margin-top: 4px;
}

.time-labels span {
  position: absolute;
  transform: translateX(-50%);
  font-size: 0.64rem;
  color: var(--clr-text-muted);
  font-weight: 600;
  white-space: nowrap;
}

/* Sun stats */
.sun-stats {
  display: flex;
  align-items: center;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  flex: 1;
}

.stat-icon {
  font-size: 1.15rem;
}

.stat-icon.rise {
  color: #FBBF24;
}

.stat-icon.noon {
  color: #FB923C;
}

.stat-icon.set {
  color: #FB923C;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--clr-text-muted);
  font-weight: 600;
}

.stat-value {
  font-size: 0.88rem;
  font-weight: 900;
  color: var(--clr-dark);
}

.stat-divider {
  width: 1px;
  height: 38px;
  background: var(--clr-border);
  flex-shrink: 0;
}

/* ── Legend + quality card ── */
.legend-card {
  background: var(--clr-white);
  border-radius: var(--radius-lg);
  padding: 1.1rem 1.25rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.quality-title {
  font-size: 0.95rem;
  font-weight: 900;
  color: var(--clr-dark);
  margin: 0;
}

.quality-body {
  font-size: 0.8rem;
  color: var(--clr-text-muted);
  margin: 0;
  line-height: 1.4;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.legend-pill {
  width: 40px;
  height: 18px;
  border-radius: 99px;
  flex-shrink: 0;
}

.shadow-pill {
  background: #CBD5E1;
}

.night-pill {
  background: #475569;
}

.sunny-pill {
  background: linear-gradient(to right, #FDE68A, #FB923C);
}

.legend-text {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--clr-dark);
  flex: 1;
}

.legend-eq {
  font-size: 0.72rem;
  color: var(--clr-text-muted);
  white-space: nowrap;
}



/* ── Fallback note ── */
.fallback-note {
  font-size: 0.65rem;
  color: var(--clr-text-muted);
  font-style: italic;
  margin: 0;
}
</style>
