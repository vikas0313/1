import { describe, it, expect } from 'vitest';
import { calculateBill as sharedCalculateBill } from './pricing';
import { calculateBill as domainCalculateBill } from '../src/domain/pricing';

describe('Pricing Parity Test (Shared vs Domain)', () => {
  it('both shared and domain export identical calculateBill functions', () => {
    expect(sharedCalculateBill).toBe(domainCalculateBill);
  });

  it('calculates 2 x Rs140 + 1 x Rs70 correctly with CGST/SGST split', () => {
    // 2 x 140.00 = 280.00
    // 1 x 70.00 = 70.00
    // Subtotal: 350.00 (35000 paise)
    // Tax 5%: 17.50 (1750 paise)
    // CGST 2.5%: 8.75 (875 paise)
    // SGST 2.5%: 8.75 (875 paise)
    // Total: 367.50 (36750 paise)
    const items = [
      { unit_price_paise: 14000, quantity: 2 },
      { unit_price_paise: 7000, quantity: 1 },
    ];

    const result = sharedCalculateBill(items, 5);
    expect(result.subtotal_paise).toBe(35000);
    expect(result.tax_paise).toBe(1750);
    expect(result.cgst_paise).toBe(875);
    expect(result.sgst_paise).toBe(875);
    expect(result.cgst_paise + result.sgst_paise).toBe(result.tax_paise);
    expect(result.total_paise).toBe(36750);
  });

  it('calculates Rs120 + Rs20 + Rs10 correctly', () => {
    // 120 + 20 + 10 = 150.00 (15000 paise)
    // Tax 5%: 7.50 (750 paise)
    // CGST: 3.75 (375 paise)
    // SGST: 3.75 (375 paise)
    // Total: 157.50 (15750 paise)
    const items = [
      { unit_price_paise: 12000, quantity: 1 },
      { unit_price_paise: 2000, quantity: 1 },
      { unit_price_paise: 1000, quantity: 1 },
    ];

    const result = sharedCalculateBill(items, 5);
    expect(result.subtotal_paise).toBe(15000);
    expect(result.tax_paise).toBe(750);
    expect(result.cgst_paise).toBe(375);
    expect(result.sgst_paise).toBe(375);
    expect(result.total_paise).toBe(15750);
  });
});
