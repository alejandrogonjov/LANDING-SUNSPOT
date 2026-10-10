# SUNspot Agent Guide

You are an AI developer helping build **SUNspot**, a PWA designed to help users manage sun exposure, track UV intensity, and find "sunspots" (locations) for safe sunbathing or circadian rhythm alignment. The app targets Valencia, Spain and a 20km radius. All user-facing text is in **Spanish**.

## Team
- **Founders**: Alejandro, Alvaro — the authors and rights holders of SUNspot (Alejandro González Jovani, Álvaro González Castelló)
- **Developer**: Kevin (Kevin Jérémy Gautier) — writes the code on their behalf; being the git committer is not a claim of authorship. See `AUTHORS.md`.

> This file is the architecture reference. Roadmap, product specs, dev commands
> and environment notes live in [`docs/`](docs/README.md).
>
> **`AGENTS.md` is the single source of project context for every AI tool.** Do
> not add per-tool copies — `.cursorrules`, `.windsurfrules` and
> `.github/copilot-instructions.md` were removed as duplicates of this file.
>
> **No tool-local memory.** Project knowledge must travel with the repository,
> not with one machine. Do not save it to a tool's per-device memory (Claude
> Code's `~/.claude/projects/…/memory`, or any equivalent): write durable facts
> here or under `docs/`, and leave that local memory empty.

## Tech Stack
- **Framework**: Vue 3 (Composition API + `<script setup>`)
- **Build Tool**: Vite 7
- **Backend/DB**: Firebase 12 (Firestore, Auth). Storage is not enabled — spot images live on Cloudinary
- **Maps**: Leaflet (interactive layers) + MapLibre GL (vector tiles via Jawg)
- **Styling**: Vanilla CSS (global tokens in `src/style.css`, component-scoped styles)
- **Icons**: Iconify via `unplugin-icons` (Material Design Icons)
- **Utilities**: SunCalc (sun position/UV), Vue Router 4, html5-qrcode (QR scanning)
- **Image Optimization**: Cloudinary via `utils/image.js` (`getOptimizedImageUrl`)
- **PWA**: Vite PWA Plugin (Workbox service worker, web manifest)

## Directory Structure

```
src/
├── main.js                  # Entry point — mounts Vue immediately, registers the PWA SW
├── App.vue                  # Root with router-view, AppLoader, Toast; desktop shell (sidebar + .app-view)
├── style.css                # Global CSS variables and layout tokens; light + dark themes
├── firebase.js              # Firebase init; exports `auth`, `db`, `getCurrentUser`
├── firebaseLazy.js          # `loadFirebase()` — on-demand Firebase for the entry graph
├── router/index.js          # All routes (lazy-loaded) + auth/admin navigation guards
├── components/
│   ├── ui/                  # Reusable primitives: Toast, AppLoader, Back, MapSkeleton
│   ├── home/                # Map, Header, Weather, SearchBar, SpotBottomSheet, SpotPreview, UserAvatar,
│   │                        #   UserMenuSheet; desktop: MapExplorerPanel, SpotListItem
│   ├── explore/             # SpotCard, ExploreFilters (sheet), ExploreFilterControls (shared controls)
│   ├── spot/                # SpotHeroImages, SpotInfo, SpotLocationAction, UVIntensityWheel, DVitamin, SolarInterval
│   ├── inc/                 # Layout chrome: Nav, MenuDrawer (mobile); DesktopSidebar (≥ 1024px)
│   ├── account/             # AccountHeader, BookmarkedSpots, ProfileSuggestions, NotificationSection, AmbassadorModal, ApplySpotSheet
│   ├── admin/               # SpotBasicInfo, SpotLocation, SpotImageManager
│   ├── personal/            # Float (FAB), PersonalSpotBottomSheet
│   ├── circadian/           # CircadianConsult, CircadianResults
│   ├── onboarding/          # OnboardingQuestion (post-login questionnaire)
│   └── settings/            # EditNameSheet
├── views/
│   ├── pages/               # Home, Explore, Account, Spot, Scan, Profile, Circadian, Onboarding,
│   │                        #   PersonalSpots, PersonalSpot, PersonalMap, Bookmarks, Notification, Settings,
│   │                        #   AvatarSelector, Ambassadors, Ambassador, Download, StateError
│   ├── auth/                # Auth (login/register)
│   └── admin/               # Dashboard, SpotManager, NotificationManager
├── layouts/
│   ├── MainLayout.vue       # Home page layout with Nav
│   ├── DefaultLayout.vue    # Standard pages with back header
│   ├── AltLayout.vue        # Minimal layout (scan page)
│   └── AdminLayout.vue      # Admin pages — renders Back + route title from meta
├── composables/             # Shared reactive state (module-level singletons)
├── directives/              # dragClose.js (v-drag-close, registered in main.js)
├── utils/                   # geo.js, image.js, solarHorizon.js, map.js, uv.js, authCache.js, download.js,
│                            #   spotSearch.js
└── data/                    # profiles.js, onboardingQuestions.js, skinTones.js,
                             #   ambassadors.js, schema.json
```

## Composables (State Layer)

Composables use **module-level** `ref`/`reactive` — state is a singleton that persists across component mounts. Never re-initialize inside component setup.

| Composable | Responsibility |
|---|---|
| `useUser.js` | Auth state, Firestore user doc, `scanSpot()`, profile updates |
| `useSpots.js` | Real-time `onSnapshot` listener for the `spots` collection |
| `usePersonalSpots.js` | User-created spots in `localStorage` |
| `useNotifications.js` | Real-time notification listener and read-state tracking |
| `useTranslator.js` | i18n dictionary, category label/color/icon lookup |
| `useToast.js` | Toast notification state and helpers |
| `usePwaInstall.js` | PWA install state for `/descargar`: captured `beforeinstallprompt`, OS/browser detection, installed/incompatible signals (listeners registered at import — see *Maps & PWA*) |
| `useSettings.js` | Geolocation preference, browser permissions |
| `useTheme.js` | Light/dark theme preference; resolves "follow the system" and writes `data-theme` |
| `useOnboarding.js` | Post-login questionnaire answers on `users/{uid}.onboarding` (cached per uid per session) |
| `useOnboardingExport.js` | Admin-only: compiles every stored questionnaire into a JSON download, keyed by email |
| `useBattery.js` | Circadian battery test save/fetch (Firestore) |
| `useSolarHorizon.js` | Resolves a spot's building-horizon profile (stored → flat fallback, no network); `computeForLocation` is the Overpass path, used only on admin save |
| `useSpotSunInterval.js` | Reactive `"HH:MM - HH:MM"` primary sun window for today (season-aware, network-free); shared by cards + spot detail |
| `useViewport.js` | `isDesktop` (≥ 1024px, one shared `matchMedia`) for the few places where desktop renders a *different structure*; see *Desktop layout* |
| `useSignOut.js` | `signOutAndGoHome()` — sign out and land on the map with the `logged-out` toast; used by the nav chrome (drawer, avatar menu, desktop sidebar) |

