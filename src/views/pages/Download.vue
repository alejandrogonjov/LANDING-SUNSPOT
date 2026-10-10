<template>
  <DefaultLayout>
    <div class="download-page">
      <div class="content centered">
        <!-- Hero — most visitors arrive here cold, from a shared link -->
        <div class="hero">
          <img src="/logo.svg" alt="SUNspot" class="hero-logo" width="88" height="88" />
          <h1 class="hero-title">SUNspot</h1>
          <p class="hero-tagline">Encuentra la luz</p>
        </div>

        <!-- Already installed — nothing left to do here -->
        <div v-if="isInstalled" class="os-section">
          <div class="success-badge">
            <IconCheck class="success-icon" />
          </div>
          <p class="description">Ya tienes SUNspot instalada en este dispositivo.</p>
          <RouterLink to="/" class="btn-primary full-width">Abrir la app</RouterLink>
        </div>

        <!-- Installed, but this page is open in the browser instead of the app -->
        <div v-else-if="hasInstalledApp" class="os-section">
          <div class="success-badge">
            <IconCheck class="success-icon" />
          </div>
          <p class="description">
            Ya tienes SUNspot instalada. Ábrela desde tu pantalla de inicio o tu lista de aplicaciones.
          </p>
          <RouterLink to="/" class="btn-secondary full-width">Seguir en el navegador</RouterLink>
        </div>

        <!-- In-app browser (WhatsApp, Instagram…) — installing isn't possible here -->
        <div v-else-if="isInAppBrowser" class="os-section">
          <div class="warning-card">
            <IconOpenInNew class="warning-icon" />
            <p>
              Estás viendo esta página dentro de otra aplicación. Para instalar SUNspot, ábrela en
              <strong>{{ isIOS ? 'Safari' : 'Chrome' }}</strong>.
            </p>
            <!-- Most Android webviews honour intent:// links, which skips the menu hunt -->
            <a v-if="isAndroid" :href="chromeIntentUrl" class="btn-primary full-width">
              <IconGoogleChrome /> Abrir en Chrome
            </a>
            <p class="warning-hint">
              {{ isAndroid ? 'Si no funciona, usa' : 'Usa' }} el menú
              <IconDotsVertical class="inline-icon" />
              y selecciona <strong>Abrir en el navegador</strong>.
            </p>
          </div>
        </div>

        <!-- Android -->
        <div v-else-if="isAndroid" class="os-section">
          <IconAndroid class="os-icon android" />
          <p class="description">
            Instala la aplicación en tu dispositivo para acceder rápidamente a todas las funciones.
          </p>

          <button v-if="canInstall" class="btn-primary full-width install-btn" @click="handleInstall">
            Descargar App
          </button>

          <!-- OEM / lite browsers (Mi, Huawei, UC…) can't install PWAs — hand off to Chrome -->
          <div v-else-if="androidBrowser === 'other'" class="warning-card">
            <IconGoogleChrome class="warning-icon" />
            <p>
              Este navegador no permite instalar aplicaciones. Para instalar SUNspot, ábrela en
              <strong>Chrome</strong>.
            </p>
            <a :href="chromeIntentUrl" class="btn-primary full-width">
              <IconGoogleChrome /> Abrir en Chrome
            </a>
          </div>

          <!-- Chromium fires beforeinstallprompt shortly after load; don't show
               the manual path (or the incompatibility notice) before it has had a chance -->
          <div v-else-if="!installCheckDone && androidBrowser !== 'firefox'" class="checking" role="status">
            <span class="spinner" aria-hidden="true" />
            Preparando la instalación…
          </div>

          <template v-else>
            <div class="fallback-instructions">
              <p>Para instalarla:</p>
              <p v-if="androidBrowser === 'samsung'" class="fallback-text">
                Toca el menú <IconMenu class="inline-icon" /> de la barra inferior y selecciona
                <strong>Añadir página a</strong> → <strong>Pantalla de inicio</strong>.
              </p>
              <p v-else-if="androidBrowser === 'firefox'" class="fallback-text">
                Abre el menú <IconDotsVertical class="inline-icon" /> y selecciona
                <strong>Instalar</strong> o <strong>Añadir a pantalla de inicio</strong>.
              </p>
              <p v-else class="fallback-text">
                Abre el menú del navegador <IconDotsVertical class="inline-icon" /> y selecciona
                <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong>.
                Si no la ves, desliza el menú hacia abajo.
              </p>
            </div>

            <!-- The install prompt never came: most likely a device that can't
                 install PWAs (Android Go, no Google services, Custom Tab…) -->
            <div v-if="showIncompatible" class="warning-card incompatible-card">
              <IconAlertCircle class="warning-icon" />
              <p>
                <strong>¿No aparece la opción?</strong> Puede que tu dispositivo no sea compatible con la
                instalación de apps web.
              </p>
              <ul class="incompatible-tips">
                <li>
                  Si abriste el enlace desde otra app (WhatsApp, Gmail…), toca
                  <IconDotsVertical class="inline-icon" /> y elige <strong>Abrir en Chrome</strong>.
                </li>
                <li v-if="androidBrowser === 'samsung'">Prueba a abrir esta página en <strong>Chrome</strong>.</li>
                <li v-else>Actualiza Chrome desde Google Play y vuelve a intentarlo.</li>
              </ul>
              <p class="warning-hint">Mientras tanto, puedes usar SUNspot desde el navegador sin instalar nada.</p>
              <RouterLink to="/" class="btn-secondary full-width">Usar en el navegador</RouterLink>
            </div>
          </template>
        </div>

        <!-- iOS -->
        <div v-else-if="isIOS" class="os-section">
          <IconApple class="os-icon apple" />
          <p class="description">
            Para instalar SUNspot en tu iPhone o iPad, sigue estos pasos desde <strong>Safari</strong>:
          </p>
          <ol class="ios-steps">
            <li>
              Toca el botón <strong>Compartir</strong> en la barra inferior.
              <div class="icon-box">
                <IconExport class="step-icon" />
              </div>
            </li>
            <li>
              Selecciona <strong>Añadir a la pantalla de inicio</strong>.
              <div class="icon-box">
                <IconPlusBox class="step-icon" />
              </div>
            </li>
            <li>Toca <strong>Añadir</strong> arriba a la derecha.</li>
          </ol>
        </div>

        <!-- Desktop (shows both) -->
        <div v-else class="desktop-view">
          <!-- Chromium desktop browsers (Chrome, Edge…) can install the PWA on
               the computer itself; offer it when the browser says it can. -->
          <template v-if="canInstall">
            <p class="description">Instala SUNspot en este ordenador para abrirla como una aplicación más.</p>
            <button class="btn-primary full-width install-btn" @click="handleInstall">
              Instalar en este ordenador
            </button>
            <p class="description">O instálala en tu móvil:</p>
          </template>
          <p v-else class="description">Visita esta página desde tu móvil para instalar la app.</p>

          <div class="instruction-card">
            <IconAndroid class="os-icon android" />
            <h2>Android</h2>
            <p>Abre esta página en Chrome y selecciona <strong>Instalar aplicación</strong> desde el menú</p>
            <IconDotsVertical class="inline-icon" />
          </div>

          <div class="instruction-card">
            <IconApple class="os-icon apple" />
            <h2>iPhone / iPad</h2>
            <p>Abre esta página en Safari, toca <strong>Compartir</strong></p>
            <IconExport class="inline-icon" />
            <p>y selecciona <strong>Añadir a la pantalla de inicio</strong></p>
            <IconPlusBox class="inline-icon" />
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { usePwaInstall } from '@/composables/usePwaInstall'
import { useToast } from '@/composables/useToast'

