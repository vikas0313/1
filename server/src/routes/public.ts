import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { menuService } from '../services/menuService.js';
import { orderService } from '../services/orderService.js';
import { sseService } from '../services/sseService.js';
import { orderRateLimiter } from '../middleware/rateLimit.js';

const createOrderSchema = z.object({
  table_label: z.string().min(1, 'Table is required'),
  customer_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(40, 'Name cannot exceed 40 characters'),
  note: z.string().max(200, 'Note cannot exceed 200 characters').optional().default(''),
  client_request_id: z.string().min(1, 'Client request ID is required'),
  items: z
    .array(
      z.object({
        menu_item_id: z.string().min(1),
        variant_id: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1, 'Order must contain at least 1 item'),
});

export const publicRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/restaurant - Public restaurant settings
  fastify.get('/restaurant', async (_req, reply) => {
    const settings = menuService.getSettings();
    return reply
      .header('Cache-Control', 'public, max-age=60')
      .send(settings);
  });

  // GET /api/menu - Public active menu
  fastify.get('/menu', async (_req, reply) => {
    const menu = menuService.getPublicMenu();
    return reply
      .header('Cache-Control', 'public, max-age=30, stale-while-revalidate=300')
      .send(menu);
  });

  // GET /api/tables/:label - Validate table
  fastify.get('/tables/:label', async (req, reply) => {
    const { label } = req.params as { label: string };
    const table = menuService.getTableByLabel(label);
    if (!table) {
      return reply.status(404).send({ error: `Table "${label}" not found or inactive` });
    }
    return reply.send(table);
  });

  // POST /api/orders - Place order (rate limited)
  fastify.post('/orders', { preHandler: [orderRateLimiter] }, async (req, reply) => {
    const parseResult = createOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: parseResult.error.format(),
      });
    }

    try {
      const order = orderService.createOrder(parseResult.data);
      return reply.status(201).send(order);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message || 'Failed to place order' });
    }
  });

  // GET /api/orders/:public_token - View single order details
  fastify.get('/orders/:public_token', async (req, reply) => {
    const { public_token } = req.params as { public_token: string };
    const order = orderService.findByPublicToken(public_token);
    if (!order) {
      return reply.status(404).send({ error: 'Order not found' });
    }
    return reply.send(order);
  });

  // GET /api/orders/:public_token/stream - SSE live updates for customer
  fastify.get('/orders/:public_token/stream', async (req, reply) => {
    const { public_token } = req.params as { public_token: string };
    const order = orderService.findByPublicToken(public_token);
    if (!order) {
      return reply.status(404).send({ error: 'Order not found' });
    }

    sseService.addClient(reply, `order:${public_token}`);
  });
};