**`useUser()` API:**
```js
const { user, userData, loading, authResolved, isLoggedIn, scanSpot } = useUser()
// user         — readonly ref, Firebase Auth user object (null if logged out)
// userData     — readonly ref, Firestore user doc merged with uid. SEEDED from the
//                cached auth snapshot, so it can hold last-known values before the
//                live document arrives (never null for a returning signed-in user)
// loading      — readonly ref boolean, true during initial auth + Firestore fetch
// authResolved — readonly ref boolean, true once Firebase has answered
// isLoggedIn   — computed boolean; optimistic (from the snapshot) until
//                `authResolved`, plain truth after
// scanSpot(spotId) — marks spot visited (deduplicates silently)
```

**`useOnboarding()` API:**
```js
const { onboarding, status, isCompleted, isAnswered, phototype, saveAnswers, skip } = useOnboarding()
// onboarding   — readonly ref, the stored payload (null until loaded)
// status       — computed 'completed' | 'skipped' | null
// isCompleted  — computed boolean, true only for 'completed' (not 'skipped')
// isAnswered   — computed boolean, true once answered OR dismissed
// phototype    — computed Fitzpatrick 1–6 from question 5, null if unanswered
// loadOnboarding(uid) — async; loads + caches the payload. Call it from any
//                page that reads the state directly (Account.vue does), since
//                the guard's cache is not guaranteed warm on a hard reload.
// saveAnswers(answers) / skip() — write to users/{uid}.onboarding using
//                `mergeFields`, NOT `merge: true`: Firestore deep-merges nested
//                maps, so a plain merge would leave keys from a previous run
//                behind on a retake. Do not regress this.

// Module-level helpers used by the router guard (they can't await a computed):
hasAnsweredOnboarding(uid)   // async; loads + caches the payload for the session
wasPromptedThisSession()     // suppresses repeat redirects within one app session
markPromptedThisSession()
```

**`useTranslator()` API:**
```js
const { t, categoryKeys, getCategoryColor, getCategoryIcon, getCategoryLabel, getAccessIcon } = useTranslator()
// t('categories.sport')     → 'Deporte'
// t('ui.free')              → 'Libre'
// categoryKeys              → ['sport', 'nature', 'culture', 'hostelry']
// getCategoryColor(cat)     → 'var(--cat-sport)' etc., fallback 'var(--cat-default)'
// getCategoryIcon(cat)      → Iconify component (mdi-dumbbell, mdi-leaf, mdi-palette, mdi-coffee)
// getCategoryLabel(cat)     → same as t('categories.<cat>')
// getAccessIcon(isFree)     → IconCurrencyEurOff (free) or IconDoorOpen (paid)
```

`ui` dictionary keys: `category`, `free`, `paid`, `sunrise`, `sunset`, `explore`, `results`, `clear`, `filters`, `access`, `moment`, `shadow`, `natural_shadow`, `quiet`, `wind`.

**`useTheme()` API:**
```js
const { theme, isDark, followsSystem, setTheme, toggleTheme, useSystemTheme } = useTheme()
// theme         — computed 'light' | 'dark', the theme actually painted
// isDark        — computed boolean
// followsSystem — computed boolean, true while no explicit choice is stored
// setTheme('light' | 'dark') / toggleTheme() — record an explicit choice
// useSystemTheme() — drop the choice and follow `prefers-color-scheme` again
```
See *Theming (light / dark)* for how it reaches the page.

**`useNotifications()` API:**
```js
const {
  notifications, latestNotification, loading,
  unreadCount, hasUnread,
  markAsRead, markAllAsRead, createNotification
} = useNotifications()
// notifications         — readonly ref array, all notifications ordered by createdAt desc
// latestNotification    — computed, first notification or null
// unreadCount           — computed, how many the current user hasn't read
// hasUnread             — computed boolean
// markAsRead(id)        — adds uid to readBy array for one notification
// markAllAsRead()       — batch-marks all unread as read
// createNotification({ title, body, spotId? }) — admin: writes a new notification doc
```
Notifications are in-app only (Firestore documents, no push). They surface on `/cuenta` (`NotificationSection.vue`) and its detail page `/notificacion` — there are no red dots or badges.

**`useBattery()` API:**
```js
const { isSaving, isLoadingLog, saveBatteryLog, getLatestBatteryLog } = useBattery()
// saveBatteryLog(userId, data)  — writes data to users/{uid}.circadian + serverTimestamp
// getLatestBatteryLog(userId)   — fetches users/{uid}.circadian, returns object or null
// isSaving / isLoadingLog       — boolean loading refs
```

## Routing & Guards