import IconAndroid from '~icons/mdi/android'
import IconApple from '~icons/mdi/apple'
import IconExport from '~icons/mdi/export-variant'
import IconPlusBox from '~icons/mdi/plus-box-outline'
import IconDotsVertical from '~icons/mdi/dots-vertical'
import IconCheck from '~icons/mdi/check-circle'
import IconOpenInNew from '~icons/mdi/open-in-new'
import IconGoogleChrome from '~icons/mdi/google-chrome'
import IconMenu from '~icons/mdi/menu'
import IconAlertCircle from '~icons/mdi/alert-circle-outline'

const {
  canInstall,
  isInstalled,
  hasInstalledApp,
  installCheckDone,
  wasDismissed,
  promptInstall,
  isIOS,
  isAndroid,
  isInAppBrowser,
  androidBrowser,
} = usePwaInstall()
const { triggerToast } = useToast()

// Only for browsers that would have fired beforeinstallprompt on a capable
// device. A dismissed prompt is withheld by Chrome for a while, so it says
// nothing about compatibility.
const showIncompatible = computed(
  () => ['chromium', 'samsung'].includes(androidBrowser) && installCheckDone.value && !wasDismissed.value
)

// Opens this page in Chrome from another browser or a webview; sends the user
// to Chrome's Play Store page when Chrome isn't installed.
const chromeIntentUrl =
  `intent://${location.host}${location.pathname}${location.search}` +
  `#Intent;scheme=${location.protocol.slice(0, -1)};package=com.android.chrome;` +
  `S.browser_fallback_url=${encodeURIComponent('https://play.google.com/store/apps/details?id=com.android.chrome')};end`

