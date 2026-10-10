/**
 * Whether a spot matches a free-text search: its name, its category label, or
 * one of its tags. Shared by the mobile search dropdown (SearchBar.vue) and the
 * desktop map panel (MapExplorerPanel.vue), so both find the same spots.
 *
 * @param {object} spot
 * @param {string} query raw user input; matching is case-insensitive and trimmed
 * @param {Function} t the `t` lookup from useTranslator()
 */
export function spotMatchesQuery(spot, query, t) {
  const q = (query || '').toLowerCase().trim()
  if (!q) return true

  const nameMatch = (spot.name || '').toLowerCase().includes(q)
  const categoryMatch = t('categories', spot.category).toLowerCase().includes(q)
  const tagsMatch = spot.tags?.some(tag => t('tags', tag).toLowerCase().includes(q))
  return nameMatch || categoryMatch || tagsMatch
}
