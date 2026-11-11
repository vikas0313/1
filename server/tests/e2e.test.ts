import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../src/index.js';
import { getDb, closeDb } from '../src/db.js';
import { signSession, SESSION_COOKIE_NAME } from '../src/middleware/auth.js';
import { AlertService } from '../../web/src/services/AlertService.js';
import { calculateBill } from '@ritsu/shared';

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

describe('Phase 4 — End-to-End System & Security Hardening Suite', () => {
  // P4-09: Cross-device real-time sync simulation
  it('P4-09: cross-device sync — customer order updates owner and owner status advancement updates customer', async () => {
    // 1. Customer places order from mobile device
    const clientRequestId = `p4-e2e-sync-${Date.now()}`;
    const orderRes = await app.inject({
      method: 'POST',
      url: '/api/orders',
      remoteAddress: '10.1.1.1',
      payload: {
        table_label: 'T1',
        customer_name: 'P4 Sync Customer',
        client_request_id: clientRequestId,
        items: [
          { menu_item_id: 'item-1', variant_id: 'var-1-s', quantity: 1 },
        ],
      },
    });

    expect(orderRes.statusCode).toBe(201);
    const order = orderRes.json();
    const orderId = order.id;
    const publicToken = order.public_token;

    // 2. Owner fetches active orders on owner device — order appears immediately
    const ownerOrdersRes = await app.inject({
      method: 'GET',
      url: '/api/owner/orders',
      headers: { cookie: ownerCookie },
    });
    expect(ownerOrdersRes.statusCode).toBe(200);
    const ownerOrders = ownerOrdersRes.json();
    const foundOnOwner = ownerOrders.find((o: any) => o.id === orderId);
    expect(foundOnOwner).toBeDefined();
    expect(foundOnOwner.status).toBe('pending');

    // 3. Owner advances status: pending -> preparing
    const advanceRes = await app.inject({
      method: 'PATCH',
      url: `/api/owner/orders/${orderId}/status`,
      headers: { cookie: ownerCookie },
      payload: { status: 'preparing' },
    });
    expect(advanceRes.statusCode).toBe(200);

    // 4. Customer polls/tracks order on mobile phone by token — reflects 'preparing'
    const customerTrackingRes = await app.inject({
      method: 'GET',
      url: `/api/orders/${publicToken}`,
    });
    expect(customerTrackingRes.statusCode).toBe(200);
    expect(customerTrackingRes.json().status).toBe('preparing');
  });

  // P4-10: Complete Customer Order Flow
  it('P4-10: order flow — table validation, 2-size variant selection, 5% GST computation, and bill generation', async () => {
    // 1. Table validation
    const tableValidRes = await app.inject({
      method: 'GET',
      url: '/api/tables/T3',
    });
    expect(tableValidRes.statusCode).toBe(200);
    expect(tableValidRes.json().active).toBe(true);

    const tableInvalidRes = await app.inject({
      method: 'GET',
      url: '/api/tables/T999',
    });
    expect(tableInvalidRes.statusCode).toBe(404);

    // 2. Menu fetch
    const menuRes = await app.inject({
      method: 'GET',
      url: '/api/menu',
    });
    expect(menuRes.statusCode).toBe(200);
    const menuData = menuRes.json();
    expect(menuData.categories.length).toBeGreaterThanOrEqual(14);
    expect(menuData.items.length).toBeGreaterThanOrEqual(160);

    // 3. Cart calculation with GST
    // Item 1 Single (140) + Item 80 Single (70) = Subtotal 210
    const bill = calculateBill([
      { unit_price_paise: 14000, quantity: 1 },
      { unit_price_paise: 7000, quantity: 1 },
    ]);
    expect(bill.subtotal_paise).toBe(21000);
    expect(bill.tax_paise).toBe(1050); // 5% of 210.00 = 10.50
    expect(bill.cgst_paise).toBe(525);
    expect(bill.sgst_paise).toBe(525);
    expect(bill.total_paise).toBe(22050);

    // 4. Place order
    const orderRes = await app.inject({
      method: 'POST',
      url: '/api/orders',
      remoteAddress: '10.1.1.2',
      payload: {
        table_label: 'T3',
        customer_name: 'P4 Flow Customer',
        client_request_id: `p4-flow-${Date.now()}`,
        items: [
          { menu_item_id: 'item-1', variant_id: 'var-1-s', quantity: 1 },
          { menu_item_id: 'item-80', variant_id: 'var-80-s', quantity: 1 },
        ],
      },
    });
    expect(orderRes.statusCode).toBe(201);
    const placed = orderRes.json();
    expect(placed.total_paise).toBe(22050);
  });

  // P4-11: Owner Kanban & State Machine Safety
  it('P4-11: owner Kanban — sequential status advancement, 409 on illegal jump, and idempotent ordering', async () => {
    const clientRequestId = `p4-state-mach-${Date.now()}`;
    const orderRes = await app.inject({
      method: 'POST',
      url: '/api/orders',
      remoteAddress: '10.1.1.3',
      payload: {
        table_label: 'T2',
        customer_name: 'P4 State Customer',
        client_request_id: clientRequestId,
        items: [{ menu_item_id: 'item-1', variant_id: 'var-1-s', quantity: 1 }],
      },
    });
    const order = orderRes.json();

    // Idempotency check: duplicate submission returns existing order
    const dupRes = await app.inject({
      method: 'POST',
      url: '/api/orders',
      remoteAddress: '10.1.1.3',
      payload: {
        table_label: 'T2',
        customer_name: 'P4 State Customer',
        client_request_id: clientRequestId,
        items: [{ menu_item_id: 'item-1', variant_id: 'var-1-s', quantity: 1 }],
      },
    });
    expect(dupRes.statusCode).toBe(201);
    expect(dupRes.json().id).toBe(order.id);

    // Illegal jump: Pending directly to Complete -> 409 Conflict
    const illegalJumpRes = await app.inject({
      method: 'PATCH',
      url: `/api/owner/orders/${order.id}/status`,
      headers: { cookie: ownerCookie },
      payload: { status: 'complete' },
    });
    expect(illegalJumpRes.statusCode).toBe(409);

    // Legal progression: Pending -> Preparing -> Ready -> Complete
    const step1 = await app.inject({
      method: 'PATCH',
      url: `/api/owner/orders/${order.id}/status`,
      headers: { cookie: ownerCookie },
      payload: { status: 'preparing' },
    });
    expect(step1.statusCode).toBe(200);

    const step2 = await app.inject({
      method: 'PATCH',
      url: `/api/owner/orders/${order.id}/status`,
      headers: { cookie: ownerCookie },
      payload: { status: 'ready' },
    });
    expect(step2.statusCode).toBe(200);

    const step3 = await app.inject({
      method: 'PATCH',
      url: `/api/owner/orders/${order.id}/status`,
      headers: { cookie: ownerCookie },
      payload: { status: 'complete' },
    });
    expect(step3.statusCode).toBe(200);

    // Cannot advance past complete
    const step4 = await app.inject({
      method: 'PATCH',
      url: `/api/owner/orders/${order.id}/status`,
      headers: { cookie: ownerCookie },
      payload: { status: 'preparing' },
    });
    expect(step4.statusCode).toBe(409);
  });

  // P4-12: Alert System sequence and deduplication
  it('P4-12: alert system — sequential queue drain and deduplication protection', async () => {
    const alert = AlertService.getInstance();
    alert.resetSeen();
    alert.clearQueue();

    const announced: string[] = [];
    alert.announceOrder = async (ord) => {
      announced.push(ord.id);
    };

    const first = alert.enqueue({ id: 'p4-alert-1', table_label: 'T5' });
    const duplicate = alert.enqueue({ id: 'p4-alert-1', table_label: 'T5' });
    const second = alert.enqueue({ id: 'p4-alert-2', table_label: 'T6' });

    expect(first).toBe(true);
    expect(duplicate).toBe(false);
    expect(second).toBe(true);

    await new Promise((r) => setTimeout(r, 60));
    expect(announced).toEqual(['p4-alert-1', 'p4-alert-2']);
  });

  // P4-13: Security hardening
  it('P4-13: security — anonymous access rejected (401), rate limiting enforced, price tampering prevented', async () => {
    // 1. Anonymous access rejected with 401
    const anonRes = await app.inject({
      method: 'GET',
      url: '/api/owner/orders',
    });
    expect(anonRes.statusCode).toBe(401);

    // 2. Price tampering immunity: client sends 1 paisa (Rs 0.01) for Rs 140.00 dish
    const tamperRes = await app.inject({
      method: 'POST',
      url: '/api/orders',
      remoteAddress: '10.1.1.4',
      payload: {
        table_label: 'T1',
        customer_name: 'Attacker',
        client_request_id: `tamper-${Date.now()}`,
        items: [
          {
            menu_item_id: 'item-1',
            variant_id: 'var-1-s',
            quantity: 1,
            unit_price_paise: 1, // Tampered price
          },
        ],
      },
    });

    expect(tamperRes.statusCode).toBe(201);
    const recordedOrder = tamperRes.json();
    // Server computes unit_price strictly from database (140.00 -> 14000 paise + 5% GST = 14700 paise)
    expect(recordedOrder.items[0].unit_price_paise).toBe(14000);
    expect(recordedOrder.total_paise).toBe(14700);

    // 3. Brute force rate limit: 11 rapid invalid password attempts
    const uniqueIp = '198.51.100.42';
    for (let i = 0; i < 10; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/owner/login',
        remoteAddress: uniqueIp,
        payload: { password: 'wrong-password' },
      });
    }

    const rateLimitedRes = await app.inject({
      method: 'POST',
      url: '/api/owner/login',
      remoteAddress: uniqueIp,
      payload: { password: 'wrong-password' },
    });
    expect(rateLimitedRes.statusCode).toBe(429);
  });
});
