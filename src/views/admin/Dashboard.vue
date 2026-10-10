<template>
  <AdminLayout>
    <main class="admin-dashboard">
      <!-- Stats Overview -->
      <section class="stats-grid">
        <div class="stat-card spots-card">
          <div class="stat-icon-wrapper">
            <icon-mdi-weather-sunny class="stat-icon" />
          </div>
          <div class="stat-details">
            <span class="stat-value">{{ spots.length }}</span>
            <span class="stat-label">SUNspots</span>
          </div>
        </div>

        <div class="stat-card users-card">
          <div class="stat-icon-wrapper">
            <icon-mdi-account-multiple class="stat-icon" />
          </div>
          <div class="stat-details">
            <span class="stat-value">{{ usersCount }}</span>
            <span class="stat-label">Usuarios</span>
          </div>
        </div>
      </section>

      <!-- Onboarding export -->
      <section class="export-section">
        <div class="section-header">
          <h3>Cuestionario</h3>
        </div>

        <button type="button" class="export-btn" :disabled="isExporting" @click="exportAnswers">
          <icon-mdi-download class="export-icon" />
          <span class="export-text">
            <span class="export-title">{{ isExporting ? 'Recopilando respuestas…' : 'Descargar respuestas' }}</span>
            <span class="export-sub">Todas las respuestas del onboarding en un JSON, por email</span>
          </span>
        </button>

        <p v-if="exportError" class="export-error">{{ exportError }}</p>
        <p v-else-if="lastCount !== null" class="export-done">
          {{ lastCount }} {{ lastCount === 1 ? 'respuesta descargada' : 'respuestas descargadas' }}.
        </p>
      </section>

      <!-- Notification Section -->
      <section class="notifications-section">
        <div class="section-header">
          <h3>Notificaciones</h3>
          <router-link to="/panel/notificacion/nueva" class="schema-link">
            <icon-mdi-plus-circle class="schema-icon" />
            <span>Nueva notificación</span>
          </router-link>
        </div>

        <!-- Notifications Stack -->
        <div v-if="notifications.length > 0" class="spots-stack">
          <button v-for="notif in notifications" :key="notif.id" type="button" class="spot-item-btn"
            @click="goToEditNotif(notif.id)">
            <div class="spot-thumb-wrapper">
              <div class="spot-thumb-placeholder">
                <icon-mdi-bell-outline class="active-icon" />
              </div>
            </div>

            <div class="spot-item-info">
              <span class="spot-name">{{ notif.title || 'Sin título' }}</span>
              <div class="spot-badges-row">
                <span class="category-badge"
                  style="background-color: transparent; color: var(--clr-text-muted); border-color: transparent;">
                  {{ formatDate(notif.createdAt) }}
                </span>
              </div>
            </div>
          </button>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon-wrapper">
            <icon-mdi-bell-off-outline class="empty-icon" />
          </div>
          <h4>Sin notificaciones</h4>
          <p>No hay mensajes en el historial.</p>
        </div>
      </section>

      <!-- Puntos Management Section -->
      <section class="spots-management">
        <div class="section-header">
          <h3>Puntos en Valencia</h3>
          <div class="header-actions">
            <router-link to="/panel/spot/nuevo" class="schema-link">
              <icon-mdi-plus-circle class="schema-icon" />
              <span>Nuevo spot</span>
            </router-link>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="search-bar-wrapper">
          <icon-mdi-magnify class="search-icon" />
          <input v-model="searchQuery" type="text" placeholder="Buscar por nombre o categoría..."
            class="search-input" />
          <button v-if="searchQuery" type="button" class="clear-btn" @click="searchQuery = ''">
            <icon-mdi-close class="clear-icon" />
          </button>
        </div>

        <!-- Spots List Stack -->
        <div v-if="spots.length > 0 && filteredSpots.length > 0" class="spots-stack">
          <button v-for="spot in filteredSpots" :key="spot.id" type="button" class="spot-item-btn"
            @click="goToEdit(spot.id)">
            <div class="spot-thumb-wrapper">
              <img :src="getOptimizedImageUrl(spot.images?.[0], 120)" :alt="spot.name" class="spot-thumb"
                :class="{ 'has-photo': spot.images?.[0] }" loading="lazy" />
            </div>

            <div class="spot-item-info">
              <span class="spot-name">{{ spot.name || 'Sitio sin nombre' }}</span>
              <div class="spot-badges-row">
                <!-- Category Badge -->
                <span class="category-badge" :style="{
                  backgroundColor: `color-mix(in srgb, ${getCategoryColor(spot.category)}, transparent 92%)`,
                  color: getCategoryColor(spot.category),
                  borderColor: `color-mix(in srgb, ${getCategoryColor(spot.category)}, transparent 80%)`
                }">
                  <icon-mdi-dumbbell v-if="spot.category === 'sport'" class="cat-icon" />
                  <icon-mdi-leaf v-else-if="spot.category === 'nature'" class="cat-icon" />
                  <icon-mdi-palette v-else-if="spot.category === 'culture'" class="cat-icon" />
                  <icon-mdi-coffee v-else-if="spot.category === 'hostelry'" class="cat-icon" />
                  <span>{{ t('categories.' + spot.category) }}</span>
                </span>


              </div>
            </div>

            <div v-if="needsHorizonUpdate(spot)" class="edit-action-btn">
              <icon-mdi-pencil class="edit-icon" />
            </div>
          </button>
        </div>

        <!-- Empty / Search State -->
        <div v-else-if="spots.length === 0" class="empty-state">
          <div class="empty-icon-wrapper">
            <icon-mdi-database-alert class="empty-icon" />
          </div>
          <h4>Sin puntos de luz</h4>
          <p>No hay spots registrados en Firebase Database.</p>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon-wrapper">
            <icon-mdi-magnify-close class="empty-icon" />
          </div>
          <h4>Sin coincidencias</h4>
          <p>No se encontraron resultados para "{{ searchQuery }}".</p>
        </div>
      </section>
    </main>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { useTranslator } from '@/composables/useTranslator'
