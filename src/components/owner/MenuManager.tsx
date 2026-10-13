import React, { useState, useMemo } from 'react';
import { useMenu } from '../../hooks/useMenu';

import { formatINR } from '../../domain/pricing';
import { DietBadge } from '../common/DietBadge';
import {
  Utensils,
  Search,
  CheckCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Percent,
  Edit2,
  Check,
  X,
} from 'lucide-react';

export const MenuManager: React.FC = () => {
  const {
    categories,
    items,
    loading,
    toggleItemAvailability,
    updateVariantPrice,
    confirmVariantPrice,
    bulkUpdatePrices,
    resetMenuToDefault,
  } = useMenu();

  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterNeedsVerificationOnly, setFilterNeedsVerificationOnly] = useState<boolean>(false);

  // Bulk edit state
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkPercent, setBulkPercent] = useState<number>(0);
  const [bulkDeltaRupees, setBulkDeltaRupees] = useState<number>(0);

  // Inline editing state: { itemId, variantId, priceInput }
  const [editingVariant, setEditingVariant] = useState<{
    itemId: string;
    variantId: string;
    priceRupees: string;
  } | null>(null);

  // Count unverified prices
  const unverifiedCount = useMemo(() => {
    return items.reduce((acc, item) => {
      return acc + item.variants.filter((v) => v.needs_verification).length;
    }, 0);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
        return false;
      }
      if (filterNeedsVerificationOnly && !item.variants.some((v) => v.needs_verification)) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesNo = item.item_no.toString() === q;
        if (!matchesName && !matchesNo) return false;
      }
      return true;
    });
  }, [items, selectedCategory, filterNeedsVerificationOnly, search]);

  const handleSavePrice = async (itemId: string, variantId: string) => {
    if (!editingVariant) return;
    const rupees = parseFloat(editingVariant.priceRupees);
    if (isNaN(rupees) || rupees <= 0) {
      alert('Please enter a valid price in Rupees');
      return;
    }
    const paise = Math.round(rupees * 100);
    await updateVariantPrice(itemId, variantId, paise, false);
    setEditingVariant(null);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ritsu-menu-backup-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleApplyBulkPrice = async () => {
    const multiplier = 1 + bulkPercent / 100;
    const deltaPaise = bulkDeltaRupees * 100;
    await bulkUpdatePrices(multiplier, deltaPaise);
    setShowBulkModal(false);
    alert('Prices updated successfully across menu items!');
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-lg">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-bold text-white">Menu & Pricing Manager</h2>
            <span className="text-xs text-neutral-400 font-mono bg-neutral-800 px-2 py-0.5 rounded-full">
              {items.length} items
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage availability, update portion rates, and confirm inferred fold-prices.
          </p>
        </div>

        {/* Global Menu Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer min-h-[38px]"
          >
            <Percent className="w-3.5 h-3.5 text-amber-400" />
            <span>Bulk Price Adjust</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer min-h-[38px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              if (confirm('Reset entire menu to default original seeded prices?')) {
                await resetMenuToDefault();
              }
            }}
            className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-rose-900/40 text-neutral-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer min-h-[38px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>
        </div>
      </div>

      {/* Unverified Prices Alert Banner */}
      {unverifiedCount > 0 && (
        <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200">
              <span className="font-bold text-amber-300 block">
                {unverifiedCount} Inferred Full Prices Pending Owner Confirmation
              </span>
              These items were obscured by a crease on the printed menu. Review and click "Confirm" once verified.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFilterNeedsVerificationOnly(!filterNeedsVerificationOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition min-h-[36px] flex items-center gap-1.5 flex-shrink-0 ${
              filterNeedsVerificationOnly
                ? 'bg-amber-400 text-neutral-950'
                : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
            }`}
          >
            <span>{filterNeedsVerificationOnly ? 'Showing Unverified Only' : 'Filter Unverified'}</span>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by dish name or item # (e.g. 1, Chicken Manchurian)..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-red-500 min-h-[40px]"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-red-500 min-h-[40px]"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Items List */}
      <div className="mt-4 space-y-2.5 max-h-[600px] overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="py-12 text-center text-neutral-500">Loading menu data...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-neutral-400">No items match your filter.</div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border transition ${
                item.available
                  ? 'bg-neutral-850/70 border-neutral-800 hover:border-neutral-700'
                  : 'bg-neutral-900/40 border-neutral-800/40 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Item Details */}
                <div className="flex items-start gap-2.5 min-w-0">
                  <DietBadge isVeg={item.is_veg} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-amber-500">
                        #{item.item_no}
                      </span>
                      <h4 className="font-bold text-sm text-white truncate max-w-[220px] sm:max-w-[320px]">
                        {item.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => toggleItemAvailability(item.id, !item.available)}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold cursor-pointer transition min-h-[24px] ${
                          item.available
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                        }`}
                      >
                        {item.available ? 'In Stock' : 'Sold Out'}
                      </button>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-neutral-400 mt-0.5">{item.description}</p>
                    )}
                  </div>
                </div>

                {/* Variants & Pricing List */}
                <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                  {item.variants.map((v) => {
                    const isEditing =
                      editingVariant?.itemId === item.id && editingVariant?.variantId === v.id;

                    return (
                      <div
                        key={v.id}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs ${
                          v.needs_verification
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-neutral-900 border-neutral-800'
                        }`}
                      >
                        <span className="text-[11px] font-semibold text-neutral-400">
                          {v.label}:
                        </span>

                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-white text-xs">₹</span>
                            <input
                              type="number"
                              step="1"
                              autoFocus
                              value={editingVariant.priceRupees}
                              onChange={(e) =>
                                setEditingVariant({
                                  ...editingVariant,
                                  priceRupees: e.target.value,
                                })
                              }
                              className="w-16 px-1.5 py-0.5 bg-neutral-950 border border-neutral-700 rounded text-white text-xs font-mono font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => handleSavePrice(item.id, v.id)}
                              className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                              title="Save Price"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingVariant(null)}
                              className="p-1 text-neutral-400 hover:text-white cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-amber-400">
                              {formatINR(v.price_paise, false)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingVariant({
                                  itemId: item.id,
                                  variantId: v.id,
                                  priceRupees: (v.price_paise / 100).toString(),
                                })
                              }
                              className="text-neutral-500 hover:text-white p-0.5 cursor-pointer"
                              title="Edit Price"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {v.needs_verification && (
                          <button
                            type="button"
                            onClick={() => confirmVariantPrice(item.id, v.id)}
                            className="bg-amber-400 text-neutral-950 px-2 py-0.5 rounded text-[10px] font-bold hover:bg-amber-300 cursor-pointer flex items-center gap-1"
                            title="Confirm this inferred price"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Confirm</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bulk Price Adjust Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h4 className="font-bold text-white text-base mb-1">Bulk Menu Price Adjust</h4>
            <p className="text-xs text-neutral-400 mb-4">
              Apply a percentage or flat Rupee increase/decrease across all 165 menu items.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Percentage Adjustment (%)
                </label>
                <input
                  type="number"
                  step="1"
                  value={bulkPercent}
                  onChange={(e) => setBulkPercent(Number(e.target.value))}
                  placeholder="e.g. 5 for +5%, -5 for -5%"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Flat Rupee Delta (₹)
                </label>
                <input
                  type="number"
                  step="5"
                  value={bulkDeltaRupees}
                  onChange={(e) => setBulkDeltaRupees(Number(e.target.value))}
                  placeholder="e.g. 10 to add ₹10 to all dishes"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulkPrice}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Apply Adjustments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
