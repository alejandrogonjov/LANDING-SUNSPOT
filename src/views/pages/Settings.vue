<template>
  <MainLayout>
    <Back title="Ajustes" />

    <main class="settings-content">
      <section class="settings-section">
        <h2 class="section-label">Apariencia</h2>
        <div class="settings-group">
          <div class="setting-item toggle-item">
            <div class="setting-info">
              <icon-mdi-weather-night v-if="isDark" class="setting-icon" />
              <icon-mdi-white-balance-sunny v-else class="setting-icon" />
              <div class="text-stack">
                <span class="label">Modo oscuro</span>
                <span class="value">{{ themeDescription }}</span>
              </div>
            </div>
            <label class="switch">
              <input type="checkbox" :checked="isDark" @change="toggleTheme" aria-label="Modo oscuro">
              <span class="slider"></span>
            </label>
          </div>
        </div>
        <button v-if="!followsSystem" class="btn-text setting-reset" @click="useSystemTheme">
          Seguir el tema del sistema
        </button>
      </section>

      <section class="settings-section">
        <h2 class="section-label">Preferencias</h2>
        <div class="settings-group">
          <div class="setting-item toggle-item">
            <div class="setting-info">
              <icon-mdi-crosshairs-gps class="setting-icon" />
              <div class="text-stack">
                <span class="label">Geolocalización</span>
                <span class="value">Usar ubicación en tiempo real</span>
              </div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="geolocationEnabled" aria-label="Geolocalización">
              <span class="slider"></span>
            </label>
          </div>
        </div>
        <p v-if="browserPermissionState === 'denied'" class="permission-warning">
          La geolocalización está bloqueada en tu navegador. Actívala en los ajustes de tu dispositivo para usar esta
          función.
        </p>
      </section>

      <!-- Account rows only exist for an account. A guest sees the appearance
           and geolocation preferences above, which are device-level, and the
           sign-in call to action below. -->
      <section v-if="isLoggedIn" class="settings-section">
        <h2 class="section-label">Cuenta</h2>
        <div class="settings-group">
          <router-link to="/avatar" class="setting-item">
            <div class="setting-info">
              <icon-mdi-account-circle-outline class="setting-icon" />
              <span>Cambiar Avatar</span>
            </div>
            <icon-mdi-chevron-right class="chevron" />
          </router-link>

          <div class="setting-item" @click="showEditNameSheet = true">
            <div class="setting-info">
              <icon-mdi-card-account-details-outline class="setting-icon" />
              <div class="text-stack">
                <span class="label">Nombre de usuario</span>
                <span class="value">{{ userData?.name || 'Explorador' }}</span>
              </div>
            </div>
            <icon-mdi-pencil class="chevron" />
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h2 class="section-label">Sesión</h2>
        <button v-if="isLoggedIn" @click="handleLogout" class="btn-logout">
          <icon-mdi-logout />
          <span>Cerrar sesión</span>
        </button>
        <template v-else>
          <button @click="router.push('/registro')" class="btn-secondary session-btn">
            <icon-mdi-login />
            <span>Iniciar sesión</span>
          </button>
          <p class="session-hint">Inicia sesión para guardar tus spots favoritos y personalizar tu perfil.</p>
        </template>
      </section>
    </main>

    <EditNameSheet v-if="showEditNameSheet" @close="showEditNameSheet = false" />
  </MainLayout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { loadFirebase } from '@/firebaseLazy'
import { useUser } from '@/composables/useUser'
import { useSettings } from '@/composables/useSettings'
import { useTheme } from '@/composables/useTheme'
import MainLayout from '@/layouts/MainLayout.vue'
import Back from '@/components/ui/Back.vue'
import EditNameSheet from '@/components/settings/EditNameSheet.vue'

const router = useRouter()
const { userData, isLoggedIn } = useUser()
const { geolocationEnabled, browserPermissionState } = useSettings()
const { isDark, followsSystem, toggleTheme, useSystemTheme } = useTheme()
const showEditNameSheet = ref(false)

const themeDescription = computed(() => {
  if (followsSystem.value) return `Siguiendo tu dispositivo (${isDark.value ? 'oscuro' : 'claro'})`
  return isDark.value ? 'Activado' : 'Desactivado'
})

const handleLogout = async () => {
  try {
    // Loaded on demand, like everywhere else off the critical path — this page
    // is public now, so a guest opening it shouldn't pull in the Firebase SDK.
    const { auth, signOut } = await loadFirebase()
    await signOut(auth)
    router.push('/')
  } catch (error) {
    console.error("Error signing out:", error)
  }
}
</script>

<style scoped>
.settings-content {
  padding: 0 1.5rem 2rem;
}

.settings-section {
  margin-bottom: 2rem;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--clr-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
  padding-left: 0.5rem;
}

.settings-group {
  background: var(--clr-white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--clr-border);
  overflow: hidden;
}

.setting-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 1px solid var(--clr-border);
  text-decoration: none;
  color: var(--clr-dark);
  transition: background 0.2s ease;
  cursor: pointer;
  text-align: left;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:active {
  background: var(--clr-background-alt);
}

.setting-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.setting-icon {
  font-size: 1.25rem;
  color: var(--clr-primary);
}

.text-stack {
  display: flex;
  flex-direction: column;
}

.text-stack .label {
  font-size: 0.9rem;
  font-weight: 600;
}

.text-stack .value {
  font-size: 0.75rem;
  color: var(--clr-text-muted);
}

.chevron {
  font-size: 1.25rem;
  color: var(--clr-border);
}

.toggle-item {
  justify-content: space-between;
  cursor: default;
}

.toggle-item:active {
  background: none;
}

.setting-reset {
  margin: 0.5rem 0 0 0.25rem;
  font-size: 0.8rem;
}

/* Switch styling */
.switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 26px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: var(--clr-border);
  transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 4px;
  bottom: 4px;
  /* The knob rides on the primary orange when on and on the border grey when
     off — both are light-on-colour in either theme, so it stays fixed white. */
  background-color: var(--clr-on-brand);
  transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

input:checked+.slider {
  background-color: var(--clr-primary);
}

input:focus+.slider {
  box-shadow: 0 0 1px var(--clr-primary);
}

input:checked+.slider:before {
  transform: translateX(20px);
}

.permission-warning {
  margin: 0.75rem 0.5rem 0;
  font-size: 0.8rem;
  color: var(--clr-sunspot-600);
  line-height: 1.45;
  font-weight: 600;
}

.session-btn {
  width: 100%;
}

.session-hint {
  margin: 0.75rem 0.5rem 0;
  font-size: 0.8rem;
  color: var(--clr-text-muted);
  line-height: 1.45;
}
</style>
