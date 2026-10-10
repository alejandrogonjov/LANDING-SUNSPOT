<template>
  <main class="onboarding-page">
    <div v-if="isSubmitting" class="state-panel">
      <icon-mdi-loading class="spin-icon" />
      <p>Preparando tus recomendaciones…</p>
    </div>

    <!-- Intro: says why we ask and that it only happens once. -->
    <div v-else-if="phase === 'intro'" class="onboarding-container intro fade-in">
      <img src="/sunspot.svg" alt="" class="intro-logo" />
      <h1 class="intro-title">{{ isRetake ? 'Actualiza tus respuestas' : 'Bienvenido/a a SUNspot' }}</h1>
      <p v-if="isRetake" class="intro-text">
        Vuelve a responder las cinco preguntas para afinar tus recomendaciones.
        Lo que contestes ahora reemplaza tus respuestas anteriores.
      </p>
      <p v-else class="intro-text">
        Cinco preguntas rápidas para conocer cómo disfrutas del sol. Con tus respuestas
        personalizamos los spots que te recomendamos y calculamos tu exposición segura.
      </p>
      <p class="intro-note">
        {{ isRetake ? 'Si sales antes de terminar, no cambiamos nada.' : 'Solo te lo preguntamos una vez.' }}
      </p>

      <div class="intro-actions">
        <button class="btn-primary" @click="phase = 'questions'">
          {{ isRetake ? 'Empezar de nuevo' : 'Empezar' }}
        </button>
        <button class="btn-text" @click="handleSkip">{{ isRetake ? 'Cancelar' : 'Ahora no' }}</button>
      </div>
    </div>

    <!-- Done: confirms what we captured before handing the user back to the app. -->
    <div v-else-if="phase === 'done'" class="onboarding-container done fade-in">
      <span class="done-badge"><icon-mdi-check /></span>
      <h1 class="intro-title">¡Todo listo!</h1>
      <p class="intro-text">Esto es lo que nos llevamos de ti:</p>

      <ul class="recap">
        <li v-for="item in recap" :key="item.label" class="recap-row">
          <span class="recap-label">{{ item.label }}</span>
          <span class="recap-value" :style="{ '--opt-color': item.color }">
            <component :is="item.icon" v-if="item.icon" class="recap-icon" />
            <span v-else-if="item.swatch" class="recap-swatch" :style="{ backgroundColor: item.swatch }" />
            {{ item.value }}
          </span>
        </li>
      </ul>

      <button class="btn-primary" @click="router.push('/')">Explorar spots</button>
    </div>

    <div v-else class="onboarding-container fade-in">
      <section class="progress-section">
        <div class="progress-top">
          <button type="button" class="btn-text nav-link" @click="goBack">
            <icon-mdi-chevron-left /> Atrás
          </button>
          <button type="button" class="btn-text nav-link" @click="handleSkip">
            {{ isRetake ? 'Cancelar' : 'Omitir' }}
          </button>
        </div>

        <div class="progress-track" role="progressbar" :aria-valuenow="step + 1" aria-valuemin="1"
          :aria-valuemax="onboardingQuestions.length">
          <div class="progress-thumb" :style="{ width: progressWidth }"></div>
        </div>
        <div class="step-meta">
          <span>PASO {{ step + 1 }} DE {{ onboardingQuestions.length }}</span>
          <span>{{ progressWidth }}</span>
        </div>
      </section>

      <Transition :name="transitionName" mode="out-in">
        <OnboardingQuestion :key="currentQuestion.id" :question="currentQuestion"
          :model-value="answers[currentQuestion.id] ?? defaultValue" :other-text="answers[otherKey] || ''"
          :is-last="step === onboardingQuestions.length - 1" @update:model-value="setAnswer"
          @update:other-text="setOtherText" @next="handleNextStep" />
      </Transition>
    </div>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { onboardingQuestions } from '@/data/onboardingQuestions'
import { useOnboarding, markPromptedThisSession } from '@/composables/useOnboarding'
import OnboardingQuestion from '@/components/onboarding/OnboardingQuestion.vue'

const router = useRouter()
const { saveAnswers, skip, isAnswered } = useOnboarding()

// Snapshotted at setup: the user reaches this page as a retake when they came
// from the profile with a payload already stored. Saving flips `isAnswered`,
// so reading it live would rewrite the copy underneath the "done" screen.
const isRetake = ref(isAnswered.value)

const phase = ref('intro')
const step = ref(0)
const answers = ref({})
const isSubmitting = ref(false)
const transitionName = ref('step-next')

const currentQuestion = computed(() => onboardingQuestions[step.value])
const otherKey = computed(() => `${currentQuestion.value.id}_other`)
const defaultValue = computed(() => (currentQuestion.value.type === 'ranking' ? [] : null))
const progressWidth = computed(
  () => `${Math.round(((step.value + 1) / onboardingQuestions.length) * 100)}%`
)

const setAnswer = (val) => {
  answers.value[currentQuestion.value.id] = val
}

const setOtherText = (val) => {
  answers.value[otherKey.value] = val
}

const goBack = () => {
  transitionName.value = 'step-prev'
  if (step.value === 0) phase.value = 'intro'
  else step.value--
}