import { getOptimizedImageUrl } from '@/utils/image'
import { useOnboardingExport } from '@/composables/useOnboardingExport'

// State
const router = useRouter()
const spots = ref([])
const notifications = ref([])
const usersCount = ref(0)
const searchQuery = ref('')

const { t, getCategoryColor } = useTranslator()
const { isExporting, error: exportError, lastCount, exportAnswers } = useOnboardingExport()

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

// Load Data in Real-time
onMounted(() => {
  // Listen to Spots
  const spotsQuery = query(collection(db, 'spots'), orderBy('name', 'asc'))
  onSnapshot(spotsQuery, (snapshot) => {
    spots.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  })

  // Listen to Notifications
  const notifsQuery = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'))
  onSnapshot(notifsQuery, (snapshot) => {
    notifications.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  })

  // Listen to User Count
  onSnapshot(collection(db, 'users'), (snapshot) => {
    usersCount.value = snapshot.size
  })
})

// Computed Filtered List
const filteredSpots = computed(() => {
  if (!searchQuery.value.trim()) return spots.value
  const queryText = searchQuery.value.toLowerCase().trim()
  return spots.value.filter(spot => {
    const nameMatch = spot.name?.toLowerCase().includes(queryText)
    const rawCatMatch = spot.category?.toLowerCase().includes(queryText)
    const translatedCat = t('categories.' + spot.category)
    const translatedCatMatch = translatedCat?.toLowerCase().includes(queryText)
    return nameMatch || rawCatMatch || translatedCatMatch
  })
})

// A spot still needs a horizon backfill if it has no valid 360-entry profile.
// These keep the edit pencil so an admin can spot + re-save them one by one.
const needsHorizonUpdate = (spot) =>
  !(Array.isArray(spot.horizon_profile) && spot.horizon_profile.length === 360)

// Handlers
const goToEdit = (id) => {
  router.push(`/panel/spot/${id}`)
}

const goToEditNotif = (id) => {
  router.push(`/panel/notificacion/${id}`)
}
</script>

<style scoped>
.admin-dashboard {
  padding: 1.25rem 1.25rem calc(100px + var(--safe-area-bottom)) 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  background: var(--clr-background);
  min-height: calc(100vh - var(--total-nav-height));
}

/* --- Stats Cards Section --- */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stat-card {
  background: var(--clr-white);
  padding: 1.25rem 1rem;
  border-radius: 24px;
  border: 1px solid var(--clr-border);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition), box-shadow var(--transition);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  flex-shrink: 0;
}

.spots-card .stat-icon-wrapper {
  background-color: var(--clr-primary-soft);
  color: var(--clr-primary);
}

.users-card .stat-icon-wrapper {
  background-color: color-mix(in srgb, var(--clr-info), transparent 90%);
  color: var(--clr-info);
}

.stat-icon {
  font-size: 1.35rem;
}

.stat-details {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--clr-dark);
  line-height: 1.1;
}

.stat-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-weight: 700;
  color: var(--clr-text-muted);
}

/* --- Spots Management Header --- */
.spots-management {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--clr-dark);
  letter-spacing: -0.2px;
}

