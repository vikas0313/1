import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../src/index.js';
import { getDb, closeDb } from '../src/db.js';
import { signSession, SESSION_COOKIE_NAME } from '../src/middleware/auth.js';
import { AlertService } from '../../web/src/services/AlertService.js';

let app: FastifyInstance;
let ownerCookie: string;

beforeAll(async () => {
  process.env.DATABASE_PATH = ':memory:';
  process.env.DEMO_MODE = 'true';
  getDb();
  app = await createServer();
  await app.ready();

  const token = signSession({ role: 'owner', loggedInAt: Date.now() });
  ownerCookie = `${SESSION_COOKIE_NAME}=${token}`;
});

afterAll(async () => {
  await app.close();
  closeDb();
});

describe('Phase 3 Owner Dashboard & Alert System Suite', () => {
  // P3-24: AlertService Queue processing
  it('P3-24: AlertService processes 3 simultaneously enqueued orders without dropping any', async () => {
    const alert = AlertService.getInstance();
    alert.resetSeen();
    alert.clearQueue();

    // Mock announceOrder to track announcements
    const announcedOrders: string[] = [];
    const origAnnounce = alert.announceOrder.bind(alert);
    alert.announceOrder = async (order) => {
      announcedOrders.push(order.id);
    };

    const o1 = { id: 'order-queue-1', table_label: 'T1' };
    const o2 = { id: 'order-queue-2', table_label: 'T2' };
    const o3 = { id: 'order-queue-3', table_label: 'T3' };

    // Enqueue all 3 simultaneously
    const res1 = alert.enqueue(o1);
    const res2 = alert.enqueue(o2);
    const res3 = alert.enqueue(o3);

    expect(res1).toBe(true);
    expect(res2).toBe(true);
    expect(res3).toBe(true);

    // Allow queue to drain
    await new Promise((r) => setTimeout(r, 50));

    expect(announcedOrders).toEqual(['order-queue-1', 'order-queue-2', 'order-queue-3']);

    // Restore
    alert.announceOrder = origAnnounce;
  });

  // P3-25: AlertService Deduplication
  it('P3-25: AlertService rejects duplicate order IDs and avoids re-announcing', async () => {
    const alert = AlertService.getInstance();
    alert.resetSeen();
    alert.clearQueue();

    const announced: string[] = [];
    alert.announceOrder = async (order) => {
      announced.push(order.id);
    };

    const order = { id: 'order-dup-check-99', table_label: 'T4' };

    // First enqueue -> succeeds
    const firstAttempt = alert.enqueue(order);
    expect(firstAttempt).toBe(true);

    // Second enqueue with identical ID -> fails deduplication
    const secondAttempt = alert.enqueue(order);
    expect(secondAttempt).toBe(false);

    // Third attempt
    const thirdAttempt = alert.enqueue({ id: 'order-dup-check-99', table_label: 'T4' });
    expect(thirdAttempt).toBe(false);

    await new Promise((r) => setTimeout(r, 50));
    expect(announced).toEqual(['order-dup-check-99']);
  });

  // P3-26: API test: Mark Paid -> summary totals update correctly
  it('P3-26: updates summary sales totals correctly when an order is marked paid', async () => {
    // 1. Get initial summary
    const initialRes = await app.inject({
      method: 'GET',
      url: '/api/owner/summary?period=today',
      headers: { cookie: ownerCookie },
    });
    expect(initialRes.statusCode).toBe(200);
    const initialSummary = initialRes.json();
    const initialSales = initialSummary.total_sales_paise;
    const initialUnpaid = initialSummary.unpaid_sales_paise;

    // 2. Create a new order (Unpaid)
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/orders',
      remoteAddress: '10.5.5.5',
      payload: {
        table_label: 'T5',
        customer_name: 'Owner Summary Test',
        client_request_id: `summary-test-${Date.now()}`,
        items: [
          { menu_item_id: 'item-1', variant_id: 'var-1-s', quantity: 1 }, // 140.00
        ],
      },
    });
    expect(createRes.statusCode).toBe(201);
    const newOrder = createRes.json();
    const orderTotal = newOrder.total_paise; // 14700 paise (140 + 5% tax = 147.00)

    // 3. Check summary: unpaid amount increases by orderTotal
    const unpaidSummaryRes = await app.inject({
      method: 'GET',
      url: '/api/owner/summary?period=today',
      headers: { cookie: ownerCookie },
    });
    const unpaidSummary = unpaidSummaryRes.json();
    expect(unpaidSummary.unpaid_sales_paise).toBe(initialUnpaid + orderTotal);

    // 4. Mark Paid via owner endpoint
    const markPaidRes = await app.inject({
      method: 'PATCH',
      url: `/api/owner/orders/${newOrder.id}/mark-paid`,
      headers: { cookie: ownerCookie },
      payload: { method: 'cash' },
    });
    expect(markPaidRes.statusCode).toBe(200);
    expect(markPaidRes.json().payment_status).toBe('paid');

    // 5. Check summary again: paid sales increases, unpaid returns
    const paidSummaryRes = await app.inject({
      method: 'GET',
      url: '/api/owner/summary?period=today',
      headers: { cookie: ownerCookie },
    });
    const paidSummary = paidSummaryRes.json();
    expect(paidSummary.total_sales_paise).toBe(initialSales + orderTotal);
    expect(paidSummary.unpaid_sales_paise).toBe(initialUnpaid);
  });

  // P3-27: Staff & Owner Password verification
  it('P3-27: supports admin123 and staff123, trims whitespace, and rejects invalid passwords', async () => {
    // 1. admin123 with whitespace
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/owner/login',
      payload: { password: '  admin123  ' },
    });
    expect(res1.statusCode).toBe(200);
    expect(res1.headers['set-cookie']).toBeDefined();

    // 2. staff123
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/owner/login',
      payload: { password: 'staff123' },
    });
    expect(res2.statusCode).toBe(200);

    // 3. Invalid password
    const res3 = await app.inject({
      method: 'POST',
      url: '/api/owner/login',
      payload: { password: 'completely-wrong-password' },
    });
    expect(res3.statusCode).toBe(401);
  });
});

