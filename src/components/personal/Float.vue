<template>
    <header class="floating-header">
        <!-- Back -->
        <button class="icon-btn" @click="goBack" aria-label="Volver">
            <icon-mdi-arrow-left height="1em" width="1em" />
        </button>

        <!-- Search bar -->
        <div ref="searchContainer" class="search-container" v-click-outside="closeDropdown">
            <div class="search-bar" :class="{ 'has-query': searchQuery.length > 0 }">
                <button class="search-submit-btn" :disabled="searchQuery.length < 2" @click="handleEnter"
                    aria-label="Buscar">
                    <Transition name="scale" mode="out-in">
                        <icon-mdi-magnify v-if="searchQuery.length < 2" key="mag" />
                        <icon-mdi-arrow-right v-else key="arrow" />
                    </Transition>
                </button>

                <input ref="searchInput" :value="searchQuery" @input="e => searchQuery = e.target.value" type="text"
                    placeholder="Buscar mis spots..." @focus="openDropdown" @keyup.enter="handleEnter" />

                <button v-if="searchQuery" class="clear-btn" @click="clearSearch" aria-label="Limpiar">
                    <icon-mdi-close-circle />
                </button>
            </div>

            <!-- Autocomplete dropdown (teleported so it's never clipped) -->
            <Teleport to="body">
                <Transition name="fade">
                    <ul v-if="searchQuery.length >= 2 && isDropdownOpen"
                        class="personal-search-results floating-results" :style="dropdownStyle">
                        <li v-for="spot in filteredSpots" :key="spot.id" @click="selectSpot(spot)">
                            <icon-mdi-map-marker-outline class="result-icon" />
                            <div class="result-info">
                                <span class="result-name">{{ spot.name }}</span>
                                <span v-if="spot.description" class="result-desc">{{ spot.description }}</span>
                            </div>
                        </li>

                        <li v-if="filteredSpots.length === 0" class="no-results">
                            <icon-mdi-emoticon-sad-outline />
                            <span>Sin resultados para "{{ searchQuery }}"</span>
                        </li>
                    </ul>
                </Transition>
            </Teleport>
        </div>

        <!-- Home -->
        <button class="icon-btn" @click="goHome" aria-label="Inicio">
            <icon-mdi-home height="1em" width="1em" />
        </button>
    </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { usePersonalSpots } from '@/composables/usePersonalSpots'

const emit = defineEmits(['select-spot'])

const router = useRouter()
const { spots } = usePersonalSpots()

// ── Navigation ──────────────────────────────────────────────
const goBack = () => {
    if (window.history.length > 1) router.back()
    else router.push('/personal-spot')
}
const goHome = () => router.push('/')

// ── Search state ─────────────────────────────────────────────
const searchContainer = ref(null)
const searchInput = ref(null)
const searchQuery = ref('')
const isDropdownOpen = ref(false)
const dropdownStyle = ref({ top: '0px', left: '0px', width: '0px' })

const filteredSpots = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    if (q.length < 2) return []
    return spots.value.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
    ).slice(0, 6)
})

// ── Dropdown positioning ─────────────────────────────────────
const updateDropdownPosition = () => {
    if (searchContainer.value && isDropdownOpen.value) {
        const rect = searchContainer.value.getBoundingClientRect()
        dropdownStyle.value = {
            top: `${rect.bottom + 8}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`
        }
    }
}

const openDropdown = () => {
    isDropdownOpen.value = true
    nextTick(updateDropdownPosition)
}

const closeDropdown = () => { isDropdownOpen.value = false }

// ── Actions ───────────────────────────────────────────────────
const selectSpot = (spot) => {
    searchQuery.value = ''
    isDropdownOpen.value = false
    emit('select-spot', spot)
    searchInput.value?.blur()
}

const handleEnter = () => {
    if (filteredSpots.value.length > 0) selectSpot(filteredSpots.value[0])
}

const clearSearch = () => {
    searchQuery.value = ''
    isDropdownOpen.value = false
}

// ── Lifecycle ─────────────────────────────────────────────────
watch([searchQuery, isDropdownOpen], () => {
    if (isDropdownOpen.value) updateDropdownPosition()
})

