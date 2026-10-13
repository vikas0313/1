-- ============================================================================
-- 20261013000002_functions_and_triggers.sql
-- Database triggers and functions for strict business rules enforcement
-- ============================================================================

-- 1. Helper function: is_owner()
CREATE OR REPLACE FUNCTION is_owner()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM owners WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Generic updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_restaurant_settings_updated_at ON restaurant_settings;
CREATE TRIGGER trg_restaurant_settings_updated_at
  BEFORE UPDATE ON restaurant_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_menu_items_updated_at ON menu_items;
CREATE TRIGGER trg_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_menu_item_variants_updated_at ON menu_item_variants;
CREATE TRIGGER trg_menu_item_variants_updated_at
  BEFORE UPDATE ON menu_item_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Strict Order Status Transition Enforcement Trigger
-- One-way state machine: pending -> preparing -> ready -> complete
-- Cancelled permitted only from pending or preparing.
-- No skipping, no going backward.
CREATE OR REPLACE FUNCTION enforce_order_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  allowed text[];
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  allowed := CASE OLD.status
    WHEN 'pending'   THEN ARRAY['preparing', 'cancelled']
    WHEN 'preparing' THEN ARRAY['ready', 'cancelled']
    WHEN 'ready'     THEN ARRAY['complete']
    ELSE ARRAY[]::text[]
  END;

  IF NOT (NEW.status = ANY(allowed)) THEN
    RAISE EXCEPTION 'Illegal order status transition from % to %', OLD.status, NEW.status;
  END IF;

  -- Audit log into order_status_events
  INSERT INTO order_status_events (order_id, from_status, to_status, changed_by)
  VALUES (NEW.id, OLD.status, NEW.status, auth.uid());

  -- Set completed_at when reaching a terminal status
  IF NEW.status IN ('complete', 'cancelled') THEN
    NEW.completed_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_order_status_transition ON orders;
CREATE TRIGGER trg_enforce_order_status_transition
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION enforce_order_status_transition();

-- 4. Payment status validation trigger
-- Changing payment_status to 'paid' requires a completed matching payments record
CREATE OR REPLACE FUNCTION enforce_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    IF NOT EXISTS (
      SELECT 1 FROM payments
      WHERE order_id = NEW.id
        AND status = 'completed'
        AND amount_paise = NEW.total_paise
    ) THEN
      RAISE EXCEPTION 'Cannot mark order as paid without an existing completed payment record matching total_paise';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_payment_status ON orders;
CREATE TRIGGER trg_enforce_payment_status
  BEFORE UPDATE OF payment_status ON orders
  FOR EACH ROW EXECUTE FUNCTION enforce_payment_status();