.schema-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--clr-primary);
  background: var(--clr-primary-soft);
  padding: 6px 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--clr-primary), transparent 85%);
  transition: all var(--transition);
}

.schema-link:hover {
  background: color-mix(in srgb, var(--clr-primary), transparent 85%);
  transform: translateY(-1px);
}

.schema-link:active {
  transform: translateY(0);
}

.schema-icon {
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* --- Search Bar --- */
.search-bar-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: var(--clr-text-muted);
  font-size: 1.25rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.85rem 1rem 0.85rem 2.75rem;
  background-color: var(--clr-white);
  border: 1px solid var(--clr-border);
  border-radius: 18px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--clr-dark);
  box-shadow: none;
  transition: all var(--transition);
}

.search-input:focus {
  outline: none;
  border-color: var(--clr-primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--clr-primary), transparent 90%);
  background-color: var(--clr-white);
}

.search-input::placeholder {
  color: var(--clr-text-muted);
  font-weight: 400;
}

.clear-btn {
  position: absolute;
  right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--clr-primary-soft);
  color: var(--clr-primary);
  transition: all var(--transition);
}

.clear-btn:hover {
  background: var(--clr-primary);
  color: var(--clr-white);
}

.clear-icon {
  font-size: 1rem;
}

/* --- Spots Stack / Item Card --- */
.spots-stack {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.spot-item-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem;
  background: var(--clr-white);
  border: 1px solid var(--clr-border);
  border-radius: 20px;
  text-align: left;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
}

.spot-item-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: color-mix(in srgb, var(--clr-primary), transparent 80%);
}

.spot-item-btn:active {
  transform: translateY(0) scale(0.98);
}

.spot-thumb-wrapper {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--clr-background-alt);
  flex-shrink: 0;
  border: 1px solid var(--clr-border);
}

.spot-thumb {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: var(--clr-background-alt);
  transition: transform 0.3s ease;
}

.spot-thumb.has-photo {
  object-fit: cover;
}

.spot-item-btn:hover .spot-thumb.has-photo {
  transform: scale(1.05);
}

.spot-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--clr-background-alt);
}

.active-icon {
  font-size: 1.5rem;
  color: var(--clr-primary);
}

.inactive-icon {
  font-size: 1.5rem;
  color: var(--clr-grey);
}

.spot-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  /* Ensures text-overflow ellipsis works properly */
}

.spot-name {
  font-weight: 750;
  font-size: 0.95rem;
  color: var(--clr-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spot-badges-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 8px;
  border: 1px solid transparent;
  font-size: 0.65rem;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.cat-icon {
  font-size: 0.8rem;
}



.edit-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--clr-background-alt);
  border: 1px solid var(--clr-border);
  color: var(--clr-text-muted);
  flex-shrink: 0;
  transition: all var(--transition);
}

.spot-item-btn:hover .edit-action-btn {
  background: var(--clr-primary-soft);
  color: var(--clr-primary);
  border-color: color-mix(in srgb, var(--clr-primary), transparent 80%);
  transform: rotate(15deg);
}

.edit-icon {
  font-size: 1rem;
}

/* --- Empty and Search Result States --- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 1.5rem;
  background: var(--clr-white);
  border-radius: 24px;
  border: 1px dashed var(--clr-border);
  margin-top: 0.5rem;
}

.empty-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--clr-background-alt);
  color: var(--clr-grey);
  margin-bottom: 1rem;
}

.empty-icon {
  font-size: 1.85rem;
}

.empty-state h4 {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--clr-dark);
  margin-bottom: 0.25rem;
}

.empty-state p {
  font-size: 0.85rem;
  color: var(--clr-text-muted);
  max-width: 240px;
  margin: 0;
}

.btn-icon {
  font-size: 1.25rem;
}
/* Onboarding export */
.export-btn {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1px solid var(--clr-border);
  border-radius: var(--radius-md);
  background: var(--clr-white);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: border-color var(--transition), background-color var(--transition);
}

.export-btn:hover:not(:disabled),
.export-btn:focus-visible:not(:disabled) {
  border-color: var(--clr-primary);
  background: color-mix(in srgb, var(--clr-primary), transparent 94%);
}

.export-btn:disabled {
  opacity: 0.6;
  cursor: progress;
}

.export-icon {
  font-size: 1.4rem;
  color: var(--clr-primary);
  flex-shrink: 0;
}

.export-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.export-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--clr-dark);
}

.export-sub {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--clr-text-muted);
}

.export-error,
.export-done {
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 0.6rem;
}

.export-error {
  color: var(--clr-danger);
}

.export-done {
  color: var(--clr-text-muted);
}
</style>