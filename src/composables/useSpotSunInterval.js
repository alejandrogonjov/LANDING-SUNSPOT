import { computed } from 'vue'
import { deriveSunWindows, primaryWindowString, fallbackProfile } from '@/utils/solarHorizon'

/**
 * Live "primary" sun window for a spot, derived for *today* so it tracks the
 * season automatically (no stored `sun_interval` field required).
 *
 * Card-grade approximation: computes from the spot's stored `horizon_profile`
 * when present (zero network) and otherwise a flat Valencia fallback — it never
 * hits Overpass, so it's safe to call for every card in a list. The precise,
 * network-aware version lives in `SolarInterval.vue` on the detail page.
 *
 * @param {() => object | import('vue').Ref<object>} spotSource getter or ref for the spot
 * @returns {import('vue').ComputedRef<string>} reactive "HH:MM - HH:MM" ('' when unavailable)
 */
export function useSpotSunInterval(spotSource) {
  return computed(() => {
    const spot = typeof spotSource === 'function' ? spotSource() : spotSource?.value
    const loc = spot?.location
    if (!loc) return ''

    const profile = Array.isArray(spot.horizon_profile) && spot.horizon_profile.length === 360
      ? spot.horizon_profile
      : fallbackProfile()

    const windows = deriveSunWindows(profile, new Date(), loc.latitude, loc.longitude)
    return primaryWindowString(windows)
  })
}