- `requiresAuth` meta — redirects unauthenticated users to `/registro`
- `requiresAdmin` meta — checks Firestore `users/{uid}.role === 'admin'`
- **Onboarding guard** — for any logged-in user the guard loads `users/{uid}.onboarding` (one cached read per session) and redirects to `/bienvenida` when it's missing. The payload is loaded even when no redirect happens, because `phototype` preloads the exposure wheel. A session flag (`sunspot_onboarding_prompted`) stops a user who navigates away mid-questionnaire from being bounced back on every route change.
- **Auth does not gate rendering** — `main.js` mounts immediately. Firebase can only answer "who is signed in?" asynchronously (IndexedDB read, sometimes a token refresh), so `utils/authCache.js` keeps a synchronous localStorage snapshot of last time's answer and the guard renders from that, verifying against Firebase afterwards. Three states: `null` (never seen — callers must wait), `{ uid: null }` (known signed out), `{ uid, onboarded, userData }` (known signed in).
  - **Fast path** (no Firebase wait): snapshot says signed in *and* onboarded → render; or says signed out on a route that isn't `requiresAuth` → render. `verifyNavigation()` then re-checks and corrects course, including resetting a snapshot that claimed a dead session.
  - **Blocking path** (`await auth.authStateReady()`): no snapshot yet, a signed-in user not yet confirmed onboarded, any `requiresAdmin` route, and any `requiresAuth` route whose snapshot says signed out. Denying access and redirecting to onboarding are the decisions worth waiting for the real answer on, so neither is ever taken on cached data alone.
  - A stale snapshot can only cost a *correction* (a redirect, or a cached value being replaced) — never a wrong access decision. Firestore rules, not this cache, guard data.
- **`auth.currentUser` can be `null` at setup** — the app renders before auth resolves. Use `getCurrentUser()` from `firebase.js` (awaits `authStateReady()` then returns the user) or read auth reactively via `useUser()`. Never read `auth.currentUser` directly in setup, `onMounted`, or an `immediate` watcher.
- The splash (`AppLoader`) is down to its 400ms anti-flash floor whenever a snapshot exists — it waits on neither auth nor the Firestore user document. `useUser` seeds `userData` and an optimistic `isLoggedIn` from the snapshot, so the header paints the right avatar on the first frame; the live document replaces it on arrival. Only a first-ever load (no snapshot) waits for auth.
- All routes are lazy-loaded except `home` (the only eager import in `router/index.js`)
- **Firebase is loaded on demand.** Nothing in the entry graph imports `@/firebase` statically — the eagerly-loaded modules (this guard, `App.vue`, the Home tree, `useUser`/`useSpots`/`useOnboarding`) go through `loadFirebase()` from `firebaseLazy.js`. That keeps ~108KB gzipped, and Firebase's `initializeApp`/`getAuth`/`getFirestore` execution, out from in front of the first frame: the map paints while Firebase is still arriving, and spots and user state fill in behind it. The snapshot fast path above touches Firebase not at all, which is what makes it possible.
  - `firebase.js` also re-exports the Firestore/Auth functions these callers need, so one dynamic import supplies everything: `const { db, doc, getDoc } = await loadFirebase()`.
  - **Lazy-loaded route components may keep importing `@/firebase` and `firebase/*` directly** — they're off the critical path by construction and resolve to the same module instance. Only add a static Firebase import to a module reachable from `main.js`, `App.vue`, `router/index.js` or the Home tree if you intend to put Firebase back on the critical path.

**Route names** (use with `router-link :to="{ name: '...' }"` or `router.push({ name: '...' })`):

| Name | Path | Auth |
|---|---|---|
| `home` | `/` | — |
| `login` | `/registro` (alias `/register`) | — |
| `explore` | `/explorar` | — |
| `scan` | `/escanear` | — |
| `spot` | `/spot/:id` | — |
| `circadian` | `/suncronizacion` | — |
| `ambassadors` | `/embajadores` | — |
| `ambassador` | `/embajador/:id` | — |
| `descargar` | `/descargar` | — |
| `not-found` | `/:pathMatch(.*)*` | — |
| `account` | `/cuenta` | auth |
| `notification` | `/notificacion` | auth |
| `settings` | `/ajustes` | — |
| `profile` | `/perfil` | auth |
| `onboarding` | `/bienvenida` | auth |
| `avatar` | `/avatar` | auth |
| `bookmarks` | `/mis-favoritos` | auth |
| `personal-spots` | `/personal-spots` | auth |
| `personal-spot` | `/personal-spot/:id` | auth |
| `personal-map` | `/personal-map` | auth |
| `dashboard` | `/panel` | admin |
| `admin-spot-new` | `/panel/spot/nuevo` | admin |
| `admin-spot-edit` | `/panel/spot/:id` | admin |
| `admin-notif-new` | `/panel/notificacion/nueva` | admin |
| `admin-notif-edit` | `/panel/notificacion/:id` | admin |

## Firestore Data Models

Schema reference: `src/data/schema.json`.

**Security Rules** are versioned in the repo (not just the Firebase console):
- `firestore.rules` + `storage.rules`, wired via `firebase.json`; project pinned in `.firebaserc` (`sunspot-b9a0c`).
- Deploy: `npx -y firebase-tools deploy --only firestore:rules,storage` (Storage is not enabled on the project, so its deploy no-ops — the deny-all file is a forward-proofing safety net).
- **Invariant — do not regress:** a client can never write the `users/{uid}.role` field (immutable on create *and* update). Admin authorization everywhere reads `role === 'admin'` from that doc, so making it client-writable is a privilege-escalation hole. Admins are promoted only via the console / trusted backend.
- Regular users may write only their own `users/{uid}` doc, and may only append their own uid to `notifications/{id}.readBy` (mark-as-read) — nothing else on notifications.
- `users/{uid}` deletes are allowed for the owner (right to erasure) or an admin. The owner check is evaluated first so a self-delete never depends on `isAdmin()`'s `get()`, which reads the very document being removed. This deletes the Firestore document only — the Firebase Auth account must be removed separately (`deleteUser()` client-side, Admin SDK for admins) or the user signs back in and `syncUserToDb()` recreates a blank profile.

**`spots` collection:**
```js
{ name, address, description,
  location: GeoPoint { latitude, longitude },
  category: 'sport' | 'nature' | 'culture' | 'hostelry',
  is_free, is_sunrise, is_sunset, has_shadow, has_natural_shadow,
  horizon_profile: [360], horizon_source, horizon_computed_at,
  images: [], web, created_at, updated_at }
```
> There is **no stored `sun_interval` field**. The sun window is derived live from
> the spot's location + today's date, so it tracks the season automatically:
> - **Card/list UI** (`SpotCard`, `SpotBottomSheet`) → `useSpotSunInterval()` — a
>   cheap, network-free approximation from the stored `horizon_profile`.
> - **Detail page** (`SolarInterval.vue`) → precise, network-aware computation.
>
> `horizon_profile` (360-value building horizon) is computed once on admin save and
> is the shared, date-independent input for both. See `docs/logic/sun-interval-logic.md`.

