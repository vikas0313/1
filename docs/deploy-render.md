# Deploying Ritsu Food Corner to Render.com

This guide explains how to deploy **Ritsu Food Corner** to Render using Docker with persistent SQLite storage so cross-device orders and live kitchen sync work 24/7.

---

## Prerequisites
1. A GitHub account with access to your repository: `https://github.com/vikas0313/1.git`.
2. A free or starter account at [Render.com](https://render.com).
3. A generated bcrypt password hash for your owner login:
   ```bash
   npm run hash-password -- "MySecretOwnerPassword123"
   ```

---

## Step-by-Step Deployment

### 1. Create a New Web Service on Render
1. Log in to your Render Dashboard and click **New +** → **Web Service**.
2. Connect your GitHub repository (`vikas0313/1`).
3. Set the following basic parameters:
   - **Name:** `ritsu-food-corner`
   - **Region:** Choose the region closest to your restaurant (e.g., Singapore or Oregon).
   - **Branch:** `main`
   - **Runtime:** `Docker` (Render will automatically pick up `Dockerfile`).
   - **Plan:** `Starter` ($7/mo) — Required for persistent disk attachments.

### 2. Attach Persistent Disk for SQLite
SQLite requires persistent storage so customer orders, menu updates, and bills persist across redeploys:
1. Scroll down to **Disks** and click **Add Disk**.
2. Configure:
   - **Name:** `ritsu-data`
   - **Mount Path:** `/data`
   - **Size:** `1 GB` (sufficient for millions of SQLite orders).

### 3. Configure Environment Variables
In the **Environment Variables** section, add:

| Key | Example Value | Description |
|---|---|---|
| `PORT` | `3001` | Fastify listening port |
| `NODE_ENV` | `production` | Production environment flag |
| `DATABASE_PATH` | `/data/ritsu.db` | Path inside mounted persistent volume |
| `BASE_URL` | `https://ritsu-food-corner.onrender.com` | Public HTTPS domain for QR links |
| `OWNER_PASSWORD_HASH` | `$2a$10$...` | Your generated bcrypt hash |
| `DEMO_MODE` | `false` | Disables demo password in production |
| `SESSION_SECRET` | `a_long_random_64_character_secret_string` | Cookie signing secret |

### 4. Deploy & Verify
1. Click **Create Web Service**.
2. Render will build the multi-stage Docker container and boot the Fastify server.
3. Verify the deployment:
   - Open `https://your-service.onrender.com/health` → should return `{"status":"ok"}`.
   - Open `https://your-service.onrender.com/?table=T1` on your mobile phone over cellular data.
   - Open `https://your-service.onrender.com/owner` on your laptop or tablet.
   - Tap **"Tap to enable sound alerts"** to initialize kitchen audio.
   - Place an order on the phone → confirm it speaks *"New order. Table 1."* on the owner screen in under 2 seconds.

