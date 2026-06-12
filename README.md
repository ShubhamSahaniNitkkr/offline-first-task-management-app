# Shubham Sunny Shop — Offline-First Ecommerce

## Concept (what this project is)

**Offline-first architecture** — the browser’s local database (IndexedDB via **Dexie**) is the **source of truth for writes**. The UI never waits on the network. Every user action is saved locally first, then an **operation queue** syncs to the server when connectivity is available.

**Pattern in one line:** *Optimistic local write → enqueue mutation → background sync (push/pull) → eventual consistency.*

| Layer | Technology | Role |
|-------|------------|------|
| UI | Astro + React 18 + Mantine | Shop, cart, wishlist, orders |
| Client state | Redux Toolkit + RTK Query | Sync status, server cache, offline-aware API layer |
| Offline storage | Dexie (IndexedDB) | Products, cart, wishlist, orders, pending operations |
| Sync | Custom sync engine | Batch `POST /sync/push`, incremental `GET /sync/pull`, retry with backoff |
| PWA | Service Worker (Workbox) | App shell + asset caching for installable offline use |
| API | Express + SQLite | Auth, catalog, orders, sync endpoints |

## What this project demonstrates (capabilities)

1. **Browse & shop without internet** — product catalog served from IndexedDB when offline (RTK Query offline-aware `baseQuery`).
2. **Cart & wishlist offline** — add, update, remove items locally; changes persist across refresh.
3. **Checkout while offline** — orders saved locally with `syncStatus: pending` and pushed when back online.
4. **Operation queue** — cart/order mutations queued in `pendingOperations` with idempotency keys and exponential backoff retries.
5. **Live sync UI** — sync banner, “Go offline” simulation, and pipeline activity log showing queue → engine → server flow.
6. **Cross-tab awareness** — `BroadcastChannel` notifies other tabs when the queue changes.
7. **JWT auth** — login stores token in IndexedDB; sync engine uses it for authenticated push/pull.
8. **Monorepo** — `apps/web`, `apps/api`, `packages/shared` with shared TypeScript types and Zod validators.

**Demo login:** `demo@example.com` / `password123`

---

## Resume lines (copy-paste)

Use 2–4 of these on your resume or LinkedIn:

- Built an **offline-first ecommerce PWA** with **Dexie (IndexedDB)**, a custom **operation-queue sync engine**, and **push/pull REST APIs** so users can browse, cart, wishlist, and checkout without connectivity.
- Implemented **optimistic UI updates** and **eventual consistency** using **Redux Toolkit**, **RTK Query** (offline-aware base query), and a **retry/backoff** strategy for failed sync operations.
- Designed a **monorepo** (Astro, React, Express, shared TypeScript package) demonstrating **local-first writes**, **idempotent sync**, and **cross-tab** state via **BroadcastChannel**.
- Shipped **Service Worker** caching (Workbox) for installable offline app shell; integrated **JWT auth**, **SQLite** backend, and live sync status UI for debugging offline pipelines.
- Engineered end-to-end **offline-to-online** flow: local persistence → queued mutations → batch sync → incremental pull — applicable to field apps, retail, and unreliable networks.

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm 9+

### Installation

```bash
npm install
cp .env.example .env
```

If `npm install` fails after switching package managers or an interrupted install, run a clean reinstall:

```bash
npm run clean:install
```

This removes all `node_modules` folders, clears the npm cache, and reinstalls from scratch.

### Development

```bash
# Start API (port 3001) and Web (port 4321)
npm run dev
```

- Web: http://localhost:4321
- API: http://localhost:3001/health
- Demo login: `demo@example.com` / `password123`

**Fresh product catalog:** If upgrading from the task-management version, delete `apps/api/data/app.db` and restart the API to seed products.

### Where offline-first helps in ecommerce

| Feature | Offline behavior |
|---------|------------------|
| **Cart** | Add, update quantities, remove — saved to IndexedDB + sync queue |
| **Catalog** | Products cached locally; browse without network |
| **Wishlist** | Save items for later, fully offline |
| **Checkout** | Queue orders when offline; auto-sync to server when online |
| **Order history** | View past and pending orders from local cache |

Use the **Go offline** button in the header to simulate disconnect and watch the process card.

### Testing

```bash
npm run test:unit
npm run test:e2e
```

## Architecture

See the **Folder Structure** section below for how the codebase is organized.

```
┌─────────────────────────────────────────────────────────┐
│ Browser: Astro + React + Redux + RTK Query + Dexie + SW │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────┐
│ Express API + SQLite                                    │
└─────────────────────────────────────────────────────────┘
```

## Offline-First Concepts

### 1. What is Offline-First Architecture?

**What:** A design pattern where the local data store is the primary write target; the network enhances but never blocks the user.

**Why we used it:** Shoppers can browse, cart, wishlist, and checkout without connectivity. No action is lost.

**Alternatives:** Online-only SPA, simple PWA cache, CRDT sync (Yjs), Firebase offline.

**Tradeoffs:** Higher complexity and eventual consistency vs. strong reliability offline.

