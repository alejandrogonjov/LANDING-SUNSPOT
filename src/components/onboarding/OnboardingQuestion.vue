<template>
  <div class="onboarding-task">
    <header class="question-header">
      <h2 class="question-display">{{ question.title }}</h2>
      <p v-if="question.sub" class="question-sub">{{ question.sub }}</p>
    </header>

    <!-- Ranked options rise to the top in order, so the list itself shows the
         priority the question is asking for. -->
    <TransitionGroup tag="div" name="rank" class="options-stack" role="group" :aria-label="question.title">
      <div v-for="opt in orderedOptions" :key="opt.value" class="option-row">
        <button type="button" class="choice-card" :class="{ 'is-selected': isSelected(opt.value) }"
          :style="opt.color ? { '--opt-color': opt.color } : null" :aria-pressed="isSelected(opt.value)"
          @click="toggle(opt.value)">
          <span v-if="opt.swatch" class="choice-swatch" :style="{ backgroundColor: opt.swatch }" aria-hidden="true" />
          <span v-else-if="opt.icon" class="choice-icon" aria-hidden="true">
            <component :is="opt.icon" />
          </span>

          <span class="choice-text">
            <span class="choice-title">{{ opt.label }}</span>
            <span v-if="opt.hint" class="choice-hint">{{ opt.hint }}</span>
          </span>

          <span v-if="isSelected(opt.value)" class="selection-indicator">
            <span v-if="isRanking">{{ getRank(opt.value) }}</span>
            <icon-mdi-check v-else />
          </span>
          <icon-mdi-chevron-right v-else-if="!isRanking" class="choice-arrow" />
        </button>

        <!-- "Otra": the free-text field only opens once the option is ranked. -->
        <input v-if="opt.isOther && isSelected(opt.value)" ref="otherInput" class="other-input" type="text"
          :placeholder="opt.placeholder || 'Escribe la tuya'" :value="otherText" maxlength="60"
          :aria-label="`Especifica tu opción para: ${question.title}`"
          @input="$emit('update:otherText', $event.target.value)" />
      </div>
    </TransitionGroup>

    <div v-if="isRanking" class="task-footer">
      <p class="rank-hint" aria-live="polite">{{ rankHint }}</p>

      <button class="btn-primary btn-continue" :disabled="!canContinue" @click="$emit('next')">
        {{ isLast ? 'Finalizar' : 'Continuar' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'

const props = defineProps({
  question: { type: Object, required: true },
  // Ordered array of option values for `ranking`; the chosen value for `single`.
  modelValue: { type: [Array, String, Number], default: null },
  otherText: { type: String, default: '' },
  isLast: Boolean,
})

const emit = defineEmits(['update:modelValue', 'update:otherText', 'next'])

const otherInput = ref(null)

const isRanking = computed(() => props.question.type === 'ranking')
const ranking = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []))

const isSelected = (val) =>
  isRanking.value ? ranking.value.includes(val) : props.modelValue === val

const getRank = (val) => ranking.value.indexOf(val) + 1

const isOther = (val) => !!props.question.options.find(o => o.value === val)?.isOther

// Ranked first, in the order they were picked; the rest keep their original
// order underneath. TransitionGroup animates the moves.
const orderedOptions = computed(() => {
  if (!isRanking.value) return props.question.options

  const picked = ranking.value
    .map(val => props.question.options.find(o => o.value === val))
    .filter(Boolean)

  return [...picked, ...props.question.options.filter(o => !ranking.value.includes(o.value))]
})

// One pick is enough to move on: the ranking is a preference signal, not a form
// to complete, and ordering every option was busywork for users who only cared
// about the top one. "Otra" is the exception — picking it without saying what
// it stands for stores nothing usable, so its text is required while selected.
const otherSelected = computed(() => ranking.value.some(isOther))

const needsOtherText = computed(() => otherSelected.value && !props.otherText.trim())

