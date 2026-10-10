<template>
  <DefaultLayout>
    <main class="ambassador-page" v-if="ambassador">
      <!-- Hero photo -->
      <div class="amb-hero">
        <img :src="ambassador.photo || '/sunspot.svg'" :alt="ambassador.name" class="amb-photo" />
      </div>

      <div class="amb-content">
        <!-- Identity -->
        <div class="amb-identity">
          <h1 class="amb-name">{{ ambassador.name }}</h1>
          <p class="amb-category-badge" :style="{
            backgroundColor: `color-mix(in srgb, ${getCategoryColor(ambassador.category)}, transparent 90%)`,
            color: getCategoryColor(ambassador.category),
            borderColor: `color-mix(in srgb, ${getCategoryColor(ambassador.category)}, transparent 80%)`
          }">
            <component :is="getCategoryIcon(ambassador.category)" class="cat-icon" />
            <span>{{ t('categories.' + ambassador.category) }}</span>
          </p>
          <p class="amb-title" v-if="ambassador.title">{{ ambassador.title }}</p>
          <p class="amb-since" v-if="ambassador.createdAt">Embajador/a desde {{ ambassador.createdAt }}</p>
        </div>

        <!-- About -->
        <p class="amb-about" v-if="ambassador.about">{{ ambassador.about }}</p>

        <!-- Mission -->
        <div class="amb-block" v-if="ambassador.mission">
          <div class="section-heading">
            <icon-mdi-lightning-bolt />
            <span>Mi misión</span>
          </div>
          <p>{{ ambassador.mission }}</p>
        </div>

        <!-- Tags -->
        <div class="amb-tags" v-if="ambassador.tags?.length">
          <span class="tag-chip" v-for="tag in ambassador.tags" :key="tag">{{ tag }}</span>
        </div>

        <!-- Offers -->
        <div class="amb-block" v-if="ambassador.offers?.length">
          <div class="section-heading">
            <icon-mdi-gift-outline />
            <span>Lo que ofrezco</span>
          </div>
          <ul class="offers-list">
            <li class="offer-item" v-for="offer in ambassador.offers" :key="offer">
              <icon-mdi-check-circle class="offer-check" />
              <span>{{ offer }}</span>
            </li>
          </ul>
        </div>

        <!-- Social links -->
        <div class="amb-block amb-socials" v-if="hasSocials">
          <a v-for="link in socialLinks" :key="link.platform" :href="link.url" class="social-btn" :class="link.platform"
            target="_blank" rel="noopener noreferrer" :aria-label="link.platform">
            <icon-mdi-instagram v-if="link.platform === 'instagram'" :class="`social-icon-${link.platform}`" />
            <icon-mdi-whatsapp v-else-if="link.platform === 'whatsapp'" :class="`social-icon-${link.platform}`" />
            <icon-ic-baseline-tiktok v-else-if="link.platform === 'tiktok'" :class="`social-icon-${link.platform}`" />
            <icon-mdi-youtube v-else-if="link.platform === 'youtube'" :class="`social-icon-${link.platform}`" />
            <icon-mdi-web v-else-if="link.platform === 'web'" :class="`social-icon-${link.platform}`" />
            <span>{{ link.handle }}</span>
          </a>
        </div>

        <!-- CTA -->
        <p class="amb-cta" v-if="ambassador.cta">{{ ambassador.cta }}</p>
      </div>
    </main>

    <div v-else class="not-found">
      <p>Embajador no encontrado.</p>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useTranslator } from '@/composables/useTranslator'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { ambassadors } from '@/data/ambassadors.js'
const props = defineProps({
  id: { type: String, required: true }
})

const { t, getCategoryColor, getCategoryIcon } = useTranslator()

const ambassador = computed(() =>
  ambassadors.find(a => String(a.id) === props.id) ?? null
)

const PLATFORM_CONFIG = {
  instagram: {
    getHandle: (url) => {
      const match = url.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i)
      return match ? `@${match[1]}` : '@instagram'
    }
  },
  whatsapp: {
    getHandle: () => 'WhatsApp'
  },
  tiktok: {
    getHandle: (url) => {
      const match = url.match(/tiktok\.com\/@([a-zA-Z0-9_.]+)/i)
      return match ? `@${match[1]}` : '@tiktok'
    }
  },
  youtube: {
    getHandle: (url) => {
      const match = url.match(/youtube\.com\/@([a-zA-Z0-9_.]+)/i)
      return match ? `@${match[1]}` : 'YouTube'
    }
  },
  web: {
    getHandle: (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
  }
}

