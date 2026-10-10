<template>
  <div class="back-wrapper">
    <button @click="goBack" class="btn-back" aria-label="Go back">
      <icon-mdi-chevron-left />
    </button>
    <h1 v-if="title">{{ title }}</h1>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

defineProps({
  title: {
    type: String,
    default: ''
  }
})

const router = useRouter()

const goBack = () => {
  const previousPath = window.history.state?.back
  const authPaths = ['/registro', '/register', '/login', '/cuenta']

  if (previousPath && authPaths.includes(previousPath)) {
    router.push('/')
  } else if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.back-wrapper {
  display: flex;
  align-items: center;
  column-gap: 1rem;
  padding: 1rem;
}

h1 {
  font-size: 1.25rem;
  margin: 0;
}

/* Desktop: a page header rather than a compact app bar. */
@media (min-width: 1024px) {
  .back-wrapper {
    padding: 1.5rem 1.5rem 1rem;
  }

  h1 {
    font-size: 1.6rem;
  }
}
</style>
