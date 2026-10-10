/**
 * Fitzpatrick skin types I–VI.
 *
 * `medConstant` = minutes to reach the minimal erythema dose at UV Index 1,
 * derived from clinical midpoint MED values (in SED): I≈2.0, II≈2.8, III≈3.5,
 * IV≈5.0, V≈7.0, VI≈10.0 — i.e. medConstant = MED(SED) × 60. Burn time at a
 * given UVI = medConstant / UVI.
 *
 * Shared by the exposure wheel (which calculates with it) and the onboarding
 * questionnaire (which captures the phototype and shows these swatches), so the
 * two can never drift apart.
 */
export const skinTones = [
  { id: 1, color: '#f9ebe0', label: 'Muy clara', medConstant: 120 },  // Fitzpatrick I  — MED ≈ 2.0 SED
  { id: 2, color: '#f3d9c1', label: 'Clara', medConstant: 168 },  // Fitzpatrick II — MED ≈ 2.8 SED
  { id: 3, color: '#ebb385', label: 'Media', medConstant: 210 },  // Fitzpatrick III— MED ≈ 3.5 SED
  { id: 4, color: '#ba8c59', label: 'Morena', medConstant: 300 },  // Fitzpatrick IV — MED ≈ 5.0 SED
  { id: 5, color: '#94613c', label: 'Oscura', medConstant: 420 },  // Fitzpatrick V  — MED ≈ 7.0 SED
  { id: 6, color: '#53352d', label: 'Muy oscura', medConstant: 600 },  // Fitzpatrick VI — MED ≈ 10.0 SED
]
