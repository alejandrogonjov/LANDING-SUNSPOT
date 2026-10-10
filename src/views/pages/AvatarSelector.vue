<template>
  <DefaultLayout>
    <main class="selector-view">
      <header class="selector-header">
        <h1>Elige tu avatar</h1>
        <p>Selecciona la identidad que mejor te represente al sol</p>
      </header>

      <div class="selector-container">
        <div class="avatar-grid">
          <button v-for="avatar in avatarList" :key="avatar" class="avatar-option"
            :class="{ 'is-active': userData?.avatar === avatar }" @click="saveAvatar(avatar)" :disabled="updating">
            <img :src="`/avatars/avatar (${avatar}).png`" :alt="`Avatar ${avatar}`" />

            <div v-if="updating && selectedAvatar === avatar" class="loader-overlay">
              <icon-mdi-loading class="spin" />
            </div>

            <div v-if="userData?.avatar === avatar" class="active-badge">
              <icon-mdi-check />
            </div>
          </button>
        </div>
      </div>
    </main>
  </DefaultLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { useUser } from '@/composables/useUser'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const { user, userData } = useUser()
const router = useRouter()
const updating = ref(false)
const selectedAvatar = ref(null)

const avatarList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]

const saveAvatar = async (avatarName) => {
  if (!user.value || updating.value) return

  updating.value = true
  selectedAvatar.value = avatarName

  try {
    const userRef = doc(db, 'users', user.value.uid)
    await updateDoc(userRef, {
      avatar: avatarName
    })
    // Small delay for visual feedback before navigating back
    setTimeout(() => router.back(), 300)
  } catch (error) {
    console.error("Error saving avatar:", error)
  } finally {
    updating.value = false
  }
}
</script>

<style scoped>
.selector-view {
  padding: 1rem 1.5rem 3rem;
  max-width: 600px;
  margin: 0 auto;
}

.selector-header {
  margin-bottom: 2rem;
  text-align: center;
}

.selector-header h1 {
  font-size: 1.75rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
}

.selector-header p {
  color: var(--clr-grey);
  font-size: 0.95rem;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.avatar-option {
  aspect-ratio: 1;
  border-radius: 50%;
  border: 2px solid var(--clr-border);
  background: var(--clr-white);
  padding: 4px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.avatar-option img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* Since they are already round/transparent */
}

.avatar-option.is-active {
  border-color: var(--clr-primary);
  background: var(--clr-primary-soft);
  transform: scale(1.05);
}

.active-badge {
  position: absolute;
  /* Seated on the circle's top-right edge (~45°) instead of the empty corner */
  top: 6%;
  right: 6%;
  background: var(--clr-primary);
  color: var(--clr-on-brand);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loader-overlay {
  position: absolute;
  inset: 0;
  background: var(--clr-glass);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.spin {
  animation: spin 1s linear infinite;
  font-size: 2rem;
  color: var(--clr-primary);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 400px) {
  .avatar-grid {
    grid-template-columns: repeat(4, 1fr);
    /* Back to 4 columns on larger screens */
  }
}
</style>