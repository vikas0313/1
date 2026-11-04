import React, { useState, useEffect, useRef } from 'react';
import type { Table } from '@ritsu/shared';
import QRCode from 'qrcode';
import { Button } from '../../components/Button.js';
import { Skeleton } from '../../components/Skeleton.js';
import { 
  QrCode, 
  Copy, 
  Download, 
  Printer, 
  Plus, 
  AlertTriangle, 
  Check, 
  ToggleLeft, 
  ToggleRight 
} from 'lucide-react';

export const TablesPage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTableLabel, setNewTableLabel] = useState('');
  const [copiedTableId, setCopiedTableId] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState<string>('');

  useEffect(() => {
    // Determine base URL: use window.location.origin
    setBaseUrl(window.location.origin);
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/owner/tables');
      if (res.ok) {
        const data = await res.json();
        setTables(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const isLocalUrl = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || /192\.168\.\d+\.\d+/.test(baseUrl);

  const handleCopyLink = (tableLabel: string, tableId: string) => {
    const url = `${baseUrl}/?table=${tableLabel}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedTableId(tableId);
      setTimeout(() => setCopiedTableId(null), 2500);
    });
  };

  const handleDownloadPng = async (tableLabel: string) => {
    const url = `${baseUrl}/?table=${tableLabel}`;
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 600,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      const dl = document.createElement('a');
      dl.href = dataUrl;
      dl.download = `ritsu_table_${tableLabel}_qr.png`;
      dl.click();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableLabel.trim()) return;

    try {
      const res = await fetch('/api/owner/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newTableLabel }),
      });
      if (res.ok) {
        setNewTableLabel('');
        fetchTables();
      }
    } catch {
      // ignore
    }
  };

  const handleToggleActive = async (tableId: string, current: boolean) => {
    const next = !current;
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, active: next } : t))
    );

    try {
      await fetch(`/api/owner/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: next }),
      });
    } catch {
      fetchTables();
    }
  };

  const handlePrintAllCards = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
            Tables & QR Codes
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-serif italic">
            Generate, copy, download, and print table QR codes for customer ordering.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={handlePrintAllCards}
            className="text-xs py-1.5 px-3 inline-flex items-center gap-1.5 tracking-wider font-semibold"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT ALL QR CARDS</span>
          </Button>
        </div>
      </div>

      {/* 2. BASE_URL Warning Banner */}
      {isLocalUrl && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-3 rounded">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold uppercase tracking-wider">
              Localhost / Private Network Warning
            </div>
            <p>
              Your active base URL is currently set to <code className="font-mono px-1 py-0.5 bg-black/10 rounded">{baseUrl}</code>.
              Customers scanning this QR code on mobile data or other Wi-Fi networks will NOT be able to connect.
              For live dining, provide your public HTTPS domain (e.g. ngrok, Cloudflare Tunnel, or Render URL).
            </p>
          </div>
        </div>
      )}

      {/* 3. Add Table Inline Form */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleAddTable} className="flex items-center gap-2 flex-1 max-w-sm">
          <input
            type="text"
            value={newTableLabel}
            onChange={(e) => setNewTableLabel(e.target.value)}
            placeholder="New Table Label (e.g. T9, Garden 1)"
            className="flex-1 px-3 py-1.5 text-xs bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-ink)]"
          />
          <Button type="submit" variant="secondary" className="py-1.5 px-3 text-xs inline-flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            Add Table
          </Button>
        </form>

        <div className="text-xs text-[var(--text-muted)] font-serif italic">
          Active tables: {tables.filter((t) => t.active).length} of {tables.length}
        </div>
      </div>

      {/* 4. Table QR Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {tables.map((tbl) => (
            <TableCardItem
              key={tbl.id}
              table={tbl}
              baseUrl={baseUrl}
              copied={copiedTableId === tbl.id}
              onCopy={() => handleCopyLink(tbl.label, tbl.id)}
              onDownload={() => handleDownloadPng(tbl.label)}
              onToggleActive={() => handleToggleActive(tbl.id, tbl.active)}
            />
          ))}
        </div>
      )}

      {/* 5. Printable 80mm Table Cards (Visible only on window.print()) */}
      <div className="hidden print:block print:space-y-6">
        {tables.filter((t) => t.active).map((tbl) => (
          <PrintableQrCard key={tbl.id} table={tbl} baseUrl={baseUrl} />
        ))}
      </div>
    </div>
  );
};

