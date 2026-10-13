import React, { useState } from 'react';
import { useMenu } from '../../hooks/useMenu';
import { useOrders } from '../../hooks/useOrders';
import { calculateBill } from '../../domain/pricing';
import { RESTAURANT_CONFIG } from '../../config/restaurant.config';
import { Sparkles, Trash2, Dices } from 'lucide-react';

const RANDOM_NAMES = [
  'Aarav Sharma',
  'Ananya Iyer',
  'Rohit Verma',
  'Sneha Reddy',
  'Vikram Malhotra',
  'Pooja Nair',
  'Karan Mehra',
  'Neha Gupta',
  'Siddharth Patel',
  'Divya Sen',
];

export const DemoTools: React.FC = () => {
  const { items } = useMenu();
  const { createOrder, clearAllOrders } = useOrders();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleGenerateRandomOrder = async () => {
    if (items.length === 0) return;
    try {
      setIsGenerating(true);

      // Pick random table T1 to T8
      const randomTable =
        RESTAURANT_CONFIG.tables[Math.floor(Math.random() * RESTAURANT_CONFIG.tables.length)].label;

      // Pick random customer name
      const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];

      // Pick 1 to 4 random menu items
      const count = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...items].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, count);

      const orderLines = selected.map((item, idx) => {
        const variant = item.variants[Math.floor(Math.random() * item.variants.length)];
        const qty = Math.floor(Math.random() * 2) + 1;
        return {
          id: `demo-${Date.now()}-${idx}`,
          menu_item_id: item.id,
          variant_id: variant.id,
          item_no: item.item_no,
          name_snapshot: item.name,
          variant_label_snapshot: variant.label,
          unit_price_paise: variant.price_paise,
          quantity: qty,
          is_veg: item.is_veg,
        };
      });

      const bill = calculateBill(
        orderLines.map((l) => ({ unit_price_paise: l.unit_price_paise, quantity: l.quantity })),
        RESTAURANT_CONFIG.taxRatePercent
      );

      await createOrder({
        table_label: randomTable,
        customer_name: randomName,
        status: 'pending',
        payment_status: 'unpaid',
        subtotal_paise: bill.subtotal_paise,
        cgst_paise: bill.cgst_paise,
        sgst_paise: bill.sgst_paise,
        total_paise: bill.total_paise,
        note: Math.random() > 0.5 ? 'Demo note: extra spicy please' : undefined,
        items: orderLines,
      });
    } catch (e) {
      console.error('Failed to generate demo order', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearOrders = async () => {
    if (confirm('Clear all demo orders from local storage?')) {
      await clearAllOrders();
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Prototype Simulation Sandbox
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Simulate incoming dining orders from real menu items to test the kitchen flow.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateRandomOrder}
            className="py-2.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer min-h-[40px] shadow-md shadow-amber-950 active:scale-95 disabled:opacity-50"
          >
            <Dices className="w-4 h-4" />
            <span>{isGenerating ? 'Placing Order...' : 'Generate Demo Order'}</span>
          </button>

          <button
            type="button"
            onClick={handleClearOrders}
            className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-300 border border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer min-h-[40px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Demo Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