const handleNextStep = () => {
  transitionName.value = 'step-next'
  if (step.value < onboardingQuestions.length - 1) step.value++
  else finish()
}

// The questionnaire is asked once, so dismissing it must still be recorded —
// otherwise the user meets it again on every login. A retake is different: the
// user already has a stored payload and is merely backing out, so writing a
// `skipped` status here would destroy good answers. Leave it untouched.
const handleSkip = async () => {
  if (isRetake.value) {
    router.push('/perfil')
    return
  }

  markPromptedThisSession()
  isSubmitting.value = true

  try {
    await skip()
  } catch (error) {
    console.error('Onboarding skip error:', error)
  }

  router.push('/')
}

const finish = async () => {
  isSubmitting.value = true
  markPromptedThisSession()

  try {
    // Drop empty "Otra" texts so the stored answers stay clean.
    const payload = Object.fromEntries(
      Object.entries(answers.value).filter(([key, val]) => !key.endsWith('_other') || val)
    )

    await saveAnswers(payload)
    phase.value = 'done'
  } catch (error) {
    console.error('Onboarding Error:', error)
    // The answers are gone if we bail here, so keep the user on the last step
    // rather than dropping them into the app with nothing saved.
    phase.value = 'questions'
  } finally {
    isSubmitting.value = false
  }
}

/** Top pick per question, for the confirmation screen. */
const recap = computed(() =>
  onboardingQuestions.map((question) => {
    const answer = answers.value[question.id]
    const value = Array.isArray(answer) ? answer[0] : answer
    const option = question.options.find(o => o.value === value)
    if (!option) return null

    const custom = answers.value[`${question.id}_other`]

    return {
      label: question.recapLabel,
      value: option.isOther && custom ? custom : option.hint || option.label,
      icon: option.icon,
      swatch: option.swatch,
      color: option.color || 'var(--clr-primary)',
    }
  }).filter(Boolean)
)
</script>

<style scoped>
.onboarding-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: var(--clr-background);
  padding: calc(1.5rem + var(--safe-area-top)) 1.25rem calc(2rem + var(--safe-area-bottom));
}

.onboarding-container {
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
}

/* --- Intro / done ------------------------------------------------------- */
.intro,
.done {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
}

.intro-logo {
  width: 84px;
  height: 84px;
  margin-bottom: 0.5rem;
}

.done-badge {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  font-size: 2rem;
  color: var(--clr-white);
  background: var(--clr-primary);
  margin-bottom: 0.25rem;
}

.intro-title {
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--clr-dark);
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.intro-text {
  font-size: 1rem;
  color: var(--clr-text-muted);
  line-height: 1.5;
  max-width: 34ch;
}

.intro-note {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--clr-grey);
}

.intro-actions {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
  margin-top: 0.75rem;
}

.intro-actions .btn-primary,
.done .btn-primary {
  width: 100%;
}

.done .btn-primary {
  margin-top: 0.75rem;
}

/* --- Recap ------------------------------------------------------------- */
.recap {
  list-style: none;
  width: 100%;
  margin: 0.25rem 0 0;
  padding: 0.35rem 0.9rem;
  background: var(--clr-white);
  border: 1px solid var(--clr-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.recap-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0;
  text-align: left;
}

.recap-row+.recap-row {
  border-top: 1px solid var(--clr-border);
}

.recap-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--clr-text-muted);
  flex-shrink: 0;
}

.recap-value {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--clr-dark);
  text-align: right;
}

.recap-icon {
  font-size: 1.05rem;
  /* Matches the darkened glyph colour used on the question cards. */
  color: color-mix(in srgb, var(--opt-color), var(--clr-dark) 38%);
  flex-shrink: 0;
}

.recap-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--clr-border);
  flex-shrink: 0;
}

/* --- Progress ---------------------------------------------------------- */
.progress-section {
  margin-bottom: 2rem;
}

.progress-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.9rem;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
  padding: 0.25rem 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--clr-text-muted);
}

.progress-track {
  width: 100%;
  height: 8px;
  background: var(--clr-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-thumb {
  height: 100%;
  background: var(--clr-primary);
  border-radius: var(--radius-full);
  transition: width 0.35s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.step-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--clr-grey);
}

/* --- States ------------------------------------------------------------ */
.state-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--clr-text-muted);
}

.spin-icon {
  font-size: 2.5rem;
  color: var(--clr-primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-in {
  animation: fade-in 0.3s ease both;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

/* --- Step transitions --------------------------------------------------- */
.step-next-enter-active,
.step-next-leave-active,
.step-prev-enter-active,
.step-prev-leave-active {
  transition: opacity 0.2s ease, transform 0.25s ease;
}

.step-next-enter-from {
  opacity: 0;
  transform: translateX(18px);
}

.step-next-leave-to {
  opacity: 0;
  transform: translateX(-18px);
}

.step-prev-enter-from {
  opacity: 0;
  transform: translateX(-18px);
}

.step-prev-leave-to {
  opacity: 0;
  transform: translateX(18px);
}

@media (prefers-reduced-motion: reduce) {

  .step-next-enter-active,
  .step-next-leave-active,
  .step-prev-enter-active,
  .step-prev-leave-active,
  .progress-thumb {
    transition: none;
  }

  .fade-in {
    animation: none;
  }
}
</style>
