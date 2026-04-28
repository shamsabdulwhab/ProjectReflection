# URL + QR setup (Admin `/join` + iPhone join link)

This project has **two screens**:

- **Admin (laptop / big screen)**: `/join`
- **Participant (phone / small screen)**: `/session/<sessionId>/join`

## Routes (React Router)

Defined in `src/App.tsx`:

- `/` → Home
- `/join` → Admin screen (`Join.tsx`)
- `/session/:sessionId/join` → Phone join form (`PhoneJoin.tsx`)
- `/session/:sessionId/join/feedback` → Feedback page

`:` means “URL parameter placeholder”. Example: `:sessionId` becomes `DEFAULT` when the URL is `/session/DEFAULT/join`.

## What we fixed (why `/join` was 404)

If Vite is configured with a non-root base like `/project-reflection-main/`, then the dev server expects URLs like:

- `/project-reflection-main/join`

So opening `/join` directly can 404.

We updated `vite.config.ts` so:

- **Dev** uses `base: '/'` → clean local URLs like `/join`
- **Production** keeps `base: '/project-reflection-main/'` (for subpath deployments)

## Why iPhone couldn’t open the QR link

The admin page originally generated the QR link from `window.location.origin`, which in dev is usually:

- `http://localhost:5173`

On iPhone, **`localhost` means the iPhone itself**, not your laptop, so the link fails.

We updated `src/pages/Join.tsx` to prefer an env override:

- `VITE_PUBLIC_ORIGIN` (if set) is used as the QR “origin”
- otherwise it falls back to `window.location.origin`

## Step-by-step: run admin on laptop + join on iPhone

### 1) Start the dev server with LAN access

Run:

```bash
npm run dev -- --host
```

Vite will print two URLs:

- Local: `http://localhost:5173/`
- Network: `http://<your-laptop-ip>:5173/`

### 2) Set the QR origin to the Network URL

Create **`.env.local`** in the project root (recommended), and set:

```bash
VITE_PUBLIC_ORIGIN="http://<your-laptop-ip>:5173"
```

Notes:
- Use the **same port** Vite prints (usually `5173`).
- Do **not** commit `.env.local` (keep secrets local).

### 3) Restart the dev server

Stop and rerun the dev server after changing env vars:

```bash
npm run dev -- --host
```

### 4) Open the admin screen (laptop)

Open:

- `http://localhost:5173/join`

This page shows the QR code and the participants list.

### 5) Scan QR with iPhone

The QR should now open something like:

- `http://<your-laptop-ip>:5173/session/DEFAULT/join`

Enter a name to join. The admin page should update the participants list.

## Troubleshooting checklist (if iPhone still can’t open)

- **Same Wi‑Fi**: laptop + iPhone must be on the same network.
- **Firewall**: allow inbound connections to Node/Vite on port `5173`.
- **Wrong origin**: if the QR still shows `localhost`, `VITE_PUBLIC_ORIGIN` wasn’t picked up (restart dev server).
- **Wrong port**: make sure `VITE_PUBLIC_ORIGIN` uses the exact port Vite is running on.

