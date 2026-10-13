# Ritsu Food Corner — QR Ordering System

> "Indo-Chinese ka asli maza – Ritsu ke saath!"

Production-grade, mobile-first QR ordering web application tailored for Indian restaurants with single/full portion pricing, 5% GST computation (CGST 2.5% + SGST 2.5%), multi-device live sync via Supabase, and role-based owner management.

---

## Architecture & Data Backends

The application features a clean repository-pattern data layer with zero UI coupling:
- **`LocalStorageAdapter`**: Runs offline or in prototype demo mode with zero cloud setup. BroadcastChannel & storage events provide instant cross-tab sync.
- **`SupabaseAdapter`**: Multi-device production backend with PostgreSQL, Row Level Security (RLS), Edge Functions, and Realtime event subscriptions.

Switch data backend at any time via `.env`:
```bash
VITE_DATA_BACKEND=local    # Prototype / local demo
VITE_DATA_BACKEND=supabase # Production Supabase backend
```

---

## Phase 2 Setup Guide (Supabase Backend)

### 1. Prerequisites
- [Supabase](https://supabase.com) account & project (or local Supabase via Docker).
- Node.js 20+ installed.

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
VITE_DATA_BACKEND=supabase
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_BASE_URL=https://your-domain.com
```

### 3. Run Database Migrations
Migrations are located in `supabase/migrations/`:
- `20261013000001_create_tables.sql`: 9 relational tables + owners table with integer paise and timestamptz.
- `20261013000002_functions_and_triggers.sql`: State machine one-way transition enforcement trigger, payment validation trigger, updated_at timestamps.
- `20261013000003_rls_policies.sql`: Deny-all RLS policies with granular owner permissions.
- `20261013000004_realtime_and_rpc.sql`: Realtime publications and secure RPCs (`get_order_by_token`, `get_sales_summary`).

Execute them using Supabase CLI:
```bash
npx supabase db reset
# OR apply to remote project
npx supabase db push
```

### 4. Seed Menu Data
The menu seed contains 165 dishes across 14 categories with all portion variants and table slots T1–T8:
```bash
npx supabase db execute --file supabase/seed.sql
```

### 5. Onboard the First Restaurant Owner
Public registrations are strictly disabled. To create the first owner:
1. Create a user via Supabase Dashboard under **Authentication > Users** (or via `supabase auth admin create-user`).
2. Add that user's UUID to the `owners` table in the SQL Editor:
```sql
INSERT INTO owners (user_id) VALUES ('<user-uuid-from-auth>');
```
Now log in via the Owner Portal at `/owner`.

### 6. Deploy Edge Functions
Deploy the serverless Edge Functions for secure price recalculation, token generation, and rate limiting:
```bash
npx supabase functions deploy create-order --no-verify-jwt
npx supabase functions deploy get-order --no-verify-jwt
```
Set the necessary secrets:
```bash
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
npx supabase secrets set SITE_URL=https://your-domain.com
npx supabase secrets set RATE_LIMIT_MAX=5
npx supabase secrets set RATE_LIMIT_WINDOW_SEC=600
```

---

## Rollback Note (Return to Local Mode)

To quickly revert to the local-storage prototype without Supabase:
1. In `.env`, change:
```bash
VITE_DATA_BACKEND=local
VITE_DEMO_OWNER_PASSWORD=admin123
```
2. Restart the Vite dev server:
```bash
npm run dev
```

---

## Restaurant Configuration & Placeholders

All restaurant identity details are centralized in `src/config/restaurant.config.ts`:
- **GSTIN**: `36AAAAA0000A1Z5` *(Placeholder)*
- **FSSAI License**: `13621000000000` *(Placeholder)*
- **Contact Phone**: `+91 98765 43210` *(Placeholder)*
- **Address**: Main Road, Opp. City Center, Hyderabad - 500032 *(Placeholder)*
- **UPI VPA**: `ritsufoodcorner@okaxis` *(Placeholder)*
- **Tables**: T1 through T8

---

## Running Automated Tests

```bash
# Run Vitest test suite (pricing parity, schema, edge functions, adapters, security)
npm test

# Run build verification
npm run build
```
