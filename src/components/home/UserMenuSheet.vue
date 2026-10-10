<template>
  <div class="sheet-overlay" @click.self="$emit('close')">
    <div class="bottom-sheet" v-drag-close="() => $emit('close')">
      <div class="sheet-handle"></div>

      <div class="sheet-content">
        <header class="user-profile-header">
          <div class="avatar-large">
            <img v-if="userData?.avatar" :src="`/avatars/avatar (${userData.avatar}).png`" :alt="userData.name" />
            <icon-mdi-account-circle v-else class="default-icon" />
          </div>

          <div class="user-info">
            <h2 class="user-name">{{ userData?.name || 'Explorador' }}</h2>
          </div>
        </header>

        <nav class="user-actions">
          <router-link to="/ajustes" class="action-item" @click="$emit('close')">
            <icon-tabler-settings />
            <span>Ajustes</span>
            <icon-mdi-chevron-right class="chevron" />
          </router-link>

          <router-link to="/mis-favoritos" class="action-item" @click="$emit('close')">
            <icon-mdi-heart-outline />
            <span>Mis spots</span>
            <icon-mdi-chevron-right class="chevron" />
          </router-link>

          <button class="btn-logout" @click="handleLogout">
            <icon-mdi-logout />
            <span>Cerrar sesión</span>
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { loadFirebase } from '@/firebaseLazy'
import { useUser } from '@/composables/useUser'

const router = useRouter()
const { userData } = useUser()
const emit = defineEmits(['close'])

const handleLogout = async () => {
  try {
    const { auth, signOut } = await loadFirebase()
    await signOut(auth)

    // Close the sheet first
    emit('close')

    // Redirect to landing/home with the query param for your Toast system
    router.push({ path: '/', query: { action: 'logged-out' } })
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

// Keyboard support (Esc key)
const handleEsc = (e) => {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', handleEsc))
onUnmounted(() => window.removeEventListener('keydown', handleEsc))
</script>

<style scoped>
/* Inheriting all sheet layout, scrim, bottom-sheet, and handle styles from global unified styles */
.sheet-content {
  padding: 1.5rem;
}

/* Profile Header */
.user-profile-header {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 3rem;
}

.avatar-large {
  width: 72px;
  height: 72px;
  background: var(--clr-white);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--clr-border);
  overflow: hidden;
}

.avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-icon {
  font-size: 3.5rem;
  color: var(--clr-grey);
}

.user-name {
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0;
}


/* Action Items */
.user-actions {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 1ch;
  padding: 1rem;
  color: var(--clr-text-muted);
  font-weight: 600;
  transition: all 0.2s ease;
}

.action-item:active {
  transform: scale(0.98);
}

.action-item svg {
  font-size: 1.25rem;
}

.chevron {
  margin-left: auto;
}
</style>