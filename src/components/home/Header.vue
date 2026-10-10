<template>
  <header class="floating-header">
    <button class="icon-btn" @click="emit('toggleMenu')">
      <icon-mdi-menu height="1em" width="1em" />
    </button>

    <SearchBar :spots="spots" @select-spot="(spot) => emit('select-spot', spot)" />

    <UserAvatar />
  </header>
</template>

<script setup>
import SearchBar from './SearchBar.vue'
import UserAvatar from './UserAvatar.vue'

defineProps({
  spots: { type: Array, required: true }
})
const emit = defineEmits(['toggleMenu', 'select-spot'])
</script>

<style scoped>
.floating-header {
  position: absolute;
  top: 1rem;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem; 
  padding: 0 1rem; 
  pointer-events: none;
  box-sizing: border-box;
}

.floating-header>* {
  pointer-events: auto;
}

.icon-btn {
  background: var(--clr-glass-strong);
  backdrop-filter: blur(8px);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--clr-border);
  font-size: 1.5rem;
  color: var(--clr-text);
  flex-shrink: 0;
}

.icon-btn svg {
  display: block;
  width: 1.5rem;
  height: 1.5rem;
}
</style>