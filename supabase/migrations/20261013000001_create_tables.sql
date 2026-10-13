-- ============================================================================
-- 00001_create_tables.sql
-- Core schema for Ritsu Food Corner QR Ordering System
-- All monetary amounts stored as integer paise (₹1 = 100 paise)
-- ============================================================================

-- 1. Restaurant Settings
CREATE TABLE IF NOT EXISTS restaurant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tagline text,
  gstin text,
  address jsonb, -- { line1, line2, city, state, pincode }
  phone text,
  upi_vpa text,
  tax_rate_bps int NOT NULL DEFAULT 500, -- 500 basis points = 5.00%
  prices_include_tax boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Tables
CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text UNIQUE NOT NULL, -- e.g. 'T1', 'T2', etc.
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  diet_type text NOT NULL CHECK (diet_type IN ('veg', 'non_veg', 'mixed')),
  icon_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  item_no int UNIQUE NOT NULL, -- 1 to 165
  name text NOT NULL,
  description text,
  is_veg boolean NOT NULL,
  available boolean NOT NULL DEFAULT true,
  is_popular boolean NOT NULL DEFAULT false,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Menu Item Variants
CREATE TABLE IF NOT EXISTS menu_item_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  label text NOT NULL, -- 'Single', 'Full', 'Regular', 'Large', 'Small'
  price_paise int NOT NULL CHECK (price_paise > 0),
  available boolean NOT NULL DEFAULT true,
  needs_verification boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no serial,
  table_label text NOT NULL,
  customer_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'preparing', 'ready', 'complete', 'cancelled')),
  payment_status text NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  payment_method text
    CHECK (payment_method IN ('upi_qr', 'counter_cash', 'razorpay', 'offline_other')),
  subtotal_paise int NOT NULL CHECK (subtotal_paise >= 0),
  cgst_paise int NOT NULL CHECK (cgst_paise >= 0),
  sgst_paise int NOT NULL CHECK (sgst_paise >= 0),
  total_paise int NOT NULL CHECK (total_paise >= 0),
  note text,
  public_token text UNIQUE NOT NULL,
  client_request_id text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table_label ON orders(table_label);
CREATE INDEX IF NOT EXISTS idx_orders_public_token ON orders(public_token);

-- 7. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL,
  variant_id uuid NOT NULL,
  item_no_snapshot int NOT NULL,
  name_snapshot text NOT NULL,
  variant_label_snapshot text NOT NULL,
  unit_price_paise int NOT NULL CHECK (unit_price_paise > 0),
  quantity int NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  is_veg boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 8. Order Status Events (Audit log)
CREATE TABLE IF NOT EXISTS order_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status text NOT NULL,
  to_status text NOT NULL,
  changed_by uuid, -- auth.uid() or NULL for system
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_events_order_id ON order_status_events(order_id);

-- 9. Payments (Manual for Phase 2; reused in Phase 3 for Razorpay)
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'manual', -- 'manual' | 'razorpay'
  provider_payment_id text UNIQUE,
  amount_paise int NOT NULL CHECK (amount_paise > 0),
  method text NOT NULL CHECK (method IN ('upi_qr', 'counter_cash', 'razorpay', 'offline_other')),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  raw_event jsonb,
  recorded_by uuid, -- auth.uid() of owner
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

-- 10. Owners Table (Identifies users with owner permissions)
CREATE TABLE IF NOT EXISTS owners (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
