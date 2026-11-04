import type { FastifyRequest, FastifyReply } from 'fastify';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: { max: number; windowMs: number; message?: string }) {
  const store = new Map<string, RateLimitRecord>();

  // Cleanup expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetAt) {
        store.delete(key);
      }
    }
  }, 60000);

  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let record = store.get(ip);

    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + options.windowMs };
      store.set(ip, record);
      return;
    }

    record.count++;
    if (record.count > options.max) {
      reply.status(429).send({
        error: options.message || 'Too many requests. Please try again later.',
        retryAfterMs: Math.max(0, record.resetAt - now),
      });
      return;
    }
  };
}

// 5 orders per 10 minutes per IP
export const orderRateLimiter = createRateLimiter({
  max: 5,
  windowMs: 10 * 60 * 1000,
  message: 'Too many orders placed from this network. Please wait a few minutes before trying again.',
});

// 10 login attempts per hour per IP
export const loginRateLimiter = createRateLimiter({
  max: 10,
  windowMs: 60 * 60 * 1000,
  message: 'Too many login attempts. Please wait an hour before trying again.',
});

