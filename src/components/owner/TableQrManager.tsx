import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { RESTAURANT_CONFIG, RestaurantTable } from '../../config/restaurant.config';
import { Copy, Download, Printer, Check, QrCode, Plus, Trash2, UtensilsCrossed } from 'lucide-react';

export const TableQrManager: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>(() => {
    if (typeof window === 'undefined') return RESTAURANT_CONFIG.tables;
    const raw = localStorage.getItem('ritsu_custom_tables_v1');
    return raw ? JSON.parse(raw) : RESTAURANT_CONFIG.tables;
  });

  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [copiedTable, setCopiedTable] = useState<string | null>(null);
  const [newTableLabel, setNewTableLabel] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>(() => {
    return (
      import.meta.env.VITE_BASE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')
    );
  });

  // Generate QR codes for all tables
  useEffect(() => {
    const generateAllQrs = async () => {
      const generated: Record<string, string> = {};
      for (const table of tables) {
        const url = `${baseUrl}/?table=${encodeURIComponent(table.label)}`;
        try {
          const dataUrl = await QRCode.toDataURL(url, {
            width: 320,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          });
          generated[table.label] = dataUrl;
        } catch (e) {
          console.error('Failed to generate QR for table', table.label, e);
        }
      }
      setQrImages(generated);
    };

    generateAllQrs();
  }, [tables, baseUrl]);

  const handleCopyLink = (tableLabel: string) => {
    const url = `${baseUrl}/?table=${encodeURIComponent(tableLabel)}`;
    navigator.clipboard.writeText(url);
    setCopiedTable(tableLabel);
    setTimeout(() => setCopiedTable(null), 2000);
  };

  const handleDownloadPng = (tableLabel: string) => {
    const dataUrl = qrImages[tableLabel];
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR-Table-${tableLabel}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintSheet = () => {
    window.print();
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newTableLabel.trim().toUpperCase();
    if (!label) return;
    if (tables.some((t) => t.label === label)) {
      alert(`Table "${label}" already exists!`);
      return;
    }

    const updated = [
      ...tables,
      { id: `t_${Date.now()}`, label, active: true },
    ];
    setTables(updated);
    localStorage.setItem('ritsu_custom_tables_v1', JSON.stringify(updated));
    setNewTableLabel('');
  };

  const handleRemoveTable = (tableId: string) => {
    if (tables.length <= 1) {
      alert('Cannot delete the last remaining table.');
      return;
    }
    const updated = tables.filter((t) => t.id !== tableId);
    setTables(updated);
    localStorage.setItem('ritsu_custom_tables_v1', JSON.stringify(updated));
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-lg">
      {/* Screen-Only Header Controls */}
      <div className="no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-red-500" />
              <span>Dining Table QR Codes (T1–T8)</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Customers scan these codes to open their table menu instantly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintSheet}
              className="py-2.5 px-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer min-h-[40px] shadow-md shadow-red-950"
            >
              <Printer className="w-4 h-4" />
              <span>Print All Standees</span>
            </button>
          </div>
        </div>

        {/* Configuration Bar: Base URL & Add Table */}
        <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-neutral-800 text-xs">
          <div>
            <label className="block text-neutral-400 font-semibold mb-1">
              QR Base URL (Change for Production/Tunnel)
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono text-xs focus:outline-none focus:border-red-500"
            />
          </div>

          <form onSubmit={handleAddTable} className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-neutral-400 font-semibold mb-1">
                Add Custom Table Label
              </label>
              <input
                type="text"
                value={newTableLabel}
                onChange={(e) => setNewTableLabel(e.target.value)}
                placeholder="e.g. T9 or Outdoor 1"
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-red-500"
              />
            </div>
            <button
              type="submit"
              className="py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer min-h-[38px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>
        </div>
      </div>

      {/* Grid of Table QR Cards (Interactive on screen, printable sheet in print mode) */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-2 print:gap-6 print:m-0 print:p-0">
        {tables.map((table) => {
          const dataUrl = qrImages[table.label];
          const fullUrl = `${baseUrl}/?table=${encodeURIComponent(table.label)}`;

          return (
            <div
              key={table.id}
              className="bg-white text-black p-4 rounded-2xl border border-neutral-300 shadow-md flex flex-col items-center text-center print:break-inside-avoid print:border-2 print:border-black"
            >
              <div className="flex items-center gap-1.5 text-red-600 font-black text-xs uppercase tracking-wider mb-1">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>{RESTAURANT_CONFIG.restaurantName}</span>
              </div>
              <p className="text-[10px] text-gray-500 italic mb-2">
                "{RESTAURANT_CONFIG.tagline}"
              </p>

              {dataUrl ? (
                <div className="p-2 border border-gray-200 rounded-xl bg-white shadow-inner">
                  <img
                    src={dataUrl}
                    alt={`QR Code for Table ${table.label}`}
                    className="w-36 h-36 object-contain"
                  />
                </div>
              ) : (
                <div className="w-36 h-36 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                  Generating...
                </div>
              )}

              <div className="mt-2.5">
                <div className="text-xl font-black text-gray-900 tracking-tight">
                  TABLE {table.label}
                </div>
                <div className="text-[9px] text-gray-500 font-mono mt-0.5 truncate max-w-[200px]">
                  {fullUrl}
                </div>
              </div>

              {/* Action buttons (hidden on print) */}
              <div className="no-print mt-3 pt-2.5 border-t border-gray-100 w-full flex items-center justify-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleCopyLink(table.label)}
                  className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold flex items-center gap-1 cursor-pointer min-h-[34px]"
                  title="Copy Link"
                >
                  {copiedTable === table.label ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPng(table.label)}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
                  title="Download PNG"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveTable(table.id)}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-100 text-rose-600 cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
                  title="Delete Table"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
