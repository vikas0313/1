import type { FastifyPluginAsync } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import type { OrderStatus, PaymentMethod } from '@ritsu/shared';
import { config } from '../config.js';
import { getDb } from '../db.js';
import { orderService } from '../services/orderService.js';
import { menuService } from '../services/menuService.js';
import { sseService } from '../services/sseService.js';
import {
  requireOwnerAuth,
  verifyOwnerPassword,
  signSession,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from '../middleware/auth.js';
import { loginRateLimiter } from '../middleware/rateLimit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

const statusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'complete', 'cancelled']),
});

const markPaidSchema = z.object({
  method: z.enum(['cash', 'upi_manual']).default('cash'),
  reference_no: z.string().optional(),
});

export const ownerRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/owner/login
  fastify.post('/login', { preHandler: [loginRateLimiter] }, async (req, reply) => {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'Password required' });
    }

    const isValid = await verifyOwnerPassword(parse.data.password);
    if (!isValid) {
      return reply.status(401).send({ error: 'Invalid password' });
    }

    const token = signSession({ role: 'owner', created: Date.now() });

    reply.setCookie(SESSION_COOKIE_NAME, token, {
      path: '/',
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    });

    return reply.send({ success: true });
  });

  // POST /api/owner/logout
  fastify.post('/logout', async (_req, reply) => {
    reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return reply.send({ success: true });
  });

  // GET /api/owner/session
  fastify.get('/session', { preHandler: [requireOwnerAuth] }, async (_req, reply) => {
    return reply.send({ authenticated: true, demo_mode: config.DEMO_MODE });
  });

  // GET /api/owner/stream - Owner SSE stream
  fastify.get('/stream', { preHandler: [requireOwnerAuth] }, async (_req, reply) => {
    sseService.addClient(reply, 'owner');
  });

  // GET /api/owner/orders - List orders
  fastify.get('/orders', { preHandler: [requireOwnerAuth] }, async (req, reply) => {
    const query = req.query as {
      status?: OrderStatus;
      payment_status?: string;
      table_label?: string;
      customer_name?: string;
      limit?: string;
    };

    const orders = orderService.listOrders({
      status: query.status,
      payment_status: query.payment_status,
      table_label: query.table_label,
      customer_name: query.customer_name,
      limit: query.limit ? parseInt(query.limit, 10) : 100,
    });

    return reply.send(orders);
  });

  // PATCH /api/owner/orders/:id/status
  fastify.patch('/orders/:id/status', { preHandler: [requireOwnerAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parse = statusSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'Valid status required' });
    }

    try {
      const order = orderService.updateStatus(id, parse.data.status, 'owner');
      return reply.send(order);
    } catch (err: any) {
      // Return 409 Conflict with friendly message on illegal transition
      if (err.message?.includes('Illegal order status transition')) {
        return reply.status(409).send({ error: err.message });
      }
      return reply.status(400).send({ error: err.message || 'Failed to update order status' });
    }
  });

  // PATCH /api/owner/orders/:id/mark-paid
  fastify.patch('/orders/:id/mark-paid', { preHandler: [requireOwnerAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parse = markPaidSchema.safeParse(req.body || {});
    if (!parse.success) {
      return reply.status(400).send({ error: 'Invalid payment parameters' });
    }

    try {
      const order = orderService.markPaid(id, parse.data.method, parse.data.reference_no);
      return reply.send(order);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message || 'Failed to mark order as paid' });
    }
  });

  // PATCH /api/owner/orders/:id/mark-refunded
  fastify.patch('/orders/:id/mark-refunded', { preHandler: [requireOwnerAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const order = orderService.markRefunded(id);
      return reply.send(order);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message || 'Failed to mark order as refunded' });
    }
  });

  // DELETE /api/owner/orders/:id - Cancel order
  fastify.delete('/orders/:id', { preHandler: [requireOwnerAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const order = orderService.cancelOrder(id, 'owner');
      return reply.send(order);
    } catch (err: any) {
      return reply.status(409).send({ error: err.message || 'Cannot cancel this order' });
    }
  });

  // GET /api/owner/summary - Sales metrics in Asia/Kolkata timezone
  fastify.get('/summary', { preHandler: [requireOwnerAuth] }, async (req, reply) => {
    const db = getDb();
    const query = req.query as { period?: string };
    const period = query.period || 'today';

    let dateClause = '';
    if (period === 'today') {
      // Asia/Kolkata is UTC+5:30
      dateClause = "AND date(datetime(created_at, '+5 hours', '30 minutes')) = date(datetime('now', '+5 hours', '30 minutes'))";
    } else if (period === '7days') {
      dateClause = "AND datetime(created_at, '+5 hours', '30 minutes') >= datetime('now', '-7 days', '+5 hours', '30 minutes')";
    }

    const paidRow = db.prepare(`
      SELECT 
        COALESCE(SUM(total_paise), 0) as total_sales_paise,
        COUNT(*) as paid_count
      FROM orders
      WHERE payment_status = 'paid' ${dateClause}
    `).get() as { total_sales_paise: number; paid_count: number };

    const unpaidRow = db.prepare(`
      SELECT 
        COALESCE(SUM(total_paise), 0) as unpaid_sales_paise,
        COUNT(*) as unpaid_count
      FROM orders
      WHERE payment_status = 'unpaid' AND status != 'cancelled' ${dateClause}
    `).get() as { unpaid_sales_paise: number; unpaid_count: number };

    const totalOrdersRow = db.prepare(`
      SELECT COUNT(*) as total_orders
      FROM orders
      WHERE status != 'cancelled' ${dateClause}
    `).get() as { total_orders: number };

    const totalSales = paidRow.total_sales_paise;
    const paidCount = paidRow.paid_count;
    const avgOrder = paidCount > 0 ? Math.round(totalSales / paidCount) : 0;

    return reply.send({
      period,
      total_sales_paise: totalSales,
      unpaid_sales_paise: unpaidRow.unpaid_sales_paise,
      order_count: totalOrdersRow.total_orders,
      avg_order_paise: avgOrder,
    });
  });

  // GET /api/owner/menu - Full menu with verification flags
  fastify.get('/menu', { preHandler: [requireOwnerAuth] }, async (_req, reply) => {
    const db = getDb();
    const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
    const items = db.prepare('SELECT * FROM menu_items ORDER BY sort_order ASC').all() as any[];
    const variants = db.prepare('SELECT * FROM menu_item_variants ORDER BY sort_order ASC').all() as any[];

    return reply.send({ categories, items, variants });
  });

  // PATCH /api/owner/menu/variants/:id/confirm-price
  fastify.patch('/menu/variants/:id/confirm-price', { preHandler: [requireOwnerAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    menuService.confirmVariantPrice(id);
    return reply.send({ success: true });
  });

  // PATCH /api/owner/menu/variants/:id
  fastify.patch('/menu/variants/:id', { preHandler: [requireOwnerAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as { price_paise?: number; available?: boolean; label?: string };
    menuService.updateVariant(id, body);
    return reply.send({ success: true });
  });

  // PATCH /api/owner/menu/items/:id/availability
  fastify.patch('/menu/items/:id/availability', { preHandler: [requireOwnerAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { available } = req.body as { available: boolean };
    menuService.updateItemAvailability(id, available);
    return reply.send({ success: true });
  });

  // GET /api/owner/tables
  fastify.get('/tables', { preHandler: [requireOwnerAuth] }, async (_req, reply) => {
    const tables = menuService.getAllTables();
    return reply.send(tables);
  });

  // POST /api/owner/tables
  fastify.post('/tables', { preHandler: [requireOwnerAuth] }, async (req, reply) => {
    const db = getDb();
    const { label } = req.body as { label: string };
    if (!label || !label.trim()) {
      return reply.status(400).send({ error: 'Table label is required' });
    }
    const cleanLabel = label.trim().toUpperCase();
    const id = `tbl-${cleanLabel.toLowerCase()}-${Date.now().toString(36)}`;
    const maxSortRow = db.prepare('SELECT MAX(sort_order) as max_sort FROM tables').get() as any;
    const sortOrder = (maxSortRow?.max_sort || 0) + 1;

    try {
      db.prepare('INSERT INTO tables (id, label, active, sort_order) VALUES (?, ?, 1, ?)').run(id, cleanLabel, sortOrder);
      return reply.status(201).send({ id, label: cleanLabel, active: true, sort_order: sortOrder });
    } catch (err: any) {
      return reply.status(400).send({ error: 'Table label already exists or invalid' });
    }
  });

  // PATCH /api/owner/tables/:id
  fastify.patch('/tables/:id', { preHandler: [requireOwnerAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { active } = req.body as { active: boolean };
    const db = getDb();
    db.prepare('UPDATE tables SET active = ? WHERE id = ?').run(active ? 1 : 0, id);
    return reply.send({ success: true, id, active });
  });

  // GET /api/owner/settings
  fastify.get('/settings', { preHandler: [requireOwnerAuth] }, async (_req, reply) => {
    const db = getDb();
    const row = db.prepare('SELECT * FROM restaurant_settings WHERE id = 1').get();
    return reply.send(row || {});
  });

  // PATCH /api/owner/settings
  fastify.patch('/settings', { preHandler: [requireOwnerAuth] }, async (req, reply) => {
    const db = getDb();
    const { name, tagline, phone, address, gstin, upi_vpa } = req.body as any;
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (tagline !== undefined) { updates.push('tagline = ?'); values.push(tagline); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (address !== undefined) { updates.push('address = ?'); values.push(address); }
    if (gstin !== undefined) { updates.push('gstin = ?'); values.push(gstin); }
    if (upi_vpa !== undefined) { updates.push('upi_vpa = ?'); values.push(upi_vpa); }

    if (updates.length > 0) {
      db.prepare(`UPDATE restaurant_settings SET ${updates.join(', ')} WHERE id = 1`).run(...values);
    }
    const row = db.prepare('SELECT * FROM restaurant_settings WHERE id = 1').get();
    return reply.send(row || {});
  });

  // GET /api/owner/backup - Download raw SQLite file
  fastify.get('/backup', { preHandler: [requireOwnerAuth] }, async (_req, reply) => {
    const dbPath = path.isAbsolute(config.DATABASE_PATH)
      ? config.DATABASE_PATH
      : path.resolve(__dirname, '../../../', config.DATABASE_PATH);

    if (!fs.existsSync(dbPath)) {
      return reply.status(404).send({ error: 'Database file not found' });
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `ritsu-backup-${dateStr}.db`;

    const stream = fs.createReadStream(dbPath);
    return reply
      .header('Content-Type', 'application/octet-stream')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(stream);
  });

  // DEMO-ONLY: POST /api/owner/demo/generate-order
  fastify.post('/demo/generate-order', { preHandler: [requireOwnerAuth] }, async (_req, reply) => {
    if (!config.DEMO_MODE) {
      return reply.status(403).send({ error: 'Demo mode is disabled' });
    }

    // Generate a mock order for testing live sync
    const order = orderService.createOrder({
      table_label: 'T1',
      customer_name: 'Demo Customer',
      note: 'Demo generated test order',
      client_request_id: `demo-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      items: [
        { menu_item_id: 'item-1', variant_id: 'var-1-s', quantity: 2 },
        { menu_item_id: 'item-80', variant_id: 'var-80-s', quantity: 1 },
      ],
    });

    return reply.status(201).send(order);
  });

  // DEMO-ONLY: DELETE /api/owner/demo/data
  fastify.delete('/demo/data', { preHandler: [requireOwnerAuth] }, async (_req, reply) => {
    if (!config.DEMO_MODE) {
      return reply.status(403).send({ error: 'Demo mode is disabled' });
    }

    const db = getDb();
    db.exec(`
      DELETE FROM order_status_events;
      DELETE FROM payments;
      DELETE FROM order_items;
      DELETE FROM orders;
    `);

    return reply.send({ success: true, message: 'All demo orders cleared' });
  });
};

