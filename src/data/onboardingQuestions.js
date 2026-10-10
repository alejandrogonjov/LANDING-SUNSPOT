/**
 * Onboarding questionnaire ("Cuestionario de Onboarding").
 *
 * Asked once, right after the user's first login. Feeds spot recommendations
 * and preloads the phototype used by the exposure wheel.
 *
 * Question types:
 *  - `ranking`: the user orders options from most to least, picking as many or
 *    as few as they like — one is enough to continue. Options flagged
 *    `isOther` open a free-text field when picked, so unforeseen categories
 *    surface for future updates; that text is required while the option stays
 *    selected, since a bare `other` says nothing.
 *  - `single`: one choice.
 */
import IconUmbrellaBeach from '~icons/mdi/umbrella-beach'
import IconTree from '~icons/mdi/tree'
import IconEarOff from '~icons/tabler/ear-off'
import IconWind from '~icons/tabler/wind'
import IconAccount from '~icons/mdi/account'
import IconHeart from '~icons/mdi/heart'
import IconAccountGroup from '~icons/mdi/account-group'
import IconHumanMaleFemaleChild from '~icons/mdi/human-male-female-child'
import IconFlower from '~icons/mdi/flower'
import IconWhiteBalanceSunny from '~icons/mdi/white-balance-sunny'
import IconLeafMaple from '~icons/mdi/leaf-maple'
import IconSnowflake from '~icons/mdi/snowflake'
import IconPlusCircleOutline from '~icons/mdi/plus-circle-outline'
import { useTranslator } from '@/composables/useTranslator'
import { skinTones } from '@/data/skinTones'

// Categories reuse the icons and colours the rest of the app already paints
// them with, so a spot card and this questionnaire never disagree.
const { getCategoryIcon, getCategoryColor } = useTranslator()

const category = (value, label) => ({
  value,
  label,
  icon: getCategoryIcon(value),
  color: getCategoryColor(value),
})

const OTHER_OPTION = {
  value: 'other',
  label: 'Otra',
  icon: IconPlusCircleOutline,
  color: 'var(--clr-grey)',
  isOther: true,
  placeholder: 'Escribe la tuya',
}

export const onboardingQuestions = [
  {
    id: 'spot_category',
    recapLabel: 'Tu plan favorito',
    title: '¿Cómo te gusta aprovechar el sol?',
    sub: 'Elige las opciones que te representen, empezando por la que más. Basta con una.',
    type: 'ranking',
    options: [
      category('sport', 'Deporte'),
      category('culture', 'Cultura'),
      category('hostelry', 'Hostelería'),
      category('nature', 'Naturaleza'),
      OTHER_OPTION,
    ],
  },
  {
    id: 'companions',
    recapLabel: 'Sueles ir',
    title: '¿Con quién sueles compartir esos planes?',
    sub: 'Elige las opciones más habituales, empezando por la que más se repite. Basta con una.',
    type: 'ranking',
    options: [
      { label: 'Solo / momento personal', value: 'solo', icon: IconAccount, color: 'var(--clr-sunspot-500)' },
      { label: 'Pareja', value: 'couple', icon: IconHeart, color: 'var(--clr-sunspot-700)' },
      { label: 'Amigos', value: 'friends', icon: IconAccountGroup, color: 'var(--clr-sunspot-400)' },
      { label: 'Familia', value: 'family', icon: IconHumanMaleFemaleChild, color: 'var(--cat-nature)' },
    ],
  },
  {
    id: 'spot_features',
    recapLabel: 'Buscas sobre todo',
    title: '¿Qué buscas más en un spot?',
    sub: 'Elige lo que valoras en un lugar, empezando por lo más importante. Basta con una.',
    type: 'ranking',
    options: [
      { label: 'Sombra natural', value: 'natural_shadow', icon: IconTree, color: 'var(--clr-natural-shadow)' },
      { label: 'Sombra artificial', value: 'shadow', icon: IconUmbrellaBeach, color: 'var(--clr-shadow)' },
      { label: 'Brisa', value: 'wind', icon: IconWind, color: 'var(--clr-windy)' },
      { label: 'Calma acústica', value: 'quiet', icon: IconEarOff, color: 'var(--clr-quiet)' },
      OTHER_OPTION,
    ],
  },
  {
    id: 'season',
    recapLabel: 'Tu estación',
    // Separates users who treat sun as abundant (summer) from those who chase
    // it as a scarce resource (winter) — drives notification tone and cadence.
    title: '¿En qué época del año más valoras o disfrutas el sol?',
    sub: 'Elige las estaciones que más aprovechas, empezando por tu favorita. Basta con una.',
    type: 'ranking',
    options: [
      { label: 'Primavera', value: 'spring', icon: IconFlower, color: 'var(--cat-nature)' },
      { label: 'Verano', value: 'summer', icon: IconWhiteBalanceSunny, color: 'var(--clr-sunspot-400)' },
      { label: 'Otoño', value: 'autumn', icon: IconLeafMaple, color: 'var(--clr-sunspot-700)' },
      { label: 'Invierno', value: 'winter', icon: IconSnowflake, color: 'var(--clr-windy)' },
    ],
  },
  {
    id: 'sun_sensitivity',
    recapLabel: 'Tu piel',
    // Values are Fitzpatrick phototypes I–VI, matching the `skinTones` ids in
    // UVIntensityWheel.vue so the answer preloads the exposure calculation.
    title: '¿Cómo reacciona tu piel bajo el sol?',
    sub: 'Elige la opción que más se ajuste a ti.',
    type: 'single',
    options: [
      'Se enrojece muy rápido, casi nunca se broncea',
      'Se enrojece con facilidad, luego broncea un poco',
      'A veces se enrojece, broncea gradualmente',
      'Rara vez se enrojece, broncea con facilidad',
      'Casi nunca se enrojece, se broncea profundamente',
      'Nunca se quema, piel muy oscura',
    ].map((label, i) => ({
      label,
      value: skinTones[i].id,
      hint: skinTones[i].label,
      swatch: skinTones[i].color,
    })),
  },
]
