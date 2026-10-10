<script setup>
import { computed } from 'vue';

const props = defineProps({
  hasSelection: { type: Boolean, default: false },
  uvIndex: { type: Number, default: 2.9 },
  phototype: { type: Number, default: 3 }, // 1–6 (Fitzpatrick)
  exposedArea: { type: Number, default: 1.0 }, // 0–1
  exposureTime: { type: Number, default: 0 }, // minutes
  burnTime: { type: Number, default: null }, // minutes to MED from UVIntensityWheel
});

// Same MED constants as UVIntensityWheel — minutes to MED at UV index 1
// Calibrated to clinical midpoint MED values (SED): I≈2.0, II≈2.8, III≈3.5, IV≈5.0, V≈7.0, VI≈10.0
const MED_CONSTANTS = { 1: 120, 2: 168, 3: 210, 4: 300, 5: 420, 6: 600 }
const medConstant = computed(() => MED_CONSTANTS[props.phototype] ?? 210)

// ── Vitamin D ────────────────────────────────────────────────────
// Calibrated: phototype III · UV 2.9 · area 1.0 → min ≈ 8 min · optimal ≈ 15 min
// VD_MIN = 8 × 2.9 / 210 ≈ 0.110;  VD_OPT = 15 × 2.9 / 210 ≈ 0.207
const VD_MIN = 0.110
const VD_OPT = 0.207

const minDose = computed(() => {
  const area = Math.max(props.exposedArea, 0.1)
  const uv = Math.max(props.uvIndex, 0.1)
  return Math.max(1, Math.round((VD_MIN * medConstant.value / uv) / area))
})

const optimalDose = computed(() => {
  const area = Math.max(props.exposedArea, 0.1)
  const uv = Math.max(props.uvIndex, 0.1)
  return Math.max(1, Math.round((VD_OPT * medConstant.value / uv) / area))
})

const progress = computed(() => {
  if (optimalDose.value === 0) return 0
  return Math.min(Math.round((props.exposureTime / optimalDose.value) * 100), 100)
})

// Show contextual note when vit D optimal time exceeds burn time
// (happens with small exposed areas — vit D synthesis is slow but burn risk is per-area)
const showBurnWarning = computed(() => {
  if (!props.burnTime || !props.hasSelection) return false
  return optimalDose.value > props.burnTime
})

const remainingTime = computed(() => Math.max(0, optimalDose.value - props.exposureTime))

// ── Tanning ──────────────────────────────────────────────────────
// Dimensionless UV dose as fraction of MED; same physics as the burn-time calculation
const tanFactor = computed(() => {
  const uv = Math.max(props.uvIndex, 0)
  const area = Math.max(props.exposedArea, 0)
  if (!uv || !area || !props.exposureTime) return 0
  return (uv * props.exposureTime * area) / medConstant.value
})

const TANNING_SCALE = [
  { label: 'Sin efecto', min: 0,    color: '#94a3b8' },
  { label: 'Suave',      min: 0.15, color: '#fbbf24' },
  { label: 'Ligero',     min: 0.30, color: '#f97316' },
  { label: 'Medio',      min: 0.50, color: '#ea580c' },
  { label: 'Intenso',    min: 0.70, color: '#c2410c' },
  { label: 'Máx',        min: 0.88, color: '#7c2d12' },
]

const tanningLevel = computed(() =>
  [...TANNING_SCALE].reverse().find(l => tanFactor.value >= l.min) ?? TANNING_SCALE[0]
)

// 5 progress dots (Suave → Máx)
const tanningDots = computed(() =>
  TANNING_SCALE.slice(1).map(lvl => ({
    label: lvl.label,
    color: lvl.color,
    reached: tanFactor.value >= lvl.min,
  }))
)

// Sessions (45 min each, current UV & area) needed to reach the next tanning level
const tanningProjectionText = computed(() => {
  if (!props.exposureTime) return null
  const uv = Math.max(props.uvIndex, 0.1)
  const area = Math.max(props.exposedArea, 0.1)
  const factorPerSession = (uv * 45 * area) / medConstant.value
  if (!factorPerSession) return null

  const next = TANNING_SCALE.find(l => l.min > 0 && tanFactor.value < l.min)
  if (!next) return '¡Bronceado máximo alcanzado con estas condiciones!'

  const sessions = Math.max(1, Math.ceil((next.min - tanFactor.value) / factorPerSession))
  return sessions === 1
    ? `1 sesión adicional de 45 min para bronceado ${next.label}.`
    : `${sessions} sesiones de 45 min/día para bronceado ${next.label}.`
})
</script>

