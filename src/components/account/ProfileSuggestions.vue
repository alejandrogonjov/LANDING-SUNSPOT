<template>
  <section class="account-section">
    <div class="section-header">
      <div class="section-info">
        <span class="section-label">Para tu perfil</span>
        <h3 class="section-title">{{ profileTitle }}</h3>
      </div>
    </div>

    <div class="horizontal-scroll">
      <div class="scroll-wrapper">
        <template v-if="isLoading">
          <div v-for="i in 3" :key="i" class="spot-card skeleton-card"></div>
        </template>

        <template v-else-if="suggestions.length">
          <RouterLink v-for="spot in suggestions" :key="spot.id" :to="`/spot/${spot.id}`" class="spot-card">
            <div class="card-image">
              <img :src="getOptimizedImageUrl(spot.images?.[0], 400)" :alt="spot.name"
                :class="{ 'has-photo': spot.images?.[0] }" />
            </div>
            <div class="card-body">
              <h4 class="card-name">{{ spot.name }}</h4>
              <span class="card-category">{{ t('categories', spot.category) }}</span>
            </div>
          </RouterLink>
        </template>

        <div v-else class="empty-slide">
          <p>Buscando nuevos rincones para ti...</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { sunspotProfiles } from '@/data/profiles'
import { useTranslator } from '@/composables/useTranslator'
import { getOptimizedImageUrl } from '@/utils/image'

const { t } = useTranslator()

const props = defineProps({
  profileType: String,
  suggestions: Array,
  isLoading: Boolean
})

const profileTitle = computed(() => {
  const profile = sunspotProfiles.find(p => p.id === props.profileType)
  return profile ? profile.title : 'Recomendaciones'
})
</script>

<style scoped>
.account-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.section-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--clr-primary);
  margin-bottom: 0.2rem;
}

.section-title {
  font-size: 1.3rem;
  font-weight: 900;
  color: var(--clr-dark);
  margin: 0;
  line-height: 1.2;
}

/* Horizontal scroll */
.horizontal-scroll {
  padding: 0.25rem 1.5rem 0.75rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.horizontal-scroll::-webkit-scrollbar {
  display: none;
}

.scroll-wrapper {
  display: flex;
  gap: 1rem;
}

/* Cards */
.spot-card {
  flex: 0 0 155px;
  scroll-snap-align: start;
  text-decoration: none;
  color: inherit;
  background: var(--clr-glass);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--clr-glass-border);
  border-radius: 1.25rem;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.spot-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: var(--shadow-md);
  background: var(--clr-glass-strong);
}

.card-image {
  width: 100%;
  height: 120px;
  overflow: hidden;
  background: var(--clr-background-alt);
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: var(--clr-background-alt);
  transition: transform 0.4s ease;
}

.card-image img.has-photo {
  object-fit: cover;
}

.spot-card:hover .card-image img {
  transform: scale(1.06);
}

.card-body {
  padding: 0.75rem 0.85rem;
}

.card-name {
  font-size: 0.85rem;
  font-weight: 800;
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--clr-dark);
}

.card-category {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--clr-text-muted);
  text-transform: capitalize;
}

/* Skeleton */
.skeleton-card {
  flex: 0 0 155px;
  height: 175px;
  background: linear-gradient(90deg, var(--clr-background-alt) 25%, rgba(255, 255, 255, 0.5) 50%, var(--clr-background-alt) 75%);
  background-size: 200% 100%;
  border-radius: 1.25rem;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.empty-slide {
  color: var(--clr-text-muted);
  font-size: 0.9rem;
  font-weight: 500;
  padding: 1rem 0;
}
</style>