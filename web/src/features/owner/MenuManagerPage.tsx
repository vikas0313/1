import React, { useState, useEffect } from 'react';
import type { Category, MenuItem, ItemVariant } from '@ritsu/shared';
import { formatPaise } from '@ritsu/shared';
import { Button } from '../../components/Button.js';
import { Skeleton } from '../../components/Skeleton.js';
import { 
  Search, 
  Plus, 
  Download, 
  Check, 
  Edit3, 
  AlertCircle, 
  CheckCircle2, 
  X,
  FileSpreadsheet,
  FileJson
} from 'lucide-react';

export const MenuManagerPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Inline editing state: { variantId: string, priceRupees: string }
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');

  // Add Item Dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategoryId, setNewItemCategoryId] = useState('');
  const [newItemNo, setNewItemNo] = useState<number>(200);
  const [newItemIsVeg, setNewItemIsVeg] = useState(true);
  const [newItemVariantLabel, setNewItemVariantLabel] = useState('Standard');
  const [newItemPriceRupees, setNewItemPriceRupees] = useState('150');

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/owner/menu');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setItems(data.items || []);
        if (data.categories?.length > 0 && !newItemCategoryId) {
          setNewItemCategoryId(data.categories[0].id);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleToggleItemAvailability = async (itemId: string, current: boolean) => {
    const next = !current;
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, available: next } : it))
    );

    try {
      await fetch(`/api/owner/menu/items/${itemId}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: next }),
      });
    } catch {
      fetchMenu();
    }
  };

  const handleToggleVariantAvailability = async (
    itemId: string,
    variantId: string,
    current: boolean
  ) => {
    const next = !current;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          variants: it.variants.map((v) =>
            v.id === variantId ? { ...v, available: next } : v
          ),
        };
      })
    );

    try {
      await fetch(`/api/owner/menu/items/${itemId}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant_id: variantId, available: next }),
      });
    } catch {
      fetchMenu();
    }
  };

  const handleSavePrice = async (itemId: string, variantId: string) => {
    const rupees = parseFloat(editingPrice);
    if (isNaN(rupees) || rupees < 0) return;

    const pricePaise = Math.round(rupees * 100);

    // Optimistic update
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          variants: it.variants.map((v) =>
            v.id === variantId
              ? { ...v, price_paise: pricePaise, needs_verification: false }
              : v
          ),
        };
      })
    );
    setEditingVariantId(null);

    try {
      await fetch(`/api/owner/menu/items/${itemId}/variants/${variantId}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_paise: pricePaise, confirm_verification: true }),
      });
    } catch {
      fetchMenu();
    }
  };

  const handleConfirmVerification = async (itemId: string, variantId: string, currentPaise: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          variants: it.variants.map((v) =>
            v.id === variantId ? { ...v, needs_verification: false } : v
          ),
        };
      })
    );

    try {
      await fetch(`/api/owner/menu/items/${itemId}/variants/${variantId}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_paise: currentPaise, confirm_verification: true }),
      });
    } catch {
      fetchMenu();
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemCategoryId) return;

    const pricePaise = Math.round(parseFloat(newItemPriceRupees || '0') * 100);

    try {
      const res = await fetch('/api/owner/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: newItemCategoryId,
          item_no: Number(newItemNo),
          name: newItemName,
          is_veg: newItemIsVeg,
          is_popular: false,
          available: true,
          variants: [
            {
              label: newItemVariantLabel || 'Standard',
              price_paise: pricePaise,
              available: true,
              needs_verification: false,
            },
          ],
        }),
      });

      if (res.ok) {
        setShowAddDialog(false);
        setNewItemName('');
        fetchMenu();
      }
    } catch {
      // ignore
    }
  };

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ categories, items }, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `ritsu_menu_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
  };

  const exportCSV = () => {
    const rows = [
      ['Category', 'Item No', 'Item Name', 'Diet', 'Variant', 'Price (INR)', 'Available', 'Verified'],
    ];

    items.forEach((item) => {
      const cat = categories.find((c) => c.id === item.category_id)?.name || '';
      item.variants.forEach((v) => {
        rows.push([
          `"${cat}"`,
          String(item.item_no),
          `"${item.name}"`,
          item.is_veg ? 'Veg' : 'Non-Veg',
          `"${v.label}"`,
          (v.price_paise / 100).toFixed(2),
          v.available ? 'Yes' : 'No',
          v.needs_verification ? 'Needs Check' : 'Verified',
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', encodeURI(csvContent));
    dlAnchorElem.setAttribute('download', `ritsu_menu_${new Date().toISOString().slice(0, 10)}.csv`);
    dlAnchorElem.click();
  };

  const filteredItems = items.filter((item) => {
    if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchNo = String(item.item_no).includes(q);
      return matchName || matchNo;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
            Menu Manager
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-serif italic">
            Edit live restaurant items, prices, availability, and verify rates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={exportCSV}
            className="text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </Button>

          <Button
            variant="secondary"
            onClick={exportJSON}
            className="text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>JSON</span>
          </Button>

          <Button
            variant="primary"
            onClick={() => setShowAddDialog(true)}
            className="text-xs py-1.5 px-3 inline-flex items-center gap-1.5 tracking-wider font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD DISH</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-3 sm:p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name or item number..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--bg-canvas)] border border-[var(--border-default)] text-[var(--text-primary)] rounded focus:outline-none focus:border-[var(--gold-ink)]"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-xs bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded px-3 py-2 text-[var(--text-primary)]"
        >
          <option value="all">All 14 Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Items Table */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-3 px-3 w-14">#No</th>
                <th className="py-3 px-3">Item Details</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Diet</th>
                <th className="py-3 px-3">Sizes & Rates (Click to Edit)</th>
                <th className="py-3 px-3 text-right">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredItems.map((item) => {
                const cat = categories.find((c) => c.id === item.category_id);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-[var(--bg-surface)] transition-colors ${
                      !item.available ? 'opacity-50 bg-[var(--bg-canvas)]' : ''
                    }`}
                  >
                    {/* Item No */}
                    <td className="py-3 px-3 font-mono font-bold text-[var(--gold-ink)]">
                      {item.item_no}
                    </td>

                    {/* Item Name */}
                    <td className="py-3 px-3">
                      <div className="font-serif font-bold text-sm text-[var(--text-primary)]">
                        {item.name}
                      </div>
                      {item.description && (
                        <div className="text-[11px] text-[var(--text-muted)] line-clamp-1 italic">
                          {item.description}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 text-[var(--text-secondary)]">
                      {cat?.name || '—'}
                    </td>

                    {/* Diet Badge */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[10px] uppercase font-bold rounded ${
                          item.is_veg
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}
                      >
                        {item.is_veg ? 'Veg' : 'Non-Veg'}
                      </span>
                    </td>

                    {/* Variants and Inline Price Edit */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.variants.map((v) => {
                          const isEditing = editingVariantId === v.id;
                          return (
                            <div
                              key={v.id}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs ${
                                v.needs_verification
                                  ? 'border-amber-500/40 bg-amber-500/10'
                                  : 'border-[var(--border-default)] bg-[var(--bg-canvas)]'
                              }`}
                            >
                              <span className="font-semibold text-[11px] text-[var(--text-secondary)]">
                                {v.label}:
                              </span>

                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={editingPrice}
                                    onChange={(e) => setEditingPrice(e.target.value)}
                                    className="w-16 px-1.5 py-0.5 text-xs bg-[var(--bg-card)] border border-[var(--gold-ink)] rounded"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSavePrice(item.id, v.id)}
                                    className="p-1 text-emerald-600 hover:text-emerald-700"
                                    title="Save rate"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingVariantId(null)}
                                    className="p-1 text-red-500 hover:text-red-600"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingVariantId(v.id);
                                    setEditingPrice(String(v.price_paise / 100));
                                  }}
                                  className="font-mono font-bold hover:text-[var(--gold-ink)] hover:underline inline-flex items-center gap-1"
                                  title="Click to edit price"
                                >
                                  {formatPaise(v.price_paise)}
                                  <Edit3 className="w-3 h-3 text-[var(--text-muted)] opacity-60" />
                                </button>
                              )}

                              {v.needs_verification && (
                                <button
                                  onClick={() =>
                                    handleConfirmVerification(item.id, v.id, v.price_paise)
                                  }
                                  className="ml-1 px-1.5 py-0.5 text-[9px] uppercase font-bold bg-amber-500 text-black rounded hover:bg-amber-400 transition-colors inline-flex items-center gap-0.5"
                                  title="Click to confirm and remove unverified badge"
                                >
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  Confirm
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    {/* Overall Availability Toggle */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleToggleItemAvailability(item.id, item.available)}
                        className={`px-2 py-1 text-[11px] font-semibold uppercase tracking-wider rounded transition-colors ${
                          item.available
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20'
                        }`}
                      >
                        {item.available ? 'Active' : 'Sold Out'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Item Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-[var(--text-primary)] mb-4">
              Add New Menu Item
            </h3>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  Category
                </label>
                <select
                  value={newItemCategoryId}
                  onChange={(e) => setNewItemCategoryId(e.target.value)}
                  className="w-full text-xs bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded px-3 py-2 text-[var(--text-primary)]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                    Item No
                  </label>
                  <input
                    type="number"
                    value={newItemNo}
                    onChange={(e) => setNewItemNo(Number(e.target.value))}
                    className="w-full text-xs bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded px-3 py-2 text-[var(--text-primary)]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                    Dish Name
                  </label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Schezwan Noodles"
                    className="w-full text-xs bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded px-3 py-2 text-[var(--text-primary)]"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="radio"
                    checked={newItemIsVeg}
                    onChange={() => setNewItemIsVeg(true)}
                    className="accent-emerald-500"
                  />
                  <span>Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="radio"
                    checked={!newItemIsVeg}
                    onChange={() => setNewItemIsVeg(false)}
                    className="accent-red-500"
                  />
                  <span>Non-Vegetarian</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border-subtle)]">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                    Size Label
                  </label>
                  <input
                    type="text"
                    value={newItemVariantLabel}
                    onChange={(e) => setNewItemVariantLabel(e.target.value)}
                    placeholder="Full / Single / Standard"
                    className="w-full text-xs bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded px-3 py-2 text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                    Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={newItemPriceRupees}
                    onChange={(e) => setNewItemPriceRupees(e.target.value)}
                    placeholder="150"
                    className="w-full text-xs bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded px-3 py-2 text-[var(--text-primary)]"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" variant="primary" className="flex-1 py-2 text-xs">
                  Create Dish
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddDialog(false)}
                  className="py-2 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

