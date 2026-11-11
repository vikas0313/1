# Deploying Ritsu Food Corner Frontend to Vercel

This guide explains how to deploy the **Ritsu Food Corner** customer and owner web application on Vercel.

---

## 1. Why Vercel?
Vercel is an ultra-fast global Edge CDN for hosting the React + Vite frontend (`/web`), ensuring instant page loads, smooth 60fps animations, and responsive offline-aware QR menu browsing.

> [!NOTE]
> **Backend Architecture Note:**
> Because Ritsu Food Corner uses an ACID SQLite database with real-time Server-Sent Events (SSE) for 2-second cross-device order notifications, the backend Fastify server (`/server`) must run on a platform with persistent storage (such as **Render**, **Fly.io**, or **Cloudflare Tunnel**).
> The Vercel deployment hosts the client application and connects to your backend API via environment variables.

---

## 2. Quick Deploy to Vercel

### Step 1: Connect GitHub Repository
1. Log in to [Vercel](https://vercel.com) and click **"Add New..."** → **"Project"**.
2. Select your GitHub repository (`vikas0313/1`).

### Step 2: Configure Project Settings
Vercel will automatically read [`vercel.json`](../vercel.json) from the repository root:
- **Framework Preset:** `Vite`
- **Root Directory:** `./`
- **Build Command:** `npm run build:web`
- **Output Directory:** `web/dist`

### Step 3: Add Environment Variables
In the **Environment Variables** section on Vercel, add:

| Key | Example Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://ritsu-food-corner.onrender.com` | The public HTTPS domain of your Fastify backend (Render, Fly.io, or Tunnel). |

*(If you leave `VITE_API_URL` empty, all API calls will use relative `/api/*` paths on the same origin).*

### Step 4: Click Deploy
Vercel will install workspace dependencies, compile `@ritsu/shared`, build the Vite frontend, and deploy your site to `https://*.vercel.app`.

---

## 3. What Was Fixed for Vercel

1. **Stale `package-lock.json` Removed**:
   - The previous lockfile did not include the `@ritsu/web` dependencies (`vite`, `react`, `@tailwindcss/vite`, `qrcode`), causing Vercel's `npm ci` command to fail. Removing the stale lockfile allows Vercel to install all workspace packages cleanly.
2. **TypeScript Compilation Typing**:
   - Corrected Fastify error handler typing in `server/src/index.ts` to prevent TypeScript compiler aborts under strict mode.
3. **Dedicated `buildCommand`**:
   - Added `npm run build:web` in `package.json` and `vercel.json` so Vercel builds the shared package and web bundle without requiring unnecessary native server compilation steps on serverless edge runners.
4. **SPA Client-Side Routing**:
   - Configured `vercel.json` rewrites (`/((?!api/).*)` → `/index.html`) so refreshing owner screens (`/owner`, `/owner/orders`, `/owner/menu`) never produces `404: NOT_FOUND`.

