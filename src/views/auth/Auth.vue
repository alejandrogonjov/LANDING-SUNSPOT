<template>
  <DefaultLayout>
    <template #header-title>
      {{ isLogin ? 'Entrar' : 'Registro' }}
    </template>

    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <img src="/logo.svg" alt="SUNspot" width="80" height="64" />
        </div>

        <Transition name="form-fade" mode="out-in">
          <div v-if="loading" class="auth-loading-overlay" key="loading">
            <div class="sun-loader"></div>
            <p>{{ isLogin ? 'Iniciando sesión...' : 'Preparando tu cuenta...' }}</p>
          </div>

          <div v-else :key="isLogin">
            <form @submit.prevent="handleSubmit" class="auth-form" novalidate>
              <div class="input-group">
                <input
                  v-model="email"
                  type="email"
                  placeholder="Tu email"
                  required
                  :class="{ 'input-error': emailError }"
                  @input="emailError = ''"
                />
                <Transition name="error-fade">
                  <span v-if="emailError" class="field-error">{{ emailError }}</span>
                </Transition>
              </div>

              <div class="input-group">
                <input
                  v-model="password"
                  type="password"
                  placeholder="Contraseña"
                  required
                  :class="{ 'input-error': passwordError }"
                  @input="passwordError = ''"
                />
                <Transition name="error-fade">
                  <span v-if="passwordError" class="field-error">{{ passwordError }}</span>
                </Transition>
              </div>

              <button type="submit" :class="isLogin ? 'btn-secondary' : 'btn-primary'" style="width: 100%;">
                {{ isLogin ? 'Iniciar Sesión' : 'Crear Cuenta' }}
              </button>
            </form>

            <div class="divider">
              <span>o</span>
            </div>

            <button @click="handleGoogleLogin" class="btn-google" type="button">
              <icon-logos-google-icon />
              <span>{{ isLogin ? 'Entrar con Google' : 'Registrarse con Google' }}</span>
            </button>

            <p class="auth-toggle">
              {{ isLogin ? '¿No tienes cuenta?' : '¿Ya eres miembro?' }}
              <button @click="isLogin = !isLogin" class="toggle-link" type="button">
                {{ isLogin ? 'Regístrate' : 'Inicia Sesión' }}
              </button>
            </p>
          </div>
        </Transition>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { auth, db } from '@/firebase'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { useRouter, useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const { triggerToast } = useToast()
const email = ref('')
const password = ref('')
const isLogin = ref(true)
const loading = ref(false)
const emailError = ref('')
const passwordError = ref('')

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Generic credential message used for every "account exists / password wrong"
// outcome so the form never reveals whether an email is registered
// (account-enumeration protection). Pair with Firebase's Email Enumeration
// Protection setting, which collapses these into auth/invalid-credential.
const INVALID_CREDENTIALS_MSG = 'Email o contraseña incorrectos.'

const FIREBASE_ERROR_MAP = {
  'auth/invalid-email': 'El formato del email no es válido.',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
  'auth/user-not-found': INVALID_CREDENTIALS_MSG,
  'auth/wrong-password': INVALID_CREDENTIALS_MSG,
  'auth/invalid-credential': INVALID_CREDENTIALS_MSG,
  'auth/email-already-in-use': INVALID_CREDENTIALS_MSG,
  'auth/weak-password': 'La contraseña es demasiado débil (mínimo 6 caracteres).',
  'auth/too-many-requests': 'Demasiados intentos. Inténtalo más tarde.',
  'auth/network-request-failed': 'Error de conexión. Comprueba tu Internet.',
  'auth/popup-closed-by-user': 'Se cerró la ventana de Google.',
  'auth/cancelled-popup-request': 'Se canceló el inicio de sesión con Google.',
  'auth/operation-not-allowed': 'Este método de acceso no está habilitado.',
}

const getFirebaseErrorMessage = (error) => {
  return FIREBASE_ERROR_MAP[error.code] || 'Ha ocurrido un error. Inténtalo de nuevo.'
}

const validateForm = () => {
  let valid = true
  emailError.value = ''
  passwordError.value = ''

  const trimmedEmail = email.value.trim()
  if (!trimmedEmail) {
    emailError.value = 'El email es obligatorio.'
    valid = false
  } else if (!EMAIL_REGEX.test(trimmedEmail)) {
    emailError.value = 'Introduce un email válido.'
    valid = false
  }

  if (!password.value) {
    passwordError.value = 'La contraseña es obligatoria.'
    valid = false
  } else if (password.value.length < 6) {
    passwordError.value = 'La contraseña debe tener al menos 6 caracteres.'
    valid = false
  }

  return valid
}

const syncUserToDb = async (user) => {
  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: user.displayName || 'Sunspotter',
      email: user.email,
      avatar: null,
      bookmarks: [],
      profile: {
        type: 'Sunspotter',
        answers: {}
      },
      visited_spots: {},
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    })
  } else {
    await setDoc(userRef, {
      updated_at: serverTimestamp()
    }, { merge: true })
  }
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  try {
    const isNewUser = !isLogin.value
    const trimmedEmail = email.value.trim()
    let userCredential

    if (isLogin.value) {
      userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password.value)
    } else {
      userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password.value)
    }

    await syncUserToDb(userCredential.user)

    router.push({
      path: '/',
      query: { action: isNewUser ? 'signed-up' : 'logged-in' }
    })
  } catch (error) {
    loading.value = false
    const msg = getFirebaseErrorMessage(error)

    // Only route errors that are inherently non-sensitive (format / strength) to
    // a specific field. Credential-mismatch and account-existence outcomes go to
    // a neutral toast with a generic message, so the UI never signals whether an
    // account exists for a given email (account-enumeration protection).
    if (error.code === 'auth/invalid-email') {
      emailError.value = msg
    } else if (error.code === 'auth/weak-password') {
      passwordError.value = msg
    } else {
      triggerToast(msg)
    }
  }
}

