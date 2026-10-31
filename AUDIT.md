# Ritsu Food Corner QR Ordering Application - Audit Report
Branch: audit-fix  
Date: 2026-10-31 10:48:22

## 1. Tech Stack

### Frontend
- Framework: React 19 + TypeScript + Vite 6
- Styling: Tailwind CSS v4
- Routing: React Router DOM v7
- UI: Radix UI, Lucide React, class-variance-authority
- Testing: Vitest with jsdom

### Backend
- Server: Fastify 5 (Node.js, TypeScript, ESM)
- Database: SQLite via node:sqlite (DatabaseSync)
- Real-time: Server-Sent Events (SSE)
- Auth: Cookie-based sessions for owner

### Shared
- @ritsu/shared package with pricing, state machine, cart logic

### Data Layer
- Dual backend: LocalStorageAdapter (prototype) and Supabase (production) via VITE_DATA_BACKEND

## 2. Folder Map
- Root src/: React frontend
- server/: Fastify backend workspace
- shared/: Shared business logic and types
- plugins/: Local sync plugin
- supabase/: Migrations, functions (per README)

## 3. End-to-End Order Flow
1. Customer scans QR -> CustomerPage with table_label
2. GET /api/menu or repository loads menu
3. POST /api/orders (rate limited) -> orderService.createOrder()
   - Validates table, recomputes prices from DB, creates snapshots
   - Generates orderNo, public_token, inserts order+items+event
   - Broadcasts via SSE to owner
4. Customer tracks via /order/:token and SSE stream
5. Owner updates status via protected routes -> enforces state machine, broadcasts updates

## 4. Tests
## 4. Tests Inventory
- Shared: pricing.test.ts, stateMachine.test.ts, cartLogic.test.ts
- Server: api.test.ts
## 5. Baseline Testing Results
npm test: all shared + server tests pass (20 + 6 = 26 tests)
npm run lint: no output/errors shown
npm run build: FAILS (server TS errors)
### Build Errors
1. server/src/db.ts:21 - DatabaseSync type issue
2. server/src/index.ts:65,68,72,78 - unknown error type
3. server/src/services/orderService.ts:240,286,308 - type mismatch passing Order to notifyOrderUpdated
## 6. Prioritization Matrix
### P0 (Critical)
- Build broken - TypeScript errors prevent deployment
- Server/SSE type issues in orderService
### P1 (Important)
- Review requirements A-D compliance - need full audit against specs
### P2 (Polish)
- Documentation, cleanup