const canContinue = computed(
  () => !isRanking.value || (ranking.value.length > 0 && !needsOtherText.value)
)

const rankHint = computed(() => {
  if (!ranking.value.length) return 'Elige al menos una opción'
  if (needsOtherText.value) return 'Escribe tu opción para continuar'
  return 'Toca una opción de nuevo para quitarla'
})

const toggle = (val) => {
  if (!isRanking.value) {
    emit('update:modelValue', val)
    emit('next')
    return
  }

  const index = ranking.value.indexOf(val)
  const next = [...ranking.value]

  if (index > -1) {
    next.splice(index, 1)
    // Dropping "Otra" from the ranking discards whatever was typed in it.
    if (isOther(val)) emit('update:otherText', '')
  } else {
    next.push(val)
    if (isOther(val)) nextTick(() => otherInput.value?.[0]?.focus())
  }

  emit('update:modelValue', next)
}
</script>

<style scoped>
.question-header {
  margin-bottom: 1.75rem;
}

.question-display {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--clr-dark);
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.question-sub {
  font-size: 0.95rem;
  color: var(--clr-text-muted);
  margin-top: 0.6rem;
  line-height: 1.45;
}

.options-stack {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.option-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.choice-card {
  --opt-color: var(--clr-primary);
  /* Category tokens run from near-black (culture) to pale yellow (hostelry),
     so glyphs and the rank badge use a darkened variant — otherwise the light
     ones are unreadable against white. The card tint keeps the true colour. */
  --opt-ink: color-mix(in srgb, var(--opt-color), var(--clr-dark) 38%);
  background: var(--clr-white);
  border: 2px solid var(--clr-border);
  padding: 0.9rem 1rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 0.85rem;
  cursor: pointer;
  transition: border-color var(--transition), background-color var(--transition),
    box-shadow var(--transition), transform 0.15s ease;
  width: 100%;
  text-align: left;
  box-shadow: var(--shadow-sm);
}

.choice-card:active {
  transform: scale(0.985);
}

.choice-card.is-selected {
  border-color: var(--opt-ink);
  background: color-mix(in srgb, var(--opt-color), var(--clr-white) 94%);
}

.choice-card:focus-visible {
  outline: none;
  border-color: var(--opt-ink);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--opt-color), transparent 75%);
}

.choice-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  font-size: 1.2rem;
  color: var(--opt-ink);
  background: color-mix(in srgb, var(--opt-color), transparent 85%);
}

.choice-swatch {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid var(--clr-white);
  box-shadow: 0 0 0 1px var(--clr-border);
}

.choice-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  flex: 1;
  min-width: 0;
}

.choice-title {
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--clr-dark);
  line-height: 1.3;
}

.choice-hint {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--clr-text-muted);
}

.selection-indicator {
  background: var(--opt-ink);
  color: var(--clr-white);
  min-width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.85rem;
  font-weight: 800;
  flex-shrink: 0;
}

.choice-arrow {
  color: var(--clr-grey);
  font-size: 1.3rem;
  flex-shrink: 0;
}

.other-input {
  width: 100%;
  padding: 0.85rem 1rem;
  border: 2px solid var(--clr-primary);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-family: inherit;
  color: var(--clr-dark);
  background: var(--clr-white);
}

.other-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--clr-primary), transparent 80%);
}

.task-footer {
  margin-top: 1.5rem;
}

.rank-hint {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--clr-text-muted);
  text-align: center;
  margin-bottom: 0.75rem;
  min-height: 1.2em;
}

.btn-continue {
  width: 100%;
}

.btn-continue:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Reordering animation: ranked cards slide up into place. */
.rank-move {
  transition: transform 0.35s cubic-bezier(0.34, 1.2, 0.64, 1);
}

@media (prefers-reduced-motion: reduce) {

  .rank-move,
  .choice-card {
    transition: none;
  }
}
</style>
