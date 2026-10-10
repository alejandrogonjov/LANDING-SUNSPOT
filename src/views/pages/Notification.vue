<template>
  <MainLayout>
    <Back title="Notificaciones" />

    <main class="timeline-page">

      <!-- Loading -->
      <div v-if="loading" class="timeline-loading">
        <div v-for="i in 3" :key="i" class="skeleton-card">
          <div class="sk-line sk-line--short" />
          <div class="sk-line sk-line--wide" />
          <div class="sk-line" />
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!notifications.length" class="timeline-empty">
        <div class="empty-icon-wrap">
          <icon-mdi-bell-off-outline />
        </div>
        <h2>Sin mensajes aún</h2>
        <p>El equipo de SUNspot no ha enviado ningún mensaje todavía. Vuelve pronto.</p>
      </div>

      <!-- Timeline -->
      <TransitionGroup v-else name="list" tag="div" class="timeline-list">
        <article v-for="notif in notifications" :key="notif.id" class="timeline-item"
          :class="{ 'is-unread': isUnread(notif) }">
          <!-- Item header -->
          <div class="item-meta">
            <span v-if="isUnread(notif)" class="item-dot" />
            <time class="item-date">{{ formatDate(notif.createdAt) }}</time>
          </div>

          <h2 class="item-title">{{ notif.title }}</h2>
          <p class="item-body">{{ notif.body }}</p>

          <!-- Suggested Spot -->
          <router-link v-if="spotsMap[notif.spotId]" :to="`/spot/${notif.spotId}`" class="item-spot-card">
            <div class="spot-card-img-wrap">
              <img v-if="spotsMap[notif.spotId].images?.[0]"
                :src="getOptimizedImageUrl(spotsMap[notif.spotId].images[0], 400)" :alt="spotsMap[notif.spotId].name"
                class="spot-card-img" loading="lazy" />
              <div v-else class="spot-card-img-placeholder">
                <icon-mdi-weather-sunny />
              </div>
            </div>
            <div class="spot-card-info">
              <span class="spot-card-label">
                <icon-mdi-map-marker-star-outline />
                Spot sugerido
              </span>
              <span class="spot-card-name">{{ spotsMap[notif.spotId].name }}</span>
            </div>
            <icon-mdi-arrow-right class="spot-card-arrow" />
          </router-link>

          <!-- Spot chip if not yet loaded -->
          <div v-else-if="notif.spotId && !spotsMap[notif.spotId]" class="item-spot-chip">
            <icon-mdi-map-marker-star-outline />
            <span>Spot sugerido</span>
          </div>
        </article>
      </TransitionGroup>

    </main>
  </MainLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { db } from '@/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useNotifications } from '@/composables/useNotifications'
import { useUser } from '@/composables/useUser'
import { getOptimizedImageUrl } from '@/utils/image'
import MainLayout from '@/layouts/MainLayout.vue'
import Back from '@/components/ui/Back.vue'

const { notifications, loading, markAllAsRead } = useNotifications()
const { user } = useUser()

// Map spotId → spot data (lazy-fetched)
const spotsMap = ref({})

