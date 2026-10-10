import { ref, watch } from 'vue'

const STORAGE_KEY = 'sunspot_personal_spots'

function readFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeToStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const spots = ref(readFromStorage())

watch(spots, (val) => writeToStorage(val), { deep: true })

export function usePersonalSpots() {
  function addSpot(payload) {
    const now = Date.now()
    const newSpot = {
      id: crypto.randomUUID(),
      name: (payload.name || '').trim(),
      description: (payload.description || '').trim(),
      address: (payload.address || '').trim(),
      category: payload.category || '',
      lat: payload.lat ?? null,
      lng: payload.lng ?? null,
      is_free: !!payload.is_free,
      is_sunrise: !!payload.is_sunrise,
      is_sunset: !!payload.is_sunset,
      has_shadow: !!payload.has_shadow,
      has_natural_shadow: !!payload.has_natural_shadow,
      spot_id: payload.spot_id || '',
      created_at: now,
      updated_at: now
    }
    spots.value = [newSpot, ...spots.value]
    return newSpot
  }

  function updateSpot(id, payload) {
    const idx = spots.value.findIndex(s => s.id === id)
    if (idx === -1) return false
    spots.value[idx] = {
      ...spots.value[idx],
      name: (payload.name || '').trim(),
      description: (payload.description || '').trim(),
      address: (payload.address || '').trim(),
      category: payload.category ?? spots.value[idx].category,
      ...(payload.lat !== undefined && { lat: payload.lat }),
      ...(payload.lng !== undefined && { lng: payload.lng }),
      is_free: payload.is_free ?? spots.value[idx].is_free,
      is_sunrise: payload.is_sunrise ?? spots.value[idx].is_sunrise,
      is_sunset: payload.is_sunset ?? spots.value[idx].is_sunset,
      has_shadow: payload.has_shadow ?? spots.value[idx].has_shadow,
      has_natural_shadow: payload.has_natural_shadow ?? spots.value[idx].has_natural_shadow,
      spot_id: payload.spot_id ?? spots.value[idx].spot_id,
      updated_at: Date.now()
    }
    spots.value = [...spots.value]
    return true
  }

  function removeSpot(id) {
    spots.value = spots.value.filter(s => s.id !== id)
  }

  return { spots, addSpot, updateSpot, removeSpot }
}
