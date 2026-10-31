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
