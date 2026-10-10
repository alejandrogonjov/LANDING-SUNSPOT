import SunCalc from 'suncalc'

/**
 * Estimated clear-sky UV index for a moment and place. Network-free, so the
 * exposure wheel keeps working offline.
 *
 * Shape: the analytic clear-sky formula (Madronich, 2007) —
 *   UVI ≈ A · cos(solar zenith)^p · (ozone / 300)^-1.23
 * with the sun's height from SunCalc, so the value follows both the hour and
 * the season (and the CET/CEST switch) instead of a fixed curve.
 *
 * `A`, `p` and the seasonal ozone term are fitted against one year of hourly
 * clear-sky UV for Valencia (CAMS via Open-Meteo, Oct 2025 – Oct 2026): RMSE
 * ≈ 0.35, monthly midday values within ~0.5. The seasonal term is a fit, so it
 * also absorbs aerosols — don't read it as a measured ozone column. Valid for
 * the app's coverage area; refit before reusing it at another latitude.
 *
 * It is a *clear-sky* figure: clouds are not accounted for, so on an overcast
 * day it reads higher than a weather app's forecast.
 */
export function clearSkyUV(date, lat, lng) {
  const altitude = SunCalc.getPosition(date, lat, lng).altitude
  if (altitude <= 0) return 0 // sun below the horizon

  const ozone = 310 + 30 * Math.cos((2 * Math.PI * (dayOfYear(date) - 130)) / 365)
  return 10.9 * Math.pow(Math.sin(altitude), 2.5) * Math.pow(ozone / 300, -1.23)
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date - start) / 86400000)
}
