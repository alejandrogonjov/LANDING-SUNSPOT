<template>
  <Teleport to="body">
    <transition name="slide-up" appear>
      <div class="sheet-overlay" @click.self="$emit('close')">
        <div class="bottom-sheet" v-drag-close="() => $emit('close')">

          <div class="sheet-handle" />

          <div class="sheet-content">
            <div class="sheet-header">
              <h2 class="sheet-title">Ser Embajador</h2>
              <button class="btn-close" type="button" @click="$emit('close')">
                <icon-mdi-close />
              </button>
            </div>

            <p class="sheet-subtitle">
              Cuéntanos sobre ti y cómo encajas con la filosofía SUNspot.
            </p>

            <form id="ambassador-form" class="ambassador-form" @submit.prevent="handleSubmit">

              <div class="field">
                <label class="field-label">Nombre completo</label>
                <input v-model="form.name" type="text" class="field-input" placeholder="Tu nombre" required />
              </div>

              <div class="field">
                <label class="field-label">Bio</label>
                <textarea v-model="form.bio" class="field-input field-textarea"
                  placeholder="Cuéntanos quién eres, a qué te dedicas..." rows="3" required />
              </div>

              <p class="field-group-label">Redes sociales</p>

              <div class="field field-icon-row">
                <icon-mdi-instagram class="field-icon" />
                <input v-model="form.instagram" type="text" class="field-input" placeholder="@instagram" />
              </div>

              <div class="field field-icon-row">
                <icon-mdi-music-note class="field-icon" />
                <input v-model="form.tiktok" type="text" class="field-input" placeholder="@tiktok" />
              </div>

              <div class="field field-icon-row">
                <icon-mdi-web class="field-icon" />
                <input v-model="form.web" type="text" class="field-input" placeholder="tu-web.com" />
              </div>

            </form>
          </div>

          <div class="sheet-footer">
            <button form="ambassador-form" type="submit" class="btn-primary submit-btn"
              :disabled="submitted || loading">
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
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['close'])

const loading = ref(false)
const submitted = ref(false)

const form = ref({
  name: '',
  bio: '',
  instagram: '',
  tiktok: '',
  web: ''
})

function handleSubmit() {
  const phone = "34618788745"
  const text = `¡Hola! Quiero ser embajador de SUNspot.
Nombre: ${form.value.name}
Bio: ${form.value.bio}
Instagram: ${form.value.instagram || '-'}
TikTok: ${form.value.tiktok || '-'}
Web: ${form.value.web || '-'}`

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')

  submitted.value = true
  setTimeout(() => emit('close'), 2000)
}
</script>

<style scoped>
/* Redundant overlay, sheet, and handle styles removed - now using unified global styles */

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.sheet-footer {
  padding: 1rem 1.75rem;
  background: var(--clr-white);
  border-top: 1px solid var(--clr-border);
}

.sheet-title {
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--clr-text);
  margin: 0;
}

/* Redundant close-btn styles removed - now using unified global styles */

.sheet-subtitle {
  color: var(--clr-grey);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

/* --- Form --- */
.ambassador-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-label,
.field-group-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--clr-text);
  letter-spacing: 0.4px;
}

.field-group-label {
  margin-bottom: -0.25rem;
}

.field-icon-row {
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}

.field-icon {
  color: var(--clr-primary);
  font-size: 1.25rem;
  flex-shrink: 0;
}

.field-input {
  flex: 1;
  border: 1px solid var(--clr-border);
  border-radius: 0.75rem;
  padding: 0.7rem 1rem;
  font-size: 0.95rem;
  color: var(--clr-text);
  background: var(--clr-white);
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
  cursor: default;
}
</style>