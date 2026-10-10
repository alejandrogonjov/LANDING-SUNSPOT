<template>
  <DefaultLayout>
    <main class="profile-page">
      <div v-if="loading" class="loading-state">
        <icon-mdi-loading class="spin" />
        <p>Cargando tu energía...</p>
      </div>

      <div v-else-if="userData?.profile?.type" class="profile-card">
          <header class="profile-header">
            <div class="avatar-circle">
              <img v-if="userData?.avatar" :src="`/avatars/avatar (${userData.avatar}).png`" class="avatar-img"
                :alt="userData.name" />
              <span v-else>{{ userData.name?.charAt(0).toUpperCase() }}</span>
            </div>
            <h1 class="user-name">{{ userData.name }}</h1>
            <p class="user-email">{{ userData.email }}</p>
          </header>
      </div>

      <div v-else class="empty-state">
        <p>Aún no te has unido al Sunspot Crew.</p>
      </div>
    </main>
  </DefaultLayout>
</template>

<script setup>
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useUser } from '@/composables/useUser'

const { userData, loading } = useUser()
</script>

<style scoped>
.profile-page {
  padding: 2rem 1.5rem;
  min-height: 80vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.profile-card {
  width: 100%;
  max-width: 440px;
  background: var(--clr-white);
  border-radius: 32px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-md);
  text-align: center;
}

/* Avatar & Header */
.profile-header {
  margin-bottom: 2.5rem;
}

.avatar-circle {
  width: 80px;
  height: 80px;
  background: var(--clr-primary);
  color: var(--clr-on-brand);
  font-size: 2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin: 0 auto 1rem;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--clr-dark);
  margin-bottom: 0.25rem;
}

.user-email {
  font-size: 0.9rem;
  color: var(--clr-grey);
}

.loading-state {
  text-align: center;
  margin-top: 4rem;
  color: var(--clr-primary);
}

.spin {
  font-size: 3rem;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>