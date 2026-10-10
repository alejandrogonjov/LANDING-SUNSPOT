<template>
  <Teleport to="body">
    <div class="sheet-overlay" @click.self="$emit('close')">
      <div class="bottom-sheet" :class="{ open: mounted }" v-drag-close="() => $emit('close')">
        <div class="sheet-handle" />

        <div class="sheet-content">
          <div class="sheet-header">
            <h2 class="sheet-title">Editar Perfil</h2>
            <button class="btn-close" @click="$emit('close')">
              <icon-mdi-close />
            </button>
          </div>

          <p class="sheet-subtitle">
            Elige cómo quieres que te llamen los demás exploradores en la comunidad SUNspot.
          </p>

          <form class="spot-form" @submit.prevent="handleSubmit">
            <div class="field">
              <label class="field-label">Nombre de usuario</label>
              <input v-model="newName" type="text" class="field-input" placeholder="Tu nombre" required ref="inputRef" />
            </div>

            <button type="submit" class="btn-primary submit-btn" :disabled="loading || newName.trim() === '' || newName === initialName">
              <template v-if="loading">
                <icon-mdi-loading class="spin" /> Guardando...
              </template>
              <template v-else>
                Guardar Cambios
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
import { db } from '@/firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { useUser } from '@/composables/useUser'

const emit = defineEmits(['close'])
const mounted = ref(false)
const loading = ref(false)
const inputRef = ref(null)

const { user, userData } = useUser()
const initialName = userData.value?.name || ''
const newName = ref(initialName)

onMounted(() => {
  requestAnimationFrame(() => { mounted.value = true })
  // Optionally focus the input after opening
  setTimeout(() => {
    if (inputRef.value) inputRef.value.focus()
  }, 400)
})

async function handleSubmit() {
  const trimmedName = newName.value.trim()
  if (!trimmedName || trimmedName === initialName) return

  loading.value = true
  try {
    if (!user.value?.uid) return
    const userRef = doc(db, 'users', user.value.uid)
    await updateDoc(userRef, { name: trimmedName })
    
    // Close the sheet with a slight delay for better UX
    setTimeout(() => {
      emit('close')
    }, 200)
  } catch (error) {
    console.error("Error updating name:", error)
    alert("Hubo un error al actualizar el nombre.")
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Inheriting all sheet layout, scrim, bottom-sheet, and handle styles from global unified styles */
.bottom-sheet.open {
  transform: translateY(0);
}

/* Redundant close-btn styles removed - now using unified global styles */

.sheet-subtitle {
  color: var(--clr-grey);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.spot-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--clr-text);
  letter-spacing: 0.4px;
}

.field-input {
  border: 1px solid var(--clr-border);
  border-radius: 0.75rem;
  padding: 0.9rem 1rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
  background: var(--clr-canvas);
}

.field-input:focus {
  border-color: var(--clr-primary);
  background: var(--clr-white);
}

.submit-btn {
  width: 100%;
}

.submit-btn:disabled {
  opacity: 0.7;
}

.spin {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
