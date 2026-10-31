import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../src/index.js';
import { getDb, closeDb } from '../src/db.js';
import { signSession, SESSION_COOKIE_NAME } from '../src/middleware/auth.js';

let app: FastifyInstance;

beforeAll(async () => {
  // Ensure DB initialized in test mode
  process.env.DATABASE_PATH = ':memory:';
  process.env.DEMO_MODE = 'true';
  getDb();
  app = await createServer();
  await app.ready();
});

afterAll(async () => {
  await app.close();
  closeDb();
});

describe('Ritsu Food Corner Server API Suite', () => {
  // P1-37: Bill maths test (Cases a and b from spec)
  it('P1-37: calculates Case (a) and Case (b) accurately with 5% GST and exact paise', async () => {
    // Case (a): 2x Chicken Manchurian Single (140) + 1x Veg Fried Rice Single (70)
    // Subtotal: 35000 paise (Rs 350.00), Tax: 1750 paise, CGST: 875, SGST: 875, Total: 36750 paise
    const resA = await app.inject({
      method: 'POST',
      url: '/api/orders',
      payload: {
        table_label: 'T1',
        customer_name: 'Vikas Test',
        client_request_id: `case-a-${Date.now()}-${Math.random()}`,
        items: [
          { menu_item_id: 'item-1', variant_id: 'var-1-s', quantity: 2 },
          { menu_item_id: 'item-80', variant_id: 'var-80-s', quantity: 1 },
        ],
      },
    });

    expect(resA.statusCode).toBe(201);
    const orderA = resA.json();
    expect(orderA.subtotal_paise).toBe(35000);
    expect(orderA.cgst_paise).toBe(875);
    expect(orderA.sgst_paise).toBe(875);
    expect(orderA.total_paise).toBe(36750);

    // Case (b): Veg Noodles Full (120) + Soft Drink Large (20) + Add-Ons (10)
    // Subtotal: 15000 paise (Rs 150.00), Tax: 750 paise, CGST: 375, SGST: 375, Total: 15750 paise
    const resB = await app.inject({
      method: 'POST',
      url: '/api/orders',
      payload: {
        table_label: 'T2',
        customer_name: 'Amit Test',
        client_request_id: `case-b-${Date.now()}-${Math.random()}`,
        items: [
          { menu_item_id: 'item-49', variant_id: 'var-49-f', quantity: 1 },
          { menu_item_id: 'item-164', variant_id: 'var-164-f', quantity: 1 },
          { menu_item_id: 'item-165', variant_id: 'var-165-s', quantity: 1 },
        ],
      },
    });

    expect(resB.statusCode).toBe(201);
    const orderB = resB.json();
    expect(orderB.subtotal_paise).toBe(15000);
    expect(orderB.cgst_paise).toBe(375);
    expect(orderB.sgst_paise).toBe(375);
    expect(orderB.total_paise).toBe(15750);
  });

  // P1-38: State machine test: valid transitions pass; illegal transitions return 409
  it('P1-38: enforces state machine transitions and returns 409 Conflict on illegal step', async () => {
    // 1. Create order
    const reqId = `state-machine-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/orders',
      payload: {
        table_label: 'T3',
        customer_name: 'Workflow Customer',
        client_request_id: reqId,
        items: [{ menu_item_id: 'item-1', variant_id: 'var-1-s', quantity: 1 }],
      },
    });
    const order = createRes.json();
    const orderId = order.id;

    const sessionCookie = signSession({ role: 'owner', created: Date.now() });

    // Try illegal transition: pending -> ready (skipping preparing)
    const illegalRes = await app.inject({
      method: 'PATCH',
      url: `/api/owner/orders/${orderId}/status`,
      headers: { cookie: `${SESSION_COOKIE_NAME}=${sessionCookie}` },
      payload: { status: 'ready' },
    });
    expect(illegalRes.statusCode).toBe(409);
    expect(illegalRes.json().error).toContain('Illegal order status transition');

    // Valid transition: pending -> preparing
    const prepRes = await app.inject({
      method: 'PATCH',
      url: `/api/owner/orders/${orderId}/status`,
      headers: { cookie: `${SESSION_COOKIE_NAME}=${sessionCookie}` },
      payload: { status: 'preparing' },
    });
    expect(prepRes.statusCode).toBe(200);
    expect(prepRes.json().status).toBe('preparing');

    // Valid transition: preparing -> ready
    const readyRes = await app.inject({
      method: 'PATCH',
      url: `/api/owner/orders/${orderId}/status`,
      headers: { cookie: `${SESSION_COOKIE_NAME}=${sessionCookie}` },
      payload: { status: 'ready' },
    });
    expect(readyRes.statusCode).toBe(200);
    expect(readyRes.json().status).toBe('ready');

    // Valid transition: ready -> complete
    const completeRes = await app.inject({
      method: 'PATCH',
      url: `/api/owner/orders/${orderId}/status`,
      headers: { cookie: `${SESSION_COOKIE_NAME}=${sessionCookie}` },
      payload: { status: 'complete' },
    });
    expect(completeRes.statusCode).toBe(200);
    expect(completeRes.json().status).toBe('complete');

    // Try illegal transition backwards: complete -> ready
    const backwardRes = await app.inject({
      method: 'PATCH',
      url: `/api/owner/orders/${orderId}/status`,
      headers: { cookie: `${SESSION_COOKIE_NAME}=${sessionCookie}` },
      payload: { status: 'ready' },
    });
    expect(backwardRes.statusCode).toBe(409);
  });

  // P1-39: Order idempotency test
  it('P1-39: returns identical order_no on duplicate client_request_id submissions', async () => {
    const requestId = 'idempotent-unique-req-777';

    const req1 = await app.inject({
      method: 'POST',
      url: '/api/orders',
      payload: {
        table_label: 'T4',
        customer_name: 'Idempotent Customer',
        client_request_id: requestId,
        items: [{ menu_item_id: 'item-2', variant_id: 'var-2-s', quantity: 1 }],
      },
    });

    const req2 = await app.inject({
      method: 'POST',
      url: '/api/orders',
      payload: {
        table_label: 'T4',
        customer_name: 'Idempotent Customer',
        client_request_id: requestId,
        items: [{ menu_item_id: 'item-2', variant_id: 'var-2-s', quantity: 1 }],
      },
    });

    expect(req1.statusCode).toBe(201);
    expect(req2.statusCode).toBe(201);
    expect(req1.json().id).toBe(req2.json().id);
    expect(req1.json().order_no).toBe(req2.json().order_no);
    expect(req1.json().public_token).toBe(req2.json().public_token);
  });

  // P1-40: Auth test: /api/owner/orders requires valid session
  it('P1-40: protects /api/owner routes with 401 for unauthenticated requests and 200 with session', async () => {
    // Unauthenticated request
    const unauthRes = await app.inject({
      method: 'GET',
      url: '/api/owner/orders',
    });
    expect(unauthRes.statusCode).toBe(401);

    // Authenticated request
    const sessionCookie = signSession({ role: 'owner', created: Date.now() });
    const authRes = await app.inject({
      method: 'GET',
      url: '/api/owner/orders',
      headers: { cookie: `${SESSION_COOKIE_NAME}=${sessionCookie}` },
    });
    expect(authRes.statusCode).toBe(200);
    expect(Array.isArray(authRes.json())).toBe(true);
  });

  // P1-41: Rate limit test: 6th order in window receives 429
  it('P1-41: limits orders to 5 per IP and returns 429 on 6th request', async () => {
    const ip = '192.168.1.100';

    for (let i = 1; i <= 5; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/orders',
        remoteAddress: ip,
        payload: {
          table_label: 'T5',
          customer_name: `Customer ${i}`,
          client_request_id: `rate-limit-test-${i}`,
          items: [{ menu_item_id: 'item-1', variant_id: 'var-1-s', quantity: 1 }],
        },
      });
      expect(res.statusCode).toBe(201);
    }

    // 6th order should be blocked with 429
    const blockedRes = await app.inject({
      method: 'POST',
      url: '/api/orders',
      remoteAddress: ip,
      payload: {
        table_label: 'T5',
        customer_name: 'Customer 6',
        client_request_id: 'rate-limit-test-6',
        items: [{ menu_item_id: 'item-1', variant_id: 'var-1-s', quantity: 1 }],
      },
    });
    expect(blockedRes.statusCode).toBe(429);
    expect(blockedRes.json().error).toContain('Too many orders');
  });

  // P1-42: Price tamper test: server recomputes prices from database
  it('P1-42: ignores any client-supplied prices and strictly uses server database prices', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders',
      remoteAddress: '192.168.1.101',
      payload: {
        table_label: 'T6',
        customer_name: 'Price Tamperer',
        client_request_id: 'tamper-test-1',
        // Client attempts to send fake prices
        items: [
          { menu_item_id: 'item-1', variant_id: 'var-1-s', quantity: 1, unit_price_paise: 100 },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const order = res.json();
    // Item 1 Single price is Rs 140 (14000 paise) + 5% tax (700 paise) = 14700 paise
    expect(order.items[0].unit_price_paise).toBe(14000);
    expect(order.subtotal_paise).toBe(14000);
    expect(order.total_paise).toBe(14700);
  });
});