**`users` collection:**
```js
{ uid, email, name, role: 'admin' | 'user', avatar, // avatar is a number (1-12) matching 'avatar (N).png'
  profile: { type, answers },
  onboarding: { version, status, completed_at, answers },  // post-login questionnaire
  circadian: { /* battery test results */ },
  visited_spots: { [spotId]: timestamp },
  bookmarks: [],
  created_at, updated_at }
```

**`personal_spots` (localStorage only — stored by `usePersonalSpots`):**
```js
{ id, name, description, address,
  lat, lng,                             // flat numbers, NOT a GeoPoint
  category, is_free, is_sunrise, is_sunset, has_shadow, has_natural_shadow,
  spot_id, created_at, updated_at }     // timestamps are Unix ms (Date.now())
```
> `usePersonalSpots` reads/writes `localStorage` key `sunspot_personal_spots`. There is no Firestore write path for personal spots.

**`notifications` collection:**
```js
{ title, body, spotId,
  createdAt: serverTimestamp(),
  createdBy: uid,
  readBy: [uid, ...] }
```

> When modifying schemas, always ensure backward compatibility for existing user documents.

## Utils API

**`utils/geo.js`**
- `calculateDistance(lat1, lon1, lat2, lon2)` → distance in km (Haversine formula)

**`utils/image.js`**
- `getOptimizedImageUrl(url, width = 800)` → Cloudinary URL with `f_auto,q_auto,w_{width},c_limit`; falls back to `/sunspot-skyline.svg` for null/non-Cloudinary URLs; safe to call on already-optimized URLs (no double-transformation)

**`utils/map.js`** — shared by both map screens; see *Maps & PWA*
- `MAP_STYLE_URL` — the Jawg style, also preloaded in `index.html` (keep identical)
- `DEFAULT_VIEW` → `{ lat, lng, zoom }` for Valencia centre
- `loadLastView()` / `saveLastView(lat, lng, zoom)` → persisted opening view

**`utils/uv.js`**
- `clearSkyUV(date, lat, lng)` → estimated clear-sky UV index from the sun's height (SunCalc) plus a seasonal term, fitted against a year of Valencia data. Network-free; feeds `UVIntensityWheel`. It ignores clouds, and the fit is only valid around Valencia.

**`utils/download.js`**
- `downloadJson(data, filename)` — serialises with two-space indent and hands the browser a blob to save. The object URL is revoked on the next tick, not synchronously: revoking straight after `click()` cancels the download in some browsers.

**`utils/authCache.js`** — synchronous auth snapshot; see *Routing & Guards*
- `readAuthSnapshot()` → `null` (never seen) | `{ uid: null }` (signed out) | `{ uid, onboarded, userData }`
- `writeAuthSnapshot(patch, expectedUid)` — merges; no-ops if the identity changed under it
- `resetAuthSnapshot(uid)` — replaces wholesale; `null` records "signed out". Use on sign-in, sign-out, account switch

## Sun Exposure Engine

The core product differentiator: turn environment + user profile into a decision,
not a raw number. The full vision (Spanish pitch) is
[`docs/product/sun-exposure-engine.md`](docs/product/sun-exposure-engine.md);
what is still missing from it is tracked in [`docs/product/roadmap.md`](docs/product/roadmap.md).
**Only the part below is built** — don't describe the rest as existing.

**What ships today** — all of it on the spot detail page (`Spot.vue`):

| Module | Where | Output |
|---|---|---|
| **Quemadura** | `UVIntensityWheel.vue` | Minutes to redness + a risk level, from phototype × UV × exposed area × planned duration |
| **Vitamina D** | `DVitamin.vue` | Minimum and optimal dose in minutes, % reached |
| **Bronceado** | `DVitamin.vue` | Level (Suave · Ligero · Medio · Intenso · Máx) + how many 45-minute sessions to the next one |
| **Sol directo** | `SolarInterval.vue` | Today's direct-sun windows at the spot — see `docs/logic/sun-interval-logic.md` |

- **UV index** is a clear-sky *estimate* from `utils/uv.js` (sun position + season),
  not a live feed: it ignores clouds. No other environment data is fetched.
- **Phototype**: `data/skinTones.js` (Fitzpatrick I–VI with a `medConstant`; burn
  time = `medConstant / UVI`). Preloaded from the onboarding answer when there is
  one, otherwise picked on the wheel. ⚠️ `DVitamin.vue` keeps its own copy of the
  constants (`MED_CONSTANTS`) — change one, change the other.
- **Exposed area, hour of day, planned duration** are per-session controls on the
  wheel — nothing is persisted. The wheel emits `update`; `Spot.vue` passes the
  payload straight to `DVitamin`.
- **UX principle**: the user touches two sliders (hour + duration) and gets a
  decision; everything recalculates instantly.

**Not built**: live environment data, the 0–100 Sun Quality Score, the hourly UV
forecast with a best window, a persisted exposure profile, and spot ranking.

---

## Key Feature Flows

- **QR Scan**: `html5-qrcode` → spotId → `scanSpot()` in `useUser` → deduplication via `visited_spots` map → navigate to spot detail
- **Solar archetypes (legacy, read-only)**: the Crew questionnaire that wrote `user.profile` was removed; nothing sets it any more. `data/profiles.js` is still read to render an archetype that older accounts already have — `Profile.vue`, `Account.vue` and `ProfileSuggestions.vue` look up `user.profile.type` in it.

  **8 profile IDs**: `energy-seeker` · `sun-social` · `city-explorer` · `golden-hour` · `balance-mode` · `sun-routine` · `sun-crew` · `senior-sunspot` (fallback: `generic-sunspotter`)
