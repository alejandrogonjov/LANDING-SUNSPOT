import { ref } from 'vue'

const show = ref(false)
const message = ref('')
const actionText = ref('')
const actionRoute = ref('')
let timer = null
let hasShownDeniedToast = false

export function useToast() {
  const triggerToast = (msg, actText = '', actRoute = '') => {
    if (timer) clearTimeout(timer)
    message.value = msg
    actionText.value = actText
    actionRoute.value = actRoute
    show.value = true

    timer = setTimeout(() => {
      show.value = false
    }, 4500)
  }

  const triggerLocationDeniedToast = () => {
    if (hasShownDeniedToast) return
    hasShownDeniedToast = true
    triggerToast(
      'Acceso a la ubicación denegado. Puedes cambiar esto en Ajustes.',
      'Ajustes',
      '/ajustes'
    )
  }

  return {
    show,
    message,
    actionText,
    actionRoute,
    triggerToast,
    triggerLocationDeniedToast
  }
}
