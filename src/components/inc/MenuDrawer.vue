<template>
  <div class="drawer-wrapper">
    <Transition name="fade">
      <div v-if="isOpen" class="overlay" @click="$emit('close')"></div>
    </Transition>

    <aside :class="{ 'is-open': isOpen }">
      <div class="drawer-inner">
        <div class="drawer-header">
          <img src="/logo.svg" alt="Logo" class="logo" height="auto" width="100" />
          <button @click="$emit('close')" class="btn-close" aria-label="Cerrar">
            <icon-mdi-close />
          </button>
        </div>

        <nav class="nav-list">
          <div class="nav-group">
            <RouterLink to="/" class="menu-link" @click="$emit('close')">
              <div class="link-content">
                <icon-mdi-map-outline class="nav-icon" />
                <span class="link-label">Mapa</span>
              </div>
            </RouterLink>

            <RouterLink to="/explorar" class="menu-link" @click="$emit('close')">
              <div class="link-content">
                <icon-mdi-magnify class="nav-icon" />
                <span class="link-label">Explorar</span>
              </div>
            </RouterLink>

            <RouterLink to="/suncronizacion" class="menu-link" @click="$emit('close')">
              <div class="link-content">
                <icon-mdi-sun-thermometer class="nav-icon" />
                <span class="link-label">Suncronización</span>
              </div>
            </RouterLink>

            <RouterLink to="/personal-spots" class="menu-link" @click="$emit('close')">
              <div class="link-content">
                <icon-mdi-star class="nav-icon" />
                <span class="link-label">Personal spots</span>
              </div>
            </RouterLink>
          </div>

          <div class="nav-group utility">
            <RouterLink to="/embajadores" class="menu-link" @click="$emit('close')">
              <div class="link-content">
                <icon-mdi-account-star class="nav-icon" />
                <span class="link-label">Embajadores</span>
              </div>
            </RouterLink>

            <RouterLink to="/ajustes" class="menu-link" @click="$emit('close')">
              <div class="link-content">
                <icon-mdi-cog-outline class="nav-icon" />
                <span class="link-label">Ajustes</span>
              </div>
            </RouterLink>

            <RouterLink v-if="userData?.role === 'admin'" to="/panel" class="menu-link admin-link"
              @click="$emit('close')">
              <div class="link-content">
                <icon-mdi-shield-check class="nav-icon" />
                <span class="link-label">Panel Admin</span>
              </div>
            </RouterLink>

          </div>
        </nav>

        <div class="drawer-footer">
          <button v-if="user" class="btn-logout" @click="handleLogout">
            <icon-mdi-logout />
            <span>Cerrar Sesión</span>
          </button>

          <button v-else class="btn-secondary" style="width: 100%;" @click="handleLogin">
            <icon-mdi-login />
            <span>Iniciar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUser } from '@/composables/useUser'
import { useSignOut } from '@/composables/useSignOut'

defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])
const router = useRouter()

const { user, userData } = useUser()
const { signOutAndGoHome } = useSignOut()

const handleLogin = () => {
  emit('close')
  router.push('/registro')
}

const handleLogout = async () => {
  if (await signOutAndGoHome()) emit('close')
}
</script>

<style scoped>
aside {
  /* Left gutter between the viewport edge and the centered app container (0 on mobile) */
  --drawer-inset: max(0px, calc((100vw - var(--max-width)) / 2));
  position: fixed;
  top: 0;
  /* Anchor to the centered app container's left edge on wide screens */
  left: var(--drawer-inset);
  width: 300px;
  max-width: 85%;
  height: 100dvh;
  background-color: var(--clr-background);
  z-index: 2002;
  /* Closed: slide fully past the viewport's left edge (own width + the inset) */
  transform: translateX(calc(-100% - var(--drawer-inset)));
  transition: transform var(--transition);
  border-right: 1px solid var(--clr-border);
  box-shadow: 10px 0 25px rgba(0, 0, 0, 0.05);
}

aside.is-open {
  transform: translateX(0);
}

.drawer-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-top: calc(var(--safe-area-top) + 1.5rem);
  padding-left: calc(var(--safe-area-left) + 1.5rem);
  padding-right: calc(var(--safe-area-right) + 1.5rem);
  padding-bottom: calc(var(--safe-area-bottom) + 1.5rem);
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

/* NAVIGATION */
.nav-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.utility {
  margin-top: 1rem;
  padding: 1rem 0;
  border-top: 1px solid var(--clr-border);
}

.menu-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0.5rem;
  border-radius: var(--radius-md);
  transition: background var(--transition);
}

.menu-link:hover {
  background-color: var(--clr-primary-soft);
}

.link-content {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.nav-icon {
  font-size: 1.25rem;
  color: var(--clr-primary);
}

.link-label {
  font-size: 0.85rem;
  color: var(--clr-text);
  font-weight: 600;
}

/* LOGIN/LOGOUT BUTTONS */
.drawer-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--clr-border);
}

/* OVERLAY */
.overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay);
  backdrop-filter: blur(4px);
  z-index: 2001;
}

/* TRANSITIONS */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>