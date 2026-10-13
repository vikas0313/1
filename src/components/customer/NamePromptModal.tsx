import React, { useState, useEffect } from 'react';
import { User, Sparkles } from 'lucide-react';

interface NamePromptModalProps {
  tableLabel: string;
  onNameConfirmed: (name: string) => void;
}

export const NamePromptModal: React.FC<NamePromptModalProps> = ({
  tableLabel,
  onNameConfirmed,
}) => {
  const [customerName, setCustomerName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    const savedName = sessionStorage.getItem(`ritsu_cust_name_${tableLabel}`);
    if (savedName && savedName.trim().length >= 2) {
      onNameConfirmed(savedName.trim());
    } else {
      setIsOpen(true);
    }
  }, [tableLabel, onNameConfirmed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customerName.trim();
    if (trimmed.length < 2) {
      setError('Please enter at least 2 characters.');
      return;
    }
    if (trimmed.length > 40) {
      setError('Name must not exceed 40 characters.');
      return;
    }

    sessionStorage.setItem(`ritsu_cust_name_${tableLabel}`, trimmed);
    sessionStorage.setItem('ritsu_current_table', tableLabel);
    setIsOpen(false);
    onNameConfirmed(trimmed);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          <User className="w-6 h-6" />
        </div>

        <div className="inline-block px-2.5 py-1 rounded-full bg-red-600/20 text-red-400 text-xs font-semibold mb-2">
          Table {tableLabel}
        </div>

        <h2 className="text-xl font-bold text-white mb-1">Welcome!</h2>
        <p className="text-neutral-400 text-xs mb-5 leading-relaxed">
          Please enter your name so our kitchen staff can serve your table accurately.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="customerName" className="block text-xs font-medium text-neutral-300 mb-1.5">
              Your Name *
            </label>
            <input
              id="customerName"
              type="text"
              autoFocus
              required
              minLength={2}
              maxLength={40}
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Vikas Kumar"
              className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm"
            />
            {error && <p className="text-xs text-rose-400 mt-1.5">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold text-sm shadow-lg shadow-red-900/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 min-h-[44px]"
          >
            <span>Start Ordering</span>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </button>
        </form>
      </div>
    </div>
  );
};
