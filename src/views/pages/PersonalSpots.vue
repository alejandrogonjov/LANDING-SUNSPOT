<template>
  <DefaultLayout>
    <div class="personal-spots-page">
      <!-- Count bar -->
      <div v-if="spots.length && !showSheet" class="spots-meta">
        <p class="subtitle">
          {{ spots.length }} {{ spots.length === 1 ? 'spot personal' : 'spots personales' }}
        </p>
        <router-link to="/personal-map" class="map-link">
          <icon-mdi-map-outline />
          Ver Mapa
        </router-link>
      </div>

      <!-- Empty state -->
      <div v-if="spots.length === 0" class="empty-state">
        <div class="empty-visual">
          <img src="/sunspot-skyline.svg" alt="Personal Spot" class="empty-illustration" />
          <div class="empty-glow"></div>
        </div>
        <h3>Crea tu primer spot personalizado</h3>
        <p>Añade tus spots personales.</p>
        <button class="btn-primary" @click="openCreateSheet">
          <icon-mdi-plus />
          Personal Spot
        </button>
      </div>

      <!-- Spots list -->
      <section v-else class="spots-feed">
        <TransitionGroup name="card">
          <div v-for="spot in spots" :key="spot.id" class="spot-card" @click="goToSpot(spot.id)">
            <div class="spot-media">
              <img src="/sunspot-skyline.svg" :alt="spot.name" />
            </div>

            <div class="spot-content">
              <h3 class="spot-name">{{ spot.name }}</h3>
              <p class="spot-desc">{{ spot.description || 'Sin descripción' }}</p>
            </div>

            <div class="spot-actions" style="position: relative;">
              <button @click.stop="toggleMenu(spot.id)" class="action-btn menu" aria-label="Opciones">
                <icon-mdi-dots-horizontal />
              </button>

              <div v-if="activeMenuId === spot.id" class="dropdown-menu">
                <button @click.stop="openEditSheet(spot); activeMenuId = null">
                  <icon-mdi-pencil-outline /> Editar
                </button>
                <button @click.stop="confirmDelete(spot); activeMenuId = null" class="delete">
                  <icon-mdi-trash-can-outline /> Eliminar
                </button>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </section>

      <!-- FAB -->
      <Transition name="fab">
        <button v-if="spots.length > 0 && !showSheet && !showDeleteConfirm" class="fab" @click="openCreateSheet"
          aria-label="Añadir spot">
          <icon-mdi-plus />
        </button>
      </Transition>

      <!-- Create / Edit Sheet -->
      <Teleport to="body">
        <Transition name="sheet">
          <div v-if="showSheet" class="sheet-overlay" @click.self="closeSheet">
            <div class="bottom-sheet" v-drag-close="closeSheet">
              <div class="sheet-handle"></div>
              <div class="sheet-content">
                <div class="sheet-header">
                  <h2 class="sheet-title">{{ editing ? 'Editar Spot' : 'Personaliza tu Spot' }}</h2>
                  <button class="btn-close" @click="closeSheet">
                    <icon-mdi-close />
                  </button>
                </div>
                <p class="sheet-subtitle">{{ editing ? 'Modifica los datos de tu spot personal.' :
                  'Crea tu spot personalizado.' }}</p>

                <form @submit.prevent="handleSave" class="spot-form">
                  <div class="form-group">
                    <label for="spot-name-input">Nombre *</label>
                    <div class="input-wrapper">
                      <icon-mdi-map-marker-outline class="input-icon" />
                      <input id="spot-name-input" ref="nameInput" v-model="form.name" type="text"
                        placeholder="Mi terraza soleada" required maxlength="60" />
                    </div>
                    <span class="char-count">{{ form.name.length }}/60</span>
                  </div>

                  <div class="form-group">
                    <label for="spot-desc-input">Descripción</label>
                    <div class="input-wrapper textarea-wrapper">
                      <textarea id="spot-desc-input" v-model="form.description"
                        placeholder="Descripción personalizada..." rows="3" maxlength="200"></textarea>
                    </div>
                    <span class="char-count">{{ form.description.length }}/200</span>
                  </div>

                  <div class="form-group">
                    <label>Ubicación</label>
                    <button type="button" class="location-toggle" :class="{ active: form.lat != null }"
                      @click="toggleLocation">
                      <icon-mdi-crosshairs-gps v-if="!locating" />
                      <div v-else class="loc-spinner"></div>
                      <span v-if="form.lat != null">Ubicación guardada</span>
                      <span v-else-if="locating">Localizando...</span>
                      <span v-else>Usar mi ubicación</span>
                      <icon-mdi-check-circle v-if="form.lat != null" class="loc-check" />
                    </button>
                  </div>

                  <!-- Category -->
                  <div class="form-group">
                    <label>Categoría</label>
                    <div class="category-grid">
                      <button v-for="cat in categories" :key="cat.value" type="button" class="category-btn"
                        :class="{ active: form.category === cat.value }" :style="form.category === cat.value ? {
                          backgroundColor: `color-mix(in srgb, ${cat.color}, transparent 90%)`,
                          borderColor: cat.color,
                          color: cat.color
                        } : {}" @click="form.category = cat.value">
                        <component :is="cat.icon" class="cat-btn-icon" />
                        <span class="cat-btn-label">{{ cat.label }}</span>
                      </button>
                    </div>
                  </div>

                  <!-- Address -->
                  <div class="form-group">
                    <label for="spot-address-input">Dirección</label>
                    <div class="input-wrapper">
                      <icon-mdi-map-marker-outline class="input-icon" />
                      <input id="spot-address-input" v-model="form.address" type="text"
                        placeholder="Av. del Puerto, 123" maxlength="120" />
                    </div>
                  </div>

                  <!-- Attributes -->
                  <div class="form-group">
                    <label>Características</label>
                    <div class="attribute-pills">
                      <label class="pill" :class="form.is_free ? 'active-free' : 'active-paid'">
                        <input type="checkbox" v-model="form.is_free" />
                        <icon-mdi-currency-eur-off v-if="form.is_free" />
                        <icon-bxs-door-open v-else />
                        <span>{{ form.is_free ? 'Gratis' : 'Establecimiento' }}</span>
                      </label>
                      <label class="pill" :class="{ 'active-sunrise': form.is_sunrise }">
                        <input type="checkbox" v-model="form.is_sunrise" />
                        <icon-mdi-weather-sunset-up />
                        <span>Sunrise</span>
                      </label>
                      <label class="pill" :class="{ 'active-sunset': form.is_sunset }">
                        <input type="checkbox" v-model="form.is_sunset" />
                        <icon-mdi-weather-sunset-down />
                        <span>Sunset</span>
                      </label>
                      <label class="pill" :class="{ 'active-shadow': form.has_shadow }">
                        <input type="checkbox" v-model="form.has_shadow" />
                        <icon-mdi-umbrella />
                        <span>Sombra</span>
                      </label>
                      <label class="pill" :class="{ 'active-natural-shadow': form.has_natural_shadow }">
                        <input type="checkbox" v-model="form.has_natural_shadow" />
                        <icon-mdi-tree />
                        <span>Sombra Natural</span>
                      </label>
                      <label class="pill" :class="{ 'active-quiet': form.is_quiet }">
                        <input type="checkbox" v-model="form.is_quiet" />
                        <icon-tabler-ear-off />
                        <span>Calma acústica</span>
                      </label>
                      <label class="pill" :class="{ 'active-windy': form.is_windy }">
                        <input type="checkbox" v-model="form.is_windy" />
                        <icon-tabler-wind />
                        <span>Brisa</span>
                      </label>
                    </div>
                  </div>

                  <button type="submit" class="btn-primary submit-btn" :disabled="!form.name.trim()">
                    <icon-mdi-check v-if="editing" />
                    <icon-mdi-plus v-else />
                    {{ editing ? 'Guardar cambios' : 'Crear Spot' }}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Delete Confirmation Sheet -->
      <Teleport to="body">
        <Transition name="sheet">
          <div v-if="showDeleteConfirm" class="sheet-overlay" @click.self="cancelDelete">
            <div class="bottom-sheet" v-drag-close="cancelDelete">
              <div class="sheet-handle"></div>
              <div class="sheet-content delete-confirm">
                <div class="delete-icon-wrap">
                  <icon-mdi-trash-can-outline class="delete-warn-icon" />
                </div>
                <h3>¿Eliminar este spot?</h3>
                <p class="delete-spot-name">{{ spotToDelete?.name }}</p>
                <p class="delete-disclaimer">Esta acción no se puede deshacer.</p>
                <div class="confirm-actions">
                  <button class="btn-secondary" @click="cancelDelete">Cancelar</button>
                  <button class="btn-delete" @click="handleDelete">
                    <icon-mdi-trash-can-outline />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { usePersonalSpots } from '@/composables/usePersonalSpots'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useRouter } from 'vue-router'
