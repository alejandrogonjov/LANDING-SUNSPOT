<template>
    <AltLayout>
        <div v-if="!spot" class="error-state">
            <icon-mdi-emoticon-sad-outline class="error-icon" />
            <h3>Spot no encontrado</h3>
            <RouterLink to="/personal-spots" class="back-link">Volver a mis spots</RouterLink>
        </div>

        <main v-else class="spot-detail">
            <div class="hero-image">
                <div class="hero-top-bar">
                    <button @click="$router.back()" class="btn-back btn-glass back-btn" aria-label="Volver">
                        <icon-mdi-chevron-left />
                    </button>
                </div>
                <img src="/sunspot-skyline.svg" :alt="spot.name" />
                <div class="hero-glow"></div>
            </div>

            <div class="content-body">
                <div class="info-header">
                    <h1 class="spot-name">{{ spot.name }}</h1>

                    <div class="badges-row">
                        <div v-if="spot.category" class="category-wrapper" :style="{
                            backgroundColor: `color-mix(in srgb, ${getCategoryColor(spot.category)}, transparent 88%)`,
                            color: getCategoryColor(spot.category)
                        }">
                            <component :is="getCategoryIcon(spot.category)" class="cat-icon" />
                            <span class="category-text">{{ t(`categories.${spot.category}`) }}</span>
                        </div>

                        <div :class="['access-badge', spot.is_free ? 'is-free' : 'is-paid']">
                            <component :is="getAccessIcon(spot.is_free)" />
                            <span>{{ spot.is_free ? t('ui.free') : t('ui.paid') }}</span>
                        </div>

                        <div v-if="spot.is_sunrise || spot.is_sunset" class="sun-badge">
                            <icon-mdi-weather-sunset-up v-if="spot.is_sunrise" class="sun-icon-mini sunrise" />
                            <icon-mdi-weather-sunset-down v-if="spot.is_sunset" class="sun-icon-mini sunset" />
                        </div>
                    </div>
                </div>

                <div class="location-row" v-if="spot.address">
                    <icon-mdi-map-marker-outline class="loc-icon" />
                    <p class="address-text">{{ spot.address }}</p>
                </div>

                <p class="description">{{ spot.description || 'Sin descripción' }}</p>

                <div v-if="spot.has_shadow || spot.has_natural_shadow || spot.is_quiet || spot.is_windy" class="features-row">
                    <div v-if="spot.has_shadow" class="feature-badge shadow">
                        <icon-mdi-umbrella class="feat-icon" />
                        <span>{{ t('ui.shadow') }}</span>
                    </div>
                    <div v-if="spot.has_natural_shadow" class="feature-badge natural-shadow">
                        <icon-mdi-tree class="feat-icon" />
                        <span>{{ t('ui.natural_shadow') }}</span>
                    </div>
                    <div v-if="spot.is_quiet" class="feature-badge quiet">
                        <icon-tabler-ear-off class="feat-icon" />
                        <span>{{ t('ui.quiet') }}</span>
                    </div>
                    <div v-if="spot.is_windy" class="feature-badge windy">
                        <icon-tabler-wind class="feat-icon" />
                        <span>{{ t('ui.wind') }}</span>
                    </div>
                </div>

                <div v-if="spot.lat != null && spot.lng != null" class="location-info">
                    <h3>Ubicación</h3>
                    <p>{{ spot.lat.toFixed(4) }}, {{ spot.lng.toFixed(4) }}</p>
                    <SpotLocationAction :lat="spot.lat" :lng="spot.lng" :spot-name="spot.name" />
                </div>
            </div>
        </main>
    </AltLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePersonalSpots } from '@/composables/usePersonalSpots'
import { useTranslator } from '@/composables/useTranslator'
import AltLayout from '@/layouts/AltLayout.vue'
import SpotLocationAction from '@/components/spot/SpotLocationAction.vue'

const route = useRoute()
const { spots } = usePersonalSpots()
const { t, getCategoryColor, getCategoryIcon, getAccessIcon } = useTranslator()

const spot = computed(() => {
    return spots.value.find(s => s.id === route.params.id)
})

</script>

<style scoped>
.spot-detail {
    background: var(--clr-background);
    min-height: 100vh;
}

