<template>
  <section class="account-section">
    <div class="section-header">
      <div class="section-info">
        <span class="section-label">Tu colección</span>
        <h3 class="section-title">Mis Favoritos</h3>
      </div>
    </div>

    <div v-if="isLoading" class="horizontal-scroll">
      <div class="scroll-wrapper">
        <div v-for="i in 3" :key="i" class="spot-card skeleton-card"></div>
      </div>
    </div>

    <div v-else-if="spots.length" class="horizontal-scroll">
      <div class="scroll-wrapper">
        <router-link v-for="spot in spots" :key="spot.id" :to="`/spot/${spot.id}`" class="spot-card">
          <div class="card-image">
            <img :src="getOptimizedImageUrl(spot.images?.[0], 400)" :alt="spot.name" loading="lazy"
              :class="{ 'has-photo': spot.images?.[0] }" />
          </div>
          <div class="card-body">
            <h4 class="card-name">{{ spot.name }}</h4>
          </div>
        </router-link>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">
        <icon-mdi-heart-outline />
      </div>
      <p>Todavía no has guardado ningún spot bajo el sol.</p>
      <router-link to="/" class="btn-discover">Descubrir sitios</router-link>
    </div>
  </section>
</template>

<script setup>
import { getOptimizedImageUrl } from '@/utils/image'

defineProps({
  spots: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false }
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
  margin: 0 -1.5rem;
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
  flex: 0 0 140px;
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
  height: 100px;
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
  padding: 0.65rem 0.75rem;
}

.card-name {
  font-size: 0.8rem;
  font-weight: 800;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--clr-dark);
}

/* Skeleton */
.skeleton-card {
  flex: 0 0 140px;
  height: 150px;
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

/* Empty state */
.empty-state {
  background: var(--clr-glass);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--clr-glass-border);
  border-radius: 1.5rem;
  padding: 2.5rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.empty-icon {
  font-size: 2.5rem;
  color: var(--clr-primary);
  opacity: 0.3;
}

.empty-state p {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--clr-text-muted);
  max-width: 200px;
  line-height: 1.4;
  margin: 0;
}

.btn-discover {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--clr-primary);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.5rem 1.25rem;
  border: 1.5px solid var(--clr-primary);
  border-radius: 99px;
  transition: all 0.25s ease;
}

.btn-discover:hover {
  background: var(--clr-primary);
  color: var(--clr-white);
}

/* Desktop: the collection fits on screen, so show it as a grid instead of a
   horizontal swipe strip. */
@media (min-width: 1024px) {
  .horizontal-scroll {
    margin: 0;
    padding: 0.25rem 0 0;
    overflow: visible;
  }

  .scroll-wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  }

  .card-image {
    height: 120px;
  }
}
</style>