import { useSettings } from '@/composables/useSettings'

import IconMdiLeaf from '~icons/mdi/leaf'
import IconMdiDumbbell from '~icons/mdi/dumbbell'
import IconMdiPalette from '~icons/mdi/palette'
import IconMdiCoffee from '~icons/mdi/coffee'

const router = useRouter()
const { spots, addSpot, updateSpot, removeSpot } = usePersonalSpots()
const { geolocationEnabled } = useSettings()

const categories = [
  { value: 'nature', label: 'Naturaleza', icon: IconMdiLeaf, color: 'var(--cat-nature)' },
  { value: 'sport', label: 'Deporte', icon: IconMdiDumbbell, color: 'var(--cat-sport)' },
  { value: 'culture', label: 'Cultura', icon: IconMdiPalette, color: 'var(--cat-culture)' },
  { value: 'hostelry', label: 'Hostelería', icon: IconMdiCoffee, color: 'var(--cat-hostelry)' }
]

// Sheet state
const showSheet = ref(false)
const editing = ref(false)
const editingId = ref(null)
const nameInput = ref(null)
const locating = ref(false)

const form = ref({
  name: '',
  description: '',
  address: '',
  category: '',
  lat: null,
  lng: null,
  is_free: true,
  is_sunrise: false,
  is_sunset: false,
  has_shadow: false,
  has_natural_shadow: false,
  is_quiet: false,
  is_windy: false
})

