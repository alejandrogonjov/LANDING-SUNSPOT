<template>
  <Teleport to="body">
    <div class="sheet-overlay" @click.self="$emit('close')">
      <div class="bottom-sheet" :class="{ open: mounted }" v-drag-close="() => $emit('close')">
        <div class="sheet-handle" />

        <div class="sheet-content">
          <div class="sheet-header">
            <h2 class="sheet-title">Proponer un Spot</h2>
            <button class="btn-close" @click="$emit('close')">
              <icon-mdi-close />
            </button>
          </div>

          <p class="sheet-subtitle">
            ¿Conoces un rincón que brilla con luz propia? Cuéntanos por qué debería estar en SUNspot.
          </p>

          <form class="spot-form" @submit.prevent="handleSubmit">
            <div class="field">
              <label class="field-label">¿Cómo se llama tu espacio?</label>
              <input v-model="form.name" type="text" class="field-input" placeholder="Nombre del lugar" required />
            </div>

            <div class="field">
              <label class="field-label">¿Qué momento destaca más?</label>
              <input v-model="form.moment" type="text" class="field-input"
                placeholder="Ej: El primer café, el atardecer..." required />
            </div>

            <div class="field">
              <label class="field-label">¿Qué hace único este lugar?</label>
              <textarea v-model="form.unique" class="field-input field-textarea" placeholder="Cuéntanos su magia..."
                rows="4" required />
            </div>

            <button type="submit" class="btn-primary submit-btn" :disabled="submitted || loading">
              <template v-if="submitted">
                <icon-mdi-check />
                ¡Redirigiendo...
              </template>
              <template v-else-if="loading">
                Enviando...
              </template>
              <template v-else>
                <div style="display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
                  <icon-mdi-whatsapp style="font-size: 1.2rem;" />
                  Enviar por WhatsApp
                </div>
              </template>
            </button>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['close'])
const mounted = ref(false)
const loading = ref(false)
const submitted = ref(false)

const form = ref({
  name: '',
  moment: '',
  unique: ''
})

onMounted(() => {
  requestAnimationFrame(() => { mounted.value = true })
})

function handleSubmit() {
  const phone = "34618788745"
  const text = `¡Hola! Quiero proponer un nuevo Spot.
Lugar: ${form.value.name}
Momento: ${form.value.moment}
¿Qué lo hace único?: ${form.value.unique}`

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')

  submitted.value = true
  setTimeout(() => emit('close'), 2000)
}
</script>

<style scoped>
/* Reuse the exact styles from your Ambassador modal for consistency */
/* Inheriting sheet layout and scrim styles from global unified styles */
.bottom-sheet.open {
  transform: translateY(0);
}

.sheet-subtitle {
  color: var(--clr-grey);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.spot-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--clr-text);
  letter-spacing: 0.4px;
}

.field-input {
  border: 1px solid var(--clr-border);
  border-radius: 0.75rem;
  padding: 0.7rem 1rem;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.field-input:focus {
  border-color: var(--clr-primary);
}

.field-textarea {
  resize: none;
}

.submit-btn {
  width: 100%;
}

.submit-btn:disabled {
  opacity: 0.7;
}
</style>