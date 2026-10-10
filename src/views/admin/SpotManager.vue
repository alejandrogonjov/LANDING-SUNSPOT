<template>
  <AdminLayout>
    <main class="spot-manager-view">
      <!-- Header Area -->
      <div class="header-main">
        <div class="title-group">
          <p class="subtitle">Gestiona la información, ubicación y galería del punto</p>
          <span class="id-badge" :class="{
            'id-error shake': isDuplicateId && !isEditing,
            'id-active': !isDuplicateId && form.spot_id
          }">
            <icon-mdi-pound class="badge-pound" />
            {{ form.spot_id || '...' }}
          </span>
        </div>
        <p v-if="isDuplicateId && !isEditing" class="error-msg animate-bounce">
          <icon-mdi-alert-circle /> Este ID ya está en uso en Valencia
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="fetching" class="loading-state-container">
        <div class="spinner-solar"></div>
        <span class="loading-text">Cargando datos del Sunspot...</span>
      </div>

      <div v-else class="manager-content">
        <!-- Tabs Navigation -->
        <nav class="admin-tabs">
          <button type="button" class="tab-btn" :class="{ active: activeTab === 'details' }"
            @click="activeTab = 'details'">
            <icon-mdi-text-box-outline class="tab-icon" />
            <span>Detalles</span>
          </button>

          <button type="button" class="tab-btn" :class="{ active: activeTab === 'location' }"
            @click="activeTab = 'location'">
            <icon-mdi-map-marker-outline class="tab-icon" />
            <span>Ubicación</span>
          </button>

          <button type="button" class="tab-btn" :class="{ active: activeTab === 'images' }"
            @click="activeTab = 'images'">
            <icon-mdi-image-multiple-outline class="tab-icon" />
            <span>Fotos</span>
            <span v-if="form.images?.length" class="images-count-badge">
              {{ form.images.length }}
            </span>
          </button>

          <div class="tab-indicator" :class="activeTab"></div>
        </nav>

        <!-- Form and Content -->
        <form @submit.prevent="handleSubmit" class="manager-form">
          <!-- Form Tabs Content -->
          <div class="tab-content-area">
            <SpotBasicInfo v-show="activeTab === 'details'" :form="form" />
            <SpotLocation v-show="activeTab === 'location'" :form="form" />
            <SpotImageManager v-show="activeTab === 'images'" v-model:images="form.images" />
          </div>



          <!-- Form Actions Footer -->
          <div class="form-actions">
            <button type="submit" class="btn-save" :disabled="loading || !isFormValid">
              <div v-if="loading" class="spinner-inline"></div>
              <span>
                {{ computingHorizon ? t('solar.computing') : (loading ? 'Guardando cambios...' : (isEditing ? 'Actualizar spot' : 'Crear Nuevo Sunspot')) }}
              </span>
            </button>

            <button v-if="isEditing" type="button" @click="handleDelete" class="btn-delete" :disabled="loading">
              <icon-mdi-delete-outline class="delete-icon" />
              <span>Eliminar permanentemente</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, serverTimestamp, GeoPoint } from 'firebase/firestore'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { useTranslator } from '@/composables/useTranslator'
import { useSolarHorizon } from '@/composables/useSolarHorizon'

import SpotBasicInfo from '@/components/admin/SpotBasicInfo.vue'
import SpotLocation from '@/components/admin/SpotLocation.vue'
import SpotImageManager from '@/components/admin/SpotImageManager.vue'

const route = useRoute()
const router = useRouter()

const { t } = useTranslator()
const { computeForLocation } = useSolarHorizon()

const loading = ref(false)
const computingHorizon = ref(false)
const fetching = ref(true)
const activeTab = ref('details')

const isEditing = computed(() => route.params.id && route.params.id !== 'nuevo')
const existingSpots = ref([])

const form = reactive({
  name: '', address: '', description: '', category: '',
  lat: null, lng: null, is_free: true,
  is_sunrise: false, is_sunset: false, spot_id: '',
  web: '',
  has_shadow: false,
  has_natural_shadow: false,
  images: []
})