const handleGoogleLogin = async () => {
  const provider = new GoogleAuthProvider()
  try {
    const result = await signInWithPopup(auth, provider)
    loading.value = true

    const isNew = result._tokenResponse?.isNewUser

    await syncUserToDb(result.user)

    router.push({
      path: '/',
      query: { action: isNew ? 'signed-up' : 'logged-in' }
    })
  } catch (error) {
    loading.value = false
    const msg = getFirebaseErrorMessage(error)
    // Don't toast if user simply closed the popup
    if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
      triggerToast(msg)
    }
  }
}

onMounted(() => {
  if (route.path === '/register') {
    isLogin.value = false
  }
})
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  padding: 1.5rem;
  font-weight: 600;
  min-height: 60vh;
}

.auth-container {
  width: 100%;
  max-width: 400px;
}

.auth-header {
  margin-bottom: 2rem;
  text-align: center;
}

.auth-header img {
  margin: auto;
}

/* Loading Overlay Styles */
.auth-loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
  gap: 1.5rem;
}

.sun-loader {
  width: 48px;
  height: 48px;
  border: 4px solid var(--clr-border);
  border-top: 4px solid var(--clr-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0;
}

input {
  padding: 0.9rem;
  border-radius: 12px;
  border: 1px solid var(--clr-border);
  background: var(--clr-input-bg);
  color: var(--clr-text);
  font-family: inherit;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input:focus {
  outline: none;
  border-color: var(--clr-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--clr-primary), transparent 85%);
}

input.input-error {
  border-color: var(--clr-danger);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--clr-danger), transparent 88%);
}

.field-error {
  font-size: 0.78rem;
  color: var(--clr-danger);
  padding: 4px 4px 0;
  font-weight: 500;
}

.error-fade-enter-active,
.error-fade-leave-active {
  transition: all 0.2s ease;
}

.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}



.divider {
  text-align: center;
  margin: 1.5rem 0;
  position: relative;
}

.divider::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  background: var(--clr-border);
  z-index: 1;
}

.divider span {
  background: var(--clr-background);
  padding: 0 1rem;
  position: relative;
  z-index: 2;
  color: var(--clr-text-muted);
}



.auth-toggle {
  text-align: center;
  margin-top: 2rem;
  font-size: 0.9rem;
  color: var(--clr-text-muted);
}

.toggle-link {
  color: var(--clr-primary);
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-weight: 800;
  cursor: pointer;
  margin-left: 4px;
}

.btn-google {
  width: 100%;
}

/* Transitions */
.form-fade-enter-active,
.form-fade-leave-active {
  transition: all 0.3s ease;
}

.form-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.form-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>