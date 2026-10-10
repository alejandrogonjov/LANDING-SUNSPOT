import { ref, readonly } from 'vue'

/**
 * Desktop breakpoint, shared by JS and CSS.
 *
 * At this width and above the app switches to its desktop composition: the
 * persistent sidebar (components/inc/DesktopSidebar.vue) replaces the bottom
 * nav and the menu drawer, bottom sheets render as centred dialogs, and the map
 * gets its side panel. Below it nothing changes — the mobile layout is the one
 * the app was designed for.
 *
 * ⚠️ CSS can't read this constant: `src/style.css` and the component styles
 * use the literal `@media (min-width: 1024px)`. Change one, change the others
 * (`grep -rn "min-width: 1024px" src`).
 */
export const DESKTOP_MIN_WIDTH = 1024
export const DESKTOP_QUERY = `(min-width: ${DESKTOP_MIN_WIDTH}px)`

// Module-level singleton: one MediaQueryList for the whole app, the same way
// the other composables keep their state (see AGENTS.md › Composables).
const mql = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia(DESKTOP_QUERY)
  : null

const isDesktop = ref(!!mql?.matches)

mql?.addEventListener('change', (e) => {
  isDesktop.value = e.matches
})

/**
 * Use this only when the *structure* differs between mobile and desktop (a
 * component rendered or not, a different container). Purely visual changes
 * belong in a CSS media query, which also avoids a frame of the wrong layout.
 */
export function useViewport() {
  return { isDesktop: readonly(isDesktop) }
}