### 2. Why IndexedDB?

**What:** Browser-native asynchronous transactional database for structured data.

**Why:** Only viable browser storage for structured offline data at scale (vs. localStorage's 5MB sync limit).

**Alternatives:** localStorage, Cache API, SQLite WASM.

**Tradeoffs:** Complex raw API; mitigated by Dexie. No built-in cross-device sync.

### 3. Why Dexie?

**What:** Minimalistic IndexedDB wrapper with Promise API, transactions, and live queries.

**Why:** Schema versioning, TypeScript support, `liveQuery` for reactive UI, mature ecosystem.

**Alternatives:** idb (Google), RxDB, PouchDB, raw IndexedDB.

**Tradeoffs:** Extra dependency; sync engine built manually (not a full sync framework).

### 4. Why Service Workers?

**What:** Programmable network proxy between the app and server.

**Why:** Offline app shell, asset caching, Background Sync bridge.

**Alternatives:** App Cache (deprecated), HTTP cache headers alone.

**Tradeoffs:** Update complexity; Safari Background Sync limitations.

### 5. How Synchronization Works

1. User action → optimistic Dexie write + UI update
2. Operation enqueued in `pendingOperations`
3. Sync engine triggered (online event, interval, manual, background sync)
4. Batch push to `/api/v1/sync/push`
5. Pull incremental changes via `/api/v1/sync/pull`
6. Update local state + BroadcastChannel to other tabs

### 6. How Optimistic Updates Work

1. Write to Dexie immediately with `syncStatus: 'pending'`
2. Invalidate RTK Query cache for instant UI
3. On server success → replace clientId, mark `synced`
4. On failure → retry with exponential backoff; rollback on non-retryable errors

### 7. How Retry Mechanisms Work

```
delay = min(1000ms × 2^retryCount + jitter, 60000ms)
maxRetries = 5
```

Non-retryable: 400, 401, 403, 404, 422

### 8. How RTK Query is Used

- **Server state:** products, orders, shop stats
- **Offline-aware baseQuery:** reads from Dexie when offline
- **Tag invalidation:** sync invalidates `Product`, `Orders`, `Shop` tags

### 9. Tradeoffs and Alternatives

| Approach | Pros | Cons |
|----------|------|------|
| **Our approach (Dexie + custom sync)** | Full control, no vendor lock-in | Engineering overhead |
| **Firebase offline** | Built-in sync | Vendor lock-in, cost |
| **CRDT (Yjs)** | Real-time collaboration | Complexity for simple CRUD |
| **Online-only** | Simple | Fails offline |

## State Management

| Layer | Responsibility |
|-------|----------------|
| **Redux Toolkit** | Sync status, offline pipeline UI |
| **RTK Query** | Server-fetched entities, cache |
| **Dexie** | Offline records, operation queue, preferences |

## Folder Structure

```
apps/web/           Astro + React frontend
  src/offline/      Dexie, sync engine, queue
  src/store/        Redux + RTK Query
  src/features/     Feature-sliced UI modules
  src/sw/           Service worker
apps/api/           Express REST API
packages/shared/    Shared types, validators, constants
```

## API Reference

Base URL: `/api/v1`

| Endpoint | Description |
|----------|-------------|
| `POST /auth/login` | Authenticate |
| `GET /products` | Product catalog (paginated) |
| `GET /orders` | User orders |
| `GET /shop/stats` | Shop summary stats |
| `POST /sync/push` | Batch push offline operations |
| `GET /sync/pull?since=` | Incremental pull |

## Deploy to Render

Deploy as **two services**: one **Web Service** (API) and one **Static Site** (frontend). Both use the **repository root** as the root directory.

### 1. Push code to GitHub

Render deploys from Git. Commit and push this repo to GitHub (or GitLab).

### 2. Deploy the API (Web Service)

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service** → connect your repo.
2. Settings:

| Field | Value |
|-------|--------|
| **Name** | `shubham-sunny-shop-api` (or any name) |
| **Root Directory** | *(leave empty — repo root)* |
| **Runtime** | Node |
| **Build Command** | `npm run render:build:api` |
| **Start Command** | `npm run start -w @oftmp/api` |

3. **Environment variables** (Environment tab):

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Long random string (32+ characters) |
| `DATABASE_URL` | `./data/app.db` |
| `CORS_ORIGIN` | Your static site URL (set after step 3), e.g. `https://shubham-sunny-shop-web.onrender.com` |

Render sets `PORT` automatically — do not hardcode it.

4. **Create Web Service**. Note the URL, e.g. `https://shubham-sunny-shop-api.onrender.com`.
5. Verify: open `https://shubham-sunny-shop-api.onrender.com/health` — should return `{"status":"ok",...}`.

**Note:** SQLite on Render uses ephemeral disk by default; data may reset on redeploy. For a persistent demo DB, add a [Render persistent disk](https://render.com/docs/disks) (e.g. mount at `/data`) and set `DATABASE_URL=/data/app.db`.

### 3. Deploy the frontend (Static Site)

1. **New** → **Static Site** → same repo.
2. Settings:

| Field | Value |
|-------|--------|
| **Name** | `shubham-sunny-shop-web` |
| **Root Directory** | *(repo root)* |
| **Build Command** | `npm run render:build:web` |
| **Publish Directory** | `apps/web/dist` |

3. **Environment variable** (required at **build** time):

| Key | Value |
|-----|--------|
| `PUBLIC_API_URL` | `https://shubham-sunny-shop-api.onrender.com/api/v1` *(your API URL from step 2)* |

4. **Create Static Site**. Note the URL, e.g. `https://shubham-sunny-shop-web.onrender.com`.

### 4. Wire CORS and redeploy

1. In the **API** service, set `CORS_ORIGIN` to your static site URL (exact origin, no trailing slash).
2. **Save** — Render redeploys the API.
3. If you change `PUBLIC_API_URL`, trigger a **manual redeploy** of the static site so the build picks up the new API URL.

### 5. Smoke test

1. Open `https://<api-host>/api/v1/products` in the browser — should return JSON with a `data` array of products.
2. Open the static site URL → **Login** with `demo@example.com` / `password123`.
3. Shop page should show products. If you see a red API error banner, fix CORS / `PUBLIC_API_URL` (see below).
4. API health: `https://<api-host>/health`

### API returns 404 `Not Found` (plain text) for `/health` or `/api/v1/products`

Plain-text **"Not Found"** (not JSON) means the **Node app is not running** — Render’s edge is responding, not Express.

1. Render → **API service** → **Logs** — look for `JWT_SECRET` or startup errors.
2. **Environment** tab — set:
   - `JWT_SECRET` = any random string **32+ characters**
   - `CORS_ORIGIN` = your static site URL (e.g. `https://shubham-sunny-shop-web.onrender.com`)
   - `DATABASE_URL` = `./data/app.db`
3. Confirm **Root Directory** is **empty** (repo root).
4. **Start Command:** `npm run start -w @oftmp/api`
5. **Manual Deploy** → wait until Live.
6. Test: `https://<api-host>/health` must return **JSON** `{"status":"ok",...}` — not plain "Not Found".

### UI shows no data (health OK)

| Check | Fix |
|-------|-----|
| `PUBLIC_API_URL` missing at **static site build** | Set to `https://<api-host>/api/v1`, then **manual redeploy** the static site |
| `CORS_ORIGIN` wrong on API | Set to exact frontend origin, e.g. `https://shubham-sunny-shop-web.onrender.com` (no trailing `/`) |
| Service names differ | If API is not `…-api` / web is `…-web`, you **must** set `PUBLIC_API_URL` explicitly |
| Products empty on API | Open `/api/v1/products` — if empty, redeploy API (seeds on first boot) |

The frontend auto-detects `…-web.onrender.com` → `…-api.onrender.com` when `PUBLIC_API_URL` was not set at build time.

### Render checklist

- [ ] **Root Directory** is repo root (leave empty) — not `apps/api`
- [ ] **Node 20** — set env `NODE_VERSION=20.18.0` (or use repo `.node-version` file)
- [ ] API build + start commands use npm workspaces (`-w @oftmp/api`)
- [ ] `JWT_SECRET` set on API
- [ ] `PUBLIC_API_URL` set on static site **before** build
- [ ] `CORS_ORIGIN` on API matches static site origin
- [ ] Free-tier services spin down when idle (first request may be slow)

### Render build failed (`better-sqlite3` / `node-gyp`)

This usually means Render used **Node 22+** and tried to compile SQLite from source.

**Fix:**
1. Add environment variable: `NODE_VERSION` = `20.18.0`
2. Set **Root Directory** to repo root (empty), not `apps/api`
3. **Build:** `npm run render:build:api` (not plain `npm install` — see esbuild note below)
4. **Start:** `npm run start -w @oftmp/api`
5. Redeploy

Or use the included `render.yaml` blueprint: **New** → **Blueprint** → connect repo.

### Render build failed (`esbuild` version mismatch)

```
Error: Expected "0.28.1" but got "0.25.12"
```

This happens when a **full** `npm install` at repo root installs both API (`tsx` → esbuild 0.28) and web (`vite` → esbuild 0.25). npm hoists the wrong binary on Linux.

**Fix (already in this repo):**
1. Use workspace-scoped install scripts — **API:** `npm run render:build:api`, **Web:** `npm run render:build:web`
2. Push `package.json`, `package-lock.json`, and `.npmrc`
3. In Render → your service → **Settings** → **Clear build cache** → **Manual Deploy**

Do **not** set Root Directory to `apps/api` or `apps/web` — leave it empty (monorepo root).

### Render build failed (`Could not find a declaration file for module 'express'`)

Render sets `NODE_ENV=production`, which makes `npm ci` **skip devDependencies** (`@types/*`, `typescript`). The API `tsc` build then fails.

**Fix (already in this repo):** install scripts use `npm ci --include=dev` so types are installed during the build step. Push latest `package.json` and redeploy.

## License

MIT
