<template>
  <AltLayout>
    <div class="scan-page">
      <Transition name="fade">
        <div v-if="isSubmitting" class="scan-overlay">
          <icon-mdi-loading class="spin" />
          <p>Validando Spot...</p>
        </div>
      </Transition>

      <nav class="scan-nav">
        <button class="btn-back btn-glass back-btn" @click="$router.back()" aria-label="Volver">
          <icon-mdi-chevron-left />
        </button>
      </nav>

      <header class="scan-header">
        <h1>Escanear Punto</h1>
        <p>Apunta al código QR del tótem</p>
      </header>

      <div class="scanner-container" :class="{ 'is-hidden': isSubmitting }">
        <div id="reader" class="qr-reader"></div>
      </div>

      <div class="scan-footer"></div>
    </div>
  </AltLayout>
</template>

<script setup>
import AltLayout from '@/layouts/AltLayout.vue'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import { useRouter } from 'vue-router'
import { useUser } from '@/composables/useUser'

const router = useRouter()
const { scanSpot } = useUser()

const scanner = ref(null)
const isSubmitting = ref(false)

const onScanSuccess = async (decodedText) => {
  if (isSubmitting.value) return // Prevent race conditions

  if (!decodedText.includes('/spot/')) {
    console.warn("Not a SUNspot QR")
    return
  }

  isSubmitting.value = true

  // Haptic feedback (Android/Chrome)
  if (navigator.vibrate) navigator.vibrate(50)

  try {
    const spotId = decodedText.split('/spot/')[1]?.split(/[?#]/)[0]

    if (spotId) {
      // 1. Fire and wait for the spot visit logic
      await scanSpot(spotId)

      // 2. Stop camera hardware immediately
      await stopScanner()

      // 3. Navigate
      router.push({ name: 'spot', params: { id: spotId } })
    }
  } catch (err) {
    console.error("Scan error:", err)
    isSubmitting.value = false
    startScanner()
  }
}

const startScanner = async () => {
  if (scanner.value) await stopScanner()

  scanner.value = new Html5Qrcode("reader")

  const config = {
    fps: 20,
    qrbox: { width: 260, height: 260 },
    aspectRatio: 1.0
  }

  try {
    await scanner.value.start(
      { facingMode: "environment" },
      config,
      onScanSuccess
    )
  } catch (err) {
    console.error("Camera error:", err)
  }
}

const stopScanner = async () => {
  if (scanner.value?.isScanning) {
    try {
      await scanner.value.stop()
      scanner.value.clear()
    } catch (e) {
      console.warn("Stop error:", e)
    }
  }
}

onMounted(() => startScanner())
onBeforeUnmount(() => stopScanner())
</script>

<style scoped>
.scan-page {
  position: relative;
  min-height: 100dvh;
  /* Match the safe area top from your global style.css */
  padding-top: var(--safe-area-top);
  background: #0f172a;
  /* Deep dark blue for a modern look */
  color: var(--clr-on-brand);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding-bottom: calc(var(--safe-area-bottom) + 2rem);
  overflow: hidden;
}

/* NAVIGATION */
.scan-nav {
  width: 100%;
  padding: 1rem 1.5rem;
  z-index: 20;
  /* Keep it high until submitting */
}

/* Redundant back-btn styles removed - now using unified global styles */

/* HEADER */
.scan-header {
  text-align: center;
  padding: 0 2rem;
}

.scan-header h1 {
  font-size: 1.5rem;
  font-weight: 900;
  margin: 0;
}

.scan-header p {
  opacity: 0.6;
  font-size: 0.95rem;
  margin-top: 0.5rem;
}

/* SCANNER CONTAINER */
.scanner-container {
  width: 85%;
  max-width: 320px;
  aspect-ratio: 1 / 1;
  border-radius: 32px;
  overflow: hidden;
  position: relative;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: opacity 0.3s ease;
}

.scanner-container.is-hidden {
  opacity: 0;
  pointer-events: none;
}

/* DEEP SELECTORS FOR HTML5-QRCODE LIBRARY */
:deep(#reader) {
  border: none !important;
  background: black !important;
}

:deep(video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}

/* Hide the library's default UI (buttons, file inputs) */
:deep(#reader__dashboard),
:deep(#reader__status_span) {
  display: none !important;
}

/* OVERLAY (The "Validating" Screen) */
.scan-overlay {
  position: fixed;
  /* Changed to fixed to cover the whole viewport */
  inset: 0;
  background: var(--clr-background);
  z-index: 2005;
  /* Higher than Menu (2002) and Nav */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  color: var(--clr-primary);
}

.scan-overlay p {
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.9rem;
}

/* LOADING ANIMATION */
.spin {
  font-size: 3.5rem;
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

/* TRANSITIONS */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scan-footer {
  height: 40px;
}
</style>