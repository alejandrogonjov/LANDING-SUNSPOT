<template>
  <DefaultLayout>
    <div class="bookmarks-page">
      <div v-if="bookmarkedSpots.length && !isLoading" class="bookmarks-meta">
        <p class="subtitle">
          Tienes {{ bookmarkedSpots.length }} {{ bookmarkedSpots.length === 1 ? 'spot guardado' : 'spots guardados' }}
        </p>
      </div>

      <div v-if="isLoading" class="loading-state">
        <icon-mdi-loading class="spin-icon" />
        <p>Sincronizando tus favoritos...</p>
      </div>

      <div v-else-if="bookmarkedSpots.length === 0" class="empty-bookmarks">
        <icon-mdi-heart-outline class="empty-icon" />
        <h3>Aún no has guardado nada</h3>
        <p>Navega por el mapa o la lista para añadir spots a tu perfil.</p>
        <router-link to="/explorar" class="btn-primary">Descubrir spots</router-link>
      </div>

      <section v-else class="bookmarks-feed">
        <router-link 
          v-for="spot in bookmarkedSpots" 
          :key="spot.id" 
          :to="`/spot/${spot.id}`"
          class="bookmark-card"
        >
          <div class="spot-media">
            <img 
              :src="getOptimizedImageUrl(spot.images?.[0], 400)" 
              :alt="spot.name" 
              :class="{ 'has-photo': spot.images?.[0] }"
            />
          </div>

          <div class="spot-content">
            <div class="content-header">
              <span class="category-tag" :style="{ color: getCategoryColor(spot.category) }">
                {{ t('categories', spot.category) }}
              </span>
              <icon-mdi-weather-sunset-up v-if="spot.is_sunrise" class="time-icon" />
            </div>

            <h3 class="spot-name">{{ spot.name }}</h3>
            <p class="spot-desc">{{ spot.description }}</p>
          </div>
        </router-link>
      </section>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, watch } from 'vue'
import { db } from '@/firebase'
import { getOptimizedImageUrl } from '@/utils/image'
import { collection, query, where, getDocs, documentId } from 'firebase/firestore'
import { useUser } from '@/composables/useUser'
import { useTranslator } from '@/composables/useTranslator'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const { userData } = useUser()
const { t, getCategoryColor } = useTranslator()

const bookmarkedSpots = ref([])
const isLoading = ref(false)

/**
 * Fetch full spot details for each ID in userData.bookmarks
 */
const fetchBookmarkedSpots = async (ids) => {
  if (!ids || ids.length === 0) {
    bookmarkedSpots.value = []
    return
  }

  isLoading.value = true
  try {
    // Firestore "in" query limited to 30 items per batch
    const q = query(
      collection(db, 'spots'),
      where(documentId(), 'in', ids.slice(0, 30))
    )

    const querySnapshot = await getDocs(q)
    bookmarkedSpots.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error("Error fetching bookmarks:", error)
  } finally {
    isLoading.value = false
  }
}

// Watch for userData changes (specifically the bookmarks array)
watch(() => userData.value?.bookmarks, (newIds) => {
  fetchBookmarkedSpots(newIds)
}, { immediate: true })
</script>

<style scoped>
.bookmarks-page {
  padding: 1.5rem;
  max-width: 500px;
  margin: 0 auto;
}

.bookmarks-meta {
  margin-bottom: 1.5rem;
}

.subtitle {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--clr-grey);
  opacity: 0.8;
}

/* --- Feed & Card --- */
.bookmarks-feed {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.bookmark-card {
  display: flex;
  background: var(--clr-white);
  border-radius: 24px;
  border: 1px solid var(--clr-border);
  overflow: hidden;
  min-height: 140px;
  text-decoration: none;
  color: inherit;
  box-shadow: var(--shadow-sm);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

/* Hover Effects for Demo */
.bookmark-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--clr-primary);
}

.bookmark-card:active {
  transform: scale(0.98);
}

/* --- Media --- */
.spot-media {
  width: 125px;
  flex-shrink: 0;
  background: var(--clr-background-alt);
}

.spot-media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: var(--clr-background-alt);
}

.spot-media img.has-photo {
  object-fit: cover;
}

/* --- Content --- */
.spot-content {
  flex: 1;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.3rem;
}

.category-tag {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.time-icon {
  color: var(--clr-warn);
  font-size: 1.1rem;
}

/* Typography Fixes */
.spot-name {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--clr-dark);
  line-height: 1.3;
  padding: 2px 0;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.spot-desc {
  font-size: 0.8rem;
  color: var(--clr-grey);
  line-height: 1.5;
  margin: 0.4rem 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* State Handlers */
.btn-primary {
  margin-top: 1.5rem;
}

.loading-state {
  text-align: center;
  padding: 4rem 0;
}

.spin-icon {
  font-size: 3rem;
  color: var(--clr-primary);
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>