- **Post-login Onboarding**: Router guard → `/bienvenida` (`data/onboardingQuestions.js`) → 4 ranking questions + 1 single-select → `users/{uid}.onboarding` via `useOnboarding()`. *Prompted* once per account — "Omitir" records `status: 'skipped'` so it stops appearing — but never locked away: a card on `/cuenta` reopens it, so a user who skipped can still answer and one who answered can redo it. A retake replaces the stored payload outright; its exits read "Cancelar" and write nothing, because recording `skipped` there would destroy good answers.

  **Ranking rules** (`OnboardingQuestion.vue`): one pick is enough to continue and options rank in tap order — ordering all of them is optional. An `isOther` option is the exception in the other direction: while it is selected its free-text field must be non-empty, since a bare `'other'` records nothing usable.

  **Answer field values** (ranking questions store an ordered array; `<id>_other` holds the free text typed when "Otra" is ranked, and is omitted when empty):
  - `spot_category`: `'sport'` · `'culture'` · `'hostelry'` · `'nature'` · `'other'`
  - `companions`: `'solo'` · `'couple'` · `'friends'` · `'family'`
  - `spot_features`: `'natural_shadow'` · `'shadow'` · `'wind'` · `'quiet'` · `'other'`
  - `season`: `'spring'` · `'summer'` · `'autumn'` · `'winter'`
  - `sun_sensitivity`: `1`–`6` (Fitzpatrick phototype; preloads the skin tone in `UVIntensityWheel`)

  Only `sun_sensitivity` is consumed today (it preloads the exposure wheel); the other answers are stored for future recommendations.
- **Circadian Battery**: Multi-step form → writes to `user.circadian` → 15-day cooldown enforced client-side
- **Explore Filters**: Firestore snapshot via `useSpots` + client-side filter (category, sunrise/sunset, shadow, access)
- **Personal Spots**: Full CRUD in `localStorage` via `usePersonalSpots`
- **Admin**: Role-gated dashboards for creating/editing spots and managing in-app notifications, plus an onboarding export on `/panel` — one-shot `getDocs` over `users`, compiled into `sunspot-onboarding-<date>.json` keyed by email (`useOnboardingExport`).

  Users with no `onboarding` field are counted in `totals.without_onboarding` rather than exported; `skipped` users are included, since declining is itself a signal. An email shared by two accounts (different auth providers) falls back to an `"email (uid)"` key so neither row is silently overwritten, and every row carries its `uid`.

  ⚠️ The file contains email, name, and `sun_sensitivity` (a Fitzpatrick phototype — health-adjacent), unencrypted, on the admin's device. Note also that it needs no special rule: `/users` grants `read` to any signed-in user, which in Firestore covers `list`, so this data is already reachable from the SDK by any logged-in account.

## Global CSS Utilities

Defined in `src/style.css`. Use these before writing new CSS.

**Button classes** (fully styled, hover + active states included):
- `.btn-primary` — solar gradient, orange glow shadow
- `.btn-secondary` — warm cream background, orange border on hover
- `.btn-text` — transparent, muted text, cream hover
- `.btn-google` — surface card, subtle border
- `.btn-close` / `.btn-back` — 40×40 circular icon button; add `.btn-glass` for glassmorphic overlay variant (e.g. over hero images)

**Bottom sheet pattern** (overlay + slide-up panel):
- `.sheet-overlay` — fixed fullscreen backdrop with blur
- `.bottom-sheet` — surface panel (`--clr-white`), `border-radius: 32px 32px 0 0`, max 90dvh
- `.sheet-handle` — drag indicator pill
- `.sheet-content` — scrollable padded body
- `.sheet-header` / `.sheet-title` / `.sheet-subtitle` — standard header layout
- `v-drag-close="() => $emit('close')"` — add to the `.bottom-sheet` element to enable drag-down-to-dismiss (touch anywhere; mouse from the handle/header below 1024px). Global directive from `directives/dragClose.js`; the value is the close callback. Content scrolls normally and only starts dragging the sheet when `.sheet-content` is at the top. It also gives every sheet **Escape to close** (top-most sheet only) and, on desktop, moves focus into the sheet on open and back to the trigger on close.
- **Desktop (≥ 1024px)**: the same markup renders as a **centred dialog** (max 560px, rounded, no handle) — see *Desktop layout*. A page-scoped `.sheet-overlay` override that pins the sheet low needs a desktop counterpart (`PersonalMap.vue` has one).

**Utility classes:**
- `.no-scrollbar` — hides scrollbar visually, scroll still works
- `.sunrise` — colors text `var(--clr-sunrise)`
- `.sunset` — colors text `var(--clr-sunset)`

**Key layout tokens:**
- `--max-width: 768px` — app container width; content is centered and capped at this width. The app stays full-bleed below it (mobile layout unchanged); between 768 and 1023px the centered band shows with canvas on either side. At ≥ 1024px `#app` is uncapped and this width becomes the default *content column* next to the sidebar — see *Desktop layout*.
- `--max-width-wide: 768px` — cap for map-first pages. Routes with `meta.wide` (currently `home`, `personal-map`) get the `app--wide` class on `#app` (toggled in `App.vue`), which overrides `--max-width` to this value so the sheets/drawer widen together. It currently matches `--max-width` — the whole app, maps included, stays in one band — but stays a separate token so the map pages can widen again without touching every other page.
- `--max-width-chrome: 768px` — cap for the bottom nav *items* (`Nav.vue` `.nav-inner`), centered regardless of the page's `--max-width`. The nav *bar* (`.bottom-nav`) itself spans the full `--max-width` band — only its inner content is capped.
- `--max-width-search: 640px` — cap for the home search input (`SearchBar.vue` `.search-container`). The home `.floating-header` spans the full band (menu button far left, avatar far right); only the search is capped.
- `--max-width-page: 1240px` — desktop only: content column for routes with `meta.desktopWide` (see *Desktop layout*).
- `--sidebar-width: 248px` / `--sidebar-width-rail: 84px` — desktop sidebar; the rail applies between 1024 and 1279px.
- `--nav-height: 64px` — bottom nav bar height (**0 on desktop**, where there is no bottom nav — every `--total-nav-height` offset collapses with it)
- `--total-nav-height` — nav + safe area bottom (use for scroll padding)
- `--safe-area-*` — iOS/Android inset vars, already applied to `body`
- `--transition: 0.2s ease-in-out` — standard transition duration

## Theming (light / dark)

`/ajustes` carries a **Modo oscuro** toggle. The route is public: appearance and
geolocation are device preferences, so the page renders for guests too and the
account rows (avatar, display name) are `v-if="isLoggedIn"`. `MenuDrawer` links
to it for everyone.