<template>
  <div class="expand-wrapper" :class="{ 'is-expanded': hasSelection }">
    <div class="expand-inner">
      <div class="d-vitamin-container">

        <!-- Vitamin D Card -->
        <div class="card vit-d-card">
          <div class="card-header">
            <h4>VITAMINA D</h4>
          </div>
          <div class="card-content">
            <div class="icon-container vit-icon-bg">
              <icon-mdi-pill class="vit-icon" />
            </div>
            <div class="stats-container">
              <div class="stat-row">
                <span class="stat-label">Dosis mínima</span>
                <span class="stat-value">{{ minDose }} min</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Dosis óptima</span>
                <span class="stat-value">{{ optimalDose }} min</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Alcanzada</span>
                <span class="stat-value text-success">{{ progress }}%</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" :style="{ width: progress + '%' }"></div>
              </div>
            </div>
          </div>
          <div class="recommendation-box" :style="{ borderColor: remainingTime > 0 ? 'var(--clr-primary)' : '#22c55e' }">
            <template v-if="remainingTime > 0">
              <p class="uv-risk" style="color: var(--clr-primary)">EN PROCESO</p>
              <p class="personalized-tip">Faltan <strong>{{ remainingTime }} min</strong> para tu dosis óptima.</p>
            </template>
            <template v-else>
              <p class="uv-risk" style="color: var(--clr-free)">COMPLETADO</p>
              <p class="personalized-tip">¡Dosis óptima de vitamina D alcanzada!</p>
            </template>
          </div>
          <div v-if="showBurnWarning" class="context-note">
            <icon-mdi-information-outline class="context-icon" />
            <span>La vitamina D depende de la superficie expuesta. Con menos piel, se necesita más tiempo que el límite de enrojecimiento.</span>
          </div>
        </div>

        <!-- Tanning Card -->
        <div class="card tanning-card">
          <div class="card-header">
            <h4>BRONCEADO ESTIMADO</h4>
          </div>
          <div class="tanning-level-badge" :style="{ color: tanningLevel.color }">
            {{ tanningLevel.label }}
          </div>
          <div class="tanning-dots">
            <div
              v-for="dot in tanningDots"
              :key="dot.label"
              class="tanning-dot"
              :class="{ reached: dot.reached }"
              :style="dot.reached ? { backgroundColor: dot.color } : {}"
              :title="dot.label"
            ></div>
          </div>
          <p class="tanning-desc" v-if="tanningProjectionText">{{ tanningProjectionText }}</p>
          <p class="tanning-desc tanning-desc--muted" v-else>
            Ajusta el tiempo de exposición para ver la proyección.
          </p>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Smooth expand wrapper */
.expand-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-out;
  pointer-events: none;
}

.expand-wrapper.is-expanded {
  grid-template-rows: 1fr;
  opacity: 1;
  pointer-events: auto;
}

.expand-inner {
  overflow: hidden;
}

.d-vitamin-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
  width: 100%;
  margin-top: 0.5rem;
  padding-bottom: 0.5rem;
}

/* Base card */
.card {
  display: flex;
  flex-direction: column;
}

.card-header h4 {
  font-size: 0.85rem;
  font-weight: 700;
  margin: 0 0 1.25rem 0;
  color: var(--clr-dark);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Vitamin D card ── */
.vit-d-card .card-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.25rem;
}

.icon-container {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vit-icon-bg { background-color: #a7e098; }

.vit-icon {
  font-size: 2.2rem;
  color: var(--clr-on-brand);
}

.stats-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.stat-label { color: var(--clr-text-muted); }

.stat-value {
  font-weight: 700;
  color: var(--clr-dark);
}

.text-success { color: var(--clr-free); }

.progress-bar-bg {
  width: 100%;
  height: 6px;
  background-color: var(--clr-border);
  border-radius: 99px;
  margin-top: 0.2rem;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background-color: var(--clr-free);
  border-radius: 99px;
  transition: width 0.4s ease;
}

.context-note {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-sm);
  background: var(--clr-info-soft);
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--clr-text);
}

.context-icon {
  flex-shrink: 0;
  font-size: 1rem;
  color: var(--clr-info);
  margin-top: 1px;
}

/* ── Tanning card ── */
.tanning-level-badge {
  font-size: 1.75rem;
  font-weight: 900;
  line-height: 1;
  margin: 0 0 0.75rem;
  transition: color 0.4s ease;
}

.tanning-dots {
  display: flex;
  gap: 8px;
  margin-bottom: 0.9rem;
  padding: 3px;
}

.tanning-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: var(--clr-border);
  transition: background-color 0.4s ease, transform 0.25s ease;
  flex-shrink: 0;
}

.tanning-dot.reached {
  transform: scale(1.2);
}

.tanning-desc {
  font-size: 0.85rem;
  color: var(--clr-text-muted);
  line-height: 1.5;
  margin: 0;
}

.tanning-desc--muted {
  opacity: 0.65;
}
</style>
