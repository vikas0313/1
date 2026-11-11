import fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { config } from './config.js';
import { getDb, closeDb } from './db.js';
import { publicRoutes } from './routes/public.js';
import { ownerRoutes } from './routes/owner.js';
import { backupService } from './services/backupService.js';

export async function createServer() {
  const app = fastify({
    logger: config.NODE_ENV !== 'test',
    bodyLimit: 10 * 1024, // 10 KB request limit
  });

  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: false, // Vite and local assets compatibility
  });

  // CORS
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. mobile apps, curl, SSE reconnects)
      if (!origin) return cb(null, true);
      if (
        config.ALLOWED_ORIGINS.includes(origin) ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return cb(null, true);
      }
      return cb(null, false);
    },
    credentials: true,
  });

  // Cookie parsing and signing
  await app.register(cookie, {
    secret: config.SESSION_SECRET,
  });

  // Health check
  app.get('/health', async (_req, reply) => {
    try {
      const db = getDb();
      db.prepare('SELECT 1').get();
      return reply.send({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        db: 'ok',
        demo_mode: config.DEMO_MODE,
      });
    } catch {
      return reply.status(503).send({ status: 'error', db: 'unhealthy' });
    }
  });

  // API Routes
  await app.register(publicRoutes, { prefix: '/api' });
  await app.register(ownerRoutes, { prefix: '/api/owner' });

  // Global error handler
  app.setErrorHandler((error: any, req, reply) => {
    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation error',
        details: error.validation,
      });
    }

    const statusCode = error.statusCode || 500;
    if (statusCode >= 500) {
      req.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }

    return reply.status(statusCode).send({ error: error.message });
  });

  return app;
}

async function start() {
  try {
    // Ensure DB is initialized and migrations run
    getDb();
    console.log('[server] Database initialized and migrations verified.');

    const app = await createServer();
    await app.listen({ port: config.PORT, host: config.HOST });
    console.log(`[server] Ritsu Food Corner API listening on http://${config.HOST}:${config.PORT}`);
    console.log(`[server] Demo Mode: ${config.DEMO_MODE ? 'ENABLED (admin123 active)' : 'DISABLED'}`);
  } catch (err) {
    console.error('[server] Boot failed:', err);
    process.exit(1);
  }
}

// Auto-start when executed directly
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  start();
}