// Menu state
const activeMenuId = ref(null)

function toggleMenu(id) {
  activeMenuId.value = activeMenuId.value === id ? null : id
}

function closeMenu(e) {
  if (!e.target.closest('.spot-actions')) {
    activeMenuId.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})

// Delete state
const showDeleteConfirm = ref(false)
const spotToDelete = ref(null)

function openCreateSheet() {
  editing.value = false
  editingId.value = null
  form.value = {
    name: '', description: '', address: '', category: '',
    lat: null, lng: null,
    is_free: true, is_sunrise: false, is_sunset: false,
    has_shadow: false, has_natural_shadow: false,
    is_quiet: false, is_windy: false
  }
  showSheet.value = true
  nextTick(() => nameInput.value?.focus())
}

function openEditSheet(spot) {
  editing.value = true
  editingId.value = spot.id
  form.value = {
    name: spot.name,
    description: spot.description || '',
    address: spot.address || '',
    category: spot.category || '',
    lat: spot.lat ?? null,
    lng: spot.lng ?? null,
    is_free: spot.is_free ?? true,
    is_sunrise: spot.is_sunrise ?? false,
    is_sunset: spot.is_sunset ?? false,
    has_shadow: spot.has_shadow ?? false,
    has_natural_shadow: spot.has_natural_shadow ?? false,
    is_quiet: spot.is_quiet ?? false,
    is_windy: spot.is_windy ?? false
  }
  showSheet.value = true
  nextTick(() => nameInput.value?.focus())
}