**Why it exists.** Chromium's *Auto Dark Theme* (Samsung Internet's "dark mode",
Chrome's `force-dark`) auto-inverts any page that declares no colour scheme of
its own. On an Android phone in dark mode that turned the map markers muddy
brown and the legend near-black. Declaring `color-scheme` is what actually turns
that off; shipping a real dark theme is what makes the result look intended.

**How it works.**
- `src/style.css` defines every semantic token twice: `:root` (light) and
  `:root[data-theme="dark"]`. The brand ramp (`--clr-sunspot-*`) and the
  category hues (`--cat-*`) are shared — the same values paint the map markers,
  and the map tiles stay light in both themes.
- `color-scheme` is `only light` / `only dark`, never a bare `light`. The `only`
  keyword is the documented opt-out from Auto Dark Theme; without it a user who
  picks light in `/ajustes` while their browser forces dark gets the inverted
  page back.
- **Preference states**: `'light'` / `'dark'` stored under `sunspot_theme` are an
  explicit choice; *nothing stored* means follow `prefers-color-scheme`, which is
  the default and the reason a dark-mode phone gets the dark theme unprompted.
- The attribute is set **before first paint** by a small inline script in
  `index.html`, not by the bundle — by the time the bundle runs the page has
  already painted. ⚠️ That script duplicates the storage key and the resolution
  rule from `composables/useTheme.js`. Change one, change the other.
- `useTheme.js` also rewrites `<meta name="theme-color">`, which is what colours
  the Android browser chrome; CSS can't reach it. The **PWA manifest**
  `theme_color` in `vite.config.js` is separate — that's the installed app's
  identity and stays brand orange.

**Writing themeable CSS.** Reach for a token, never a literal:

| Need | Token |
|---|---|
| Elevated surface (card, sheet, nav bar) | `--clr-white` — read it as "surface"; it is dark in dark mode |
| Page / app background | `--clr-background`, `--clr-canvas` (outside the band) |
| Body text / headings / muted | `--clr-text` · `--clr-dark` · `--clr-text-muted` |
| Frosted panel | `--clr-glass`, `--clr-glass-strong`, `--clr-glass-border` |
| Status fills | `--clr-success` · `--clr-warn` · `--clr-danger` · `--clr-info` (+ `-soft` tints), `--clr-neutral-soft` |
| Form fields | `--clr-input-bg`, `--clr-input-bg-focus`, `--clr-input-border` |
| Per-card accents on `/cuenta` | `--clr-accent-purple`, `--clr-accent-teal`, `--clr-quiet`, `--clr-info` |
| Text on brand orange / an image / a fixed dark surface | `--clr-on-brand` — the one colour that never flips |
| Shadows, overlays | `--shadow-sm/md/md-up`, `--overlay` |

- `color: white` on a coloured fill is `--clr-on-brand`, **not** `--clr-white`:
  the latter becomes a dark surface and the text vanishes.
- Tint a token instead of hardcoding its rgba: `color-mix(in srgb, var(--clr-primary), transparent 90%)`.
- A CSS `var()` does **not** work in an SVG presentation attribute — put the
  `stroke`/`fill` in a scoped rule and give the element a class
  (`.wheel-track` in `UVIntensityWheel`, `.sun-dot` in `SolarInterval`).
- Deliberate exceptions, left fixed in both themes: the map markers, legend
  hues and GPS dot (they sit on light tiles either way), `Scan.vue` (it frames a
  camera feed), the UV / tanning / circadian / solar-interval data scales, the
  destructive red on `/personal-spots`, and third-party brand colours (Google
  blue, Instagram, WhatsApp, YouTube).

## Design System & Premium Aesthetics

- **Palette**: Orange, white, yellow, black — defined as CSS custom properties in `src/style.css`, in two themes (see *Theming (light / dark)* for which token to reach for)
- **Premium gradient**: `linear-gradient(135deg, var(--clr-sunspot-400), var(--clr-primary))`
- **Glassmorphism**: `background: var(--clr-glass); border: 1px solid var(--clr-glass-border); backdrop-filter: blur(12px)` — never the raw `rgba(255,255,255,…)`, which stays white in dark mode
- **Interactive states**: hover → `transform: translateY(-4px) scale(1.02)` + updated shadow; click → `transform: scale(0.97)`
- **Category badges**: icon + label inside one pill, `gap: 6px` — no loose icon elements
- **Category colors**: CSS vars `--cat-hostelry`, `--cat-culture`, `--cat-nature`, `--cat-sport` — use `color-mix()` or `useTranslator` lookups, never hardcode per-category hex values
- **No emojis**: Use icons instead. Limit emoji as much as possible

## Health & Safety Language

SUNspot is not a medical product and the team are not qualified health professionals. All sun-exposure output must inform and facilitate — never prescribe or command.

**Allowed verbs**: indicar, sugerir, estimar, calcular, mostrar, orientar.
**Forbidden verbs**: recomendar (as a command), necesitar, deber, tener que — and any phrasing that tells the user what to do as fact.

**Concrete rules:**
- Never recommend SPF, sunscreen, or any medical product. That is a clinical decision.
- Never use imperative commands for health actions ("usa", "aplica", "necesitas"). Use conditional or informational phrasing instead ("tu piel toleraría", "estimamos", "considera").
- Phrase output as estimates, not guarantees: "quemadura estimada en ~X min", not "te quemarías en X min".
- If the situation is high-risk, surface the data clearly and let the user decide. Do not prescribe an action.

## Coding Standards

1. **SFC**: Always `<script setup>` — no Options API, no defineComponent
2. **i18n**: All user-facing text through `useTranslator` composable — no hardcoded Spanish strings in templates
3. **Reusability**: Extract to a composable when logic is used in more than one place
4. **Images**: Always serve via `getOptimizedImageUrl()` from `utils/image.js` (Cloudinary `f_auto`, `q_auto`)
5. **Firebase**: Follow patterns in `firebase.js`; Firestore access uses `db` export
6. **XSS**: Never use `v-html` with user-generated content
7. **Mobile-first, desktop-checked**: Test on small screen first, then at ≥ 1024px (see *Desktop layout*); `user-scalable=no` on map viewport
8. **Social handles**: Render clean `@username` via `socialHandle` parsing — never raw URLs or static platform names

