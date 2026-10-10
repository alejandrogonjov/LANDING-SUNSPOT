import IconDumbbell from '~icons/mdi/dumbbell'
import IconLeaf from '~icons/mdi/leaf'
import IconPalette from '~icons/mdi/palette'
import IconCoffee from '~icons/mdi/coffee'
import IconCurrencyEurOff from '~icons/mdi/currency-eur-off'
import IconDoorOpen from '~icons/bxs/door-open'

export function useTranslator() {
  const dictionary = {
    categories: {
      sport: 'Deporte',
      nature: 'Naturaleza',
      culture: 'Cultura',
      hostelry: 'Hostelería',
    },
    ui: {
      category: "Categoría",
      free: 'Libre',
      paid: 'Establecimiento',
      sunrise: 'Sunrise',
      sunset: 'Sunset',
      explore: 'Explorar este spot',
      results: 'Ver Resultados',
      clear: 'Limpiar',
      filters: 'Filtros',
      access: 'Acceso',
      moment: 'Momento del día',
      shadow: 'Sombra',
      natural_shadow: 'Sombra Natural',
      quiet: 'Calma acústica',
      wind: 'Brisa'
    },
    solar: {
      computing: 'Calculando sombras…',
    },
  }

  const t = (groupOrPath, key) => {
    let targetGroup = groupOrPath
    let targetKey = key

    if (groupOrPath.includes('.')) {
      const parts = groupOrPath.split('.')
      targetGroup = parts[0]
      targetKey = parts[1]
    }

    // Fallback logic: return dictionary value, or the key itself if missing
    return dictionary[targetGroup]?.[targetKey] ?? targetKey ?? ''
  }

  const getCategoryColor = (category) => {
    const key = category?.toLowerCase().trim()
    const colors = {
      sport: 'var(--cat-sport)',
      nature: 'var(--cat-nature)',
      culture: 'var(--cat-culture)',
      hostelry: 'var(--cat-hostelry)',
    }
    return colors[key] || 'var(--cat-default)'
  }

  const getCategoryIcon = (category) => {
    const key = category?.toLowerCase().trim()
    const icons = {
      sport: IconDumbbell,
      nature: IconLeaf,
      culture: IconPalette,
      hostelry: IconCoffee,
    }
    return icons[key] || IconDumbbell // Fallback icon
  }

  const getCategoryLabel = (category) => t('categories.' + (category?.toLowerCase().trim() || ''))

  const getAccessIcon = (isFree) => {
    return isFree ? IconCurrencyEurOff : IconDoorOpen
  }

  return {
    t,
    categoryKeys: Object.keys(dictionary.categories),
    getCategoryColor,
    getCategoryIcon,
    getCategoryLabel,
    getAccessIcon
  }
}