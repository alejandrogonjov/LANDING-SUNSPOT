<template>
  <Transition name="fade-out">
    <div v-if="show" class="app-loader">
      <div class="loader-content">
        <img src="/sunspot.svg" alt="SUNspot" class="elegant-pulse" width="120" />

        <div class="loader-track">
          <div class="loader-bar"></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  show: Boolean
})
</script>

<style scoped>
.app-loader {
  position: fixed;
  inset: 0;
  background: var(--clr-background);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.elegant-pulse {
  animation: soft-pulse 2.5s ease-in-out infinite;
}

.loader-track {
  width: 120px;
  height: 2px;
  background: var(--clr-border);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.loader-bar {
  position: absolute;
  left: 0;
  width: 40%;
  height: 100%;
  background: var(--clr-primary);
  border-radius: 2px;
  animation: slide 1.5s infinite ease-in-out;
  will-change: transform;
}

@keyframes soft-pulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 0.9;
  }

  50% {
    transform: scale(1.05);
    opacity: 1;
  }
}

@keyframes slide {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(250%);
  }
}

/* Smooth exit transition */
.fade-out-leave-active {
  transition: opacity 0.6s ease;
}

.fade-out-leave-to {
  opacity: 0;
}
</style>