function toggleLocation() {
  if (form.value.lat != null) {
    form.value.lat = null
    form.value.lng = null
    return
  }
  if (!('geolocation' in navigator)) return
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      form.value.lat = pos.coords.latitude
      form.value.lng = pos.coords.longitude
      locating.value = false
    },
    () => { locating.value = false },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

function closeSheet() {
  showSheet.value = false
  editing.value = false
  editingId.value = null
}

function handleSave() {
  if (!form.value.name.trim()) return

  const payload = {
    name: form.value.name,
    description: form.value.description,
    address: form.value.address,
    category: form.value.category,
    lat: form.value.lat,
    lng: form.value.lng,
    is_free: form.value.is_free,
    is_sunrise: form.value.is_sunrise,
    is_sunset: form.value.is_sunset,
    has_shadow: form.value.has_shadow,
    has_natural_shadow: form.value.has_natural_shadow,
    is_quiet: form.value.is_quiet,
    is_windy: form.value.is_windy
  }

  if (editing.value && editingId.value) {
    updateSpot(editingId.value, payload)
  } else {
    addSpot(payload)
  }

  closeSheet()
}

function confirmDelete(spot) {
  spotToDelete.value = spot
  showDeleteConfirm.value = true
}

function cancelDelete() {
  showDeleteConfirm.value = false
  spotToDelete.value = null
}

function goToSpot(id) {
  router.push(`/personal-spot/${id}`)
}

function handleDelete() {
  if (spotToDelete.value) {
    removeSpot(spotToDelete.value.id)
  }
  cancelDelete()
}
</script>

<style scoped>
.personal-spots-page {
  padding: 1.5rem;
  padding-bottom: calc(var(--total-nav-height) + 6rem);
  width: 100%;
  margin: 0 auto;
}

/* --- Meta bar --- */
.spots-meta {
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.subtitle {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--clr-grey);
  opacity: 0.8;
}

.map-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--clr-primary);
  background: rgba(224, 120, 32, 0.1);
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-full);
  transition: all 0.2s ease;
}

.map-link:hover {
  background: var(--clr-primary);
  color: var(--clr-white);
}

/* --- Empty State --- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1.5rem;
  gap: 0.5rem;
}

.empty-visual {
  position: relative;
  width: 140px;
  height: 140px;
  margin-bottom: 1rem;
}

.empty-illustration {
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.6;
  filter: drop-shadow(0 4px 12px rgba(224, 120, 32, 0.15));
}

.empty-glow {
  position: absolute;
  inset: -20%;
  background: radial-gradient(circle, rgba(224, 120, 32, 0.08) 0%, transparent 70%);
  z-index: -1;
  animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {

  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }

  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

.empty-state h3 {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--clr-dark);
}

.empty-state p {
  font-size: 0.9rem;
  color: var(--clr-text-muted);
  max-width: 260px;
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.empty-state .btn-primary {
  margin-top: 0.5rem;
}

/* --- Spots Feed --- */
.spots-feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* --- Spot Card --- */
.spot-card {
  display: flex;
  background: var(--clr-white);
  border-radius: 20px;
  border: 1px solid var(--clr-border);
  min-height: 120px;
  box-shadow: var(--shadow-sm);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.spot-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--clr-primary-soft);
}

/* --- Card Media --- */
.spot-media {
  width: 100px;
  flex-shrink: 0;
  background: var(--clr-background-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border-radius: 20px 0 0 20px;
}

.spot-media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.5;
}

/* --- Card Content --- */
.spot-content {
  flex: 1;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.spot-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--clr-dark);
  line-height: 1.3;
  margin: 0;
  display: -webkit-box;
  line-clamp: 1;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.spot-desc {
  font-size: 0.8rem;
  color: var(--clr-grey);
  line-height: 1.45;
  margin: 0.25rem 0 0;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}



