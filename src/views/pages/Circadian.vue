<template>
  <DefaultLayout>
    <main class="circadian-page">
      <div v-if="isLoading" class="loading-state">
        <p>Cargando...</p>
      </div>

      <CircadianConsult v-else-if="!isEligible && latestResult"
        :latest-result="latestResult"
        :next-available-date="nextAvailableDate" />

      <!-- Results Dashboard -->
      <CircadianResults v-else-if="currentResult" :result="currentResult" />

      <!-- Questionnaire View -->
      <div v-else class="questionnaire-view fade-in">
        <p v-if="!testStarted" class="subtitle">Evalúa tu sincronización con el ciclo natural luz-oscuridad.</p>

        <div v-if="!testStarted" class="start-screen fade-in">
          <div class="description-content">
            <h3 class="desc-title">
              <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              ¿Qué es la batería circadiana?
            </h3>
            <p>La Batería Circadiana mide tu nivel de activación a través de tus hábitos de luz, sueño y ritmo. Responde
              para descubrir qué áreas puedes mejorar. Recomendamos hacerla cada 15 días.</p>
          </div>

          <button @click="testStarted = true" class="submit-btn start-btn">Empezar Test</button>
        </div>

        <div v-else class="quiz-container fade-in">
          <form @submit.prevent="submitTest" class="quiz-form" v-if="allQuestions.length > 0">
            <div class="question-card fade-in" :key="currentStep">
              <div v-if="currentStep < allQuestions.length">
                <h2 class="block-title">{{ allQuestions[currentStep].blockTitle }}</h2>
                <div class="progress-bar" role="progressbar">
                  <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
                </div>

                <div class="question-item">
                  <button type="button" class="back-btn" @click="prevStep" v-if="currentStep > 0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                      stroke-linejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Volver
                  </button>
                  <p class="question-text">{{ allQuestions[currentStep].text }}</p>
                  <div class="options-group">
                    <label v-for="opt in allQuestions[currentStep].options" :key="opt.value" class="option-label"
                      :class="{ selected: answers[allQuestions[currentStep].id] === opt.value }"
                      @click.prevent="toggleAnswer(allQuestions[currentStep].id, opt.value)">
                      <input type="radio" :name="allQuestions[currentStep].id" :value="opt.value"
                        :checked="answers[allQuestions[currentStep].id] === opt.value" />
                      <span class="option-text">{{ opt.text }}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div v-else class="review-step">
                <div class="progress-bar" role="progressbar">
                  <div class="progress-fill" :style="{ width: '100%' }"></div>
                </div>
                <div class="review-text">
                  <p class="review-message">Has respondido todas las preguntas.</p>
                  <p class="review-subtext">Revisa tus respuestas o envía los resultados.</p>
                </div>
                <div class="review-actions">
                  <button type="submit" class="submit-btn" :disabled="!isFormValid || isSaving">
                    {{ isSaving ? 'Guardando...' : 'Enviar resultados' }}
                  </button>
                  <button type="button" class="back-btn review-back-btn" @click="prevStep">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                      stroke-linejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Volver
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import CircadianResults from '@/components/circadian/CircadianResults.vue'
import CircadianConsult from '@/components/circadian/CircadianConsult.vue'
import { useUser } from '@/composables/useUser'
import { useBattery } from '@/composables/useBattery'

const { user, loading: userLoading } = useUser()
const { saveBatteryLog, getLatestBatteryLog, isSaving } = useBattery()

// State
const isLoading = ref(true)
const isEligible = ref(true)
const latestResult = ref(null)
const nextAvailableDate = ref('')
const currentResult = ref(null)
const testStarted = ref(false)
const currentStep = ref(0)

const answers = ref({
  q1: null, q2: null, q3: null,
  q4: null, q5: null, q6: null,
  q7: null, q8: null, q9: null,
  q10: null, q11: null, q12: null
})

