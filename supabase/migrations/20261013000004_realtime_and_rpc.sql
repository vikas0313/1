-- ============================================================================
-- 20261013000004_realtime_and_rpc.sql
-- Realtime publications and secure RPCs
-- ============================================================================

-- 1. Enable Realtime on orders, order_items, menu_items, menu_item_variants
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_item_variants;

-- 2. Secure RPC to fetch order by public token (Customer token-gated access)
-- Uses SECURITY DEFINER to bypass RLS while enforcing token constraint
CREATE OR REPLACE FUNCTION get_order_by_token(p_token text)
RETURNS jsonb AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_items jsonb;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 16 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_order
  FROM orders
  WHERE public_token = p_token;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', oi.id,
        'order_id', oi.order_id,
        'menu_item_id', oi.menu_item_id,
        'variant_id', oi.variant_id,
        'item_no', oi.item_no_snapshot,
        'name_snapshot', oi.name_snapshot,
        'variant_label_snapshot', oi.variant_label_snapshot,
        'unit_price_paise', oi.unit_price_paise,
        'quantity', oi.quantity,
        'is_veg', oi.is_veg
      ) ORDER BY oi.item_no_snapshot ASC
    ),
    '[]'::jsonb
  ) INTO v_items
  FROM order_items oi
  WHERE oi.order_id = v_order.id;

  RETURN jsonb_build_object(
    'id', v_order.id,
    'order_no', v_order.order_no,
    'table_label', v_order.table_label,
    'customer_name', v_order.customer_name,
    'status', v_order.status,
    'payment_status', v_order.payment_status,
    'payment_method', v_order.payment_method,
    'subtotal_paise', v_order.subtotal_paise,
    'cgst_paise', v_order.cgst_paise,
    'sgst_paise', v_order.sgst_paise,
    'total_paise', v_order.total_paise,
    'note', v_order.note,
    'public_token', v_order.public_token,
    'created_at', v_order.created_at,
    'updated_at', v_order.updated_at,
    'completed_at', v_order.completed_at,
    'items', v_items
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execution to anon and authenticated
GRANT EXECUTE ON FUNCTION get_order_by_token(text) TO anon, authenticated;

-- 3. Sales summary RPC (Asia/Kolkata timezone)
-- Calculates server-side sales statistics for owner dashboard
CREATE OR REPLACE FUNCTION get_sales_summary(period text DEFAULT 'today')
RETURNS jsonb AS $$
DECLARE
  v_start_time timestamptz;
  v_result jsonb;
BEGIN
  IF NOT is_owner() THEN
    RAISE EXCEPTION 'Access denied. Owner privilege required.';
  END IF;

  IF period = 'today' THEN
    -- Today boundary in Asia/Kolkata timezone
    v_start_time := date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata';
  ELSIF period = '7days' THEN
    v_start_time := (date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') - interval '7 days') AT TIME ZONE 'Asia/Kolkata';
  ELSE
    -- 'all'
    v_start_time := '1970-01-01 00:00:00+00'::timestamptz;
  END IF;

  SELECT jsonb_build_object(
    'total_orders', COUNT(*),
    'completed_orders', COUNT(*) FILTER (WHERE status = 'complete'),
    'cancelled_orders', COUNT(*) FILTER (WHERE status = 'cancelled'),
    'active_orders', COUNT(*) FILTER (WHERE status IN ('pending', 'preparing', 'ready')),
    'total_revenue_paise', COALESCE(SUM(total_paise) FILTER (WHERE status != 'cancelled'), 0),
    'paid_revenue_paise', COALESCE(SUM(total_paise) FILTER (WHERE payment_status = 'paid' AND status != 'cancelled'), 0),
    'unpaid_revenue_paise', COALESCE(SUM(total_paise) FILTER (WHERE payment_status = 'unpaid' AND status != 'cancelled'), 0),
    'avg_order_paise', CASE
      WHEN COUNT(*) FILTER (WHERE status != 'cancelled') > 0 THEN
        COALESCE(SUM(total_paise) FILTER (WHERE status != 'cancelled'), 0) / COUNT(*) FILTER (WHERE status != 'cancelled')
      ELSE 0
    END
  ) INTO v_result
  FROM orders
  WHERE created_at >= v_start_time;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_sales_summary(text) TO authenticated;
