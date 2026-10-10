# Sun Interval Logic

How SUNspot decides whether a spot is in **direct sunlight** at any moment, and how it derives the spot's daily **sun interval** (the window(s) of direct sun).

> **TL;DR** — We compare the sun's real position in the sky against a 360° "skyline" of the buildings around the spot. If the sun is higher than the buildings in its current direction, the spot is sunlit; if not, it's in shadow. The skyline is computed once from OpenStreetMap building footprints and stored on the spot. The sun's position is recomputed live for the current date.

---

## Do we actually know the height of the surrounding buildings?

**Partly. It's a mix of real data and estimation** — this is the biggest source of uncertainty in the whole system, so it's worth being upfront about.

For every building we pull from OpenStreetMap, we pick a height in this order (`buildingHeight()` in `src/utils/solarHorizon.js`):

1. **`height` tag** → used directly. This is a real surveyed/mapped height in metres. **Best case, but rare.**
2. **`building:levels` tag** → we multiply floors × **3 m**. A reasonable proxy (≈3 m per storey incl. floor slab), but the floor count itself may be approximate and 3 m is an assumption.
3. **Neither tag** → we assume **12 m** (≈4 floors, typical for Valencia's Ensanche blocks). **This is a pure guess and it's the common case** for many buildings in OSM.

So: we know the exact height only when OSM has it tagged. Otherwise we estimate from floor count, and failing that we fall back to a city-typical default. The geometry (where the buildings are, their shape, their distance and direction) is accurate; the **height is the weak link**. That's the number to tune first if block-times come out systematically wrong (see *Tuning*).

---

## The core idea: horizon profile vs. sun path

Two independent pieces:

### 1. The horizon profile (geometry — where the buildings are)
A `horizon_profile` is an array of **360 numbers**. Index = compass direction in whole degrees (0 = North, 90 = East, 180 = South, 270 = West). The value at each index is the **maximum elevation angle** (degrees above the flat horizon) that a building occupies in that direction.

```
profile[135] = 22   →  looking Southeast, buildings rise to 22° above the horizon
profile[180] = 0    →  looking South, clear sky all the way down to the horizon
```

An open spot like **Malvarrosa beach** has a profile that's near `0` in almost every direction. A spot boxed in by tall blocks like **El Carmen** has high values across many directions.

**This profile is pure geometry. It never changes with the date or time** — a building is the same height in June as in December. That's why we can compute it once and store it.

### 2. The sun path (astronomy — where the sun is)
For any date/time and location, [SunCalc](https://github.com/mourner/suncalc) gives us the sun's **altitude** (how high, in degrees) and **azimuth** (which compass direction). The sun path *does* change every day, so this part is always recomputed live — but it's microseconds of math.

### Putting them together
The spot is in **direct sun** at a given moment when:

```
sun.altitude  >  horizon_profile[ round(sun.azimuth) ]
```

i.e. the sun is higher in the sky than whatever building sits in the sun's current direction. If the sun is lower than that building, the building is between the sun and the spot → **shadow**. (`isSunlitAt()` in `solarHorizon.js`.)

---

## How the horizon profile is built

`computeHorizonProfile()` in `src/utils/solarHorizon.js`.

1. **Fetch buildings.** Query the [Overpass API](https://overpass-api.de) for every building footprint within **100 m** of the spot (`fetchBuildings()`). 100 m still captures cross-street blocks that shade low winter sun, while keeping the query light. Two endpoints are tried for resilience.

2. **For each building, walk its footprint outline.** OSM gives the full polygon (`out geom`), not just a centre point. We densify each wall by sampling a point roughly every **2 m** along it. This matters: a nearby wall spans a wide arc of the sky, and sampling only the corners (or the centroid) would leave gaps or push the wall artificially far away.

3. **For each sampled point, compute:**
   - **Distance** from the spot (metres), via a local flat-earth approximation. Longitude metres are scaled by `cos(latitude)` because degrees of longitude shrink toward the poles (`M_PER_DEG_LAT = 111320`).
   - **Elevation angle** = `atan2(height, distance)` — a tall building far away can subtend the same angle as a short one nearby.
   - **Compass bearing** from the spot to the point (`cos(latitude)` applied here too, so the direction is correct at Valencia's latitude).

4. **Keep the maximum** elevation angle seen in each of the 360 compass bins. Values are rounded to 0.1° to stay compact in Firestore.

If Overpass is unreachable, `fallbackProfile()` returns a **flat 15° horizon** in every direction — a rough "average city" stand-in so the feature still renders. Spots using it are flagged (`horizon_source: 'fallback'`) and the UI shows a disclaimer note.

---

## From profile to a sun interval

`deriveSunWindows()` in `src/utils/solarHorizon.js`.

To get the direct-sun window(s) for a given day, we step through the whole day in **10-minute** increments and, at each step, run the `isSunlitAt()` test above. Contiguous runs of "sunlit" steps become windows:

```
[[07:40, 13:10], [15:20, 20:05]]   →  morning sun, a shadow gap, then evening sun
```

- **`primaryWindowString()`** returns just the **longest** window as a `"HH:MM - HH:MM"` string. This is what the card/list UI shows, derived live via `useSpotSunInterval()` (never stored).
- A spot can legitimately have **two windows** (e.g. sun in the morning, blocked at midday by one tall block, sun again in the evening) — a single string can't express that, so the detail view derives *all* windows fresh; the card just shows the longest.

**Important nuance:** the sun interval is **date-dependent** (the sun rises/sets in different directions across the year). It is therefore **not stored** — it's always re-derived from `profile + today's date` at render time, so it tracks the season automatically. The horizon profile is what's authoritative and date-independent.

---

## Architecture: compute once, render instantly

```
Author time (admin saves a spot)
  └─ fetch buildings (ONE Overpass call)
     compute horizon_profile  (geometry)
     write profile + source + timestamp onto the spot doc

View time (any user opens a spot / sees a card)
  └─ read spot.horizon_profile   (NO network call — flat fallback if absent)
     recompute today's sun windows with SunCalc  (instant)
     render the arc (detail) or the primary window string (card)
```

Why split it this way: the profile is the **expensive and flaky** part (external API, rate limits). The per-day sun windows are **cheap** (pure local math). So we precompute and store only the profile, and always derive the date-specific windows live.

**Overpass is only ever called from `SpotManager` (compute-on-save).** Viewing a spot or card never triggers a request: it uses the stored `horizon_profile`, or the flat Valencia fallback when a spot doesn't have one yet.

- **Precompute on save** happens in `src/views/admin/SpotManager.vue`.
- **Backfill** for existing (pre-feature) spots: open and re-save each one in the admin spot editor — that recomputes and stores its profile. There is no bulk recompute (it hammered the public Overpass API into 429s). Until re-saved, an old spot simply renders the fallback horizon.
- If Overpass fails during a save, the fallback profile is stored and the save is **never blocked**.

---

## How it's shown to the user

`src/components/spot/SolarInterval.vue` renders an arc + timeline for the current day.

- It samples the day at **15-minute** resolution (`solarSlots`). Each slot runs the same `altitude > profile[azimuth]` test to decide `isSunny`.
- The arc/timeline colours each slot into one of **three** states:
  - **Warm gradient** — direct sun (colour intensity tracks the sun's altitude).
  - **`SHADOW_GREY` (#CBD5E1)** — daytime but blocked by buildings.
  - **`NIGHT_GREY` (#F3F4F6)** — before sunrise / after sunset.
- The legend explains all three. The astronomical **sunrise / solar noon / sunset** stats come straight from SunCalc and are *not* horizon-adjusted (they're true facts about the day); the greying of the band is what conveys the spot-specific shadowing.

Result: an open spot shows a wide warm band; a shadowed spot shows the same daylight span with grey shoulders (or a grey notch) eaten out of it.

---

## Data sources & key assumptions

| Thing | Source | Confidence |
|---|---|---|
| Building **positions & footprints** | OpenStreetMap via Overpass | High (where mapped) |
| Building **height** | OSM `height` tag | High — but **rarely present** |
| Building **height** | OSM `building:levels` × 3 m | Medium (floor count + 3 m assumption) |
| Building **height** | **12 m default** | Low — a guess, but common case |
| Sun **position** | SunCalc (astronomy) | High |
| Fallback horizon | Flat 15° everywhere | Low — only when Overpass is down |

### Deliberately out of scope (MVP)
- **Trees / vegetation** — handled by the manual `has_natural_shadow` flag. OSM tree data is sparse and deciduous shade is seasonal, so it isn't computed.
- **Terrain / elevation** — ignored. Valencia is flat and near sea level, within tolerance.
- **Sun width & atmospheric refraction** — the sun is treated as a point and standard SunCalc refraction is used; sub-degree effects are below our accuracy target.

---

## Tuning the accuracy

This is an MVP **estimate**, not a survey instrument. The geometry removes the *systematic* errors (correct footprints, correct bearings). The residual error is dominated by **building height**. If real sunrise/sunset block-times at a spot are systematically off:

1. Adjust the **12 m** height default (`buildingHeight()`).
2. Adjust the **12 m** min wall distance (`MIN_WALL_DIST_M`) — the floor that stops a pin dropped against a façade from fabricating a near-vertical horizon. Raise it if close buildings still over-shade; lower it if genuinely adjacent buildings are being ignored.
3. Then adjust the **100 m** fetch radius (`fetchBuildings()`).

Validate by eyeballing 4–5 known spots on a clear day and comparing the computed first-sun / last-sun times against reality.

---

## Where the code lives

| File | Role |
|---|---|
| `src/utils/solarHorizon.js` | Pure math: Overpass fetch, footprint geometry, profile + window derivation. No Vue/Firebase. |
| `src/composables/useSolarHorizon.js` | Vue wrapper: `getProfileForSpot` resolves stored profile → flat fallback (no network); `computeForLocation` is the Overpass path, used only on save. |
| `src/composables/useSpotSunInterval.js` | Card/list helper: reactive primary window string for today, network-free (stored profile or fallback). |
| `src/components/spot/SolarInterval.vue` | Renders the arc/timeline for the current date from the profile. |
| `src/views/admin/SpotManager.vue` | Computes + persists the profile on spot save. |
| `src/views/admin/Dashboard.vue` | Flags spots that still lack a stored profile (`needsHorizonUpdate`), so the admin knows which to re-save. |

### Stored fields (on each `spots` doc)
- `horizon_profile: array<number>` — the 360 elevation angles.
- `horizon_source: 'osm' | 'fallback'` — whether real building data was used.
- `horizon_computed_at: timestamp` — when it was last computed.

> The sun interval is **not** stored — it's derived live from `horizon_profile + today's date`
> (detail page: `SolarInterval.vue`; cards: `useSpotSunInterval()`).
