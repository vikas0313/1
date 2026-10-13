import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limiter.ts";
import { sanitizeString, validateCustomerName } from "../_shared/validation.ts";
import { calculateBill } from "../_shared/pricing.ts";

interface OrderRequestItem {
  menu_item_id: string;
  variant_id: string;
  quantity: number;
}

interface CreateOrderRequest {
  table_label: string;
  customer_name: string;
  note?: string;
  client_request_id: string;
  items: OrderRequestItem[];
}

function generateRandomToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Rate Limiting by IP
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown-ip";

    const maxRate = parseInt(Deno.env.get("RATE_LIMIT_MAX") || "5", 10);
    const windowSec = parseInt(Deno.env.get("RATE_LIMIT_WINDOW_SEC") || "600", 10);
    const rateCheck = checkRateLimit(clientIp, maxRate, windowSec);

    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: `Too many requests. Please retry in ${rateCheck.retryAfterSec} seconds.`,
          retry_after: rateCheck.retryAfterSec,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rateCheck.retryAfterSec),
          },
        }
      );
    }

    // 2. Parse & Validate Payload
    const body: CreateOrderRequest = await req.json();
    const { table_label, customer_name, note, client_request_id, items } = body;

    if (!client_request_id || typeof client_request_id !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing client_request_id idempotency key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const nameCheck = validateCustomerName(customer_name);
    if (!nameCheck.valid) {
      return new Response(JSON.stringify({ error: nameCheck.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0 || items.length > 30) {
      return new Response(
        JSON.stringify({ error: "Order must contain between 1 and 30 items" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Connect to Supabase using Service Role Key to perform validation and transaction
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Check Idempotency: Has this client_request_id already been processed?
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, order_no, public_token, subtotal_paise, cgst_paise, sgst_paise, total_paise")
      .eq("client_request_id", client_request_id)
      .maybeSingle();

    if (existingOrder) {
      return new Response(
        JSON.stringify({
          order_id: existingOrder.id,
          order_no: existingOrder.order_no,
          public_token: existingOrder.public_token,
          subtotal_paise: existingOrder.subtotal_paise,
          cgst_paise: existingOrder.cgst_paise,
          sgst_paise: existingOrder.sgst_paise,
          total_paise: existingOrder.total_paise,
          idempotent_replay: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Validate Table
    const { data: tableData, error: tableErr } = await supabase
      .from("tables")
      .select("id, label, active")
      .eq("label", table_label)
      .maybeSingle();

    if (tableErr || !tableData || !tableData.active) {
      return new Response(
        JSON.stringify({ error: "Invalid or inactive table selected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Validate Menu Items & Variants and extract server-side pricing
    const variantIds = items.map((i) => i.variant_id);
    const { data: variantsData, error: variantsErr } = await supabase
      .from("menu_item_variants")
      .select("id, menu_item_id, label, price_paise, available, menu_items(id, item_no, name, is_veg, available)")
      .in("id", variantIds);

    if (variantsErr || !variantsData) {
      return new Response(
        JSON.stringify({ error: "Error verifying menu items" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const variantsMap = new Map<string, any>(variantsData.map((v) => [v.id, v]));

    // Construct verified snapshots and pricing lines
    const verifiedOrderItems: any[] = [];
    const pricingItems: Array<{ unit_price_paise: number; quantity: number }> = [];

    for (const item of items) {
      const qty = Math.floor(Number(item.quantity));
      if (qty < 1 || qty > 20) {
        return new Response(
          JSON.stringify({ error: "Quantity for each item must be between 1 and 20" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const variant = variantsMap.get(item.variant_id);
      if (!variant) {
        return new Response(
          JSON.stringify({ error: `Variant not found: ${item.variant_id}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const menuItem = variant.menu_items;
      if (!variant.available || !menuItem.available) {
        return new Response(
          JSON.stringify({
            error: `Item "${menuItem.name}" (${variant.label}) is currently out of stock`,
            unavailable_item: menuItem.name,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (variant.menu_item_id !== item.menu_item_id) {
        return new Response(
          JSON.stringify({ error: "Variant does not belong to specified menu item" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      pricingItems.push({
        unit_price_paise: variant.price_paise,
        quantity: qty,
      });

      verifiedOrderItems.push({
        menu_item_id: menuItem.id,
        variant_id: variant.id,
        item_no_snapshot: menuItem.item_no,
        name_snapshot: menuItem.name,
        variant_label_snapshot: variant.label,
        unit_price_paise: variant.price_paise,
        quantity: qty,
        is_veg: menuItem.is_veg,
      });
    }

    // 6. Compute Server-side Billing
    // Default tax 500 basis points = 5%
    const taxRatePercent = 5;
    const totals = calculateBill(pricingItems, taxRatePercent);
    const publicToken = generateRandomToken();

    // 7. Insert Order
    const { data: newOrder, error: orderInsertErr } = await supabase
      .from("orders")
      .insert({
        table_label,
        customer_name: nameCheck.value,
        note: sanitizeString(note, 0, 200),
        status: "pending",
        payment_status: "unpaid",
        subtotal_paise: totals.subtotal_paise,
        cgst_paise: totals.cgst_paise,
        sgst_paise: totals.sgst_paise,
        total_paise: totals.total_paise,
        public_token: publicToken,
        client_request_id,
      })
      .select("id, order_no, public_token, subtotal_paise, cgst_paise, sgst_paise, total_paise")
      .single();

    if (orderInsertErr || !newOrder) {
      console.error("Failed to insert order:", orderInsertErr);
      return new Response(
        JSON.stringify({ error: "Failed to place order. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Insert Order Items
    const itemsToInsert = verifiedOrderItems.map((oi) => ({
      ...oi,
      order_id: newOrder.id,
    }));

    const { error: itemsInsertErr } = await supabase
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsInsertErr) {
      console.error("Failed to insert order items:", itemsInsertErr);
      // Clean up orphaned order
      await supabase.from("orders").delete().eq("id", newOrder.id);
      return new Response(
        JSON.stringify({ error: "Failed to store order items. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        order_id: newOrder.id,
        order_no: newOrder.order_no,
        public_token: newOrder.public_token,
        subtotal_paise: newOrder.subtotal_paise,
        cgst_paise: newOrder.cgst_paise,
        sgst_paise: newOrder.sgst_paise,
        total_paise: newOrder.total_paise,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Unhandled error in create-order:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
