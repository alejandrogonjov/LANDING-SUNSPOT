<template>
  <div class="sheet-overlay" @click.self="$emit('close')">
    <div class="bottom-sheet" v-drag-close="() => $emit('close')">
      <div class="sheet-handle"></div>

      <button class="btn-close inner-close-btn" @click="$emit('close')">
        <icon-mdi-close />
      </button>

      <div class="sheet-content">
        <div class="weather-main">
          <div class="weather-info">
            <div class="weather-badge">
              <span>{{ weatherStatus.icon }}</span>
              <span>{{ weatherStatus.label }}</span>
            </div>
            <h2 class="greeting">{{ greeting }}</h2>
            <p class="status-msg">{{ statusMessage }}</p>
          </div>

          <div class="temp-display" v-if="currentTemp !== null">
            {{ Math.round(currentTemp) }}°
          </div>
        </div>

        <div class="forecast-grid" v-if="forecast.length">
          <div v-for="step in forecast" :key="step.time" class="forecast-card">
            <span class="f-time">{{ step.time }}</span>
            <span class="f-icon">{{ step.icon }}</span>
            <span class="f-temp">{{ Math.round(step.temp) }}°</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSettings } from '@/composables/useSettings'
import { useToast } from '@/composables/useToast'

const emit = defineEmits(['close'])

const { geolocationEnabled } = useSettings()
const { triggerLocationDeniedToast } = useToast()

const greeting = ref('¡Hola!')
const statusMessage = ref('Consultando el cielo...')
const currentTemp = ref(null)
const forecast = ref([])
const weatherStatus = ref({ label: 'Cargando', icon: '☁️', isSunny: true })

const isNight = computed(() => {
  const hour = new Date().getHours()
  return hour >= 20 || hour <= 6
})

const interpretWeather = (code) => {
  const night = isNight.value
  
  if (code <= 1) {
    return { 
      label: night ? 'Noche Despejada' : 'Despejado', 
      icon: night ? '🌙' : '☀️', 
      isSunny: true 
    }
  }
  if (code <= 3) {
    return { 
      label: 'Nubes y Claros', 
      icon: night ? '☁️🌙' : '⛅', 
      isSunny: true 
    }
  }
  if (code <= 48) return { label: 'Niebla', icon: '🌫️', isSunny: false }
  if (code <= 67) return { label: 'Lluvia', icon: '🌧️', isSunny: false }
  if (code <= 82) return { label: 'Chubascos', icon: '🌦️', isSunny: false }
  return { label: 'Tormenta', icon: '⛈️', isSunny: false }
}

const getCoordinates = () => {
  return new Promise((resolve) => {
    if (!geolocationEnabled.value || !navigator.geolocation) {
      resolve({ latitude: 39.47, longitude: -0.37, isFallback: true })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          isFallback: false
        })
      },
      (error) => {
        console.warn("Geolocation error/denied, using Valencia fallback:", error)
        if (error.code === error.PERMISSION_DENIED) {
          triggerLocationDeniedToast()
        }
        resolve({ latitude: 39.47, longitude: -0.37, isFallback: true })
      },
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 600000 }
    )
  })
}

const getCityName = async (latitude, longitude, isFallback) => {
  if (isFallback) return 'Valencia'
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=es`)
    if (res.ok) {
      const data = await res.json()
      const address = data.address || {}
      const city = address.city || address.town || address.village || address.municipality || address.suburb
      if (city) return city
    }
  } catch (err) {
    console.warn("Could not reverse geocode location name:", err)
  }
  return 'tu ubicación'
}

const fetchWeather = async () => {
  try {
    statusMessage.value = "Localizando..."
    const coords = await getCoordinates()
    
    statusMessage.value = "Consultando el cielo..."
    const locationName = await getCityName(coords.latitude, coords.longitude, coords.isFallback)

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true&hourly=temperature_2m,weathercode`
    const response = await fetch(url)
    const data = await response.json()
    const current = data.current_weather

    currentTemp.value = current.temperature
    weatherStatus.value = interpretWeather(current.weathercode)

    const hour = new Date().getHours()
    
    // Generic Messaging
    greeting.value = "¡Hola!"
    
    if (!weatherStatus.value.isSunny) {
      statusMessage.value = `Cielo cubierto actualmente en ${locationName}.`
    } else if (isNight.value) {
      statusMessage.value = `Noche despejada en ${locationName}.`
    } else {
      statusMessage.value = `El tiempo está despejado en ${locationName}.`
    }

    const nextHours = []
    for (let i = 0; i <= 4; i++) {
      const forecastHour = (hour + i) % 24
      const code = data.hourly.weathercode[hour + i]
      const isNightAtTarget = forecastHour >= 20 || forecastHour <= 6
      let icon = interpretWeather(code).icon
      
      if (isNightAtTarget && code <= 1) icon = '🌙'
      if (isNightAtTarget && code > 1 && code <= 3) icon = '☁️'

      nextHours.push({
        time: i === 0 ? 'Ahora' : `${forecastHour}:00`,
        temp: data.hourly.temperature_2m[hour + i],
        icon: icon
      })
    }
    forecast.value = nextHours
  } catch (e) {
    console.error("Error fetching weather:", e)
    statusMessage.value = "Error al consultar el tiempo."
  }
}

onMounted(() => fetchWeather())
</script>

<style scoped>
/* Inheriting sheet layout and scrim styles from global unified styles */
.bottom-sheet {
  padding-bottom: calc(var(--total-nav-height) + 1.5rem);
}

.inner-close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.weather-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-top: 1rem;
}

.weather-badge {
  background: var(--clr-primary-soft);
  color: var(--clr-primary);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 800;
  display: flex;
  gap: 8px;
  margin-bottom: 0.5rem;
}

.greeting {
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0;
}

.status-msg {
  color: var(--clr-text-muted);
  margin: 0.2rem 0 0;
  font-size: 0.95rem;
}

.temp-display {
  font-size: 3.5rem;
  font-weight: 900;
  color: var(--clr-primary);
}

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  background: var(--clr-background-alt);
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
}

.forecast-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.f-time {
  font-size: 0.7rem;
  color: var(--clr-text-muted);
  font-weight: 700;
}

.f-icon {
  font-size: 1.2rem;
}

.f-temp {
  font-weight: 800;
  font-size: 0.9rem;
}
</style>