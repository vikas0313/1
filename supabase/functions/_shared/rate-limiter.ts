// In-memory sliding window rate limiter per IP
// Configurable via environment variables (default 5 orders per 10 mins)

interface RateLimitRecord {
  timestamps: number[];
}

const ipHistory = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  ip: string,
  maxOrders = 5,
  windowSec = 600
): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const windowMs = windowSec * 1000;

  let record = ipHistory.get(ip);
  if (!record) {
    record = { timestamps: [] };
    ipHistory.set(ip, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxOrders) {
    const oldestTimestamp = record.timestamps[0];
    const retryAfterSec = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
    return { allowed: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }

  record.timestamps.push(now);
  return { allowed: true };
}