const handleInstall = async () => {
  const outcome = await promptInstall()
  if (outcome === 'unavailable') {
    triggerToast('Usa el menú de Chrome y selecciona "Instalar aplicación"')
  }
}
</script>

<style scoped>
@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.download-page {
  padding: 24px 20px;
  padding-bottom: var(--total-nav-height);
  min-height: 100vh;
  background: var(--clr-background);
  display: flex;
  flex-direction: column;
}

.content.centered {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 32px;
  opacity: 0;
  animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  align-items: center;
  margin-top: 24px;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.hero-logo {
  width: 88px;
  height: 88px;
  margin-bottom: 8px;
}

.hero-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin: 0;
  color: var(--clr-text);
}

.hero-tagline {
  margin: 0;
  font-size: 15px;
  color: var(--clr-text-muted);
}

.os-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 400px;
}

.success-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.success-icon {
  font-size: 48px;
  color: #3DDC84;
}

/* Some actions are links (RouterLink, the Chrome intent), so they need the
   same box behaviour the <button> gets from .btn-primary. */
a.btn-primary,
a.btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  box-sizing: border-box;
}

.warning-card {
  background: var(--clr-neutral-soft);
  border: 1px solid var(--clr-border);
  border-radius: 20px;
  padding: 24px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.warning-icon {
  font-size: 32px;
  color: var(--clr-primary);
}

.warning-card p {
  margin: 0;
  line-height: 1.5;
  color: var(--clr-text);
  font-size: 15px;
}

.warning-hint {
  font-size: 14px !important;
  color: var(--clr-text-muted) !important;
}

.os-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.os-icon.android {
  color: #3DDC84;
}

.os-icon.apple {
  color: var(--clr-dark);
}

.description {
  color: var(--clr-text-muted);
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 32px;
}

.install-btn {
  margin-bottom: 24px;
}

.full-width {
  width: 100%;
  padding: 16px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.fallback-instructions {
  margin-top: 16px;
  padding-top: 24px;
  border-top: 1px solid var(--clr-border);
  width: 100%;
}

.fallback-instructions p {
  color: var(--clr-text-muted);
  font-size: 14px;
  margin-bottom: 8px;
}

.fallback-text {
  font-size: 15px !important;
  color: var(--clr-text) !important;
  line-height: 1.5;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.checking {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--clr-text-muted);
  font-size: 15px;
  padding: 16px 0;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--clr-border);
  border-top-color: var(--clr-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.incompatible-card {
  margin-top: 24px;
}

.incompatible-tips {
  margin: 0;
  padding-left: 20px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--clr-text);
  font-size: 14px;
  line-height: 1.5;
}

/* Keep the menu icon in the sentence instead of on a line of its own */
.incompatible-tips .inline-icon {
  display: inline-block;
  margin: 0 2px;
}

.inline-icon {
  vertical-align: middle;
  font-size: 1.2em;
  margin: auto auto;
  color: var(--clr-primary);
}

.ios-steps {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.ios-steps li {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: var(--clr-neutral-soft);
  padding: 20px;
  border-radius: 20px;
  margin: 0;
  border: 1px solid var(--clr-border);
  transition: background 0.2s ease, transform 0.2s ease;
  color: var(--clr-text);
  line-height: 1.5;
}

.ios-steps li:hover {
  background: var(--clr-background-alt);
  transform: scale(1.01);
}

.icon-box {
  margin-top: 16px;
  width: 48px;
  height: 48px;
  background: var(--clr-white);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.step-icon {
  font-size: 24px;
  color: #007AFF;
}

.desktop-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 400px;
}

.instruction-card {
  background: var(--clr-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--clr-glass-border);
  border-radius: 24px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  width: 100%;
  display: flex;
  gap: 1.2rem;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.instruction-card h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 12px 0;
  color: var(--clr-text);
}

.instruction-card p {
  color: var(--clr-text-muted);
  line-height: 1.5;
  margin: 0;
  font-size: 15px;
  text-align: center;
}
</style>
