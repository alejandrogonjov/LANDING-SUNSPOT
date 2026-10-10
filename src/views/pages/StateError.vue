<template>
  <DefaultLayout>
    <div class="error-state">
      <div class="error-card">
        <icon-mdi-map-marker-off class="error-icon" />
        <h2>{{ title }}</h2>
        <p>{{ message }}</p>

        <RouterLink to="/" class="btn-home">
          {{ buttonText }}
        </RouterLink>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import DefaultLayout from '@/layouts/DefaultLayout.vue'

defineProps({
  title: { type: String, default: '¿Te has perdido?' },
  message: { type: String, default: 'No encontramos lo que buscas.' },
  buttonText: { type: String, default: 'Volver al inicio' }
})
</script>

<style scoped>
.error-state {
  height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.error-card {
  text-align: center;
  max-width: 320px;
}

.error-icon {
  font-size: 4rem;
  color: var(--clr-grey);
  margin-bottom: 1.5rem;
  margin: auto;
}

.btn-home {
  display: inline-block;
  margin-top: 2rem;
  padding: 1rem 2rem;
  background: var(--clr-text);
  color: var(--clr-white);
  border-radius: var(--radius-lg);
  text-decoration: none;
  font-weight: 700;
  box-shadow: var(--shadow-md);
}
</style>