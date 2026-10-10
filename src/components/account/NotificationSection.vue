<template>
  <section v-if="latestNotification" class="notif-section">

    <!-- Section Header -->
    <div class="notif-section-header">
      <div class="notif-section-title-row">
        <icon-mdi-bell-outline class="notif-section-icon" />
        <h2 class="notif-section-title">Notificaciones</h2>
      </div>
    </div>

    <!-- Preview Card -->
    <router-link to="/notificacion" class="notif-preview-card" :class="{ 'is-unread': isLatestUnread }">
      <!-- Unread indicator + date -->
      <div class="notif-preview-meta">
        <!-- The red dot has been removed -->
        <time class="notif-preview-date">{{ formatDate(latestNotification.createdAt) }}</time>
      </div>

      <h3 class="notif-preview-title">{{ latestNotification.title }}</h3>
      <p class="notif-preview-body">{{ latestNotification.body }}</p>

      <!-- Spot preview (if loaded) -->
      <router-link v-if="spot" :to="`/spot/${spot.id}`" class="notif-preview-spot" @click.stop>
        <div class="spot-thumb-wrap">
          <img v-if="spot.images?.[0]"
            :src="getOptimizedImageUrl(spot.images[0], 200)"
            :alt="spot.name" class="spot-thumb" loading="lazy" />
          <div v-else class="spot-thumb-placeholder">
            <icon-mdi-weather-sunny />
          </div>
        </div>
        <div class="spot-thumb-info">
          <span class="spot-thumb-label">
            <icon-mdi-map-marker-star-outline />
            Spot sugerido
          </span>
          <span class="spot-thumb-name">{{ spot.name }}</span>
        </div>
      </router-link>
      <!-- Fallback chip while loading -->
      <div v-else-if="latestNotification.spotId" class="notif-preview-spot-chip">
        <icon-mdi-map-marker-star-outline />
        <span>Spot sugerido</span>
      </div>
    </router-link>

    <router-link to="/notificacion" class="notif-see-all">
      Ver todas las notificaciones
      <icon-mdi-arrow-right class="see-all-arrow" />
    </router-link>

  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { db } from '@/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useNotifications } from '@/composables/useNotifications'
import { useUser } from '@/composables/useUser'
import { getOptimizedImageUrl } from '@/utils/image'

const { latestNotification, unreadCount, markAsRead } = useNotifications()
const { user } = useUser()

onMounted(() => {
  if (isLatestUnread.value) {
    markAsRead(latestNotification.value.id)
  }
})

const isLatestUnread = computed(() => {
  if (!latestNotification.value || !user.value) return false
  return !(latestNotification.value.readBy || []).includes(user.value.uid)
})

const spot = ref(null)

watch(latestNotification, async (notif) => {
  if (!notif?.spotId) {
    spot.value = null
    return
  }
  try {
    const snap = await getDoc(doc(db, 'spots', notif.spotId))
    spot.value = snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch (e) {
    console.error('[NotificationSection] Error fetching spot:', e)
    spot.value = null
  }
}, { immediate: true })

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `Hace ${mins || 1} min`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(diff / 86400000)
  if (days < 7) return `Hace ${days}d`
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
}
</script>

<style scoped>
.notif-section {
  margin-bottom: 0.5rem;
}

/* ── Header ── */
.notif-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding: 0 0.25rem;
}

.notif-section-title-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.notif-section-icon {
  font-size: 1.05rem;
  color: var(--clr-primary);
}

.notif-section-title {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--clr-dark);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0;
}

.notif-unread-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.5rem 0.15rem 0.35rem;
  background: color-mix(in srgb, var(--clr-danger), transparent 90%);
  border: 1px solid color-mix(in srgb, var(--clr-danger), transparent 80%);
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--clr-danger);
  line-height: 1;
}

.notif-unread-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--clr-danger);
  animation: dot-pulse 2s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes dot-pulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.4);
    opacity: 0.7;
  }
}

.notif-see-all {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  margin-top: 0.75rem;
  padding: 0.65rem 1.25rem;
  font-size: 0.82rem;
  font-weight: 750;
  color: var(--clr-primary);
  background: var(--clr-primary-soft);
  border: 1px solid color-mix(in srgb, var(--clr-primary), transparent 85%);
  border-radius: 14px;
  text-decoration: none;
  transition: gap var(--transition), background var(--transition);
}

.notif-see-all:hover {
  gap: 0.55rem;
  background: color-mix(in srgb, var(--clr-primary), transparent 88%);
}

.see-all-arrow {
  font-size: 0.85rem;
  transition: transform var(--transition);
}

.notif-see-all:hover .see-all-arrow {
  transform: translateX(3px);
}

/* ── Preview Card ── */
.notif-preview-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  background: var(--clr-white);
  border: 1.5px solid var(--clr-border);
  border-radius: 20px;
  padding: 1.1rem 1.2rem;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
  text-decoration: none;
}

.notif-preview-card.is-unread {
  border-color: color-mix(in srgb, var(--clr-danger), transparent 75%);
  background: linear-gradient(135deg, var(--clr-danger-soft) 0%, var(--clr-white) 60%);
}

.notif-preview-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: color-mix(in srgb, var(--clr-primary), transparent 75%);
}

.notif-preview-card:active {
  transform: scale(0.98);
}

/* ── Meta row ── */
.notif-preview-meta {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.notif-preview-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--clr-danger);
  flex-shrink: 0;
}

.notif-preview-date {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--clr-text-muted);
}

/* ── Content ── */
.notif-preview-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--clr-dark);
  margin: 0;
  letter-spacing: -0.01em;
  line-height: 1.25;
}

.notif-preview-body {
  font-size: 0.83rem;
  color: var(--clr-text-muted);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Spot Chip ── */
.notif-preview-spot-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.6rem;
  background: color-mix(in srgb, var(--clr-primary), transparent 92%);
  border: 1px solid color-mix(in srgb, var(--clr-primary), transparent 85%);
  border-radius: 99px;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--clr-primary);
  width: fit-content;
  margin-top: 0.1rem;
}

/* ── Spot Preview Card ── */
.notif-preview-spot {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-top: 0.5rem;
  padding: 0.6rem 0.75rem;
  background: var(--clr-background);
  border: 1px solid var(--clr-border);
  border-radius: 14px;
  text-decoration: none;
  transition: background var(--transition), border-color var(--transition);
}

.notif-preview-spot:hover {
  background: var(--clr-background-alt);
  border-color: color-mix(in srgb, var(--clr-primary), transparent 80%);
}

.notif-preview-spot:active {
  transform: scale(0.98);
}

.spot-thumb-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--clr-background-alt);
}

.spot-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.spot-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: var(--clr-sunspot-300);
  background: linear-gradient(135deg, var(--clr-sunspot-50), var(--clr-sunspot-100));
}

.spot-thumb-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.spot-thumb-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.66rem;
  font-weight: 750;
  color: var(--clr-primary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.spot-thumb-name {
  font-size: 0.83rem;
  font-weight: 750;
  color: var(--clr-dark);
}
</style>
