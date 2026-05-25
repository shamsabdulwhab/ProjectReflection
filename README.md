# REFLECT — Group reflection sessions
## Overview
REFLECT is a tool for group feedback. A host starts a session, participants join on their phones, and everyone rates each other using sliders. The app then shows the average results as simple concentric rings—from core to distant—for easy group reflection.


---

The app is designed to:

- **Lower the barrier** to structured peer feedback in a room or remote setting
- **Keep the flow simple** — join via link or QR, rate others when the host starts the assessment
- **Show patterns at a glance** — averages drive placement on shared rings for discussion and reflection

This project supports research into **how groups perceive closeness or alignment** and how that can be surfaced constructively in a session.

---

## Features

- **Home & host join** — start a session from the web app; editable session title
- **QR code** — participants scan to open the phone join URL (configurable public origin via env)
- **Phone join** — name entry, Firestore participant registration, auto-redirect when assessment starts
- **Feedback** — per-participant sliders (0–100) rating others; scores synced to Firestore in real time
- **Visualisation** — live averages grouped into rings (Core, Close, Immediate, Far, Distant)
- **Firebase (Firestore)** — sessions, participants, rater scores, and host “assessment started” flag

---

## Session flow 

End-to-end flow in the current prototype:

1. Host opens **Join** — session document is ensured in Firestore; QR points to `/session/:sessionId/join`
2. Participants **Phone join** — they register under `sessions/{sessionId}/participants`
3. Host clicks **Start assessment** — `assessmentStarted` is set on the session document
4. Participants are routed to **Feedback** — each rater’s scores are stored under `sessions/{sessionId}/raterScores`
5. **Visualisation** subscribes to participants and scores and **computes averages** → ring placement

The default demo session id in code is `DEFAULT`; `/visualisation` redirects to that session’s visualisation route.

---

## Tech stack

- React 19, TypeScript
- Vite 8
- React Router 7
- Firebase (Firestore)
- `react-qr-code` for QR generation

---

## Quickstart

### Requirements

- **Node.js** (recommended: latest LTS)
- A **Firebase** project with Firestore enabled

### Environment variables

Create a `.env`  in the project root with your Firebase web app config:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Optional — if your deployed URL differs from where you run the dev server, set the origin used in QR links:

```bash
VITE_PUBLIC_ORIGIN=https://your-domain.example
```

### Install and run

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

### Deploy on Netlify

The site is configured for [Netlify](https://www.netlify.com/) via `netlify.toml` (build `dist`, SPA fallback for React Router).

1. In Netlify: **Add new site** → **Import from Git** → select this repository.
2. **Site configuration → Build & deploy → Build settings** (must match `netlify.toml`):
   - **Build command:** leave empty to use `netlify.toml`, or `npm ci --include=dev && npm run build`
   - **Publish directory:** `dist` (not `.` and not blank if the UI defaulted to repo root)
   - **Base directory:** leave empty
3. Build settings in `netlify.toml` run a full Vite build into `dist/`.
4. Under **Site configuration → Environment variables**, add the same `VITE_*` values as in `.env` (Firebase config and, if needed, `VITE_PUBLIC_ORIGIN`).
5. Set `VITE_PUBLIC_ORIGIN` to your Netlify URL (e.g. `https://your-site.netlify.app`, no trailing slash) so QR codes point at production.
6. In the [Firebase console](https://console.firebase.google.com/), add that domain under **Authentication → Settings → Authorized domains** (and ensure Firestore rules allow your app).
7. **Deploys → Trigger deploy → Clear cache and deploy site** after fixing publish directory.
8. In the deploy **file browser**, open `assets/` — you should see **many** `.js` / `.css` files (not only two). The build log should list Vite chunk sizes like `dist/assets/index-….js`.

**MIME type / module script errors** — the browser asked for a `.js` file but got HTML. Usually:

- **Publish directory** must be `dist` (set in `netlify.toml`; do not override to `.` or repo root in the Netlify UI).
- **Build** must succeed (`npm run build` produces hashed files under `dist/assets/`).
- **Do not set** `VITE_BASE_PATH` on Netlify unless the site lives in a subdirectory.
- Remove any **forced** `/* → /index.html` redirect in the Netlify UI that overrides `netlify.toml`.

---

## Repository structure

```text
.
├── src/
│   ├── App.tsx                 # Routes
│   ├── main.tsx                # Entry
│   ├── lib/firebase.ts         # Firebase init + Firestore export
│   ├── components/             # Shared UI (e.g. slider, editable title)
│   └── pages/
│       ├── Home.tsx            # Landing — “Start the session”
│       ├── Join.tsx            # Host: QR, participant list, start assessment
│       ├── PhoneJoin.tsx       # Participant join + name
│       ├── feedback.tsx        # Sliders / peer ratings
│       └── Visualisation.tsx   # Ring view from aggregated scores
├── package.json
├── vite.config.ts
└── netlify.toml                # Netlify build + SPA redirects
```

---

## Design principles

### Session-first, low friction

Participants only need a link or QR and a name; the host controls when rating begins.

### Real-time, transparent aggregation

Firestore listeners keep lists, scores, and the visualisation in sync across devices.

### Research-oriented

The UI encodes a simple model (slider → average → ring) so sessions can be repeated and compared in studies.

---

## Status

This repository is a **focused frontend + Firestore prototype** for group reflection sessions.


---

## Future work

- Multiple concurrent sessions 
- Improving authentication and security for real-world use
- UX polish and mobile layouts
- Refining the user interface, and ensuring better accessibility so all participants can engage easily.
---

## Acknowledgements

This project was developed as part of my learning journey at Fontys University of Applied Sciences

## Visualization Example
[View the images] (./src/assets/img)