interface TableCardItemProps {
  table: Table;
  baseUrl: string;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onToggleActive: () => void;
}

const TableCardItem: React.FC<TableCardItemProps> = ({
  table,
  baseUrl,
  copied,
  onCopy,
  onDownload,
  onToggleActive,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const tableUrl = `${baseUrl}/?table=${table.label}`;

  useEffect(() => {
    QRCode.toDataURL(tableUrl, {
      width: 240,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' },
    }).then(setDataUrl);
  }, [tableUrl]);

  return (
    <div
      className={`bg-[var(--bg-card)] border border-[var(--border-default)] p-4 flex flex-col justify-between shadow-xs transition-opacity ${
        !table.active ? 'opacity-50' : ''
      }`}
    >
      <div>
        {/* Table Title and Status */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 mb-3">
          <span className="font-serif text-xl font-bold text-[var(--gold-ink)]">
            Table {table.label.replace(/^T/i, '')}
          </span>
          <button
            onClick={onToggleActive}
            className={`text-xs px-2 py-0.5 rounded font-semibold uppercase ${
              table.active
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-zinc-500/10 text-zinc-500'
            }`}
          >
            {table.active ? 'Active' : 'Disabled'}
          </button>
        </div>

        {/* QR Code Canvas on high-contrast white canvas */}
        <div className="flex justify-center p-3 bg-white rounded border border-zinc-200 shadow-inner mb-3">
          {dataUrl ? (
            <img src={dataUrl} alt={`QR Code for Table ${table.label}`} className="w-36 h-36" />
          ) : (
            <div className="w-36 h-36 flex items-center justify-center text-zinc-400 text-xs">
              Generating QR...
            </div>
          )}
        </div>

        <div className="text-center font-mono text-[10px] text-[var(--text-muted)] truncate mb-3 select-all">
          {tableUrl}
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-subtle)]">
        <button
          onClick={onCopy}
          className="py-1.5 px-2 text-[11px] font-semibold border border-[var(--border-default)] rounded hover:border-[var(--gold-ink)] hover:text-[var(--gold-ink)] transition-colors inline-flex items-center justify-center gap-1"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy URL'}</span>
        </button>

        <button
          onClick={onDownload}
          className="py-1.5 px-2 text-[11px] font-semibold border border-[var(--border-default)] rounded hover:border-[var(--gold-ink)] hover:text-[var(--gold-ink)] transition-colors inline-flex items-center justify-center gap-1"
        >
          <Download className="w-3 h-3" />
          <span>Save PNG</span>
        </button>
      </div>
    </div>
  );
};

const PrintableQrCard: React.FC<{ table: Table; baseUrl: string }> = ({ table, baseUrl }) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const tableUrl = `${baseUrl}/?table=${table.label}`;

  useEffect(() => {
    QRCode.toDataURL(tableUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    }).then(setDataUrl);
  }, [tableUrl]);

  return (
    <div className="border-2 border-black p-6 max-w-xs mx-auto text-center bg-white text-black page-break-after">
      <div className="text-xs uppercase tracking-widest font-bold mb-1">
        RITSU FOOD CORNER
      </div>
      <div className="text-[10px] italic mb-3">
        Indo-Chinese ka asli maza – Ritsu ke saath!
      </div>
      <div className="text-2xl font-bold font-serif my-2 border-t border-b border-black py-1">
        TABLE {table.label.replace(/^T/i, '')}
      </div>
      <div className="my-4 flex justify-center">
        {dataUrl && <img src={dataUrl} alt="Table QR" className="w-48 h-48" />}
      </div>
      <div className="text-xs font-semibold uppercase tracking-wider">
        Scan to view menu & place order
      </div>
      <div className="text-[9px] font-mono mt-1 text-zinc-600 truncate">
        {tableUrl}
      </div>
    </div>
  );
};
