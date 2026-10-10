import SunCalc from 'suncalc'

const DEG = 180 / Math.PI
const M_PER_DEG_LAT = 111320

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Fetch building footprints within `radius` m. Returns elements[] or null on total failure.
 *
 * Overpass rate-limits bursts with HTTP 429. Rather than fall straight through to
 * the fallback profile (which silently degrades accuracy), we retry the same
 * endpoint with exponential backoff — honouring a `Retry-After` header when sent,
 * and adding random jitter so concurrent callers don't retry in lockstep.
 */
export async function fetchBuildings(lat, lng, radius = 100, maxRetries = 3) {
  const q = `[out:json][timeout:25];(way["building"](around:${radius},${lat},${lng});relation["building"](around:${radius},${lat},${lng}););out geom tags;`
  for (const ep of OVERPASS_ENDPOINTS) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(`${ep}?data=${encodeURIComponent(q)}`)
        if (res.ok) return (await res.json()).elements ?? []

        // Rate-limited / server busy → back off and retry the SAME endpoint
        if (res.status === 429 || res.status >= 500) {
          if (attempt === maxRetries) break // exhausted → try next endpoint
          const retryAfter = parseFloat(res.headers.get('retry-after'))
          const backoff = Number.isFinite(retryAfter) ? retryAfter * 1000 : 1000 * 2 ** attempt
          await sleep(backoff + Math.random() * 500) // jitter
          continue
        }

        break // other non-ok (4xx) → not retryable, try next endpoint
      } catch {
        break // network error → try next endpoint
      }
    }
  }
  return null
}

/** Best-effort building height in metres. Valencia Ensanche-friendly default. */
function buildingHeight(tags = {}) {
  if (tags.height) return parseFloat(tags.height)
  if (tags['building:levels']) return parseFloat(tags['building:levels']) * 3
  return 12
}

/**
 * Build a 360-entry horizon profile (max blocking elevation angle per compass degree).
 *
 * Each wall is rasterized across the full azimuth arc it spans: we sample it
 * finely in metres (to capture the varying distance/elevation along its length),
 * then fill EVERY integer-degree bin between consecutive samples by interpolating
 * the elevation. This leaves no azimuth holes even for near walls — where a fixed
 * metre step would otherwise skip degrees and produce a striped/aliased horizon —
 * while genuine sky gaps between separate buildings are preserved (nothing bridges
 * across the empty azimuth between two different footprints).
 */
// Distance floor (m): a spot is an open place you stand *in*, not pressed against a
// wall. Walls closer than this are treated as this far away when computing their
// blocking elevation, so a pin dropped a few metres from a façade can't fabricate a
// near-vertical (~75°) horizon that wrongly shades the whole morning. The wall still
// occupies its true azimuth — only its elevation is capped. See docs/logic/sun-interval-logic.md.
const MIN_WALL_DIST_M = 12

export function computeHorizonProfile({ lat, lng, buildings }) {
  const cosLat = Math.cos(lat / DEG)
  const profile = new Array(360).fill(0)

  // Local ENU projection of a point → { az (compass deg), elev (deg) }, or null if degenerate.
  const project = (plat, plon, h) => {
    const dLat = (plat - lat) * M_PER_DEG_LAT
    const dLon = (plon - lng) * cosLat * M_PER_DEG_LAT   // cosLat on the EASTING
    const dist = Math.hypot(dLat, dLon)
    if (dist < 1) return null
    return {
      elev: Math.atan2(h, Math.max(dist, MIN_WALL_DIST_M)) * DEG,  // distance floor
      az: (Math.atan2(dLon, dLat) * DEG + 360) % 360,     // cosLat baked into the bearing
    }
  }

  const raise = (az, elev) => {
    const i = ((Math.round(az) % 360) + 360) % 360
    if (elev > profile[i]) profile[i] = elev
  }

  // Fill every integer azimuth bin between two samples (minor arc), interpolating elevation.
  const rasterize = (p, q) => {
    const delta = ((q.az - p.az + 540) % 360) - 180        // signed shortest arc, (-180, 180]
    const steps = Math.max(1, Math.ceil(Math.abs(delta)))  // ≤ 1° per fill point → no gaps
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      raise(p.az + delta * t, p.elev + (q.elev - p.elev) * t)
    }
  }

  for (const el of buildings) {
    const h = buildingHeight(el.tags)
    const pts = el.geometry
    if (!pts?.length) {                    // relation/no-geom → centroid fallback
      if (el.center) {
        const p = project(el.center.lat, el.center.lon, h)
        if (p) raise(p.az, p.elev)
      }
      continue
    }
    for (let k = 0; k < pts.length - 1; k++) {
      const a = pts[k], b = pts[k + 1]
      const segM = Math.hypot(
        (b.lat - a.lat) * M_PER_DEG_LAT,
        (b.lon - a.lon) * cosLat * M_PER_DEG_LAT,
      )
      const steps = Math.max(1, Math.ceil(segM / 2)) // ~2 m sampling captures varying distance/elev
      let prev = project(a.lat, a.lon, h)
      if (prev) raise(prev.az, prev.elev)
      for (let s = 1; s <= steps; s++) {
        const t = s / steps
        const cur = project(a.lat + (b.lat - a.lat) * t, a.lon + (b.lon - a.lon) * t, h)
        if (prev && cur) rasterize(prev, cur) // fill the azimuth gap between consecutive samples
        else if (cur) raise(cur.az, cur.elev)
        prev = cur
      }
    }
  }
  return profile.map(v => Math.round(v * 10) / 10) // 0.1° precision, compact in Firestore
}

/** Flat fallback horizon for Valencia when Overpass is unreachable. */
export function fallbackProfile() {
  return new Array(360).fill(15)
}

/** Is the spot in direct sun at `date`, given its profile? */
export function isSunlitAt(profile, date, lat, lng) {
  const p = SunCalc.getPosition(date, lat, lng)
  const alt = p.altitude * DEG
  if (alt <= 0) return false
  const az = ((p.azimuth * DEG + 180) % 360 + 360) % 360 // SunCalc south-based → compass
  const limit = profile[Math.round(az) % 360] ?? 0
  return alt > limit
}

/** All direct-sun windows for the given day. Returns [[Date,Date], ...]. */
export function deriveSunWindows(profile, date, lat, lng, stepMin = 10) {
  const day = new Date(date); day.setHours(0, 0, 0, 0)
  const windows = []
  let start = null
  for (let m = 0; m <= 24 * 60; m += stepMin) {
    const d = new Date(day.getTime() + m * 60000)
    const lit = isSunlitAt(profile, d, lat, lng)
    if (lit && start === null) start = d
    if (!lit && start !== null) { windows.push([start, d]); start = null }
  }
  if (start !== null) windows.push([start, new Date(day.getTime() + 24 * 60 * 60000)])
  return windows
}

const fmt = d => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

/** ["07:40 - 13:10", "15:20 - 20:05"] */
export function formatWindows(windows) {
  return windows.map(([a, b]) => `${fmt(a)} - ${fmt(b)}`)
}

/** Longest window → compact "HH:MM - HH:MM" string for card/list UI. */
export function primaryWindowString(windows) {
  if (!windows.length) return ''
  const [a, b] = windows.reduce((m, w) => (w[1] - w[0] > m[1] - m[0] ? w : m))
  return `${fmt(a)} - ${fmt(b)}`
}
