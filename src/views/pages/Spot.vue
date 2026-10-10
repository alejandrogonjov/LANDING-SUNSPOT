<template>
  <AltLayout>
    <div v-if="loading" class="loading-state">
      <div class="sun-loader"></div>
      <p>Buscando el rincón...</p>
    </div>

    <div v-else-if="!spot" class="error-state">
      <icon-mdi-emoticon-sad-outline class="error-icon" />
      <h3>Este spot se ha escondido</h3>
      <RouterLink to="/explorar" class="back-link">Volver a explorar</RouterLink>
    </div>

    <main v-else class="spot-detail">
      <SpotHeroImages :spot="spot" @share="handleShare" />

      <div class="content-body">
        <SpotInfo :spot="spot" />
        <UVIntensityWheel :lat="spot.location?.latitude" :lng="spot.location?.longitude" @update="handleUvUpdate" />
        <DVitamin v-bind="uvData" />
        <section v-if="spot && spot.location" class="spot-solar-section">
          <SolarInterval :spot="spot" />
        </section>
        <SpotLocationAction :lat="spot.location?.latitude" :lng="spot.location?.longitude" :spot-name="spot.name" />
      </div>
    </main>
  </AltLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

import AltLayout from '@/layouts/AltLayout.vue'
import SpotHeroImages from '@/components/spot/SpotHeroImages.vue'
import SpotInfo from '@/components/spot/SpotInfo.vue'
import UVIntensityWheel from '@/components/spot/UVIntensityWheel.vue'
import DVitamin from '@/components/spot/DVitamin.vue'
import SpotLocationAction from '@/components/spot/SpotLocationAction.vue'
import SolarInterval from '@/components/spot/SolarInterval.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const { triggerToast } = useToast()

const spot = ref(null)
const loading = ref(true)
let unsubscribe = null

const uvData = ref({
  hasSelection: false,
  uvIndex: 2.9,
  phototype: 3,
  exposedArea: 1.0,
  exposureTime: 0,
  burnTime: null
})

const handleUvUpdate = (data) => {
  uvData.value = data
}

const handleShare = async () => {
  if (!spot.value) return
  try {
    await navigator.share({
      title: `Sunspot: ${spot.value.name}`,
      text: `¡Mira este sunspot!`,
      url: window.location.href
    })
  } catch (err) {
    // No Web Share API (most desktop browsers) or it failed: copy the link
    // instead and confirm with the app's toast rather than a blocking alert().
    if (err.name !== 'AbortError') {
      try {
        await navigator.clipboard.writeText(window.location.href)
        triggerToast('Enlace copiado')
      } catch {
        triggerToast('No se ha podido copiar el enlace')
      }
    }
  }
}

onMounted(() => {
  const spotId = route.params.id
  if (!spotId) return router.push('/explorar')

  const docRef = doc(db, 'spots', spotId)
  unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      spot.value = { id: docSnap.id, ...docSnap.data() }
    } else {
      spot.value = null
    }
    loading.value = false
  }, () => {
    loading.value = false
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
.spot-detail {
  background: var(--clr-background);
  min-height: 100vh;
}

.content-body {
  padding: 1.5rem 1.25rem calc(var(--safe-area-bottom) + 1.5rem);
  margin-top: -2.5rem;
  background: var(--clr-background);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

/* --- Desktop ---
   DOM order is the mobile reading order and stays untouched; the grid only
   places it: the description on top, the exposure wheel next to the vitamin D
   / tanning cards it drives, then the solar interval and the maps link. */
@media (min-width: 1024px) {
  .spot-detail {
    padding: 1.5rem 1.5rem 3rem;
  }

  .content-body {
    margin-top: 0;
    padding: 2rem 0 0;
    border-radius: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
    gap: 2.5rem 3rem;
  }

  .content-body > * {
    grid-column: 1 / -1;
  }

  /* Comfortable line length for the description. */
  .content-body > .spot-info {
    max-width: 820px;
  }

  .content-body > .uv-card {
    grid-column: 1;
  }

  .content-body > .expand-wrapper {
    grid-column: 2;
  }

  .content-body > .location-action-container {
    width: min(100%, 420px);
  }
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 80vh;
  gap: 1rem;
  color: var(--clr-text-muted);
}

.sun-loader {
  width: 32px;
  height: 32px;
  border: 3px solid var(--clr-primary-soft);
  border-top: 3px solid var(--clr-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.back-link {
  color: var(--clr-primary);
  font-weight: 700;
  text-decoration: underline;
}
</style>