// Data definition
const questionsData = [
  {
    id: 'light',
    title: 'BLOQUE 1: LUZ',
    questions: [
      { id: 'q1', text: '1. ¿Cuánto tiempo pasas al aire libre al día?', options: [{ text: '<10 min', value: 0 }, { text: '10–30 min', value: 1 }, { text: '30–60 min', value: 2 }, { text: '1–2 h', value: 3 }, { text: '>2 h', value: 4 }] },
      { id: 'q2', text: '2. ¿Recibes luz solar en la primera hora tras despertarte?', options: [{ text: 'Nunca', value: 0 }, { text: '1–2 días', value: 1 }, { text: '3–4 días', value: 2 }, { text: '5–6 días', value: 3 }, { text: 'Todos los días', value: 4 }] },
      { id: 'q3', text: '3. ¿Buscas activamente el sol (paseos, terrazas, etc.)?', options: [{ text: 'Nunca', value: 0 }, { text: 'Rara vez', value: 1 }, { text: 'A veces', value: 2 }, { text: 'Frecuentemente', value: 3 }, { text: 'Siempre', value: 4 }] },
    ]
  },
  {
    id: 'sleep',
    title: 'BLOQUE 2: SUEÑO',
    questions: [
      { id: 'q4', text: '4. ¿Cuántas horas duermes?', options: [{ text: '<5h', value: 0 }, { text: '5–6h', value: 1 }, { text: '6–7h', value: 2 }, { text: '7–8h', value: 3 }, { text: '>8h', value: 4 }] },
      { id: 'q5', text: '5. ¿Te despiertas descansado?', options: [{ text: 'Nunca', value: 0 }, { text: 'Rara vez', value: 1 }, { text: 'A veces', value: 2 }, { text: 'Casi siempre', value: 3 }, { text: 'Siempre', value: 4 }] },
      { id: 'q6', text: '6. ¿Tienes interrupciones por la noche?', options: [{ text: 'Nunca', value: 0 }, { text: 'Rara vez', value: 1 }, { text: 'A veces', value: 2 }, { text: 'Muy frecuente', value: 3 }, { text: 'Siempre', value: 4 }] },
    ]
  },
  {
    id: 'rhythm',
    title: 'BLOQUE 3: RITMO',
    questions: [
      { id: 'q7', text: '7. ¿Te acuestas a la misma hora?', options: [{ text: 'Nunca', value: 0 }, { text: 'Rara vez', value: 1 }, { text: 'A veces', value: 2 }, { text: 'Casi siempre', value: 3 }, { text: 'Siempre', value: 4 }] },
      { id: 'q8', text: '8. ¿Te levantas a la misma hora?', options: [{ text: 'Nunca', value: 0 }, { text: 'Rara vez', value: 1 }, { text: 'A veces', value: 2 }, { text: 'Casi siempre', value: 3 }, { text: 'Siempre', value: 4 }] },
      { id: 'q9', text: '9. ¿Tu energía es estable durante el día?', options: [{ text: 'Nunca', value: 0 }, { text: 'Rara vez', value: 1 }, { text: 'A veces', value: 2 }, { text: 'Bastante estable', value: 3 }, { text: 'Muy estable', value: 4 }] },
    ]
  },
  {
    id: 'disruptors',
    title: 'BLOQUE 4: DISRUPTORES',
    questions: [
      { id: 'q10', text: '10. ¿Usas pantallas antes de dormir?', options: [{ text: 'Nunca', value: 0 }, { text: 'Rara vez', value: 1 }, { text: 'A veces', value: 2 }, { text: 'Muy frecuente', value: 3 }, { text: 'Siempre', value: 4 }] },
      { id: 'q11', text: '11. ¿Consumes cafeína por la tarde?', options: [{ text: 'Nunca', value: 0 }, { text: 'Rara vez', value: 1 }, { text: 'A veces', value: 2 }, { text: 'Muy frecuente', value: 3 }, { text: 'Siempre', value: 4 }] },
      { id: 'q12', text: '12. ¿Estás expuesto a luz artificial intensa por la noche?', options: [{ text: 'Nunca', value: 0 }, { text: 'Rara vez', value: 1 }, { text: 'A veces', value: 2 }, { text: 'Muy frecuente', value: 3 }, { text: 'Siempre', value: 4 }] },
    ]
  }
]

// Computed
const allQuestions = computed(() => {
  return questionsData.flatMap(block =>
    block.questions.map(q => ({ ...q, blockTitle: block.title }))
  )
})

const progressPercentage = computed(() => {
  if (allQuestions.value.length === 0) return 0
  return ((currentStep.value) / allQuestions.value.length) * 100
})

const isFormValid = computed(() => {
  return Object.values(answers.value).every(val => val !== null)
})

