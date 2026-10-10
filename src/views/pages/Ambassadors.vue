<template>
  <DefaultLayout>
    <main class="ambassadors-page">
      <div class="container">

        <!-- Category Filters -->
        <div class="category-filters">
          <button
            v-for="catId in CATEGORY_IDS"
            :key="catId"
            class="filter-dot"
            :class="{ active: selectedCategory === catId }"
            @click="toggleCategory(catId)"
          >
            <span
              class="dot-circle"
              :style="{
                color: getCategoryColor(catId),
                backgroundColor: `color-mix(in srgb, ${getCategoryColor(catId)}, transparent ${selectedCategory === catId ? '70%' : '87%'})`,
                boxShadow: selectedCategory === catId ? `0 0 0 2.5px ${getCategoryColor(catId)}` : 'none'
              }"
            >
              <component :is="getCategoryIcon(catId)" />
            </span>
            <span class="dot-label" :style="{ color: getCategoryColor(catId) }">{{ getCategoryLabel(catId) }}</span>
          </button>
        </div>

        <!-- Ambassadors List -->
        <div class="ambassadors-list">
          <transition-group name="fade-list">
            <article
              v-for="amb in filteredAmbassadors"
              :key="amb.id"
              class="ambassador-card"
              @click="openAmbassador(amb)"
            >
              <img :src="amb.photo || '/sunspot.svg'" :alt="amb.name" class="amb-photo" />
              <div class="amb-info">
                <h3 class="amb-name">{{ amb.name }}</h3>
                <p class="amb-category" :style="{
                  backgroundColor: `color-mix(in srgb, ${getCategoryColor(amb.category)}, transparent 90%)`,
                  color: getCategoryColor(amb.category),
                  borderColor: `color-mix(in srgb, ${getCategoryColor(amb.category)}, transparent 80%)`
                }">
                  <component :is="getCategoryIcon(amb.category)" class="cat-icon" />
                  <span>{{ getCategoryLabel(amb.category) }}</span>
                </p>
              </div>
            </article>
          </transition-group>

          <div v-if="filteredAmbassadors.length === 0" class="empty-state">
            <p>No hay embajadores en esta categoría todavía.</p>
          </div>
        </div>

      </div>
    </main>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { ambassadors as ambassadorData } from '@/data/ambassadors.js'
import { useTranslator } from '@/composables/useTranslator'

const router = useRouter()
const { getCategoryColor, getCategoryIcon, getCategoryLabel } = useTranslator()

const CATEGORY_IDS = ['hostelry', 'culture', 'nature', 'sport']

const selectedCategory = ref(null)

const filteredAmbassadors = computed(() => {
  if (!selectedCategory.value) return ambassadorData
  return ambassadorData.filter(amb => amb.category === selectedCategory.value)
})

const toggleCategory = (catId) => {
  selectedCategory.value = selectedCategory.value === catId ? null : catId
}

const openAmbassador = (amb) => {
  router.push({ name: 'ambassador', params: { id: amb.id } })
}
</script>

<style scoped>
.ambassadors-page {
  background: var(--clr-background);
  min-height: 100vh;
  padding: 2rem 0 4rem;
}

.container {
  padding: 0 1.5rem;
  max-width: 600px;
  margin: 0 auto;
}

/* Category Filters */
.category-filters {
  display: flex;
  justify-content: center;
  gap: 1.25rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.filter-dot:active {
  transform: scale(0.92);
}

.dot-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  transition: background-color 0.25s ease, box-shadow 0.25s ease;
}

.dot-label {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* List */
.ambassadors-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-height: 200px;
}

.ambassador-card {
  background: var(--clr-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--clr-glass-border);
  border-radius: 1.5rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: var(--shadow-sm);
}

.ambassador-card:hover {
  transform: translateY(-6px) scale(1.01);
  box-shadow: var(--shadow-md);
  background: var(--clr-glass-strong);
  border-color: var(--clr-white);
}

.amb-photo {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--clr-background-alt);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.amb-info {
  flex: 1;
}

.amb-name {
  font-weight: 900;
  color: var(--clr-dark);
  font-size: 1.25rem;
  margin: 0 0 0.35rem 0;
}

.amb-category {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  border-radius: 99px;
  border: 1px solid;
  margin: 0;
}

.cat-icon {
  font-size: 0.85rem;
}

.empty-state {
  text-align: center;
  color: var(--clr-text-muted);
  font-weight: 600;
  padding: 3rem 0;
}

.fade-list-enter-active,
.fade-list-leave-active {
  transition: all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.fade-list-enter-from,
.fade-list-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(16px);
}

.fade-list-leave-active {
  position: absolute;
}

/* Desktop: wide column, ambassadors in a grid under the category filter. */
@media (min-width: 1024px) {
  .ambassadors-page {
    padding: 1rem 0 3rem;
  }

  /* Auto margins inside the flex <main> would shrink-wrap it otherwise. */
  .container {
    width: 100%;
    max-width: none;
  }

  .ambassadors-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    align-content: start;
    gap: 1.25rem;
  }

  .ambassadors-list .empty-state {
    grid-column: 1 / -1;
  }
}
</style>
