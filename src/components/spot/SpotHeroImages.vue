<template>
  <div class="hero-media-container">
    <div class="image-slider no-scrollbar" ref="slider" @scroll="handleScroll">
      <div v-for="(img, index) in spot?.images || []" :key="index" class="slide">
        <img :src="getOptimizedImageUrl(img, 1000)" :alt="`${spot?.name || 'Spot'} - ${index + 1}`" class="hero-img" :loading="index === 0 ? 'eager' : 'lazy'" />
      </div>

      <div v-if="spot && (!spot.images || spot.images.length === 0)" class="slide">
        <img src="/sunspot-skyline.svg" class="hero-img" alt="No disponible" />
      </div>
    </div>

    <div v-if="spot?.images?.length > 1" class="image-counter">
      {{ currentIndex + 1 }} / {{ spot.images.length }}
    </div>

    <div class="hero-top-bar">
      <button @click="$router.back()" class="btn-back btn-glass back-btn" aria-label="Volver">
        <icon-mdi-chevron-left />
      </button>

      <div class="right-actions">
        <button @click="toggleLike" :class="['btn-close btn-glass like-btn', { 'is-liked': isLiked }]" aria-label="Me gusta">
          <icon-mdi-heart v-if="isLiked" />
          <icon-mdi-heart-outline v-else />
        </button>

        <button @click="$emit('share')" class="btn-close btn-glass share-btn" aria-label="Compartir">
          <icon-mdi-share-variant />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { db, getCurrentUser } from '@/firebase'
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore'
import { getOptimizedImageUrl } from '@/utils/image'

const props = defineProps({
  spot: { type: Object, default: null }
})

const emit = defineEmits(['share'])
const router = useRouter()

const isLiked = ref(false)
const currentIndex = ref(0)

// Check if this spot is already in the user's bookmarks on load
const checkBookmarkStatus = async () => {
  // `getCurrentUser()` rather than `auth.currentUser`: this runs from an
  // `immediate` watcher, before auth has resolved, and a bare read would show
  // a signed-in user's saved spot as unsaved.
  const user = await getCurrentUser()
  if (!user || !props.spot?.id) return

  const userDoc = await getDoc(doc(db, 'users', user.uid))
  if (userDoc.exists()) {
    const bookmarks = userDoc.data().bookmarks || []
    isLiked.value = bookmarks.includes(props.spot.id)
  }
}

// Watch for spot data to arrive before checking status
watch(() => props.spot, (newSpot) => {
  if (newSpot) checkBookmarkStatus()
}, { immediate: true })

const toggleLike = async () => {
  const user = await getCurrentUser()

  // 1. Redirect if not logged in
  if (!user) {
    router.push('/login')
    return
  }

  // 2. Optimistic UI update
  const previousState = isLiked.value
  isLiked.value = !isLiked.value

  try {
    const userRef = doc(db, 'users', user.uid)

    if (isLiked.value) {
      // Add to bookmarks
      await updateDoc(userRef, {
        bookmarks: arrayUnion(props.spot.id)
      })
    } else {
      // Remove from bookmarks
      await updateDoc(userRef, {
        bookmarks: arrayRemove(props.spot.id)
      })
    }
  } catch (error) {
    console.error("Error updating bookmarks:", error)
    // Rollback UI if DB update fails
    isLiked.value = previousState
  }
}

const handleScroll = (event) => {
  const { scrollLeft, offsetWidth } = event.target
  if (offsetWidth > 0) {
    currentIndex.value = Math.round(scrollLeft / offsetWidth)
  }
}
</script>

<style scoped>
.hero-media-container {
  position: relative;
  width: 100%;
  height: 320px;
  background-color: var(--clr-dark);
}

.image-slider {
  display: flex;
  width: 100%;
  height: 100%;
  overflow-x: auto;
  /* Ensure this is auto or scroll */
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.slide {
  /* Use min-width to force the overflow */
  flex: 0 0 100%;
  min-width: 100%;
  height: 100%;
  scroll-snap-align: start;
}

/* Standard utility for hiding scrollbars while keeping functionality */
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: var(--clr-sunspot-50);
}

.image-counter {
  position: absolute;
  bottom: 3.5rem;
  /* Adjusted for ContentBody overlap */
  right: 1.25rem;
  background: rgba(15, 23, 42, 0.6);
  color: var(--clr-on-brand);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 5;
  pointer-events: none;
}

.hero-top-bar {
  position: absolute;
  top: 0.5rem;
  left: 0;
  right: 0;
  padding: 0 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
  pointer-events: none;
}

.hero-top-bar button {
  pointer-events: auto;
}

.right-actions {
  display: flex;
  gap: 0.75rem;
}

/* Redundant .floating-btn styles removed - now using unified global styles */
.like-btn.is-liked {
  color: var(--clr-primary) !important;
}
</style>