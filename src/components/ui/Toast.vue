<template>
  <Transition name="toast">
    <div v-if="show" class="toast-message">
      <icon-mdi-sparkles v-if="message.includes('Bienvenido')" />
      <icon-mdi-check-circle v-else />
      <span class="toast-text">{{ message }}</span>
      <router-link v-if="actionRoute" :to="actionRoute" class="toast-action">
        {{ actionText }}
      </router-link>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  show: Boolean,
  message: String,
  actionText: {
    type: String,
    default: ''
  },
  actionRoute: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.toast-message {
  position: fixed;
  width: max-content;
  max-width: 90vw;
  bottom: calc(var(--total-nav-height) + 1rem);
  left: 50%;
  transform: translateX(-50%);
  /* Inverted pill: both tokens flip with the theme, so it stays legible. */
  background: var(--clr-text);
  color: var(--clr-background);
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 700;
  z-index: 2000;
  box-shadow: var(--shadow-md);
}

.toast-text {
  line-height: 1.3;
}

.toast-action {
  margin-left: 8px;
  color: var(--clr-sunspot-200);
  text-decoration: underline;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}

.toast-action:hover {
  color: var(--clr-sunspot-100);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>