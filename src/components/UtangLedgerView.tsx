import React, { useState } from 'react';
import { UtangRecord } from '../types';
import { BookOpen, Check, Search, User, AlertCircle } from 'lucide-react';

interface Props {
  utangRecords: UtangRecord[];
  onMarkPaid: (id: string) => void;
}

export const UtangLedgerView: React.FC<Props> = ({ utangRecords, onMarkPaid }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Unpaid' | 'Paid'>('Unpaid');

  const formatPeso = (val: number) => {
    return '₱' + (Math.round(val * 100) / 100).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const filteredRecords = utangRecords.filter((rec) => {
    const matchStatus = filterStatus === 'All' || rec.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q || rec.customer.toLowerCase().includes(q) || rec.description.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const totalUnpaid = utangRecords
    .filter((r) => r.status === 'Unpaid')
    .reduce((s, r) => s + r.amount, 0);

  // Group by customer for quick summary
  const customerTotals: Record<string, number> = {};
  utangRecords
    .filter((r) => r.status === 'Unpaid')
    .forEach((r) => {
      customerTotals[r.customer] = (customerTotals[r.customer] || 0) + r.amount;
    });

  return (
    <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="text-red-500">📝</span> Utang (Credit Ledger)
          </h2>
          <p className="text-xs text-zinc-400">
            Customer store credit notebook — tracks unpaid tabs with 14% credit markup
          </p>
        </div>

        <div className="bg-red-950/80 border border-red-700/80 rounded-2xl px-5 py-3 shadow-lg">
          <div className="text-[11px] text-red-300 font-bold uppercase tracking-wider">
            Total Outstanding Credit
          </div>
          <div className="text-2xl font-black font-mono text-red-400">
            {formatPeso(totalUnpaid)}
          </div>
        </div>
      </div>

      {/* Customer Quick Balances Grid */}
      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
          Customers with Outstanding Balances
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Object.entries(customerTotals).length === 0 ? (
            <div className="col-span-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-500 text-center">
              No outstanding utang tabs. Lahat bayad na! 🎉
            </div>
          ) : (
            Object.entries(customerTotals).map(([cust, amount]) => (
              <div
                key={cust}
                onClick={() => setSearch(cust)}
                className="bg-zinc-950 border border-zinc-800 hover:border-red-500 rounded-xl p-3 cursor-pointer transition"
              >
                <div className="flex items-center gap-2 text-white font-bold text-xs truncate">
                  <User className="w-3.5 h-3.5 text-red-400" />
                  <span>{cust}</span>
                </div>
                <div className="text-lg font-mono font-black text-red-400 mt-1">
                  {formatPeso(amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 mb-5 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-red-500" />
          <input
            type="text"
            placeholder="Search customer name or item…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black border border-zinc-800 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['Unpaid', 'Paid', 'All'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                filterStatus === st
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/60 text-zinc-400 uppercase border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Amount Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    No credit records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-900/40 transition">
                    <td className="py-3 px-4 font-mono text-zinc-400">{r.date}</td>
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span>{r.customer}</span>
                    </td>
                    <td className="py-3 px-4 text-zinc-300 max-w-xs truncate">{r.description}</td>
                    <td className="py-3 px-4 text-center font-mono text-zinc-400">{r.qty}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-red-400 text-sm">
                      {formatPeso(r.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'Paid'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.status === 'Unpaid' ? (
                        <button
                          onClick={() => onMarkPaid(r.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-black rounded-lg text-xs transition inline-flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark Paid</span>
                        </button>
                      ) : (
                        <span className="text-zinc-500 font-medium">Settled ✓</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
