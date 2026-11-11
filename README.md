# 🍜 Ritsu Food Corner — QR Dine-In Ordering System

A complete **table-to-kitchen real-time ordering system** for an Indo-Chinese restaurant. Customers scan a table QR code on their phone, browse the full 165-item menu, place orders with GST-accurate billing, and track live status. The owner dashboard speaks *"New order. Table 3."* the instant an order arrives.

Built with **Fastify 5 + SQLite (node:sqlite) + React 19 + Vite + Tailwind CSS 4**. Zero external databases. Zero native dependencies. Single `npm install` on any OS.

---

## Quick Start (Local Development)

```bash
# 1. Clone the repo
git clone https://github.com/vikas0313/1.git ritsu-food-corner
cd ritsu-food-corner

# 2. Copy environment template
cp .env.example .env

# 3. Install all workspace dependencies
npm install

# 4. Start development server (API + Vite HMR)
npm run dev
```

Open:
- **Customer:** `http://localhost:5173/?table=T1`
- **Owner Dashboard:** `http://localhost:5173/owner` (password: `admin123` in demo mode)

---

## Project Structure

```
ritsu-food-corner/
├── shared/          @ritsu/shared — types, pricing math, state machine, menu seed
│   └── src/
├── server/          @ritsu/server — Fastify 5 API, SQLite, SSE, auth, migrations
│   ├── migrations/  SQL schema + seed data (auto-run on boot)
│   ├── src/
│   └── tests/       Vitest unit + integration tests
├── web/             @ritsu/web — React 19 SPA (customer + owner)
│   └── src/
│       ├── components/    Design system (Button, Badge, Stepper, Toast, etc.)
│       ├── features/
│       │   ├── customer/  Welcome → Menu → Cart → Payment → Tracking → Bill
│       │   └── owner/     Login → Kanban → Menu Manager → Tables & QR → Sales → Settings
│       ├── services/      AlertService (Web Audio + SpeechSynthesis order announcements)
│       └── styles/        Warm Peach design tokens, global CSS, print rules
├── docs/            Deployment guides (Render, Fly.io, Cloudflare Tunnel)
├── Dockerfile       Multi-stage production build
├── render.yaml      Render.com blueprint
├── fly.toml         Fly.io configuration
└── .env.example     Environment variables template
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Fastify listening port |
| `HOST` | `0.0.0.0` | Bind address |
| `NODE_ENV` | `development` | `production` disables verbose logging |
| `DATABASE_PATH` | `./data/ritsu.db` | SQLite file path (persistent volume in prod) |
| `SESSION_SECRET` | — | Random string for signed session cookies |
| `OWNER_PASSWORD_HASH` | — | bcrypt hash (generate with `npm run hash-password`) |
| `DEMO_MODE` | `true` | When `true`, accepts `admin123` as owner password |
| `BASE_URL` | `http://localhost:3001` | Public HTTPS URL encoded into QR codes |

---

## Generating an Owner Password Hash

```bash
npm run hash-password -- "YourSecretPassword"
```

Copy the output `$2a$10$...` string into `OWNER_PASSWORD_HASH` in your `.env` or hosting environment.

---

## Running Tests

```bash
npm test
```

Runs the full Vitest suite across `@ritsu/shared` (20 tests) and `@ritsu/server` (12 tests):
- GST pricing math (CGST 2.5% + SGST 2.5%)
- Order state machine transitions and illegal transition guards
- Cart add/remove/update with size validation
- API idempotency (duplicate `client_request_id`)
- Auth guard (401 on unauthenticated owner access)
- Rate limiting (429 after 10 failed logins)
- Price tamper protection (server always recomputes)
- AlertService queue processing and deduplication
- Sales summary totals after Mark Paid

---

## Seeded Menu

The database auto-seeds **165 items across 14 categories** on first boot (Soups, Starters, Momos, Noodles, Fried Rice, Manchurian, Paneer, Chicken, Rice & Biryani, Rolls, Add-Ons, Desserts, Beverages, Soft Drinks). Some prices are marked `needs_verification` — confirm them in the Menu Manager before going live.

---

## Deployment

| Platform | Guide | Cost |
|---|---|---|
| **Render.com** | [`docs/deploy-render.md`](docs/deploy-render.md) | From \$7/mo (persistent disk) |
| **Fly.io** | [`docs/deploy-fly.md`](docs/deploy-fly.md) | Free tier possible |
| **Cloudflare Tunnel** | [`docs/deploy-cloudflare-tunnel.md`](docs/deploy-cloudflare-tunnel.md) | Free (runs on your own PC) |

---

## Go-Live Checklist

See [`docs/go-live-checklist.md`](docs/go-live-checklist.md) for the complete pre-launch verification list.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22/24 with `node:sqlite` (built-in `DatabaseSync`) |
| API | Fastify 5, Helmet, CORS, signed cookies, rate limiting |
| Auth | bcryptjs (pure JS), signed httpOnly session cookies |
| Database | SQLite with WAL mode, foreign keys, auto-migrations |
| Real-time | Server-Sent Events with 5s polling fallback |
| Frontend | React 19, Vite 6, Tailwind CSS 4 |
| Audio | Web Audio API (AudioContext) + SpeechSynthesis + Wake Lock |
| QR | `qrcode` library (canvas rendering) |
| Tests | Vitest |
| Container | Docker multi-stage (node:22-alpine) |

---

## License

Private project. All rights reserved.
