<template>
  <Back :title="title" />
  <slot />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Back from '@/components/ui/Back.vue'

const route = useRoute()
const title = computed(() => route.meta.title)
</script>