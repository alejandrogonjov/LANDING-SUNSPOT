<template>
  <header class="account-header">
    <div class="full-banner">
      <div class="banner-header">
        <button @click="$router.back()" class="btn-back btn-glass" aria-label="Volver">
          <icon-mdi-chevron-left />
        </button>

        <router-link to="/ajustes" class="btn-close btn-glass" aria-label="Ajustes de perfil">
          <icon-tabler-settings />
        </router-link>
      </div>

    </div>

    <div class="header-card">
      <div class="identity-row">

        <div class="avatar-container">
          <div class="avatar-inner">
            <img v-if="user?.avatar" :src="`/avatars/avatar (${user.avatar}).png`" class="profile-avatar" />
            <icon-mdi-account-circle v-else class="profile-avatar-icon" />

            <router-link to="/avatar" class="edit-avatar-btn" aria-label="Editar avatar">
              <icon-mdi-pencil />
            </router-link>
          </div>
        </div>

        <div class="user-info">
          <h1 class="user-name">{{ user?.name || 'Explorador Solar' }}</h1>

          <div class="profile-label">
            {{ user?.profile_type || 'Explorador' }}
          </div>
        </div>

      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  user: { type: Object, default: null }
})
</script>

<style scoped>
.account-header {
  background: transparent;
}

.full-banner {
  position: relative;
  height: 140px;
  width: 100%;
  background: linear-gradient(135deg, var(--clr-primary-soft) 0%, var(--clr-primary) 100%);
  background-image: url(https://images.unsplash.com/photo-1563630381190-77c336ea545a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3VufGVufDB8fDB8fHww);
  opacity: 0.9;
  background-size: cover;
  background-position: center center;
}

.banner-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  z-index: 10;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, transparent 100%);
}

/* Redundant .glass-btn styles removed - now using unified global styles */

.header-card {
  margin: -30px 0 0 0;
  background: var(--clr-white);
  padding: 1.5rem;
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
  position: relative;
  z-index: 2;
}

.identity-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.avatar-container {
  flex-shrink: 0;
}

.avatar-inner {
  position: relative;
  width: 76px;
  height: 76px;
  background: var(--clr-background-alt);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--clr-border);
}

.profile-avatar {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.profile-avatar-icon {
  font-size: 68px;
  color: var(--clr-border);
}

.edit-avatar-btn {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: var(--clr-white);
  color: var(--clr-dark);
  width: 26px;
  height: 26px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--clr-border);
  font-size: 0.75rem;
  box-shadow: var(--shadow-sm);
}


.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--clr-dark);
  line-height: 1.1;
  letter-spacing: -0.02em;
}


.profile-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--clr-primary);
  margin-top: 4px;
}
</style>