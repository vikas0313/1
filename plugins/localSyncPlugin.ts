import type { Plugin, ViteDevServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Vite plugin that provides a local shared file storage backend and real-time SSE stream.
 * Enables live multi-device ordering (phone -> owner portal) across local Wi-Fi or tunnels
 * without requiring any external cloud database or Supabase setup!
 */
export function localSyncPlugin(): Plugin {
  const dataDir = path.resolve(process.cwd(), 'data');
  const ordersFile = path.join(dataDir, 'local_orders.json');
  const sseClients = new Set<ServerResponse>();

  function readOrders(): any[] {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (!fs.existsSync(ordersFile)) {
        fs.writeFileSync(ordersFile, JSON.stringify([], null, 2), 'utf-8');
        return [];
      }
      const raw = fs.readFileSync(ordersFile, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  function writeOrders(orders: any[]): void {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2), 'utf-8');
      broadcastOrders(orders);
    } catch (e) {
      console.error('[local-sync] Failed to save orders:', e);
    }
  }

  function broadcastOrders(orders: any[]): void {
    const payload = `data: ${JSON.stringify(orders)}\n\n`;
    sseClients.forEach((client) => {
      try {
        client.write(payload);
      } catch {
        sseClients.delete(client);
      }
    });
  }

  return {
    name: 'ritsu-local-sync-plugin',
    configureServer(server: ViteDevServer) {
      const interval = setInterval(() => {
        sseClients.forEach((client) => {
          try {
            client.write(': ping\n\n');
          } catch {
            sseClients.delete(client);
          }
        });
      }, 15000);
      interval.unref();

      server.httpServer?.on('close', () => {
        clearInterval(interval);
        sseClients.forEach((c) => {
          try { c.end(); } catch {}
        });
        sseClients.clear();
      });

      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url || '';

        // CORS headers for all /api requests
        if (url.startsWith('/api/')) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }
        }

        // 1. SSE Events feed: /api/events
        if (url === '/api/events' && req.method === 'GET') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
          });

          sseClients.add(res);

          // Send current state immediately on connect
          const orders = readOrders();
          res.write(`data: ${JSON.stringify(orders)}\n\n`);

          req.on('close', () => {
            sseClients.delete(res);
          });
          return;
        }

        // 2. GET /api/orders
        if (url === '/api/orders' && req.method === 'GET') {
          const orders = readOrders();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(orders));
          return;
        }

        // Helper to parse JSON body
        const parseJsonBody = (callback: (body: any) => void) => {
          let raw = '';
          req.on('data', (chunk) => {
            raw += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = raw ? JSON.parse(raw) : {};
              callback(parsed);
            } catch {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
        };

        // 3. POST /api/orders
        if (url === '/api/orders' && req.method === 'POST') {
          parseJsonBody((newOrder) => {
            if (!newOrder || !newOrder.id) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing order data' }));
              return;
            }

            const current = readOrders();
            // Check idempotency
            const exists = current.some((o) => o.id === newOrder.id);
            const updated = exists
              ? current.map((o) => (o.id === newOrder.id ? newOrder : o))
              : [newOrder, ...current];

            writeOrders(updated);

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, order: newOrder }));
          });
          return;
        }

        // 4. PATCH /api/orders/:id
        if (url.startsWith('/api/orders/') && req.method === 'PATCH') {
          const orderId = decodeURIComponent(url.replace('/api/orders/', '').split('?')[0]);
          parseJsonBody((updates) => {
            const current = readOrders();
            const index = current.findIndex((o) => o.id === orderId);

            if (index === -1) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Order not found' }));
              return;
            }

            const updatedOrder = {
              ...current[index],
              ...updates,
              updated_at: new Date().toISOString(),
            };

            current[index] = updatedOrder;
            writeOrders(current);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, order: updatedOrder }));
          });
          return;
        }

        // 5. DELETE /api/orders
        if (url === '/api/orders' && req.method === 'DELETE') {
          writeOrders([]);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        next();
      });
    },
  };
}
