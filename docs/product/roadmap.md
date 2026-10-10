# Roadmap

What's built, what's next. Update this file when a feature ships — it's the
first thing to check before starting a major task.

## Shipped

- **Spots**: Firestore-backed spot catalogue, map (Leaflet + MapLibre/Jawg),
  Explore with client-side filters, spot detail, bookmarks, QR scan → visited.
- **Personal spots**: full CRUD in `localStorage`, personal map.
- **Sun interval**: 360° building horizon from OpenStreetMap, computed once on
  admin save; live sun window per spot. See [`../logic/sun-interval-logic.md`](../logic/sun-interval-logic.md).
- **Exposure wheel**: Fitzpatrick phototype × UV × exposed area → burn time,
  vitamin D estimate, and a tanning level with the number of sessions to the
  next one (`UVIntensityWheel.vue`, `DVitamin.vue`).
- **Circadian battery**: multi-step test, 15-day cooldown.
- **Onboarding questionnaire**: asked once after first login; preloads the
  phototype into the exposure wheel. The other answers are stored but not
  used yet (see *Later*).
- **Ambassadors**: profile directory (`data/ambassadors.js`).
- **PWA**: installable, Workbox runtime caches, install flow at `/descargar`
  with browser-specific Android paths (Chrome hand-off for OEM browsers, an
  incompatible-device notice when the install prompt never arrives).
- **Dark mode**: full light/dark theme, toggled in `/ajustes` (now a public
  route) and following the device by default. Also the fix for Android
  browsers force-inverting the app — see *Theming* in `AGENTS.md`.

## Next — Sun Exposure Engine

The full engine is specced in [`sun-exposure-engine.md`](sun-exposure-engine.md).
Against what ships today, the gaps are:

- [ ] **Live environment data** — temperature, cloudiness, air quality, humidity
      and pollen. Only UV is modelled today, and from a clear-sky estimate
      (`utils/uv.js`: sun position + season) rather than a real feed — so it
      ignores clouds and reads high on an overcast day.
- [ ] **Sun Quality Score** — the single 0–100 headline combining those inputs.
- [ ] **Persisted exposure profile** — `skin_phototype` and `body_area` on the
      user doc. The onboarding questionnaire already captures the phototype
      (`onboarding.answers.sun_sensitivity`); body area is still per-session.
- [ ] **Bronceado projection** — the level and sessions-to-next-level ship
      today; the day-by-day plan from the spec does not.
- [ ] **Hourly forecast** — UV hour by hour with a highlighted best window.
- [ ] **Spot ranking** — score every spot daily to rank Explore results.

> **Health language.** The reference mockup shows *"es suficiente con SPF 15 o
> protección ligera"*. That violates the rule in `AGENTS.md`: never recommend
> SPF or any protective product — that's a clinical decision. Reword before
> building this screen.

## Later

- [ ] **Building shadows on the map** — a 3D building layer, or a lightweight
      Leaflet/MapLibre plugin, to draw the shadow projection in urban spots.
- [ ] **Spot certification** — holographic "Michelin star" plaques for
      top-scoring spots.
- [ ] **Onboarding answers → recommendations** — the answers are stored but
      nothing consumes them yet.
