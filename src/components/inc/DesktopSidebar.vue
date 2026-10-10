<template>
  <aside class="desktop-sidebar" aria-label="Navegación principal">
    <RouterLink to="/" class="sidebar-brand" :aria-label="t('nav.home')">
      <img src="/logo.svg" alt="SUNspot" class="brand-wordmark" width="150" height="30" />
      <img src="/sunspot.svg" alt="SUNspot" class="brand-mark" width="44" height="44" />
    </RouterLink>

    <nav class="sidebar-nav">
      <template v-for="group in groups" :key="group.label">
        <p class="sidebar-section">{{ group.label }}</p>
        <ul class="sidebar-list">
          <li v-for="item in group.items" :key="item.to">
            <RouterLink :to="item.to" class="sidebar-link" :class="{ 'is-active': isActive(item) }"
              :aria-current="isActive(item) ? 'page' : undefined" :data-label="item.label"
              :aria-label="item.label">
              <component :is="item.icon" class="sidebar-icon" aria-hidden="true" />
              <span class="sidebar-label">{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>
      </template>
    </nav>

    <div class="sidebar-footer">
      <template v-if="isLoggedIn">
        <RouterLink to="/cuenta" class="sidebar-user" :data-label="t('nav.account')" :aria-label="t('nav.account')">
          <span class="user-avatar">
            <img v-if="userData?.avatar" :src="`/avatars/avatar (${userData.avatar}).png`" alt="" />
            <icon-mdi-account-circle v-else class="user-avatar-icon" />
          </span>
          <span class="sidebar-label user-text">
            <span class="user-name">{{ userData?.name || 'Explorador' }}</span>
            <span class="user-sub">{{ t('nav.view_account') }}</span>
          </span>
        </RouterLink>
        <button type="button" class="sidebar-link sidebar-logout" :data-label="t('nav.logout')" :aria-label="t('nav.logout')"
          @click="signOutAndGoHome">
          <icon-mdi-logout class="sidebar-icon" aria-hidden="true" />
          <span class="sidebar-label">{{ t('nav.logout') }}</span>
        </button>
      </template>

      <RouterLink v-else to="/registro" class="btn-primary sidebar-login" :data-label="t('nav.login')"
        :aria-label="t('nav.login')">
        <icon-mdi-login aria-hidden="true" />
        <span class="sidebar-label">{{ t('nav.login') }}</span>
      </RouterLink>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUser } from '@/composables/useUser'
import { useSignOut } from '@/composables/useSignOut'
import { useTranslator } from '@/composables/useTranslator'
import IconMap from '~icons/mdi/map-outline'
import IconMagnify from '~icons/mdi/magnify'
import IconSunThermometer from '~icons/mdi/sun-thermometer'
import IconAccountStar from '~icons/mdi/account-star'
import IconAccount from '~icons/mdi/account-outline'
import IconHeart from '~icons/mdi/heart-outline'
import IconStar from '~icons/mdi/star'
import IconCog from '~icons/mdi/cog-outline'
import IconShield from '~icons/mdi/shield-check'

// Desktop replacement for the mobile chrome: it carries every destination of
// the bottom nav (Nav.vue), the menu drawer (MenuDrawer.vue) and the avatar
// menu (UserMenuSheet.vue), so nothing reachable on a phone is lost here.
const route = useRoute()
const { userData, isLoggedIn } = useUser()
const { signOutAndGoHome } = useSignOut()
const { t } = useTranslator()

const groups = computed(() => [
  {
    label: t('nav.discover'),
    items: [
      { to: '/', label: t('nav.map'), icon: IconMap, exact: true },
      { to: '/explorar', label: t('nav.explore'), icon: IconMagnify, match: ['/explorar', '/spot/'] },
      { to: '/suncronizacion', label: t('nav.circadian'), icon: IconSunThermometer },
      { to: '/embajadores', label: t('nav.ambassadors'), icon: IconAccountStar, match: ['/embajador'] },
    ],
  },
  {
    label: t('nav.your_space'),
    items: [
      { to: '/cuenta', label: t('nav.account'), icon: IconAccount, match: ['/cuenta', '/notificacion', '/avatar', '/perfil'] },
      ...(isLoggedIn.value ? [{ to: '/mis-favoritos', label: t('nav.bookmarks'), icon: IconHeart }] : []),
      { to: '/personal-spots', label: t('nav.personal_spots'), icon: IconStar, match: ['/personal-spot', '/personal-map'] },
      { to: '/ajustes', label: t('nav.settings'), icon: IconCog },
      ...(userData.value?.role === 'admin' ? [{ to: '/panel', label: t('nav.admin'), icon: IconShield, match: ['/panel'] }] : []),
    ],
  },
])

