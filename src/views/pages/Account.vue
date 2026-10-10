<template>
  <MainLayout>
    <AccountHeader :user="userData" />

    <main class="account-main">
      <NotificationSection />

      <ProfileSuggestions v-if="userData?.profile?.type" :profile-type="userData.profile.type"
        :suggestions="suggestedSpots" :is-loading="isSuggestionsLoading" />

      <BookmarkedSpots :spots="bookmarkedSpots" :is-loading="isBookmarksLoading" />

      <div class="action-section">
        <button class="action-card" @click="showSpotSheet = true">
          <div class="icon-circle">
            <icon-mdi-map-marker-plus-outline class="btn-icon" />
          </div>
          <div class="btn-content">
            <span class="btn-title">¿Sugerir un spot al equipo?</span>
            <span class="btn-sub">Envíanos un nuevo spot solar que conozcas</span>
          </div>
          <icon-mdi-chevron-right class="chevron" />
        </button>

        <button class="action-card ambassador-card" @click="showAmbassadorModal = true">
          <div class="icon-circle star">
            <icon-mdi-star-outline class="btn-icon" />
          </div>
          <div class="btn-content">
            <span class="btn-title">Conviértete en Embajador</span>
            <span class="btn-sub">Valida los mejores spots de la ciudad</span>
          </div>
          <icon-mdi-chevron-right class="chevron" />
        </button>

        <!-- Reachable whether the user answered, skipped, or was never asked:
             the questionnaire is only *prompted* once, never locked away. -->
        <router-link to="/bienvenida" class="action-card quiz-card">
          <div class="icon-circle quiz">
            <icon-mdi-clipboard-text-outline class="btn-icon" />
          </div>
          <div class="btn-content">
            <span class="btn-title">{{ isCompleted ? 'Repetir cuestionario' : 'Responder cuestionario' }}</span>
            <span class="btn-sub">{{ quizHint }}</span>
          </div>
          <icon-mdi-chevron-right class="chevron" />
        </router-link>

        <router-link to="/ajustes" class="action-card settings-card">
          <div class="icon-circle settings">
            <icon-mdi-cog-outline class="btn-icon" />
          </div>
          <div class="btn-content">
            <span class="btn-title">Ajustes de cuenta</span>
            <span class="btn-sub">Gestiona tu perfil, avatar y preferencias</span>
          </div>
          <icon-mdi-chevron-right class="chevron" />
        </router-link>

        <router-link to="/personal-spots" class="action-card personal-card">
          <div class="icon-circle personal">
            <icon-mdi-map-marker-multiple-outline class="btn-icon" />
          </div>
          <div class="btn-content">
            <span class="btn-title">Mis Spots Personales</span>
            <span class="btn-sub">Crea y gestiona tus rincones de sol</span>
          </div>
          <icon-mdi-chevron-right class="chevron" />
        </router-link>
      </div>

      <ApplySpotSheet v-if="showSpotSheet" @close="showSpotSheet = false" />
      <AmbassadorModal v-if="showAmbassadorModal" @close="showAmbassadorModal = false" />

      <button @click="handleLogout" class="btn-logout" style="margin-top: 1rem;">
        <icon-mdi-logout />
        <span>Cerrar Sesión</span>
      </button>
    </main>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db, getCurrentUser } from '@/firebase'
import { signOut } from 'firebase/auth'
import { useUser } from '@/composables/useUser'
import { useOnboarding } from '@/composables/useOnboarding'
import { collection, query, where, getDocs, documentId, limit } from 'firebase/firestore'
import { sunspotProfiles } from '@/data/profiles'

// Components
import MainLayout from '@/layouts/MainLayout.vue'
import AccountHeader from '@/components/account/AccountHeader.vue'
import BookmarkedSpots from '@/components/account/BookmarkedSpots.vue'
import NotificationSection from '@/components/account/NotificationSection.vue'
import ProfileSuggestions from '@/components/account/ProfileSuggestions.vue'
import ApplySpotSheet from '@/components/account/ApplySpotSheet.vue'
import AmbassadorModal from '@/components/account/AmbassadorModal.vue'

const router = useRouter()
const { userData } = useUser()
const { onboarding, status, isCompleted, loadOnboarding } = useOnboarding()

// The router guard has usually cached the payload already; this covers a hard
// reload that lands straight on /cuenta. `getCurrentUser()` rather than
// `auth.currentUser` because the page can mount before auth resolves — see
// utils/authCache.js.
onMounted(async () => {
  const currentUser = await getCurrentUser()
  if (currentUser) loadOnboarding(currentUser.uid)
})

const quizHint = computed(() => {
  const answeredOn = onboarding.value?.completed_at

  if (isCompleted.value) {
    if (!answeredOn) return 'Actualiza tus respuestas cuando quieras'

    const formatted = new Date(answeredOn).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    return `Respondido el ${formatted}`
  }

  return status.value === 'skipped'
    ? 'Lo omitiste, puedes responderlo cuando quieras'
    : 'Personaliza los spots que te recomendamos'
})

