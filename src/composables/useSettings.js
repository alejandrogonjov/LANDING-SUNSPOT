import { ref, watch, onMounted } from 'vue'

const GEOLOCATION_KEY = 'sunspot_geolocation_enabled'

const getInitialGeolocation = () => {
  const saved = localStorage.getItem(GEOLOCATION_KEY)
  return saved !== null ? saved === 'true' : true
}

const geolocationEnabled = ref(getInitialGeolocation())
const browserPermissionState = ref('prompt') // 'granted', 'denied', 'prompt'

watch(geolocationEnabled, (val) => {
  localStorage.setItem(GEOLOCATION_KEY, val ? 'true' : 'false')
})

const updatePermissionState = async () => {
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' })
      browserPermissionState.value = result.state
      result.onchange = () => {
        browserPermissionState.value = result.state
      }
    } catch (e) {
      console.warn("Permissions API not fully supported for geolocation in this environment:", e)
    }
  }
}

export function useSettings() {
  onMounted(() => {
    updatePermissionState()
  })

  const toggleGeolocation = () => {
    geolocationEnabled.value = !geolocationEnabled.value
  }

  return {
    geolocationEnabled,
    browserPermissionState,
    updatePermissionState,
    toggleGeolocation
  }
}