const hasSocials = computed(() =>
  Object.values(ambassador.value?.social || {}).some(Boolean)
)

const socialLinks = computed(() =>
  Object.entries(ambassador.value?.social || {})
    .filter(([, url]) => url)
    .map(([platform, url]) => {
      const config = PLATFORM_CONFIG[platform]
      if (!config) return null
      return { platform, url, handle: config.getHandle(url) }
    })
    .filter(Boolean)
)
</script>

<style scoped>
.ambassador-page {
  padding-bottom: 3rem;
}

/* Hero */
.amb-hero {
  display: flex;
  justify-content: center;
  padding: 2rem 1.5rem 1.5rem;
}

.amb-photo {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--clr-canvas);
  box-shadow: var(--shadow-md);
}

/* Content */
.amb-content {
  padding: 0 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Identity */
.amb-identity {
  text-align: center;
}

.amb-name {
  font-size: 1.9rem;
  font-weight: 900;
  color: var(--clr-dark);
  margin: 0 0 0.6rem;
}

.amb-category-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 800;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 6px 14px;
  border-radius: 99px;
  border: 1px solid;
  margin: 0 0 0.5rem;
}

.cat-icon {
  font-size: 0.9rem;
}

.amb-title {
  font-size: 1rem;
  color: var(--clr-text-muted);
  font-weight: 600;
  margin: 0.25rem 0 0;
}

.amb-since {
  font-size: 0.78rem;
  color: var(--clr-grey);
  margin: 0.25rem 0 0;
}

/* About */
.amb-about {
  text-align: center;
  color: var(--clr-text-muted);
  font-size: 0.95rem;
  line-height: 1.65;
  margin: 0;
  padding: 0 0.5rem;
}

/* Shared block (mission, offers, socials) */
.amb-block {
  background: var(--clr-canvas);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
}

.amb-block p {
  margin: 0;
  color: var(--clr-text-muted);
  font-size: 0.92rem;
  line-height: 1.65;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--clr-dark);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.85rem;
}

.section-heading svg {
  font-size: 1rem;
  color: var(--clr-primary);
  flex-shrink: 0;
}

/* Tags */
.amb-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: center;
}

.tag-chip {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  background: var(--clr-canvas);
  color: var(--clr-text-muted);
  font-size: 0.78rem;
  font-weight: 600;
}

/* Offers */
.offers-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.offer-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.92rem;
  color: var(--clr-text);
  line-height: 1.45;
}

.offer-check {
  flex-shrink: 0;
  font-size: 1rem;
  color: var(--clr-primary);
  margin-top: 0.1rem;
}

/* Socials */
.amb-socials {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.social-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.4rem;
  border-radius: var(--radius-full);
  background: var(--clr-white);
  color: var(--clr-dark);
  box-shadow: var(--shadow-sm);
  font-weight: 700;
  font-size: 0.9rem;
  border: 1px solid transparent;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-decoration: none;
}

.social-btn svg {
  font-size: 1.3rem;
  transition: transform 0.3s ease;
}

.social-btn:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.social-btn:hover svg {
  transform: scale(1.15);
}

.social-icon-instagram {
  color: #E1306C;
}

.social-icon-whatsapp {
  color: #25D366;
}

.social-icon-tiktok {
  color: var(--clr-dark);
}

.social-icon-youtube {
  color: #FF0000;
}

.social-icon-web {
  color: var(--clr-primary);
}

.social-btn.instagram:hover {
  border-color: #E1306C;
}

.social-btn.whatsapp:hover {
  border-color: #25D366;
}

.social-btn.tiktok:hover {
  border-color: var(--clr-dark);
}

.social-btn.youtube:hover {
  border-color: #FF0000;
}

.social-btn.web:hover {
  border-color: var(--clr-primary);
}

/* CTA */
.amb-cta {
  text-align: center;
  font-size: 0.85rem;
  color: var(--clr-text-muted);
  font-style: italic;
  margin: 0;
  padding: 0 1rem;
  line-height: 1.5;
}

/* 404 */
.not-found {
  padding: 4rem 1.5rem;
  text-align: center;
  color: var(--clr-text-muted);
}
</style>