/* --- Card Actions --- */
.spot-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem 0.75rem 0.75rem 0;
  flex-shrink: 0;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-size: 1rem;
}

.action-btn.menu {
  background: var(--clr-background-alt);
  color: var(--clr-grey);
}

.action-btn.menu:hover {
  background: var(--clr-border);
  color: var(--clr-dark);
  transform: scale(1.1);
}

.action-btn:active {
  transform: scale(0.9);
}

/* --- Dropdown Menu --- */
.dropdown-menu {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--clr-white);
  border: 1px solid var(--clr-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  z-index: 10;
  min-width: 140px;
}

.dropdown-menu button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--clr-dark);
  transition: background 0.2s;
}

.dropdown-menu button:hover {
  background: rgba(224, 120, 32, 0.1);
  color: var(--clr-primary);
}

.dropdown-menu button.delete {
  color: #ff3b30;
}

.dropdown-menu button.delete:hover {
  background: rgba(255, 59, 48, 0.08);
  color: #ff3b30;
}

/* --- FAB --- */
.fab {
  position: fixed;
  bottom: calc(var(--total-nav-height) + 1.5rem);
  right: calc(50% - min(var(--max-width), 100%) / 2 + 1.5rem);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--clr-sunspot-400) 0%, var(--clr-primary) 100%);
  color: var(--clr-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  border: none;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(224, 120, 32, 0.35);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 100;
}

.fab:hover {
  transform: scale(1.08) translateY(-2px);
  box-shadow: 0 10px 30px rgba(224, 120, 32, 0.45);
}

.fab:active {
  transform: scale(0.95);
  box-shadow: 0 4px 12px rgba(224, 120, 32, 0.25);
}

/* --- Form --- */
.spot-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--clr-dark);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  font-size: 1.1rem;
  color: var(--clr-grey);
  pointer-events: none;
  transition: color 0.2s ease;
}

.input-wrapper input {
  width: 100%;
  padding: 0.9rem 1rem 0.9rem 2.75rem;
  border: 1.5px solid var(--clr-border);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  background: var(--clr-white);
  color: var(--clr-dark);
  transition: all 0.2s ease;
  outline: none;
}

.input-wrapper input:focus {
  border-color: var(--clr-primary);
  box-shadow: 0 0 0 3px rgba(224, 120, 32, 0.1);
}

.input-wrapper input:focus~.input-icon,
.input-wrapper input:focus+.input-icon {
  color: var(--clr-primary);
}

.textarea-wrapper textarea {
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1.5px solid var(--clr-border);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  background: var(--clr-white);
  color: var(--clr-dark);
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s ease;
  outline: none;
  font-family: inherit;
}

.textarea-wrapper textarea:focus {
  border-color: var(--clr-primary);
  box-shadow: 0 0 0 3px rgba(224, 120, 32, 0.1);
}

.char-count {
  font-size: 0.7rem;
  color: var(--clr-grey);
  text-align: right;
}

/* --- Location Toggle --- */
.location-toggle {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.85rem 1rem;
  border: 1.5px dashed var(--clr-border);
  border-radius: var(--radius-md);
  background: var(--clr-background-alt);
  color: var(--clr-grey);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.location-toggle:hover {
  border-color: var(--clr-primary);
  color: var(--clr-primary);
}

.location-toggle.active {
  border-color: var(--clr-primary);
  border-style: solid;
  background: rgba(224, 120, 32, 0.06);
  color: var(--clr-primary);
}

.loc-check {
  margin-left: auto;
  font-size: 1.1rem;
  color: var(--clr-primary);
}

.loc-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--clr-border);
  border-top-color: var(--clr-primary);
  border-radius: 50%;
  animation: loc-spin 0.8s linear infinite;
}

@keyframes loc-spin {
  to {
    transform: rotate(360deg);
  }
}


.submit-btn {
  width: 100%;
  margin-top: 0.5rem;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* --- Category Grid --- */
.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 0.85rem;
  border-radius: 12px;
  border: 1.5px solid var(--clr-border);
  background: var(--clr-background-alt);
  color: var(--clr-grey);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: left;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
}

