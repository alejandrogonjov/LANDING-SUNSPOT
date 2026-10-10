import { ref, computed } from 'vue'

/**
 * PWA install state.
 *
 * The listeners below are registered at module-import time, on purpose.
 * `beforeinstallprompt` fires very early in page load — before the router
 * resolves a lazy route and before main.js mounts the app (it waits on
 * onAuthStateChanged first). A listener registered inside a component's
 * onMounted always arrives too late and the event is lost, which leaves the
 * install button permanently disabled. main.js imports this module at the top
 * so the listener is live on first script evaluation.
 */

const deferredPrompt = ref(null)
const isInstalled = ref(false)

const userAgent = navigator.userAgent || navigator.vendor || window.opera || ''

// iPadOS 13+ reports itself as a Mac, so touch points are the only tell.
const isIOS =
  (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

const isAndroid = /android/i.test(userAgent)
const isMobile = isIOS || isAndroid
const isDesktop = !isMobile

/**
 * In-app browsers (WhatsApp/Instagram/Facebook webviews) can't install a PWA:
 * there's no install menu entry and no "Añadir a pantalla de inicio". Since the
 * /descargar link is mainly shared over WhatsApp, detecting this is worth it —
 * otherwise the user follows instructions that reference a menu they don't have.
 */
const isInAppBrowser =
  /FBAN|FBAV|Instagram|Line\/|Twitter|TikTok/.test(userAgent) ||
  (isAndroid && /;\s*wv\)/.test(userAgent))

/**
 * Android browser family — it decides which install path the page can offer.
 * - 'chromium': Chrome, Edge, Opera, Brave… fire `beforeinstallprompt`.
 * - 'samsung' : fires it too, but its manual path lives in a different menu.
 * - 'firefox' : never fires it; installs only from its own menu.
 * - 'other'   : OEM/lite browsers (Mi, Huawei, UC, Opera Mini…) with no
 *               reliable install support — the only way forward is Chrome.
 * The 'other' test runs first because those browsers also claim "Chrome/".
 */
const androidBrowser = !isAndroid
  ? null
  : /MiuiBrowser|XiaoMi|HuaweiBrowser|HeyTapBrowser|VivoBrowser|UCBrowser|Opera Mini|YaBrowser|DuckDuckGo|Silk\//i.test(userAgent)
    ? 'other'
    : /SamsungBrowser/i.test(userAgent)
      ? 'samsung'
      : /Firefox\//i.test(userAgent)
        ? 'firefox'
        : /Chrome\/\d+/.test(userAgent)
          ? 'chromium'
          : 'other'

const detectStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: window-controls-overlay)').matches ||
  window.navigator.standalone === true

isInstalled.value = detectStandalone()

/**
 * Whether we've waited long enough to conclude `beforeinstallprompt` isn't
 * coming. Chromium fires it once the manifest (and, on a first visit, the
 * service worker) is processed — normally within a second or two of `load`.
 * When it never fires on Android, the device or browser can't install from
 * the page: Android Go / no-Google-services phones, a Custom Tab opened from
 * another app (WhatsApp, Gmail…), or a recently dismissed prompt.
 */
const INSTALL_PROMPT_WAIT_MS = 4000
const installCheckDone = ref(!('serviceWorker' in navigator))

const startInstallCheckTimer = () =>
  setTimeout(() => (installCheckDone.value = true), INSTALL_PROMPT_WAIT_MS)

if (document.readyState === 'complete') startInstallCheckTimer()
else window.addEventListener('load', startInstallCheckTimer, { once: true })

// True when the prompt was shown and the user said no — Chrome then withholds
// it for a while, which is not the same as the device being incompatible.
const wasDismissed = ref(false)

/**
 * The PWA is installed, but this page is open in the browser rather than in
 * the app. Chrome Android answers this through the manifest's
 * `related_applications` webapp entry (see vite.config.js).
 */
const hasInstalledApp = ref(false)

if (!isInstalled.value && 'getInstalledRelatedApps' in navigator) {
  navigator
    .getInstalledRelatedApps()
    .then((apps) => (hasInstalledApp.value = apps.length > 0))
    .catch(() => {})
}

window.addEventListener('beforeinstallprompt', (e) => {
  // Chromium shows its own mini-infobar unless we take over the prompt.
  e.preventDefault()
  deferredPrompt.value = e
  installCheckDone.value = true
})

window.addEventListener('appinstalled', () => {
  deferredPrompt.value = null
  isInstalled.value = true
})

// Covers the case where the user installs via the browser's own menu while the
// page stays open, and launches into standalone from the new icon.
window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
  if (e.matches) isInstalled.value = true
})

export function usePwaInstall() {
  const canInstall = computed(() => !!deferredPrompt.value && !isInstalled.value)

  /**
   * Returns the user's choice: 'accepted', 'dismissed', or 'unavailable' when
   * no prompt was captured (non-Chromium browser, already installed, or the
   * engagement heuristics haven't fired yet).
   */
  const promptInstall = async () => {
    if (!deferredPrompt.value) return 'unavailable'

    const prompt = deferredPrompt.value
    prompt.prompt()
    const { outcome } = await prompt.userChoice

    // The event is single-use — it can't be re-prompted either way.
    deferredPrompt.value = null

    if (outcome === 'accepted') isInstalled.value = true
    else wasDismissed.value = true
    return outcome
  }

  return {
    canInstall,
    isInstalled,
    hasInstalledApp,
    installCheckDone,
    wasDismissed,
    promptInstall,
    isIOS,
    isAndroid,
    isDesktop,
    isInAppBrowser,
    androidBrowser,
  }
}
