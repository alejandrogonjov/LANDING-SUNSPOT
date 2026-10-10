<template>
  <div class="avatar-wrapper" @click="handleAvatarClick">
    <img v-if="isLoggedIn && userData?.avatar" :src="`/avatars/avatar (${userData.avatar}).png`" class="avatar-img"
      :alt="userData.name" />

    <icon-mdi-account-circle v-else class="avatar-icon" />

    <Teleport to="body">
      <Transition name="slide-up">
        <UserMenuSheet v-if="isUserMenuOpen" @close="isUserMenuOpen = false" />
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUser } from '@/composables/useUser'
import UserMenuSheet from './UserMenuSheet.vue'

const router = useRouter()
const { userData, isLoggedIn } = useUser()

const isUserMenuOpen = ref(false)

const handleAvatarClick = () => {
  if (isLoggedIn.value) {
    isUserMenuOpen.value = true
  } else {
    router.push('/registro')
  }
}
</script>

<style scoped>
.avatar-wrapper {
  width: 44px;
  height: 44px;
  position: relative;
  background: var(--clr-glass-strong);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 50%;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  /* Fixed position */
  border: 1px solid var(--clr-border);
  flex-shrink: 0;
  cursor: pointer;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-icon {
  font-size: 2rem;
  color: var(--clr-grey);
}

</style>