.hero-image {
    position: relative;
    width: 100%;
    height: 280px;
    background: linear-gradient(135deg, rgba(224, 120, 32, 0.1) 0%, rgba(224, 120, 32, 0.02) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    overflow: hidden;
}

.hero-top-bar {
    position: absolute;
    top: 1rem;
    left: 0;
    right: 0;
    padding: 0 1.25rem;
    display: flex;
    align-items: center;
    z-index: 10;
    pointer-events: none;
}

.hero-top-bar button {
    pointer-events: auto;
}

.hero-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0.6;
    z-index: 1;
    filter: drop-shadow(0 4px 12px rgba(224, 120, 32, 0.15));
}

.hero-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 150px;
    height: 150px;
    background: radial-gradient(circle, rgba(224, 120, 32, 0.15) 0%, transparent 70%);
    z-index: 0;
    animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {

    0%,
    100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 0.6;
    }

    50% {
        transform: translate(-50%, -50%) scale(1.2);
        opacity: 1;
    }
}

.content-body {
    padding: 2rem 1.5rem calc(var(--safe-area-bottom) + 1.5rem);
    margin-top: -2rem;
    background: var(--clr-white);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    box-shadow: var(--shadow-md-up);
}

/* --- Info Header --- */
.info-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.spot-name {
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--clr-dark);
    line-height: 1.2;
    margin: 0;
}

.badges-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.category-wrapper {
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    width: fit-content;
    line-height: 1;
}

.cat-icon {
    font-size: 0.95rem;
    margin-right: 4px;
}

.access-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 6px 12px;
    border-radius: var(--radius-full);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.access-badge.is-free {
    background-color: color-mix(in srgb, var(--clr-free), transparent 88%);
    color: var(--clr-free);
}

.access-badge.is-paid {
    background-color: var(--clr-warn-soft);
    color: var(--clr-warn);
}

.sun-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    background: var(--clr-background-alt);
    border-radius: var(--radius-full);
}

.sun-icon-mini {
    font-size: 1.1rem;
}

/* --- Location Row --- */
.location-row {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    color: var(--clr-text-muted);
}

.loc-icon {
    font-size: 1.1rem;
    color: var(--clr-primary);
    flex-shrink: 0;
    margin-top: 2px;
}

.address-text {
    font-size: 0.95rem;
    font-weight: 500;
    line-height: 1.4;
    margin: 0;
}

/* --- Description --- */
.description {
    font-size: 1rem;
    color: var(--clr-grey);
    line-height: 1.6;
    margin: 0;
}

/* --- Features --- */
.features-row {
    display: flex;
    gap: 1rem;
}

.feature-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: 700;
    padding: 6px 12px;
    border-radius: 12px;
}

.feature-badge.shadow {
    background: color-mix(in srgb, var(--clr-shadow), transparent 88%);
    color: var(--clr-shadow);
}

.feature-badge.natural-shadow {
    background: color-mix(in srgb, var(--clr-natural-shadow), transparent 88%);
    color: var(--clr-natural-shadow);
}

.feat-icon {
    font-size: 1.1rem;
}

.feature-badge.quiet {
    color: var(--clr-quiet);
    background: color-mix(in srgb, var(--clr-quiet), transparent 85%);
}

.feature-badge.windy {
    color: var(--clr-windy);
    background: color-mix(in srgb, var(--clr-windy), transparent 85%);
}

/* --- Location Info --- */
.location-info h3 {
    font-size: 1.2rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
    color: var(--clr-dark);
}

.location-info p {
    font-family: monospace;
    color: var(--clr-text-muted);
    margin-bottom: 1rem;
    background: var(--clr-background-alt);
    padding: 0.6rem 0.8rem;
    border-radius: var(--radius-md);
    display: inline-block;
    font-size: 0.95rem;
    border: 1px solid var(--clr-border);
}

/* --- Error State --- */
.error-state {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 80vh;
    gap: 1rem;
    color: var(--clr-text-muted);
}

.error-icon {
    font-size: 3.5rem;
    color: var(--clr-grey);
    opacity: 0.5;
}

.back-link {
    color: var(--clr-primary);
    font-weight: 700;
    text-decoration: none;
    padding: 0.75rem 1.5rem;
    background: color-mix(in srgb, var(--clr-primary), transparent 90%);
    border-radius: var(--radius-md);
    transition: all 0.2s;
    margin-top: 0.5rem;
}

.back-link:hover {
    background: var(--clr-primary);
    color: var(--clr-on-brand);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(224, 120, 32, 0.2);
}
</style>
