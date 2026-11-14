import type { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { config } from '../config.js';

// Simple signed session token mechanism
const SESSION_COOKIE_NAME = 'ritsu_owner_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

interface SessionPayload {
  role: 'owner';
  created: number;
}

export function signSession(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', config.SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${hmac}`;
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;

    const expectedSig = crypto.createHmac('sha256', config.SESSION_SECRET).update(data).digest('base64url');
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as SessionPayload;
    if (Date.now() - payload.created > SESSION_TTL_MS) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Validates owner password against hash or demo password.
 * Trims input and supports standard demo/staff passwords in DEMO_MODE or when no hash is set.
 */
export async function verifyOwnerPassword(password: string): Promise<boolean> {
  const trimmed = password.trim();
  const lower = trimmed.toLowerCase();

  const allowedDemoPasswords = ['admin123', 'staff123', 'admin', 'staff', 'owner', 'ritsu123', '123456'];

  // If demo mode is active or no password hash is configured, allow standard demo/staff passwords
  if (config.DEMO_MODE || !config.OWNER_PASSWORD_HASH) {
    if (allowedDemoPasswords.includes(lower) || trimmed === 'admin123') {
      return true;
    }
  }

  if (config.OWNER_PASSWORD_HASH) {
    try {
      if (await bcrypt.compare(trimmed, config.OWNER_PASSWORD_HASH)) {
        return true;
      }
    } catch {
      // ignore
    }
  }

  // Fallback: if demo mode is active
  return config.DEMO_MODE && allowedDemoPasswords.includes(lower);
}

/**
 * Fastify preHandler authentication guard for /api/owner/* routes.
 */
export async function requireOwnerAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const sessionCookie = req.cookies[SESSION_COOKIE_NAME];
  if (!sessionCookie) {
    reply.status(401).send({ error: 'Authentication required' });
    return;
  }

  const session = verifySession(sessionCookie);
  if (!session || session.role !== 'owner') {
    reply.status(401).send({ error: 'Invalid or expired session' });
    return;
  }
}

export { SESSION_COOKIE_NAME, SESSION_TTL_MS };

