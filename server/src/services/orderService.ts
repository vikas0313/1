import { nanoid } from 'nanoid';
import { calculateBill } from '@ritsu/shared';
import { assertValidTransition, canCancel } from '@ritsu/shared';
import type { Order, OrderItem, OrderStatus, PaymentMethod } from '@ritsu/shared';
import { getDb } from '../db.js';
import { sseService } from './sseService.js';

export interface CreateOrderInput {
  table_label: string;
  customer_name: string;
  note?: string;
  client_request_id: string;
  items: Array<{
    menu_item_id: string;
    variant_id: string;
    quantity: number;
  }>;
}

export class OrderService {
  /**
   * Generates a daily sequential order number, e.g. #1001, #1002
   */
  private generateOrderNo(): string {
    const db = getDb();
    const countRow = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
    const nextNum = 1001 + countRow.count;
    return `#${nextNum}`;
  }

  /**
   * Finds an existing order by client_request_id for idempotency.
   */
  public findByClientRequestId(clientRequestId: string): Order | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM orders WHERE client_request_id = ?').get(clientRequestId) as any;
    if (!row) return null;
    return this.hydrateOrder(row);
  }

  /**
   * Finds an order by its secret public token for customer live tracking and bill viewing.
   */
  public findByPublicToken(publicToken: string): Order | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM orders WHERE public_token = ?').get(publicToken) as any;
    if (!row) return null;
    return this.hydrateOrder(row);
  }

  /**
   * Finds an order by its ID (for owner operations).
   */
  public findById(id: string): Order | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.hydrateOrder(row);
  }

  /**
   * Creates a new order with server-recomputed prices and strict validation.
   */
  public createOrder(input: CreateOrderInput): Order {
    const db = getDb();

    // 1. Idempotency check: if client_request_id exists, return existing order
    const existing = this.findByClientRequestId(input.client_request_id);
    if (existing) {
      return existing;
    }

    // 2. Validate table exists and is active
    const table = db.prepare('SELECT * FROM tables WHERE label = ? AND active = 1').get(input.table_label);
    if (!table) {
      throw new Error(`Table "${input.table_label}" is invalid or inactive`);
    }

    // 3. Fetch each variant and menu item from database to recompute prices
    const itemStmt = db.prepare(`
      SELECT 
        m.id as menu_item_id,
        m.item_no,
        m.name,
        m.available as item_available,
        v.id as variant_id,
        v.label as variant_label,
        v.price_paise,
        v.available as variant_available
      FROM menu_item_variants v
      JOIN menu_items m ON m.id = v.menu_item_id
      WHERE v.id = ? AND m.id = ?
    `);

    const orderLines: Array<{
      menu_item_id: string;
      variant_id: string;
      item_no: number;
      name: string;
      variant_label: string;
      unit_price_paise: number;
      quantity: number;
    }> = [];

    for (const item of input.items) {
      if (item.quantity <= 0 || item.quantity > 20) {
        throw new Error(`Invalid quantity ${item.quantity} for item`);
      }

      const row = itemStmt.get(item.variant_id, item.menu_item_id) as any;
      if (!row) {
        throw new Error(`Menu item or variant not found: ${item.menu_item_id} / ${item.variant_id}`);
      }

      if (!row.item_available || !row.variant_available) {
        throw new Error(`Item "${row.name} (${row.variant_label})" is currently unavailable`);
      }

      orderLines.push({
        menu_item_id: row.menu_item_id,
        variant_id: row.variant_id,
        item_no: row.item_no,
        name: row.name,
        variant_label: row.variant_label,
        unit_price_paise: row.price_paise,
        quantity: item.quantity,
      });
    }

    // 4. Calculate official totals (5% GST)
    const bill = calculateBill(
      orderLines.map((l) => ({
        unit_price_paise: l.unit_price_paise,
        quantity: l.quantity,
      })),
      5
    );

    const orderId = `ord-${nanoid(12)}`;
    const orderNo = this.generateOrderNo();
    const publicToken = nanoid(24);
    const now = new Date().toISOString();

    const insertOrderStmt = db.prepare(`
      INSERT INTO orders (
        id, order_no, table_label, customer_name, status, payment_status, payment_method,
        subtotal_paise, cgst_paise, sgst_paise, total_paise, note, public_token, client_request_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItemStmt = db.prepare(`
      INSERT INTO order_items (
        id, order_id, menu_item_id, variant_id, item_no_snapshot, name_snapshot,
        variant_label_snapshot, unit_price_paise, quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertEventStmt = db.prepare(`
      INSERT INTO order_status_events (
        id, order_id, from_status, to_status, actor, note, created_at
      ) VALUES (?, ?, NULL, 'pending', 'customer', 'Order submitted', ?)
    `);

    db.transaction(() => {
      insertOrderStmt.run(
        orderId,
        orderNo,
        input.table_label,
        input.customer_name.trim(),
        'pending',
        'unpaid',
        null,
        bill.subtotal_paise,
        bill.cgst_paise,
        bill.sgst_paise,
        bill.total_paise,
        (input.note || '').trim(),
        publicToken,
        input.client_request_id,
        now,
        now
      );

      for (const line of orderLines) {
        insertItemStmt.run(
          `oi-${nanoid(12)}`,
          orderId,
          line.menu_item_id,
          line.variant_id,
          line.item_no,
          line.name,
          line.variant_label,
          line.unit_price_paise,
          line.quantity
        );
      }

      insertEventStmt.run(`evt-${nanoid(12)}`, orderId, now);
    })();

    const createdOrder = this.findById(orderId)!;

    // 5. Broadcast to owners via SSE
    sseService.notifyOrderCreated(createdOrder as any);

    return createdOrder;
  }

  /**
   * Advances or updates order status, enforcing strict state machine transitions.
   */
  public updateStatus(orderId: string, nextStatus: OrderStatus, actor = 'owner'): Order {
    const db = getDb();
    const order = this.findById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Enforce transition rules
    assertValidTransition(order.status, nextStatus);

    const now = new Date().toISOString();
    const completedAt = nextStatus === 'complete' ? now : null;

    db.transaction(() => {
      db.prepare(`
        UPDATE orders
        SET status = ?, updated_at = ?, completed_at = COALESCE(completed_at, ?)
        WHERE id = ?
      `).run(nextStatus, now, completedAt, orderId);

      db.prepare(`
        INSERT INTO order_status_events (id, order_id, from_status, to_status, actor, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(`evt-${nanoid(12)}`, orderId, order.status, nextStatus, actor, now);
    })();

    const updated = this.findById(orderId)!;
    sseService.notifyOrderUpdated(updated as any);
    return updated;
  }

  /**
   * Cancels an order if eligible (only from pending or preparing).
   */
  public cancelOrder(orderId: string, actor = 'owner', note = 'Cancelled by owner'): Order {
    const order = this.findById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    if (!canCancel(order.status)) {
      throw new Error(`Cannot cancel order in "${order.status}" status`);
    }

    return this.updateStatus(orderId, 'cancelled', actor);
  }

  /**
   * Marks an order as paid (cash or upi_manual).
   */
  public markPaid(orderId: string, method: PaymentMethod = 'cash', referenceNo?: string): Order {
    const db = getDb();
    const order = this.findById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const now = new Date().toISOString();

    db.transaction(() => {
      db.prepare(`
        UPDATE orders
        SET payment_status = 'paid', payment_method = ?, updated_at = ?
        WHERE id = ?
      `).run(method, now, orderId);

      db.prepare(`
        INSERT INTO payments (id, order_id, amount_paise, method, status, reference_no, recorded_by, created_at)
        VALUES (?, ?, ?, ?, 'completed', ?, 'owner', ?)
      `).run(`pay-${nanoid(12)}`, orderId, order.total_paise, method, referenceNo || null, now);
    })();

    const updated = this.findById(orderId)!;
    sseService.notifyOrderUpdated(updated as any);
    return updated;
  }

  /**
   * Marks an order as refunded.
   */
  public markRefunded(orderId: string): Order {
    const db = getDb();
    const order = this.findById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE orders
      SET payment_status = 'refunded', updated_at = ?
      WHERE id = ?
    `).run(now, orderId);

    const updated = this.findById(orderId)!;
    sseService.notifyOrderUpdated(updated as any);
    return updated;
  }

  /**
   * Hydrates order row with its items list.
   */
  private hydrateOrder(row: any): Order {
    const db = getDb();
    const items = db
      .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY item_no_snapshot ASC')
      .all(row.id) as OrderItem[];

    return {
      id: row.id,
      order_no: row.order_no,
      table_label: row.table_label,
      customer_name: row.customer_name,
      status: row.status as OrderStatus,
      payment_status: row.payment_status,
      payment_method: row.payment_method,
      subtotal_paise: row.subtotal_paise,
      cgst_paise: row.cgst_paise,
      sgst_paise: row.sgst_paise,
      total_paise: row.total_paise,
      note: row.note || '',
      public_token: row.public_token,
      client_request_id: row.client_request_id,
      items,
      created_at: row.created_at,
      updated_at: row.updated_at,
      completed_at: row.completed_at,
    };
  }

  /**
   * List orders for owner with filtering and pagination.
   */
  public listOrders(filters: {
    status?: OrderStatus;
    payment_status?: string;
    table_label?: string;
    customer_name?: string;
    limit?: number;
  } = {}): Order[] {
    const db = getDb();
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params: any[] = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.payment_status) {
      query += ' AND payment_status = ?';
      params.push(filters.payment_status);
    }
    if (filters.table_label) {
      query += ' AND table_label = ?';
      params.push(filters.table_label);
    }
    if (filters.customer_name) {
      query += ' AND customer_name LIKE ?';
      params.push(`%${filters.customer_name}%`);
    }

    query += ' ORDER BY created_at DESC';
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map((r) => this.hydrateOrder(r));
  }
}

export const orderService = new OrderService();

