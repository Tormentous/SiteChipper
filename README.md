# Coolbrador

A static HTML/JS social site on Firebase Hosting, Auth and Firestore, including
the Chipper in-game (Miiverse-style) feed.

## Local development

Requirements: Node 20+ and Java 21 (`mise install` reads `mise.toml`).

```sh
npm ci
npm run dev     # Auth/Firestore/Storage emulators + dev server on :8000
npm run serve   # dev server only, against production Firebase
npm test        # security-rules tests against the emulators
```

`tools/dev-server.mjs` mirrors the `firebase.json` Hosting routing (redirects,
static files, rewrites, 404). In emulator mode it proxies the emulators on the
same origin and injects `window.__CB_EMULATOR__`, which `js/firebase.js` uses to
connect to them, so local and preview sessions never touch production data.
Emulator data persists in `.emulator-data/` (delete it to start fresh).

## Deploying

```sh
firebase deploy --only hosting,firestore:rules,storage,functions
```

Hosting predeploy runs `npm run build` to generate `.hosting/` with public files
only. Functions predeploy packages the preserved game archives. Live game URLs
reach Functions rather than stale static files. `npm run build:archive` can build
an archived-feed artifact for inspection, but standard deployment rebuilds live mode.

## Shared social features

See [social deployment and migration](docs/SOCIAL-DEPLOYMENT.md) before deploying
the new rules. Existing profiles must be sanitized before opening public reads.
Progress and known baseline issues are in [the work log](docs/SOCIAL-READINESS.md).
