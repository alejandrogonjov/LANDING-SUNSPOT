import { computed, ref } from 'vue'

/**
 * App theme (light / dark).
 *
 * Three states, two of them stored:
 *   'light' | 'dark' — an explicit choice the user made in /ajustes
 *   null            — nothing stored: follow the operating system
 *
 * The system default is the point of the feature. Android's browser-level dark
 * mode used to force-invert SUNspot into muddy browns because the app declared
 * no scheme of its own; now a phone in dark mode gets the real dark theme
 * without anyone having to find this setting.
 *
 * ⚠️ The storage key and the resolution rule are duplicated in the bootstrap
 * script in `index.html`, which runs before the bundle so the first paint is
 * already the right colour. Change one, change the other.
 */

const THEME_KEY = 'sunspot_theme'
const THEME_COLORS = { light: '#fffcf2', dark: '#17150f' }

const isTheme = (value) => value === 'light' || value === 'dark'

const readStored = () => {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    return isTheme(stored) ? stored : null
  } catch {
    // Storage blocked (private mode) — treat it as "no preference".
    return null
  }
}

const systemQuery = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null

/** The user's explicit choice, or null while they're following the system. */
const preference = ref(readStored())
/** What the system currently asks for. Kept live so "follow system" is live. */
const systemTheme = ref(systemQuery?.matches ? 'dark' : 'light')

/** The theme actually painted right now. */
const theme = computed(() => preference.value ?? systemTheme.value)
const isDark = computed(() => theme.value === 'dark')
const followsSystem = computed(() => preference.value === null)

const apply = () => {
  const value = theme.value
  document.documentElement.setAttribute('data-theme', value)
  // The Android/Chrome browser chrome reads this, not our CSS — without it the
  // address bar stays cream while the app underneath is dark.
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[value])
}

// A system flip only repaints while the user is following the system; once they
// have chosen, their choice outranks it (but is still remembered here, so
// clearing the choice snaps straight to whatever the system says now).
systemQuery?.addEventListener('change', (event) => {
  systemTheme.value = event.matches ? 'dark' : 'light'
  apply()
})

/** Records an explicit choice. */
const setTheme = (value) => {
  if (!isTheme(value)) return
  preference.value = value
  try {
    localStorage.setItem(THEME_KEY, value)
  } catch {
    // Not persisting is survivable; the session still honours the choice.
  }
  apply()
}

const toggleTheme = () => setTheme(isDark.value ? 'light' : 'dark')

/** Drops the explicit choice and goes back to following the system. */
const useSystemTheme = () => {
  preference.value = null
  try {
    localStorage.removeItem(THEME_KEY)
  } catch {
    // Nothing stored is exactly the state we want anyway.
  }
  apply()
}

// The bootstrap in index.html already set the attribute for this same state, so
// this is a no-op on a cold load. It matters when storage was unreadable there
// but readable here, and it keeps the meta colour honest either way.
if (typeof document !== 'undefined') apply()

export function useTheme() {
  return { theme, isDark, followsSystem, setTheme, toggleTheme, useSystemTheme }
}