// --- LÓGICA DE ID ---
const getNextId = () => {
  if (!existingSpots.value.length) return 'sunspot_0001'
  const numericIds = existingSpots.value
    .map(s => {
      const match = s.spot_id?.match(/\d+/)
      return match ? parseInt(match[0]) : 0
    })
  const maxId = Math.max(...numericIds, 0)
  return `sunspot_${String(maxId + 1).padStart(4, '0')}`
}

const isDuplicateId = computed(() => {
  if (isEditing.value) return false
  return existingSpots.value.some(s => s.spot_id === form.spot_id)
})

// --- VALIDACIONES ---
const isFormValid = computed(() => {
  return form.name.length > 2 && form.lat !== null && form.lng !== null && !isDuplicateId.value
})

const loadData = async () => {
  fetching.value = true
  try {
    if (isEditing.value) {
      const docSnap = await getDoc(doc(db, 'spots', route.params.id))
      if (docSnap.exists()) {
        const s = docSnap.data()
        Object.assign(form, {
          ...s,
          lat: s.location?.latitude,
          lng: s.location?.longitude,
          images: s.images ? [...s.images] : []
        })
      } else {
        alert("Spot no encontrado")
        router.push('/panel')
      }
    } else {
      // Necesitamos cargar los spots para generar el ID nuevo
      const snap = await getDocs(collection(db, 'spots'))
      existingSpots.value = snap.docs.map(d => ({ spot_id: d.data().spot_id }))
      form.spot_id = getNextId()
    }
  } catch (error) {
    console.error("Error cargando spot:", error)
  } finally {
    fetching.value = false
  }
}

onMounted(() => {
  loadData()
})

// --- ACCIONES ---
const handleSubmit = async () => {
  if (!isFormValid.value) return
  loading.value = true

  try {
    // Precompute the date-independent horizon profile (Overpass + footprint geometry).
    // Overpass failure never blocks the save — it returns a fallback profile instead.
    computingHorizon.value = true
    const { profile, source } = await computeForLocation(form.lat, form.lng)
    computingHorizon.value = false

    const payload = {
      ...form,
      location: new GeoPoint(form.lat, form.lng),
      horizon_profile: profile,
      horizon_source: source,
      horizon_computed_at: serverTimestamp(),
      updated_at: serverTimestamp()
    }
    delete payload.lat; delete payload.lng;

    if (isEditing.value) {
      await updateDoc(doc(db, 'spots', route.params.id), payload)
      console.log(`[spots] Actualizado OK: ${form.name} (${form.spot_id})`)
    } else {
      payload.created_at = serverTimestamp()
      const ref = await addDoc(collection(db, 'spots'), payload)
      console.log(`[spots] Creado OK: ${form.name} (${form.spot_id}) → ${ref.id}`)
    }
    router.push('/panel')
  } catch (e) {
    console.error(`[spots] FALLO al ${isEditing.value ? 'actualizar' : 'crear'} "${form.name}" (${form.spot_id}):`, e)
    alert("Error al guardar: " + e.message)
  } finally {
    loading.value = false
    computingHorizon.value = false
  }
}

const handleDelete = async () => {
  if (confirm('¿Borrar este spot de forma permanente? Esta acción no se puede deshacer.')) {
    loading.value = true
    try {
      await deleteDoc(doc(db, 'spots', route.params.id))
      router.push('/panel')
    } catch (e) {
      console.error(e)
      alert("Error al eliminar: " + e.message)
    } finally {
      loading.value = false
    }
  }
}
</script>

<style scoped>
.spot-manager-view {
  padding: 1rem 1rem 6rem 1rem;
  background: var(--clr-background);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Header Styling */
.header-main {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 0.25rem 1rem 0.25rem;
  border-bottom: 1px solid var(--clr-border);
}

.title-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.title-left {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.title-left h2 {
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--clr-dark);
  letter-spacing: -0.2px;
}

.subtitle {
  font-size: 0.78rem;
  color: var(--clr-text-muted);
  font-weight: 500;
  margin: 0;
}

.id-badge {
  font-family: monospace;
  font-size: 0.72rem;
  font-weight: 800;
  background: var(--clr-white);
  color: var(--clr-text-muted);
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid var(--clr-border);
  display: inline-flex;
  align-items: center;
  gap: 2px;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}

.badge-pound {
  font-size: 0.8rem;
  opacity: 0.6;
}

.id-badge.id-active {
  background: var(--clr-primary-soft);
  color: var(--clr-primary);
  border-color: color-mix(in srgb, var(--clr-primary), transparent 75%);
  animation: pulse-badge 2s infinite;
}

@keyframes pulse-badge {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--clr-primary), transparent 80%);
  }

  70% {
    box-shadow: 0 0 0 6px rgba(224, 120, 32, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(224, 120, 32, 0);
  }
}

