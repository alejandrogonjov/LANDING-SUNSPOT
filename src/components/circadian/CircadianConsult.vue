<template>
  <div class="results-view fade-in">
    <p class="subtitle">Ya completaste este test recientemente. Podrás repetirlo cuando se cumpla el plazo.</p>

    <div class="score-section">
      <p class="score-label">Puntuación</p>
      <div class="gauge-container">
        <svg viewBox="0 0 36 36" class="circular-chart">
          <path class="circle-bg" d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831" />
          <path class="circle" :stroke-dasharray="`${Math.round(latestResult.totalScore)}, 100`"
            :stroke="getColor(latestResult.totalScore)" d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831" />
          <text x="18" y="20.35" class="percentage">{{ Math.round(latestResult.totalScore) }}%</text>
        </svg>
      </div>
      <p class="interpretation" :style="{ color: getColor(latestResult.totalScore) }">
        {{ getInterpretation(latestResult.totalScore) }}
      </p>
    </div>

    <div class="worst-block">
      <span class="worst-block-label">Área con más margen de mejora</span>
      <span class="worst-block-name">{{ getBlockName(latestResult.worstBlock) }}</span>
    </div>

    <div class="divider"></div>

    <p class="next-date">Disponible a partir del: <strong>{{ nextAvailableDate }}</strong></p>

    <section class="recommendations">
      <h2 class="rec-title">Recomendaciones</h2>
      <div class="rec-item" v-for="blockId in ['light', 'sleep', 'rhythm', 'disruptors']" :key="blockId">
        <span class="rec-dot" :class="blockId"></span>
        <div class="rec-content">
          <h4 class="rec-block-name">{{ getBlockName(blockId) }}</h4>
          <p class="rec-text">{{ getRecommendation(blockId, latestResult.blockScores[blockId]) }}</p>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
defineProps({
  latestResult: { type: Object, required: true },
  nextAvailableDate: { type: String, required: true }
})

const getInterpretation = (score) => {
  if (score >= 80) return 'Óptimo'
  if (score >= 60) return 'Mejorable'
  return 'Desincronizado'
}

const getColor = (score) => {
  if (score >= 80) return '#4caf50'
  if (score >= 60) return '#ff9800'
  return '#f44336'
}

const getBlockName = (id) => {
  const map = {
    light: 'LUZ',
    sleep: 'SUEÑO',
    rhythm: 'RITMO',
    disruptors: 'DISRUPTORES'
  }
  return map[id] || id
}

const getRecommendation = (blockId, score) => {
  if (score < 60) {
    if (blockId === 'light') return 'Sal al exterior al menos 20–30 min al día y prioriza la luz solar por la mañana.'
    if (blockId === 'sleep') return 'Duerme entre 7–8h y reduce interrupciones nocturnas.'
    if (blockId === 'rhythm') return 'Acuéstate y levántate a la misma hora todos los días.'
    if (blockId === 'disruptors') return 'Reduce pantallas antes de dormir y evita cafeína por la tarde.'
  } else if (score < 80) {
    if (blockId === 'light') return 'Intenta aumentar tu exposición a la luz natural en tu rutina diaria.'
    if (blockId === 'sleep') return 'Ajusta pequeños hábitos para mejorar la calidad de tu descanso.'
    if (blockId === 'rhythm') return 'Mejora la regularidad de tus horarios.'
    if (blockId === 'disruptors') return 'Minimiza hábitos nocturnos que afectan tu descanso.'
  } else {
    if (blockId === 'light') return 'Mantén tu buena exposición solar.'
    if (blockId === 'sleep') return 'Mantén tu rutina de sueño.'
    if (blockId === 'rhythm') return 'Mantén tu consistencia.'
    if (blockId === 'disruptors') return 'Mantén tus buenos hábitos.'
  }
}
</script>

<style scoped>
.results-view {
  animation: fadeIn 0.4s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.subtitle {
  color: var(--clr-text-muted);
  text-align: center;
  margin-bottom: 1rem;
}

/* ── Score Section ── */
.score-section {
  text-align: center;
  padding: 2rem 0 1.5rem;
}

.score-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--clr-text-muted);
  margin-bottom: 1.25rem;
}

.gauge-container {
  max-width: 180px;
  margin: 0 auto 1.25rem;
}

.circular-chart {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  max-height: 220px;
}

.circle-bg {
  fill: none;
  stroke: var(--clr-border);
  stroke-width: 3.8;
}

.circle {
  fill: none;
  stroke-width: 2.8;
  stroke-linecap: round;
  transition: stroke-dasharray 1s ease-out;
}

.percentage {
  fill: var(--clr-dark);
  font-family: sans-serif;
  font-size: 0.45em;
  text-anchor: middle;
  font-weight: 800;
}

.interpretation {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

/* ── Worst Block ── */
.worst-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1.25rem;
  background: var(--clr-primary-soft);
  border-radius: var(--radius-md);
  text-align: center;
}

.worst-block-label {
  font-size: 0.8rem;
  color: var(--clr-text-muted);
}

.worst-block-name {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--clr-primary);
}

/* ── Divider ── */
.divider {
  height: 1px;
  background: var(--clr-border);
  margin: 1.75rem 0;
}

/* ── Next Date ── */
.next-date {
  text-align: center;
  font-size: 0.8rem;
  color: var(--clr-text-muted);
  margin: 0 0 1.75rem;
}

/* ── Recommendations ── */
.recommendations {
  margin-top: 1.75rem;
}

.rec-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--clr-text-muted);
  margin: 0 0 1.25rem;
}

.rec-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--clr-border);
}

.rec-item:last-child {
  border-bottom: none;
}

.rec-dot {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 0.35rem;
}

.rec-dot.light {
  background: var(--clr-primary);
}

.rec-dot.sleep {
  background: #4c6ef5;
}

.rec-dot.rhythm {
  background: #7950f2;
}

.rec-dot.disruptors {
  background: #f76707;
}

.rec-content {
  flex: 1;
  min-width: 0;
}

.rec-block-name {
  margin: 0 0 0.2rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--clr-dark);
}

.rec-text {
  margin: 0;
  font-size: 0.85rem;
  color: var(--clr-text-muted);
  line-height: 1.45;
}

</style>