// Methods
const nextStep = () => {
  if (currentStep.value < allQuestions.value.length) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

let advanceTimeout = null
const toggleAnswer = (qId, val) => {
  if (answers.value[qId] === val) {
    answers.value[qId] = null
    if (advanceTimeout) clearTimeout(advanceTimeout)
  } else {
    answers.value[qId] = val
    if (advanceTimeout) clearTimeout(advanceTimeout)
    if (currentStep.value < allQuestions.value.length) {
      advanceTimeout = setTimeout(() => {
        nextStep()
      }, 300)
    }
  }
}

const getVal = (id, inverted = false) => {
  const val = answers.value[id] || 0
  return inverted ? (4 - val) : val
}

const calculateResults = () => {
  // Block calculations: (sum / 3) * 25
  const lightScore = ((getVal('q1') + getVal('q2') + getVal('q3')) / 3) * 25
  const sleepScore = ((getVal('q4') + getVal('q5') + getVal('q6', true)) / 3) * 25
  const rhythmScore = ((getVal('q7') + getVal('q8') + getVal('q9')) / 3) * 25
  const disruptorsScore = ((getVal('q10', true) + getVal('q11', true) + getVal('q12', true)) / 3) * 25

  const totalScore = (lightScore * 0.35) + (sleepScore * 0.30) + (rhythmScore * 0.20) + (disruptorsScore * 0.15)

  const blockScores = {
    light: lightScore,
    sleep: sleepScore,
    rhythm: rhythmScore,
    disruptors: disruptorsScore
  }

  // Find worst block
  let worstBlock = 'light'
  let minScore = lightScore
  for (const [block, score] of Object.entries(blockScores)) {
    if (score < minScore) {
      minScore = score
      worstBlock = block
    }
  }

  return {
    rawAnswers: { ...answers.value },
    blockScores,
    totalScore,
    worstBlock
  }
}

const submitTest = async () => {
  if (!isFormValid.value || !user.value) return

  const results = calculateResults()

  try {
    await saveBatteryLog(user.value.uid, results)
    currentResult.value = results
  } catch (error) {
    alert("Hubo un error al guardar los resultados. Inténtalo de nuevo.")
  }
}

// Init
onMounted(async () => {
  if (!user.value) {
    // If user isn't loaded immediately, we wait for watcher
    return
  }
  await checkEligibility()
})

watch(() => user.value, async (newVal) => {
  if (newVal) {
    await checkEligibility()
  }
})

const checkEligibility = async () => {
  if (!user.value) return
  isLoading.value = true
  try {
    const latest = await getLatestBatteryLog(user.value.uid)
    if (latest && latest.createdAt) {
      const now = new Date()
      // handle firebase timestamp
      const logDate = latest.createdAt.toDate ? latest.createdAt.toDate() : new Date(latest.createdAt)
      const diffTime = Math.abs(now - logDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays <= 15) {
        isEligible.value = false
        latestResult.value = latest

        const next = new Date(logDate)
        next.setDate(next.getDate() + 15)
        nextAvailableDate.value = next.toLocaleDateString()
      }
    }
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.circadian-page {
  padding: 0 1.5rem 80px;
  max-width: var(--max-width);
  margin: 0 auto;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--clr-text-muted);
}

.page-title {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  text-align: center;
}

.subtitle {
  color: var(--clr-text-muted);
  text-align: center;
  margin-bottom: 1rem;
}

.desc-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--clr-primary);
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.info-icon {
  width: 20px;
  height: 20px;
}

.description-content {
  background: var(--clr-primary-soft);
  color: var(--clr-primary);
  padding: 1.5rem;
  border-radius: var(--radius-md);
  margin: 2rem 0;
  font-size: 0.95rem;
  line-height: 1.5;
  text-align: center;
}

.start-btn {
  margin-top: 1rem;
  width: 100%;
}

.progress-bar {
  background: var(--clr-border);
  height: 3px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.progress-fill {
  background: var(--clr-primary);
  height: 100%;
  transition: width 0.4s ease;
}

.fade-in {
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

/* Form */
.question-block {
  margin-bottom: 2.5rem;
}

.step-counter {
  display: none;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: none;
  color: var(--clr-grey);
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  padding: 0;
  margin-bottom: 0.75rem;
  transition: color 0.2s;
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

.back-btn:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.back-btn:not(:disabled):hover {
  color: var(--clr-primary);
}

.block-title {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  padding-bottom: 0;
  border-bottom: none;
}

.question-item {
  margin-bottom: 1.5rem;
  background: var(--clr-white);
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--clr-border);
  box-shadow: var(--shadow-sm);
}

.question-text {
  font-weight: 500;
  margin-bottom: 1rem;
}

.options-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-label {
  display: flex;
  align-items: center;
  padding: 0.8rem 1rem;
  background: var(--clr-neutral-soft);
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.option-label:hover {
  background: var(--clr-primary-soft);
}

.option-label.selected {
  background: var(--clr-primary-soft);
  border-color: var(--clr-primary);
}

.option-label input {
  display: none;
}

.option-text {
  font-size: 0.95rem;
  color: var(--clr-dark);
}

.review-text {
  text-align: center;
  padding: 2rem 0;
}

.review-message {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.review-subtext {
  color: var(--clr-text-muted);
  font-size: 0.95rem;
}

.review-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding: 1rem 0;
  position: sticky;
  bottom: 20px;
}

.review-actions .submit-btn,
.review-actions .back-btn {
  width: 100%;
  justify-content: center;
}

.submit-btn {
  flex: 1;
  padding: 1rem;
  background: var(--clr-primary);
  color: var(--clr-on-brand);
  border: none;
  border-radius: var(--radius-md);
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(224, 120, 32, 0.3);
  transition: transform 0.1s, opacity 0.2s;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.98);
}
</style>