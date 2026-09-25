import React, { useState } from 'react';
import { GCashTransaction } from '../types';
import { Smartphone, ArrowDownRight, ArrowUpRight, Plus, X } from 'lucide-react';

interface Props {
  transactions: GCashTransaction[];
  onAddTransaction: (tx: GCashTransaction) => void;
}

export const GCashView: React.FC<Props> = ({ transactions, onAddTransaction }) => {
  const [modalType, setModalType] = useState<'Cash In' | 'Cash Out' | null>(null);
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('10');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const formatPeso = (val: number) => {
    return '₱' + (Math.round(val * 100) / 100).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTx = transactions.filter((t) => t.date.slice(0, 10) === todayStr);

  const cashInTotal = todayTx
    .filter((t) => t.type === 'Cash In')
    .reduce((s, t) => s + t.amount, 0);

  const cashOutTotal = todayTx
    .filter((t) => t.type === 'Cash Out')
    .reduce((s, t) => s + t.amount, 0);

  const feesTotal = todayTx.reduce((s, t) => s + t.fee, 0);
  const netDrawerImpact = todayTx.reduce((s, t) => s + t.cashImpact, 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalType) return;
    const numAmount = Number(amount) || 0;
    const numFee = Number(fee) || 0;
    if (numAmount <= 0) return;

    // Cash In: customer gives cash, we send GCash -> cash in drawer goes UP by (amount + fee)
    // Cash Out: customer sends GCash, we give cash -> cash in drawer goes DOWN by (amount - fee)
    const impact = modalType === 'Cash In' ? numAmount + numFee : numFee - numAmount;

    const newTx: GCashTransaction = {
      id: 'GC-' + Date.now().toString().slice(-6),
      date: new Date().toISOString(),
      type: modalType,
      reference: reference.trim(),
      amount: numAmount,
      fee: numFee,
      notes: notes.trim(),
      cashImpact: impact,
    };

    onAddTransaction(newTx);
    setModalType(null);
    setAmount('');
    setFee('10');
    setReference('');
    setNotes('');
  };

  return (
    <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="text-blue-500">📲</span> GCash Cash-In & Cash-Out
          </h2>
          <p className="text-xs text-zinc-400">
            Monitor remittances, cash drawer balance impacts and service fees earned
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalType('Cash In')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black font-black rounded-xl text-xs shadow-md transition"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>+ Cash In (Receive Cash)</span>
          </button>

          <button
            onClick={() => setModalType('Cash Out')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs shadow-md transition"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>- Cash Out (Disburse Cash)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
          <div className="text-xs text-zinc-400 uppercase font-bold tracking-wider">
            Today's Cash In
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-1">
            {formatPeso(cashInTotal)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Cash handed by customer</div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
          <div className="text-xs text-zinc-400 uppercase font-bold tracking-wider">
            Today's Cash Out
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-red-400 mt-1">
            {formatPeso(cashOutTotal)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Cash given to customer</div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
          <div className="text-xs text-zinc-400 uppercase font-bold tracking-wider">
            Net Cash Drawer Effect
          </div>
          <div
            className={`text-2xl sm:text-3xl font-black font-mono mt-1 ${
              netDrawerImpact >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {netDrawerImpact >= 0 ? '+' : ''}
            {formatPeso(netDrawerImpact)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Physical drawer change</div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
          <div className="text-xs text-zinc-400 uppercase font-bold tracking-wider">
            Service Fees Earned
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-1">
            {formatPeso(feesTotal)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Store commission</div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/60 text-zinc-400 uppercase border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Mobile / Ref</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Service Fee</th>
                <th className="py-3 px-4 text-right">Drawer Impact</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    No GCash transactions recorded yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-900/40 transition">
                    <td className="py-3 px-4 text-zinc-400 font-mono">
                      {new Date(tx.date).toLocaleDateString('en-PH', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.type === 'Cash In'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-white">
                      {tx.reference || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {formatPeso(tx.amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-400">
                      {formatPeso(tx.fee)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold ${
                        tx.cashImpact >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {tx.cashImpact >= 0 ? '+' : ''}
                      {formatPeso(tx.cashImpact)}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{tx.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative">
            <button
              onClick={() => setModalType(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-2">Record {modalType}</h3>
            <p className="text-xs text-zinc-400 mb-4">
              {modalType === 'Cash In'
                ? 'Customer hands you physical cash; you transfer GCash. Cash drawer goes UP.'
                : 'Customer transfers GCash to you; you hand out cash. Cash drawer goes DOWN.'}
            </p>

            <form onSubmit={handleSave} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1 font-bold">
                  Amount in Pesos (₱)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-emerald-400 font-mono text-lg font-bold"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-bold">
                  Service Fee Charged (₱)
                </label>
                <input
                  type="number"
                  step="any"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-bold">
                  Customer Mobile Number / Ref No.
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. 0917-123-4567"
                  className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-bold">Notes (optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Electricity payment / regular customer"
                  className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-black rounded-xl"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