function isUnread(notif) {
  if (!user.value) return false
  return !(notif.readBy || []).includes(user.value.uid)
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Fetch spot details for notifications that have a spotId
async function fetchSpots(notifs) {
  const idsToFetch = [...new Set(
    notifs.filter(n => n.spotId && !spotsMap.value[n.spotId]).map(n => n.spotId)
  )]
  await Promise.all(
    idsToFetch.map(async (id) => {
      try {
        const snap = await getDoc(doc(db, 'spots', id))
        if (snap.exists()) {
          spotsMap.value = { ...spotsMap.value, [id]: { id: snap.id, ...snap.data() } }
        }
      } catch (e) {
        console.error('[Notification] Error fetching spot:', e)
      }
    })
  )
}

watch(notifications, (notifs) => {
  if (notifs.length) fetchSpots(notifs)
}, { immediate: true })

// Mark everything as read when the page is opened
onMounted(() => {
  markAllAsRead()
})
</script>

<style scoped>
.timeline-page {
  padding: 1rem 1.25rem calc(var(--total-nav-height) + 2rem);
  display: flex;
  flex-direction: column;
  min-height: 60vh;
}

/* ── Loading Skeleton ── */
.timeline-loading {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-card {
  background: var(--clr-white);
  border: 1px solid var(--clr-border);
  border-radius: 20px;
  padding: 1.2rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.sk-line {
  height: 13px;
  border-radius: 99px;
  width: 75%;
  background: linear-gradient(90deg, var(--clr-background-alt) 25%, var(--clr-sunspot-50) 50%, var(--clr-background-alt) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.sk-line--short {
  width: 35%;
  height: 10px;
}

.sk-line--wide {
  width: 100%;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

/* ── Empty ── */
.timeline-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.85rem;
  padding: 3rem 2rem;
}

.empty-icon-wrap {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: var(--clr-background-alt);
  border: 1px solid var(--clr-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.9rem;
  color: var(--clr-grey);
  margin-bottom: 0.3rem;
}

.timeline-empty h2 {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--clr-dark);
  margin: 0;
}

.timeline-empty p {
  font-size: 0.85rem;
  color: var(--clr-text-muted);
  max-width: 270px;
  line-height: 1.55;
  margin: 0;
}

/* ── Timeline List ── */
.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── Item ── */
.timeline-item {
  background: var(--clr-white);
  border: 1.5px solid var(--clr-border);
  border-radius: 22px;
  padding: 1.2rem 1.3rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  transition: border-color var(--transition);
}

.timeline-item.is-unread {
  border-color: color-mix(in srgb, var(--clr-danger), transparent 80%);
  background: linear-gradient(135deg, var(--clr-danger-soft) 0%, var(--clr-white) 55%);
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.item-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--clr-danger);
  flex-shrink: 0;
}

.item-date {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--clr-text-muted);
  text-transform: capitalize;
}

.item-title {
  font-size: 1rem;
  font-weight: 850;
  color: var(--clr-dark);
  letter-spacing: -0.01em;
  line-height: 1.2;
  margin: 0;
}

.item-body {
  font-size: 0.87rem;
  font-weight: 450;
  color: var(--clr-text);
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

/* ── Spot Card (inside item) ── */
.item-spot-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding: 0.65rem 0.8rem;
  background: var(--clr-background);
  border: 1px solid var(--clr-border);
  border-radius: 14px;
  text-decoration: none;
  transition: background var(--transition), border-color var(--transition);
}

.item-spot-card:hover {
  background: var(--clr-background-alt);
  border-color: color-mix(in srgb, var(--clr-primary), transparent 80%);
}

.item-spot-card:active {
  transform: scale(0.98);
}

.spot-card-img-wrap {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--clr-background-alt);
}

.spot-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.spot-card-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: var(--clr-sunspot-300);
  background: linear-gradient(135deg, var(--clr-sunspot-50), var(--clr-sunspot-100));
}

.spot-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.spot-card-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.68rem;
  font-weight: 750;
  color: var(--clr-primary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.spot-card-name {
  font-size: 0.85rem;
  font-weight: 750;
  color: var(--clr-dark);
}

.spot-card-arrow {
  font-size: 1rem;
  color: var(--clr-text-muted);
  flex-shrink: 0;
  transition: transform var(--transition);
}

.item-spot-card:hover .spot-card-arrow {
  transform: translateX(3px);
}

.item-spot-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.6rem;
  background: color-mix(in srgb, var(--clr-primary), transparent 93%);
  border: 1px solid color-mix(in srgb, var(--clr-primary), transparent 85%);
  border-radius: 99px;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--clr-primary);
  margin-top: 0.35rem;
  width: fit-content;
}

/* ── List transition ── */
.list-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
</style>
