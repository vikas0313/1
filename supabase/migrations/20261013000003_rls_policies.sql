-- ============================================================================
-- 20261013000003_rls_policies.sql
-- Row Level Security (RLS) policies for Ritsu Food Corner
-- Deny-all by default. Explicit grants only.
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 1. restaurant_settings
-- Anon & Authenticated: SELECT public fields
-- Owner: ALL
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read access for restaurant settings"
  ON restaurant_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Owner write access for restaurant settings"
  ON restaurant_settings FOR ALL
  TO authenticated
  USING (is_owner())
  WITH CHECK (is_owner());

-- ----------------------------------------------------------------------------
-- 2. tables
-- Anon & Authenticated: SELECT active tables
-- Owner: ALL
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read active tables"
  ON tables FOR SELECT
  TO anon, authenticated
  USING (active = true OR is_owner());

CREATE POLICY "Owner manage tables"
  ON tables FOR ALL
  TO authenticated
  USING (is_owner())
  WITH CHECK (is_owner());

-- ----------------------------------------------------------------------------
-- 3. categories
-- Anon & Authenticated: SELECT
-- Owner: ALL
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Owner manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (is_owner())
  WITH CHECK (is_owner());

-- ----------------------------------------------------------------------------
-- 4. menu_items
-- Anon & Authenticated: SELECT
-- Owner: ALL
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read menu items"
  ON menu_items FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Owner manage menu items"
  ON menu_items FOR ALL
  TO authenticated
  USING (is_owner())
  WITH CHECK (is_owner());

-- ----------------------------------------------------------------------------
-- 5. menu_item_variants
-- Anon & Authenticated: SELECT
-- Owner: ALL
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read menu item variants"
  ON menu_item_variants FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Owner manage menu item variants"
  ON menu_item_variants FOR ALL
  TO authenticated
  USING (is_owner())
  WITH CHECK (is_owner());

-- ----------------------------------------------------------------------------
-- 6. orders
-- Anon: NO direct access (reads via RPC/Edge Function, writes via create-order Edge Function)
-- Owner: SELECT, UPDATE (for statuses)
-- ----------------------------------------------------------------------------
CREATE POLICY "Owner select orders"
  ON orders FOR SELECT
  TO authenticated
  USING (is_owner());

CREATE POLICY "Owner update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (is_owner())
  WITH CHECK (is_owner());

-- ----------------------------------------------------------------------------
-- 7. order_items
-- Anon: NO direct access
-- Owner: SELECT
-- ----------------------------------------------------------------------------
CREATE POLICY "Owner select order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (is_owner());

-- ----------------------------------------------------------------------------
-- 8. order_status_events
-- Owner: SELECT
-- ----------------------------------------------------------------------------
CREATE POLICY "Owner select order status events"
  ON order_status_events FOR SELECT
  TO authenticated
  USING (is_owner());

-- ----------------------------------------------------------------------------
-- 9. payments
-- Anon: NO direct access
-- Owner: SELECT, INSERT (for recording manual cash/UPI payments)
-- ----------------------------------------------------------------------------
CREATE POLICY "Owner select payments"
  ON payments FOR SELECT
  TO authenticated
  USING (is_owner());

CREATE POLICY "Owner insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (is_owner());

-- ----------------------------------------------------------------------------
-- 10. owners
-- Owner: SELECT
-- ----------------------------------------------------------------------------
CREATE POLICY "Owner read owners"
  ON owners FOR SELECT
  TO authenticated
  USING (is_owner());