.id-badge.id-error {
  background: var(--clr-danger-soft);
  color: var(--clr-danger);
  border-color: color-mix(in srgb, var(--clr-danger), transparent 65%);
}

.error-msg {
  color: var(--clr-danger);
  font-size: 0.72rem;
  font-weight: 800;
  margin: 4px 0 0 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Shake Animation */
.shake {
  animation: shakeKey 0.4s ease-in-out;
}

@keyframes shakeKey {

  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-4px);
  }

  75% {
    transform: translateX(4px);
  }
}

/* Loading Solar Spinner */
.loading-state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 5rem 1rem;
}

.spinner-solar {
  width: 48px;
  height: 48px;
  border: 4px solid var(--clr-primary-soft);
  border-top-color: var(--clr-primary);
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.55, 0.085, 0.68, 0.53) infinite;
}

.loading-text {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--clr-text-muted);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Manager Content and Tabs */
.manager-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.admin-tabs {
  position: relative;
  display: flex;
  background: var(--clr-neutral-soft);
  padding: 4px;
  border-radius: 14px;
  border: 1px solid var(--clr-border);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.75rem 0.25rem;
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--clr-text-muted);
  border-radius: 10px;
  cursor: pointer;
  z-index: 2;
  transition: color 0.25s ease;
  position: relative;
}

.tab-btn.active {
  color: var(--clr-primary);
}

.tab-icon {
  font-size: 1rem;
}

.images-count-badge {
  font-size: 0.62rem;
  background: var(--clr-primary);
  color: var(--clr-on-brand);
  padding: 2px 5px;
  border-radius: 6px;
  margin-left: 2px;
}

/* Tab indicator line sliding background effect */
.tab-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(33.33% - 4px);
  background: var(--clr-white);
  border-radius: 10px;
  z-index: 1;
  box-shadow: var(--shadow-sm);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tab-indicator.details {
  transform: translateX(0);
}

.tab-indicator.location {
  transform: translateX(100%);
}

.tab-indicator.images {
  transform: translateX(200%);
}

.manager-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.tab-content-area {
  display: flex;
  flex-direction: column;
}



/* Actions Footer styling */
.form-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-save {
  background: linear-gradient(135deg, var(--clr-sunspot-400) 0%, var(--clr-primary) 100%);
  color: var(--clr-white);
  border: none;
  padding: 1.05rem;
  border-radius: var(--radius-md);
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 6px 16px color-mix(in srgb, var(--clr-primary), transparent 75%);
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(224, 120, 32, 0.35);
}

.btn-save:active {
  transform: translateY(0) scale(0.97);
  box-shadow: 0 4px 10px color-mix(in srgb, var(--clr-primary), transparent 85%);
}

.btn-save:disabled {
  opacity: 0.5;
  filter: grayscale(1);
  cursor: not-allowed;
  box-shadow: none;
}

.spinner-inline {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--clr-on-brand);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.btn-delete {
  background: none;
  border: 1.5px solid color-mix(in srgb, var(--clr-danger), transparent 75%);
  color: var(--clr-danger);
  margin-top: 0.5rem;
  font-weight: 800;
  font-size: 0.85rem;
  width: 100%;
  padding: 0.9rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: all 0.2s ease;
}

.btn-delete:hover:not(:disabled) {
  background: var(--clr-danger-soft);
  border-color: var(--clr-danger);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--clr-danger), transparent 92%);
}

.btn-delete:active {
  transform: scale(0.98);
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-icon {
  font-size: 1.1rem;
}
</style>
