import React, { useState } from 'react';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  X,
  ShoppingBag,
  Crown,
  Shield,
  Tv,
  ArrowRight,
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onNavigateView?: (view: 'pos' | 'dashboard' | 'display') => void;
}

export const ScreenLinksModal: React.FC<Props> = ({ onClose, onNavigateView }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const getBaseUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${window.location.pathname}`;
  };

  const links = [
    {
      key: 'pos',
      title: 'POS Cashier Counter',
      param: '?view=pos',
      role: 'Cashier & Staff',
      icon: ShoppingBag,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-950/80 border-emerald-600 text-emerald-300',
      desc: 'Point of sale counter screen for scanning items, reviewing orders, tendering payment, and printing receipts. Restricted to cashier functions.',
      viewTarget: 'pos' as const,
    },
    {
      key: 'owner',
      title: 'Owner Business Dashboard',
      param: '?view=owner',
      role: 'Owner Only',
      icon: Crown,
      color: 'text-amber-400',
      badgeBg: 'bg-amber-950/80 border-amber-600 text-amber-300',
      desc: 'Complete business and sales monitoring. Shows yearly, monthly, and daily sales from Google Sheets, revenue breakdown, and top items.',
      viewTarget: 'dashboard' as const,
    },
    {
      key: 'admin',
      title: 'Admin Management Dashboard',
      param: '?view=admin',
      role: 'Admin & Owner',
      icon: Shield,
      color: 'text-blue-400',
      badgeBg: 'bg-blue-950/80 border-blue-600 text-blue-300',
      desc: 'Sales, cashier management, and system operations. Access to staff management, PIN controls, and transactions audit.',
      viewTarget: 'dashboard' as const,
    },
    {
      key: 'display',
      title: 'Customer-Facing Price Display',
      param: '?view=display',
      role: 'Customer Screen',
      icon: Tv,
      color: 'text-cyan-400',
      badgeBg: 'bg-cyan-950/80 border-cyan-600 text-cyan-300',
      desc: 'Standalone customer-facing screen showing real-time scanned items, verified prices, subtotal, and payment QR codes on a second monitor.',
      viewTarget: 'display' as const,
    },
  ];

  const handleCopy = (fullUrl: string, key: string) => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none">
      <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 text-white shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-800 pr-8">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Independent Screen Links</h3>
            <p className="text-xs text-zinc-400">
              Access the POS counter, Owner Dashboard, and Customer Display independently
            </p>
          </div>
        </div>

        {/* Links List */}
        <div className="space-y-3.5">
          {links.map((item) => {
            const Icon = item.icon;
            const fullUrl = `${getBaseUrl()}${item.param}`;
            const isCopied = copiedKey === item.key;

            return (
              <div
                key={item.key}
                className="bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 transition shadow-md"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    <span className="font-bold text-sm text-white">{item.title}</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${item.badgeBg}`}>
                    {item.role}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 mb-3">{item.desc}</p>

                <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded-xl p-1.5 pl-3">
                  <span className="text-xs font-mono text-zinc-300 truncate flex-1">
                    {fullUrl}
                  </span>

                  <button
                    onClick={() => handleCopy(fullUrl, item.key)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-xs font-bold transition shrink-0"
                    title="Copy direct link to clipboard"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-zinc-800 hover:bg-red-600 text-zinc-200 hover:text-white rounded-lg transition shrink-0"
                    title="Open in new browser tab/window"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tip Box */}
        <div className="mt-5 p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-zinc-400 flex items-start gap-2.5">
          <span className="text-base">💡</span>
          <div>
            <span className="text-white font-bold">Pro Tip: </span>
            Keep the cashier terminal on the{' '}
            <strong className="text-emerald-400">?view=pos</strong> URL to prevent staff from
            viewing dashboard revenue figures, while viewing{' '}
            <strong className="text-amber-400">?view=owner</strong> on your phone or laptop.
          </div>
        </div>
      </div>
    </div>
  );
};
