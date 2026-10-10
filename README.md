# SUNspot

A progressive web app (PWA) that helps users manage sun exposure, track UV intensity, and discover "sunspots" — curated outdoor locations in Valencia, Spain and a 20 km radius — for safe sunbathing or circadian rhythm alignment.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vue 3 (`<script setup>`) + Vite 7 |
| Backend / DB | Firebase 12 (Firestore, Auth) |
| Maps | Leaflet + MapLibre GL (Jawg vector tiles) |
| Sun calculations | SunCalc |
| Styling | Vanilla CSS with CSS custom properties (light + dark themes) |
| Icons | Iconify (Material Design Icons) via `unplugin-icons` |
| PWA | Vite PWA Plugin (Workbox) |
| QR scanning | html5-qrcode |
| Image CDN | Cloudinary |

## Getting Started

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # Production build
npm run preview   # Preview production build
```

In VS Code, install the **Vue - Official** extension (`Vue.volar`) for SFC
language support — the workspace recommends it automatically.

A `.env` file is required (not committed): copy [`.env.example`](.env.example) and fill in `VITE_JAWG_MAPS_TOKEN` and the `VITE_FIREBASE_*` values — see [`docs/dev/environment.md`](docs/dev/environment.md).

## Project Structure

```
src/
├── main.js          # Entry point
├── App.vue          # Root component
├── style.css        # Global CSS variables (light + dark themes) and utility classes
├── firebase.js      # Firebase init (exports auth, db)
├── router/          # Vue Router — all routes + auth/admin guards
├── components/      # Feature-grouped UI components
├── views/           # Page-level views (pages/, auth/, admin/)
├── layouts/         # MainLayout, DefaultLayout, AltLayout, AdminLayout
├── composables/     # Module-level reactive state singletons
├── utils/           # geo.js, image.js, solarHorizon.js, map.js, uv.js, authCache.js, download.js
└── data/            # profiles.js, onboardingQuestions.js, skinTones.js,
                     #   ambassadors.js, schema.json
```

## Documentation

- [`AGENTS.md`](AGENTS.md) — architecture, composable APIs, Firestore schemas, routing, coding standards
- [`docs/`](docs/README.md) — roadmap, product specs, dev commands, environment notes

## Team

- **Authors and rights holders**: Alejandro González Jovani, Álvaro González Castelló (founders)
- **Developer**: Kevin Jérémy Gautier

© 2026 Alejandro González Jovani and Álvaro González Castelló. All rights reserved. See [`AUTHORS.md`](AUTHORS.md).