## Desktop layout (≥ 1024px)

One app, two compositions. Below **1024px** the app is exactly the mobile app
(the desktop work was verified pixel-identical at 360–768px); at 1024px and
above it switches to a desktop composition. Same routes, same components, same
composables — no second app and no duplicated business logic.

**Breakpoint.** `DESKTOP_MIN_WIDTH = 1024` in `composables/useViewport.js`. CSS
can't import it, so stylesheets use the literal `@media (min-width: 1024px)`
(`grep -rn "min-width: 1024px" src`). Use `useViewport().isDesktop` only when the
*structure* differs (a component rendered or not); purely visual changes go in a
media query.

**Shell** (`App.vue` + `style.css` › *Desktop*):
- `DesktopSidebar.vue` replaces the bottom nav (`Nav.vue`, hidden by CSS) and the
  menu drawer (`MenuDrawer.vue`, not rendered). It carries every destination of
  the nav, the drawer and the avatar menu: Mapa, Explorar, Suncronización,
  Embajadores · Mi cuenta, Mis favoritos (signed in), Personal spots, Ajustes,
  Panel Admin (admins) · user card + Cerrar sesión, or Iniciar sesión. Between
  1024 and 1279px it collapses to an icon rail with tooltips.
- `router-view` sits in `.app-view`. On mobile it is `display: contents`, so
  pages are still direct children of `#app` and nothing moves. On desktop it is
  the content column next to the sidebar, sized by route meta:

| Route meta | Desktop column | Routes |
|---|---|---|
| *(none)* | 768px, centred — the band the page was designed in | most pages (settings, auth, circadian, profile, notifications, admin forms…) |
| `desktopWide: true` | `--max-width-page` (1240px); the page lays itself out in a grid | `explore`, `spot`, `account`, `bookmarks`, `personal-spots`, `ambassadors`, `dashboard` |
| `wide: true` | full width | `home`, `personal-map` |
| `chrome: false` | no sidebar (focused flow) | `onboarding` |

- `--nav-height` is `0` on desktop, so paddings built on `--total-nav-height`
  need no desktop override.
- Keyboard: a global `:focus-visible` ring (brand orange) for links, buttons and
  fields; sheets close with Escape (see *Bottom sheet pattern*).

