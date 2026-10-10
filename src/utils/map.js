/**
 * Shared map configuration + view persistence for the two map screens
 * (components/home/Map.vue and views/pages/PersonalMap.vue).
 */

/**
 * Jawg vector style URL.
 *
 * ⚠️ index.html preloads this exact URL so the style fetch starts during HTML
 * parse instead of waiting for the bundle to download, parse and mount. The
 * two copies must stay byte-identical — query string included — or the browser
 * won't match the preload and the fetch happens twice.
 *
 * The token comes from `VITE_JAWG_MAPS_TOKEN`; index.html reads the same
 * variable through Vite's `%VITE_JAWG_MAPS_TOKEN%` substitution.
 */
export const MAP_STYLE_URL = `https://api.jawg.io/styles/jawg-terrain.json?access-token=${import.meta.env.VITE_JAWG_MAPS_TOKEN}`

/** Valencia city centre — the view used until we know anything better. */
export const DEFAULT_VIEW = { lat: 39.4699, lng: -0.3763, zoom: 15 }

const LAST_VIEW_KEY = 'sunspot_last_view'
const LEGACY_COORDS_KEY = 'sunspot_last_location' // pre-zoom [lat, lng] array

/**
 * The view the map should open on. Opening on the last known view means the
 * first tile set we fetch is usually the one we end up keeping, instead of
 * fetching a default view and then a second set once GPS reports in.
 */
export function loadLastView() {
  try {
    const saved = localStorage.getItem(LAST_VIEW_KEY)
    if (saved) {
      const { lat, lng, zoom } = JSON.parse(saved)
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng, zoom: Number.isFinite(zoom) ? zoom : DEFAULT_VIEW.zoom }
      }
    }

    // Fall back to the old key so existing installs don't lose their position.
    const legacy = localStorage.getItem(LEGACY_COORDS_KEY)
    if (legacy) {
      const [lat, lng] = JSON.parse(legacy)
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng, zoom: DEFAULT_VIEW.zoom }
      }
    }
  } catch {
    // Corrupt/unavailable storage — the default view is a fine answer.
  }

  return { ...DEFAULT_VIEW }
}

export function saveLastView(lat, lng, zoom) {
  try {
    localStorage.setItem(LAST_VIEW_KEY, JSON.stringify({ lat, lng, zoom }))
  } catch {
    // Storage full or blocked (private mode) — not worth surfacing.
  }
}