const isActive = (item) => {
  if (item.exact) return route.path === item.to
  return (item.match || [item.to]).some((prefix) => route.path.startsWith(prefix))
}
</script>

<style scoped>
.desktop-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: var(--sidebar-width);
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem 1rem 1.25rem;
  background: var(--clr-white);
  border-right: 1px solid var(--clr-border);
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-md);
}

.brand-wordmark {
  width: 150px;
  height: auto;
}

.brand-mark {
  display: none;
  width: 44px;
  height: 44px;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sidebar-section {
  margin: 1.25rem 0 0.5rem;
  padding: 0 0.75rem;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--clr-text-muted);
}

.sidebar-section:first-child {
  margin-top: 0;
}

.sidebar-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sidebar-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  width: 100%;
  padding: 0.7rem 0.75rem;
  border-radius: var(--radius-md);
  color: var(--clr-text);
  font-size: 0.92rem;
  font-weight: 600;
  text-align: left;
  transition: background-color var(--transition), color var(--transition);
}

.sidebar-link:hover {
  background-color: var(--clr-primary-soft);
  color: var(--clr-primary);
}

.sidebar-link.is-active {
  background-color: var(--clr-primary-soft);
  color: var(--clr-primary);
  font-weight: 800;
}

.sidebar-link.is-active::before {
  content: '';
  position: absolute;
  left: -1rem;
  top: 0.5rem;
  bottom: 0.5rem;
  width: 4px;
  border-radius: 0 4px 4px 0;
  background: var(--clr-primary);
}

.sidebar-icon {
  flex-shrink: 0;
  width: 1.35rem;
  height: 1.35rem;
  color: var(--clr-primary);
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--clr-border);
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  transition: background-color var(--transition);
}

.sidebar-user:hover {
  background-color: var(--clr-primary-soft);
}

.user-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--clr-border);
  background: var(--clr-background-alt);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar-icon {
  width: 2rem;
  height: 2rem;
  color: var(--clr-grey);
}

.user-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-weight: 800;
  font-size: 0.9rem;
  color: var(--clr-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-sub {
  font-size: 0.75rem;
  color: var(--clr-text-muted);
}

.sidebar-logout {
  color: var(--clr-text-muted);
}

.sidebar-logout .sidebar-icon {
  color: var(--clr-text-muted);
}

.sidebar-login {
  width: 100%;
  padding: 0.8rem 1rem;
}

/* --- Rail: 1024–1279px. Icons only, so the map keeps its width; the label
   moves into a tooltip on hover / keyboard focus. --- */
@media (max-width: 1279px) {
  .desktop-sidebar {
    padding: 1.25rem 0.75rem;
    overflow: visible;
  }

  .sidebar-brand {
    justify-content: center;
    padding: 0;
  }

  .brand-wordmark,
  .sidebar-label,
  .sidebar-section {
    display: none;
  }

  .brand-mark {
    display: block;
  }

  .sidebar-list {
    padding-top: 0.75rem;
    margin-top: 0.75rem;
    border-top: 1px solid var(--clr-border);
  }

  .sidebar-link,
  .sidebar-user,
  .sidebar-login {
    justify-content: center;
    padding: 0.75rem;
  }

  .sidebar-link.is-active::before {
    left: -0.75rem;
  }

  .sidebar-user {
    padding: 0.4rem;
  }

  [data-label]::after {
    content: attr(data-label);
    position: absolute;
    left: calc(100% + 0.75rem);
    top: 50%;
    transform: translateY(-50%);
    padding: 0.35rem 0.65rem;
    border-radius: var(--radius-sm);
    background: var(--clr-text);
    color: var(--clr-background);
    font-size: 0.8rem;
    font-weight: 700;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
    z-index: 1;
  }

  .sidebar-user,
  .sidebar-login {
    position: relative;
  }

  [data-label]:hover::after,
  [data-label]:focus-visible::after {
    opacity: 1;
  }
}
</style>