**Per page:**
- **Home** — `MapExplorerPanel.vue` (search, the list of every spot, and the
  selected spot's preview) next to the map. The preview body is
  `SpotPreview.vue`, shared with the mobile `SpotBottomSheet.vue`; search
  matching is `utils/spotSearch.js`, shared with `SearchBar.vue`. Selection lives
  in `Home.vue` and reaches `Map.vue` through `v-model:selected-spot`, so a
  marker click and a row click are one action; hovering a row enlarges its
  marker. The map gets zoom buttons, a `ResizeObserver` (the container resizes
  without a window resize), and skips the mobile `-0.002` latitude offset that
  keeps a marker above the bottom sheet. The weather sheet opens as a dialog and
  leaves the selection alone. `Home.vue` keeps the `Map` in the same place in
  the tree on both layouts, so crossing the breakpoint never re-creates it.
- **Explore** — filters always visible in a sticky side panel
  (`ExploreFilterControls.vue`, the same controls the mobile sheet renders),
  cards in an auto-fill grid, live result count.
- **Spot** — framed gallery with previous/next buttons and ←/→ keys (shown on
  `(hover: hover) and (pointer: fine)` devices, so touch phones are unchanged);
  a grid places the exposure wheel beside the vitamin D / tanning cards it
  drives. DOM order is the mobile order.
- **Account** — content | actions columns (`display: contents` wrappers on
  mobile). **Bookmarks, Ambassadors, Personal spots, Admin dashboard** — grids.
- **Download** — offers *Instalar en este ordenador* when the desktop browser
  fired `beforeinstallprompt`.

**Adding a page:** it works on desktop as-is in the 768px column. If it is a
list or a dashboard, add `desktopWide: true` and a `@media (min-width: 1024px)`
grid at the end of its `<style>` (after the base rules — same specificity, so
order decides). A wrapper with `margin: 0 auto` inside the flex column
shrink-wraps: give it `width: 100%`.

## Maps & PWA

- Service Worker via Workbox (Vite PWA Plugin), configured in `vite.config.js`
- Runtime caches (all `CacheFirst`, bounded + `purgeOnQuotaError` so the browser reclaims them first under storage pressure):
  - `jawg-map-tiles` — Jawg tiles/style/glyphs; 200 entries, 14-day expiry
  - `local-images` — `/avatars/**` + `/ambassadors/**`, cached on demand; 30 entries, 30-day expiry
  - `cloudinary-spot-images` — Cloudinary spot images (`res.cloudinary.com`); 60 entries, 30-day expiry
- Precache (app shell) excludes `avatars/**` and `ambassadors/**` (`globIgnores`) — these heavy images are runtime-cached on demand rather than shipped in the install, keeping the PWA lightweight
- **Map Coverage**: Valencia + 20km radius limit
  - Panning is strictly bounded (`maxBounds`) to a 20km box around the city center.
  - If a user is outside this 20km radius, the GPS blue dot/circle is not shown, the `map-btn` locate button is hidden, and the last view is not saved.
- **Map loading path** — both map screens (`components/home/Map.vue`, `views/pages/PersonalMap.vue`) share `utils/map.js`:
  - The Jawg style URL lives in `MAP_STYLE_URL`, and is **also preloaded in `index.html`** so the fetch starts during HTML parse instead of after the bundle mounts. Keep the two copies byte-identical or the preload is wasted.
  - The map opens on the last known view (`sunspot_last_view` — centre *and* zoom, via `loadLastView()`; falls back to the legacy `sunspot_last_location` array, then to Valencia centre) so the first tile set fetched is usually the one that's kept.
  - The skeleton is dismissed on the MapLibre GL map's `load` event (first visually complete frame), **not** `idle` (which waits for every pending tile). 3s timeout as a safety net.
  - The first GPS fix uses `setView` while the skeleton is up and `flyTo` only after reveal — animating during load fetches a whole extra tile set for a movement nobody sees.
- **Chunking** (`build.rollupOptions.output.manualChunks` in `vite.config.js`): `maplibre`, `leaflet`, `vue` and `firebase-sdk` are split out of the app chunk.
  - `vue`/`leaflet`/`maplibre` are statically imported and `modulepreload`ed, so splitting them doesn't shorten the pre-mount path — it keeps a code-only deploy from invalidating precached vendor code.
  - `firebase-sdk` **is** off the critical path (see *Routing & Guards*). The pre-mount graph is `index + vue + leaflet + maplibre` ≈ 386KB gzipped; adding a static Firebase import anywhere in it would push that back to ~496KB.
  - Verify with `npm run build`: the `modulepreload` links in `dist/index.html` are exactly the pre-mount graph.
- **Install flow** (`/descargar`, state in `composables/usePwaInstall.js`) — Android picks one path, in order:
  - `beforeinstallprompt` captured → **Descargar App** button. It always wins, whatever the browser.
  - OEM/lite browser (`androidBrowser === 'other'`: Mi, Huawei, UC…) → **Abrir en Chrome** via an `intent://` link (Play Store fallback). The same button appears in the in-app-browser card.
  - Chromium/Samsung: a short "Preparando…" wait (`installCheckDone`, 4s after `load`), then per-browser menu instructions plus the **"¿No aparece la opción?" incompatibility card**. That card is the fallback for devices that never fire the prompt (Android Go / no Google services, Custom Tabs opened from WhatsApp/Gmail). It's hidden after a dismissed prompt (`wasDismissed`), because Chrome withholds the event for a while after a dismissal.
  - Firefox never fires the event, so it goes straight to its own menu instructions.
  - `hasInstalledApp` (via `getInstalledRelatedApps` + the manifest's `related_applications` webapp entry) catches "installed, but opened in the browser" before any of the above.
- **Offline**: the app shell is precached, so every route loads; cached map tiles and images render; personal spots work fully (`localStorage`). Firestore has no offline persistence configured, so spots and the user document need a connection.
- **App icons**: generated from `public/icon.svg` via `pwa-assets.config.js` (see `docs/dev/commands.md`). The source has the skyline safe-zone baked in (full-bleed gradient, logo inset ~10%) and all icons generate with `padding: 0` so the gradient fills the whole icon edge-to-edge — no white float on iOS, no crop on Android's round mask.

## Environment

`.env` (never committed) — contains `VITE_JAWG_MAPS_TOKEN` and the Firebase config (`VITE_FIREBASE_*`); `.env.example` lists the names. `src/firebase.js` and `utils/map.js` read them through `import.meta.env`, and `index.html` through `%VITE_JAWG_MAPS_TOKEN%`. Never hardcode these values back into the source: they must stay out of the repo and out of any source deposit. They are still public in the built bundle, so the real protection is the Firestore rules plus domain restrictions on the keys. Credentials are **not** in this repo; see `docs/dev/environment.md` for where the services live and how to get access.

The same variables must exist on the host: a build without them ships an app with no Firebase config and no map. The build log warns when any required one is missing (`envCheck` in `vite.config.js`), `firebase.js` throws a message naming the missing variables instead of the SDK's opaque `auth/invalid-api-key`, and the app degrades visibly rather than silently: `firebaseLazy.js` exposes `firebaseStatus` (`'idle' | 'ready' | 'unavailable'`), `App.vue` shows a banner when it is `'unavailable'`, the router guard lets public routes through and sends protected ones home (it used to abort every navigation — the page looked fine but no link worked), a route that can't load shows a toast, and both maps show a notice when their base style fails to load.

**Hosts.** Netlify (the live mobile app, `public/_redirects`) and Vercel (`landing-sunspot`, built from `alejandrogonjov/LANDING-SUNSPOT`, SPA rewrite in `vercel.json`). Per-host setup — env vars, Firebase authorized domains, API-key referrers, Jawg allowed domains — is in `docs/dev/environment.md`.

**Stale chunks after a deploy.** A tab opened on the previous build asks for chunk hashes that no longer exist; `router.onError` reloads once into the target URL instead of leaving the click dead.

**Deployment.** The live app (https://sunspot-vlc.netlify.app/) is hosted on Alejandro's Netlify account, which builds from Alejandro's GitHub repository — a fork of Kevin's private repo (`kevjrmy/SunSpot`, the `origin` remote). Pushing to `origin/main` therefore deploys nothing by itself: a change goes live only once the fork (`alejandrogonjov/SUNspot_MVP`) is synced and Netlify rebuilds. The sync is Alejandro's step, not Kevin's — `gh api repos/alejandrogonjov/SUNspot_MVP/commits/main --jq .sha` shows which commit the fork is on. GitHub's "Sync fork" copies branches but not tags, and Netlify must already hold the `VITE_*` variables a commit expects before that commit is synced. Check a deploy from outside by fetching the live `index.html`: an unreplaced `%VITE_JAWG_MAPS_TOKEN%` or an `undefined` in the bundle means the variables are missing.

## Commands

```bash
npm run dev       # Vite dev server (http://localhost:5173)
npm run build     # Production build
npm run preview   # Preview production build locally
```

- No lint or test scripts are configured.
- Do not run `npm run dev` — the dev server is started from the IDE when needed.
- Do not run `npm run build` to verify changes; read the code instead.
- **IP deposit**: source archives are built with `git archive` from a version tag into `deposit/`, which is gitignored — never commit its contents. A deposit is identified by its tag, states its authors in `AUTHORS.md`, and its zip must stay byte-for-byte; don't regenerate one that has already been sent. Any change to a tracked file after tagging means a new tag, zip, hash and timestamp, so finish every edit before tagging. Procedure and the log of deposits: `docs/dev/commands.md`.

## Development Guidelines

### Branching
- `feature/description` — new features
- `fix/description` — bug fixes
- `hotfix/description` — production fixes

### Commits (Conventional)
- `feat:` · `fix:` · `chore:` · `docs:` · `refactor:`

### Code Review
- Test on mobile device before merging
- Squash-merge to `main`
- Delete branch after merge
- Check `docs/product/roadmap.md` before starting major tasks for roadmap alignment
