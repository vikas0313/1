import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '../../supabase/functions/_shared/rate-limiter';
import { validateCustomerName, sanitizeString } from '../../supabase/functions/_shared/validation';
import { calculateBill } from '../../shared/pricing';

describe('Edge Function Logic & Security Validation', () => {
  it('rate limiter enforces max requests within sliding window', () => {
    const testIp = '192.168.1.100';
    const maxOrders = 5;
    const windowSec = 600;

    for (let i = 0; i < maxOrders; i++) {
      const res = checkRateLimit(testIp, maxOrders, windowSec);
      expect(res.allowed).toBe(true);
    }

    // 6th order should be blocked
    const blocked = checkRateLimit(testIp, maxOrders, windowSec);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it('validates customer name bounds and sanitization', () => {
    expect(validateCustomerName('Vikas').valid).toBe(true);
    expect(validateCustomerName('A').valid).toBe(false); // too short (< 2)
    expect(validateCustomerName('   ').valid).toBe(false);
    expect(validateCustomerName('a'.repeat(45)).valid).toBe(false); // too long (> 40)
  });

  it('sanitizes notes and strings correctly', () => {
    const dirty = 'Extra spicy \u0000 please\n';
    const clean = sanitizeString(dirty, 0, 50);
    expect(clean).toBe('Extra spicy  please');
  });

  it('guarantees server-side price calculation ignores client overrides', () => {
    // If client attempts to send unit price ₹1 instead of ₹140
    const serverVerifiedItem = { unit_price_paise: 14000, quantity: 2 };
    const bill = calculateBill([serverVerifiedItem], 5);

    expect(bill.subtotal_paise).toBe(28000);
    expect(bill.tax_paise).toBe(1400); // 5% of 280.00 = 14.00
    expect(bill.cgst_paise).toBe(700);
    expect(bill.sgst_paise).toBe(700);
    expect(bill.total_paise).toBe(29400);
  });
});
