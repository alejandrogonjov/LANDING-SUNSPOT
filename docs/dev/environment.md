# Environment & Accounts

Where the project's services live. **No secrets in this file** — see below.

## Services

| Service | Where |
|---|---|
| Firebase console | https://console.firebase.google.com/project/sunspot-b9a0c/overview |
| Firebase project id | `sunspot-b9a0c` (pinned in `.firebaserc`) |
| Live app (Netlify) | https://sunspot-vlc.netlify.app/ — on Alejandro's Netlify account, built from his GitHub fork (`alejandrogonjov/SUNspot_MVP`) of `kevjrmy/SunSpot` |
| Netlify (legacy deploy) | https://monumental-souffle-ed2f95.netlify.app/ |
| Shared team account | `sunspot.vlc@gmail.com` |

## Secrets

Credentials are **not stored in this repository**. That includes the shared
account password, its access key and 2FA recovery codes, and the Jawg Maps API
token. Keep them in the team password manager and ask a maintainer for access.

Local development needs a `.env` file (git-ignored). Copy `.env.example` and
fill in the values:

```
VITE_FIREBASE_API_KEY=…
VITE_FIREBASE_AUTH_DOMAIN=…
VITE_FIREBASE_PROJECT_ID=…
VITE_FIREBASE_STORAGE_BUCKET=…
VITE_FIREBASE_MESSAGING_SENDER_ID=…
VITE_FIREBASE_APP_ID=…
VITE_FIREBASE_MEASUREMENT_ID=…
VITE_JAWG_MAPS_TOKEN=…
```

### Vercel (`landing-sunspot`, the desktop-layout repo)

`alejandrogonjov/LANDING-SUNSPOT` deploys to the Vercel project
`landing-sunspot`. A deploy there needs the same setup as Netlify, or it ships
an app that renders but can do nothing — no spots, no sign-in, no map tiles,
and (before the guard fix) no navigation at all:

1. **Environment variables** — Project → Settings → Environment Variables: the
   eight `VITE_*` names above, for *Production* and *Preview*. Then redeploy:
   Vite inlines them at build time, so an existing build never picks them up.
   The build log warns (`⚠ SUNspot: faltan variables de entorno…`) when any of
   them is missing.
2. **Firebase Auth** — Firebase console → Authentication → Settings →
   *Authorized domains*: add the Vercel domain(s) (`*.vercel.app` previews are
   per-deployment; add the production domain at least). Without it Google
   sign-in fails on that host.
3. **API key restrictions** — if the Firebase browser key is restricted by HTTP
   referrer (Google Cloud console → Credentials), add the Vercel domain, or
   every Firestore/Auth request from it is rejected.
4. **Jawg token** — add the Vercel domain to the token's allowed domains in the
   Jawg Lab, or the map shows only its background.

`vercel.json` holds the SPA rewrite (every path → `index.html`). It is the
Vercel equivalent of `public/_redirects`, which only Netlify reads; without it
a reload or a shared link to `/explorar`, `/spot/:id`… returns Vercel's 404.

**Netlify needs the same eight variables** (Site configuration → Environment
variables on Alejandro's account). Vite inlines them at build time, so a build
without them deploys an app with no Firebase config and no map — set them
*before* syncing the fork with a commit that expects them.

These are client-side values: they end up readable in the built bundle. Keeping
them out of the source keeps them out of the repo and out of source deposits;
it does not make them private. What protects the data is `firestore.rules`,
plus restricting the Firebase API key and the Jawg token to our domains in
their respective consoles.

> **History note.** Until commit `34f19bc` (2026-09-02), `docs/dev/doc.md` and
> `docs/backups/Backup-codes-sunspot.vlc.txt` held those values in plaintext and
> were committed. Deleting them removed them from the working tree, **not
> from git history** — anyone who can clone the repo can still read them with
> `git log -p`. Treat every value that was in those files as compromised and
> rotate it: the shared account password, its access key, the 2FA recovery
> codes, and the Jawg token.