onMounted(() => {
    window.addEventListener('resize', updateDropdownPosition)
    window.addEventListener('scroll', updateDropdownPosition, true)
})

onUnmounted(() => {
    window.removeEventListener('resize', updateDropdownPosition)
    window.removeEventListener('scroll', updateDropdownPosition, true)
})

// ── Click-outside directive ───────────────────────────────────
const vClickOutside = {
    mounted(el, binding) {
        el.clickOutsideEvent = (event) => {
            const resultsEl = document.querySelector('.personal-search-results')
            if (!(el === event.target || el.contains(event.target) || resultsEl?.contains(event.target))) {
                binding.value()
            }
        }
        document.addEventListener('click', el.clickOutsideEvent)
    },
    unmounted(el) {
        document.removeEventListener('click', el.clickOutsideEvent)
    }
}
</script>

<style scoped>
.floating-header {
    position: absolute;
    top: 1rem;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 900;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0 1rem;
    pointer-events: none;
    box-sizing: border-box;
}

.floating-header>* {
    pointer-events: auto;
}

/* ── Icon buttons ── */
.icon-btn {
    background: var(--clr-glass-strong);
    backdrop-filter: blur(8px);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--clr-border);
    font-size: 1.5rem;
    color: var(--clr-text);
    cursor: pointer;
    flex-shrink: 0;
    transition: transform 0.15s ease, background 0.15s ease;
}

.icon-btn:hover {
    background: var(--clr-background-alt);
}

.icon-btn:active {
    transform: scale(0.9);
}

.icon-btn svg {
    display: block;
    width: 1.5rem;
    height: 1.5rem;
}

/* ── Search bar ── */
.search-container {
    flex: 1;
    min-width: 0;
    position: relative;
    overflow: visible;
}

.search-bar {
    position: relative;
    background: var(--clr-glass-strong);
    border-radius: 1rem;
    box-shadow: var(--shadow-md);
    display: flex;
    align-items: center;
    height: 44px;
    padding: 0 4px;
    border: 1px solid var(--clr-border);
    transition: box-shadow 0.2s;
    isolation: isolate;
}

.search-bar::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 1rem;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: -1;
}

.search-bar:focus-within {
    box-shadow: var(--shadow-md);
    background: var(--clr-white);
}

.search-bar input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    outline: none;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--clr-text);
    padding: 0 6px;
}

.search-bar input::placeholder {
    color: var(--clr-grey);
    font-weight: 400;
}

.search-submit-btn,
.clear-btn {
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
}

.search-submit-btn {
    color: var(--clr-primary);
}

.clear-btn {
    color: var(--clr-grey);
    opacity: 0.7;
}

.search-bar svg {
    display: block;
    width: 1.3rem;
    height: 1.3rem;
}
</style>

<!-- Global: teleported dropdown -->
<style>
.personal-search-results.floating-results {
    position: fixed;
    z-index: 99999;
    background: var(--clr-white);
    border-radius: 1.25rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    list-style: none;
    padding: 0.5rem;
    margin: 0;
    border: 1px solid var(--clr-border);
    pointer-events: auto;
}

.personal-search-results li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 0.8rem;
    cursor: pointer;
    transition: background 0.15s;
}

.personal-search-results li:hover,
.personal-search-results li:active {
    background: var(--clr-background-alt);
}

.personal-search-results .result-icon {
    color: var(--clr-primary);
    font-size: 1.2rem;
    flex-shrink: 0;
}

.personal-search-results .result-geo {
    color: var(--clr-text-muted);
    font-size: 1rem;
    flex-shrink: 0;
    margin-left: auto;
}

.personal-search-results .result-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.personal-search-results .result-name {
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--clr-dark);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.personal-search-results .result-desc {
    font-size: 0.78rem;
    color: var(--clr-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.personal-search-results .no-results {
    padding: 1.25rem !important;
    justify-content: center;
    color: var(--clr-text-muted);
    font-size: 0.88rem;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s, transform 0.2s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}

/* Icon scale transition */
.scale-enter-active,
.scale-leave-active {
    transition: all 0.2s ease;
}

.scale-enter-from {
    opacity: 0;
    transform: scale(0.5) rotate(-45deg);
}

.scale-leave-to {
    opacity: 0;
    transform: scale(0.5) rotate(45deg);
}
</style>
