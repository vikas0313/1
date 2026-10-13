export interface BillCalculation {
  subtotal_paise: number;
  tax_paise: number;
  cgst_paise: number;
  sgst_paise: number;
  total_paise: number;
}

/**
 * Pure calculation engine for Indian GST restaurant billing.
 *
 * Rules:
 * - All inputs and outputs in integer paise (₹1 = 100 paise).
 * - Subtotal = sum(unit_price_paise * quantity).
 * - 5% GST total is rounded to the nearest paisa.
 * - CGST = floor(tax / 2), SGST = tax - cgst so they always sum exactly to tax.
 * - Total = subtotal + tax.
 */
export function calculateBill(
  items: Array<{ unit_price_paise: number; quantity: number }>,
  taxRatePercent = 5
): BillCalculation {
  const subtotal_paise = items.reduce((sum, item) => {
    const qty = Math.max(0, Math.floor(item.quantity));
    const price = Math.max(0, Math.floor(item.unit_price_paise));
    return sum + price * qty;
  }, 0);

  // Compute tax rounded to nearest integer paisa
  const tax_paise = Math.round((subtotal_paise * taxRatePercent) / 100);

  // Divide into CGST and SGST strictly without losing 1 paisa
  const cgst_paise = Math.floor(tax_paise / 2);
  const sgst_paise = tax_paise - cgst_paise;

  const total_paise = subtotal_paise + tax_paise;

  return {
    subtotal_paise,
    tax_paise,
    cgst_paise,
    sgst_paise,
    total_paise,
  };
}

/**
 * Format integer paise into INR currency display.
 * Example: 36750 -> "₹367.50", 14000 -> "₹140.00" or "₹140"
 */
export function formatINR(paise: number, alwaysShowDecimals = true): string {
  const rupees = paise / 100;
  if (!alwaysShowDecimals && paise % 100 === 0) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rupees);
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}