// State
const showSpotSheet = ref(false)
const showAmbassadorModal = ref(false)
const bookmarkedSpots = ref([])
const suggestedSpots = ref([])
const isBookmarksLoading = ref(false)
const isSuggestionsLoading = ref(false)

const handleLogout = async () => {
  try {
    await signOut(auth)
    router.push({ path: '/', query: { action: 'logged-out' } })
  } catch (error) {
    console.error("Error signing out:", error)
  }
}

/**
 * Fetches the full data for the user's saved bookmarks
 */
const fetchBookmarkedSpots = async (ids) => {
  if (!ids || ids.length === 0) {
    bookmarkedSpots.value = []
    return
  }

  isBookmarksLoading.value = true
  try {
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
    isBookmarksLoading.value = false
  }
}

/**
 * Fetches 5 suggestions based on the user's profile preferences
 */
const fetchSuggestions = async (profileId) => {
  if (!profileId) return

  isSuggestionsLoading.value = true
  try {
    // Get the first preference from profiles.js (e.g., 'sport' or 'hostelry')
    const profile = sunspotProfiles.find(p => p.id === profileId)
    const preferredCategory = profile?.criteria?.preferences?.[0] || 'hostelry'

    const q = query(
      collection(db, 'spots'),
      where('category', '==', preferredCategory),
      limit(5)
    )

    const querySnapshot = await getDocs(q)
    suggestedSpots.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error("Error fetching suggestions:", error)
  } finally {
    isSuggestionsLoading.value = false
  }
}

// Watchers to trigger fetches when user data is ready or changes
watch(() => userData.value?.bookmarks, (newIds) => {
  fetchBookmarkedSpots(newIds)
}, { immediate: true })

watch(() => userData.value?.profile?.type, (newType) => {
  fetchSuggestions(newType)
}, { immediate: true })
</script>

<style scoped>
.account-main {
  padding: 1.5rem 1.5rem calc(var(--total-nav-height) + 2rem);
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem;
  background: var(--clr-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--clr-glass-border);
  border-radius: 1.5rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: var(--shadow-sm);
}

.action-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: var(--shadow-md);
  background: var(--clr-glass-strong);
  border-color: var(--clr-white);
}

.action-card:active {
  transform: translateY(0) scale(0.98);
}

.icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--clr-primary), transparent 85%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.action-card:hover .icon-circle {
  background: var(--clr-primary);
}

.icon-circle.star {
  background: color-mix(in srgb, var(--clr-accent-purple), transparent 85%);
}

.action-card:hover .icon-circle.star {
  background: var(--clr-accent-purple);
}

.btn-icon {
  font-size: 1.5rem;
  color: var(--clr-primary);
  transition: all 0.3s ease;
}

.action-card:hover .btn-icon {
  color: var(--clr-white);
  transform: scale(1.1);
}

.icon-circle.star .btn-icon {
  color: var(--clr-accent-purple);
}

.action-card:hover .icon-circle.star .btn-icon {
  color: var(--clr-white);
}

.btn-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.btn-title {
  font-weight: 800;
  font-size: 1rem;
  color: var(--clr-dark);
  margin-bottom: 0.2rem;
}

.btn-sub {
  font-size: 0.8rem;
  color: var(--clr-grey);
  font-weight: 500;
}

.chevron {
  color: var(--clr-border);
  font-size: 1.5rem;
  transition: transform 0.3s ease;
}

.action-card:hover .chevron {
  transform: translateX(4px);
  color: var(--clr-primary);
}

.action-card.ambassador-card:hover .chevron {
  color: var(--clr-accent-purple);
}

.icon-circle.quiz {
  background: color-mix(in srgb, var(--clr-info), transparent 85%);
}

.action-card:hover .icon-circle.quiz {
  background: var(--clr-info);
}

.icon-circle.quiz .btn-icon {
  color: var(--clr-info);
}

.action-card:hover .icon-circle.quiz .btn-icon {
  color: var(--clr-white);
}

.action-card.quiz-card:hover .chevron {
  color: var(--clr-info);
}

.icon-circle.settings {
  background: color-mix(in srgb, var(--clr-quiet), transparent 85%);
}

.action-card:hover .icon-circle.settings {
  background: var(--clr-quiet);
}

.icon-circle.settings .btn-icon {
  color: var(--clr-quiet);
}

.action-card:hover .icon-circle.settings .btn-icon {
  color: var(--clr-white);
}

.action-card.settings-card:hover .chevron {
  color: var(--clr-quiet);
}

.icon-circle.personal {
  background: color-mix(in srgb, var(--clr-accent-teal), transparent 85%);
}

.action-card:hover .icon-circle.personal {
  background: var(--clr-accent-teal);
}

.icon-circle.personal .btn-icon {
  color: var(--clr-accent-teal);
}

.action-card:hover .icon-circle.personal .btn-icon {
  color: var(--clr-white);
}

.action-card.personal-card:hover .chevron {
  color: var(--clr-accent-teal);
}
</style>