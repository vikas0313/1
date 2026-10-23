-- ============================================================================
-- 20261023000005_direct_order_rpc.sql
-- Direct Order Placement RPC for Supabase (no Edge Functions required)
-- Enables multi-device real-time sync across any network with zero CLI setup!
-- ============================================================================

CREATE OR REPLACE FUNCTION create_order_direct(
  p_table_label text,
  p_customer_name text,
  p_note text DEFAULT NULL,
  p_client_request_id text DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_order_id uuid;
  v_public_token text;
  v_subtotal_paise integer := 0;
  v_cgst_paise integer := 0;
  v_sgst_paise integer := 0;
  v_total_paise integer := 0;
  v_item jsonb;
  v_variant menu_item_variants%ROWTYPE;
  v_menu_item menu_items%ROWTYPE;
  v_qty integer;
  v_req_id text;
BEGIN
  -- Idempotency check
  v_req_id := COALESCE(p_client_request_id, 'cr_' || floor(extract(epoch from now()) * 1000)::text);
  
  -- Check if already created with this client_request_id
  SELECT id, public_token INTO v_order_id, v_public_token
  FROM orders
  WHERE client_request_id = v_req_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'id', v_order_id,
      'public_token', v_public_token
    );
  END IF;

  -- Generate 32-char hex random public token
  v_public_token := encode(gen_random_bytes(16), 'hex');

  -- Calculate subtotal from database prices (tamper-proof)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_variant FROM menu_item_variants WHERE id = (v_item->>'variant_id')::uuid;
    IF FOUND THEN
      v_qty := GREATEST(1, LEAST(20, COALESCE((v_item->>'quantity')::integer, 1)));
      v_subtotal_paise := v_subtotal_paise + (v_variant.price_paise * v_qty);
    END IF;
  END LOOP;

  -- 5% GST (2.5% CGST + 2.5% SGST)
  v_cgst_paise := round(v_subtotal_paise * 0.025);
  v_sgst_paise := round(v_subtotal_paise * 0.025);
  v_total_paise := v_subtotal_paise + v_cgst_paise + v_sgst_paise;

  -- Insert order
  INSERT INTO orders (
    table_label,
    customer_name,
    note,
    status,
    payment_status,
    subtotal_paise,
    cgst_paise,
    sgst_paise,
    total_paise,
    public_token,
    client_request_id
  ) VALUES (
    p_table_label,
    p_customer_name,
    p_note,
    'pending',
    'unpaid',
    v_subtotal_paise,
    v_cgst_paise,
    v_sgst_paise,
    v_total_paise,
    v_public_token,
    v_req_id
  ) RETURNING id INTO v_order_id;

  -- Insert snapshot items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_variant FROM menu_item_variants WHERE id = (v_item->>'variant_id')::uuid;
    IF FOUND THEN
      SELECT * INTO v_menu_item FROM menu_items WHERE id = v_variant.menu_item_id;
      v_qty := GREATEST(1, LEAST(20, COALESCE((v_item->>'quantity')::integer, 1)));
      
      INSERT INTO order_items (
        order_id,
        menu_item_id,
        variant_id,
        item_no_snapshot,
        name_snapshot,
        variant_label_snapshot,
        unit_price_paise,
        quantity,
        is_veg
      ) VALUES (
        v_order_id,
        v_variant.menu_item_id,
        v_variant.id,
        COALESCE(v_menu_item.item_no, 0),
        COALESCE(v_menu_item.name, 'Item'),
        COALESCE(v_variant.label, 'Standard'),
        v_variant.price_paise,
        v_qty,
        COALESCE(v_menu_item.is_veg, true)
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'id', v_order_id,
    'public_token', v_public_token
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION create_order_direct(text, text, text, text, jsonb) TO anon, authenticated;