.category-btn:hover {
  transform: translateY(-2px);
  border-color: var(--clr-grey);
}

.category-btn:active {
  transform: scale(0.96);
}

.category-btn.active {
  font-weight: 800;
}

.cat-btn-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

/* --- Attribute Pills --- */
.attribute-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1rem;
  border-radius: 20px;
  background: var(--clr-background-alt);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--clr-grey);
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  user-select: none;
}

.pill:hover {
  transform: translateY(-2px);
  background: var(--clr-border);
}

.pill:active {
  transform: scale(0.95);
}

.pill input {
  display: none;
}

.pill.active-free {
  background: color-mix(in srgb, var(--clr-free), transparent 88%);
  color: var(--clr-free);
  border-color: color-mix(in srgb, var(--clr-free), transparent 80%);
}

.pill.active-paid {
  background: color-mix(in srgb, var(--clr-warn), transparent 88%);
  color: var(--clr-warn);
  border-color: color-mix(in srgb, var(--clr-warn), transparent 80%);
}

.pill.active-sunrise {
  background: color-mix(in srgb, var(--clr-sunrise), transparent 88%);
  color: var(--clr-sunrise);
  border-color: color-mix(in srgb, var(--clr-sunrise), transparent 80%);
}

.pill.active-sunset {
  background: color-mix(in srgb, var(--clr-sunset), transparent 88%);
  color: var(--clr-sunset);
  border-color: color-mix(in srgb, var(--clr-sunset), transparent 80%);
}

.pill.active-shadow {
  background: color-mix(in srgb, var(--clr-shadow), transparent 88%);
  color: var(--clr-shadow);
  border-color: color-mix(in srgb, var(--clr-shadow), transparent 80%);
}

.pill.active-natural-shadow {
  background: color-mix(in srgb, var(--clr-natural-shadow), transparent 88%);
  color: var(--clr-natural-shadow);
  border-color: color-mix(in srgb, var(--clr-natural-shadow), transparent 80%);
}

.pill.active-quiet {
  background: color-mix(in srgb, var(--clr-quiet), transparent 85%);
  color: var(--clr-quiet);
  border-color: color-mix(in srgb, var(--clr-quiet), transparent 80%);
}

.pill.active-windy {
  background: color-mix(in srgb, var(--clr-windy), transparent 85%);
  color: var(--clr-windy);
  border-color: color-mix(in srgb, var(--clr-windy), transparent 80%);
}

/* --- Delete Confirmation --- */
.delete-confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
  padding: 2rem 1.75rem;
}

.delete-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 59, 48, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.delete-warn-icon {
  font-size: 1.8rem;
  color: #ff3b30;
}

.delete-confirm h3 {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--clr-dark);
}

.delete-spot-name {
  font-size: 0.95rem;
  color: var(--clr-primary);
  font-weight: 700;
}

.delete-disclaimer {
  font-size: 0.8rem;
  color: var(--clr-grey);
}

.confirm-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  width: 100%;
}

.confirm-actions .btn-secondary {
  flex: 1;
}

.btn-delete {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.9rem 1.5rem;
  background: #ff3b30;
  color: var(--clr-white);
  font-weight: 700;
  font-size: 0.95rem;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-delete:hover {
  background: #e6342b;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 59, 48, 0.3);
}

.btn-delete:active {
  transform: scale(0.97);
}

/* --- Transitions --- */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.3s ease;
}

.sheet-enter-active .bottom-sheet,
.sheet-leave-active .bottom-sheet {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .bottom-sheet,
.sheet-leave-to .bottom-sheet {
  transform: translateY(100%);
}

.card-enter-active,
.card-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.card-leave-to {
  opacity: 0;
  transform: translateX(-100%) scale(0.9);
}

.card-move {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fab-enter-active,
.fab-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: scale(0) rotate(180deg);
}
</style>
