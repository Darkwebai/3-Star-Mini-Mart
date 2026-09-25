import React, { useState, useMemo } from 'react';
import { Sale } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Award,
  BarChart3,
  Layers,
  Sparkles,
  Download,
  FileText,
} from 'lucide-react';

interface Props {
  sales: Sale[];
  spreadsheetId: string;
}

export const DailySalesView: React.FC<Props> = ({ sales, spreadsheetId }) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [chartMode, setChartMode] = useState<'total' | 'breakdown'>('total');
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const formatPeso = (val: number) => {
    return '₱' + (Math.round(val * 100) / 100).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleExportCSV = (onlySelected = false) => {
    const dataToExport = onlySelected
      ? sales.filter((s) => s.date === selectedDate)
      : sales;

    if (dataToExport.length === 0) {
      alert('No sales found for the selected period.');
      return;
    }

    const headers = [
      'Sale ID',
      'Date',
      'Time',
      'Cashier',
      'Customer',
      'Payment Method',
      'Reference Code',
      'Total Amount (PHP)',
      '12% VAT (PHP)',
      'Net Subtotal (PHP)',
      'Tendered (PHP)',
      'Change (PHP)',
      'Items Purchased Summary',
    ];

    const rows = dataToExport.map((s) => {
      const vat = (s.total * 0.12) / 1.12;
      const net = s.total - vat;
      const cleanSummary = (s.summary || '').replace(/"/g, '""');
      return [
        `"${s.id}"`,
        `"${s.date}"`,
        `"${s.time || ''}"`,
        `"${s.cashier || 'Cashier 1'}"`,
        `"${s.customer || ''}"`,
        `"${s.paymentMethod}"`,
        `"${s.referenceCode || ''}"`,
        s.total.toFixed(2),
        vat.toFixed(2),
        net.toFixed(2),
        (s.tendered || s.total).toFixed(2),
        (s.change || 0).toFixed(2),
        `"${cleanSummary}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateTag = onlySelected ? selectedDate : `all_${new Date().toISOString().slice(0, 10)}`;
    link.setAttribute('href', url);
    link.setAttribute('download', `3stars_sales_history_${dateTag}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess(onlySelected ? `Exported ${selectedDate}` : 'Exported All Sales');
    setTimeout(() => setExportSuccess(null), 3000);
  };

  // Generate 7-day trend data (last 7 days including today)
  const last7DaysData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'numeric',
        day: 'numeric',
      });

      const daySales = sales.filter((s) => s.date === isoDate);
      const total = daySales.reduce((acc, s) => acc + s.total, 0);
      const cash = daySales
        .filter((s) => s.paymentMethod === 'Cash')
        .reduce((acc, s) => acc + s.total, 0);
      const gcash = daySales
        .filter((s) => s.paymentMethod === 'GCash')
        .reduce((acc, s) => acc + s.total, 0);
      const utang = daySales
        .filter((s) => s.paymentMethod === 'Utang')
        .reduce((acc, s) => acc + s.total, 0);
      const card = daySales
        .filter((s) => s.paymentMethod === 'Card')
        .reduce((acc, s) => acc + s.total, 0);
      const txCount = daySales.length;
      const itemsCount = daySales.reduce(
        (sum, s) => sum + s.items.reduce((iSum, it) => iSum + it.qty, 0),
        0
      );

      days.push({
        date: isoDate,
        dayLabel,
        total,
        cash,
        gcash,
        utang,
        card,
        txCount,
        itemsCount,
        isSelected: isoDate === selectedDate,
      });
    }
    return days;
  }, [sales, selectedDate]);

  // Calculations for 7-day summary
  const sevenDayTotal = last7DaysData.reduce((acc, d) => acc + d.total, 0);
  const sevenDayAvg = sevenDayTotal / 7;
  const bestDay = [...last7DaysData].sort((a, b) => b.total - a.total)[0];
  const total7DayTx = last7DaysData.reduce((acc, d) => acc + d.txCount, 0);

  // Selected date sales
  const filteredSales = sales.filter((s) => s.date === selectedDate);
  const totalSales = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const cashSales = filteredSales
    .filter((s) => s.paymentMethod === 'Cash')
    .reduce((acc, s) => acc + s.total, 0);
  const gcashSales = filteredSales
    .filter((s) => s.paymentMethod === 'GCash')
    .reduce((acc, s) => acc + s.total, 0);
  const utangSales = filteredSales
    .filter((s) => s.paymentMethod === 'Utang')
    .reduce((acc, s) => acc + s.total, 0);
  const cardSales = filteredSales
    .filter((s) => s.paymentMethod === 'Card')
    .reduce((acc, s) => acc + s.total, 0);

  const totalItemsSold = filteredSales.reduce((sum, s) => {
    return sum + s.items.reduce((iSum, it) => iSum + it.qty, 0);
  }, 0);

  const vat = (totalSales * 0.12) / 1.12;
  const vatableSales = totalSales - vat;

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-950 border-2 border-emerald-500/80 rounded-2xl p-4 shadow-2xl text-white font-sans text-xs">
          <div className="font-bold text-sm text-white border-b border-zinc-800 pb-1.5 mb-2 flex items-center justify-between gap-4">
            <span className="text-red-400">{data.dayLabel}</span>
            <span className="text-[10px] font-mono text-zinc-400">{data.date}</span>
          </div>

          <div className="flex flex-col gap-1.5 font-mono">
            <div className="flex justify-between items-center text-sm font-black text-emerald-400">
              <span>Total Revenue:</span>
              <span>{formatPeso(data.total)}</span>
            </div>
            <div className="border-t border-zinc-900 pt-1.5 flex justify-between text-zinc-300">
              <span className="text-emerald-400">💵 Cash:</span>
              <span>{formatPeso(data.cash)}</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span className="text-blue-400">📲 GCash:</span>
              <span>{formatPeso(data.gcash)}</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span className="text-red-400">📝 Utang:</span>
              <span>{formatPeso(data.utang)}</span>
            </div>
            <div className="border-t border-zinc-900 pt-1.5 flex justify-between text-zinc-400 text-[11px]">
              <span>Transactions:</span>
              <span>{data.txCount} sales</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 text-center font-medium">
            Click bar to view transactions below
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="text-red-500">📊</span> Sales Trends & Daily Reports
          </h2>
          <p className="text-xs text-zinc-400">
            Performance analytics, 7-day revenue visualization & transaction logs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-red-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none font-bold"
            />
          </div>

          {/* Export to CSV Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleExportCSV(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-emerald-500 text-zinc-200 hover:text-white rounded-xl text-xs font-bold transition shadow-sm"
              title="Download CSV for the currently selected date"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Day CSV</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportCSV(false)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-300 rounded-xl text-xs font-bold transition shadow-sm"
              title="Download entire sales history as CSV"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export All CSV</span>
            </button>
          </div>

          <a
            href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Google Sheets</span>
          </a>
        </div>
      </div>

      {/* Export Success Feedback Notification */}
      {exportSuccess && (
        <div className="mb-4 bg-emerald-950/80 border border-emerald-500 text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <Download className="w-4 h-4 text-emerald-400 animate-bounce" />
          <span>Sales CSV downloaded locally: <strong>{exportSuccess}</strong>. Ready for record keeping!</span>
        </div>
      )}

      {/* 7-Day Performance Highlights Card */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="text-xs text-zinc-400 uppercase font-bold tracking-wider">
            7-Day Revenue
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-1">
            {formatPeso(sevenDayTotal)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 font-medium">
            {total7DayTx} total transactions logged
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
          <div className="text-xs text-zinc-400 uppercase font-bold tracking-wider">
            Daily Average
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">
            {formatPeso(sevenDayAvg)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-medium">Per day baseline</div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
          <div className="text-xs text-zinc-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Peak Sales Day</span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-400 mt-1">
            {bestDay ? formatPeso(bestDay.total) : '₱0.00'}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 font-medium">
            {bestDay?.dayLabel || '—'}
          </div>
        </div>

        <div className="bg-zinc-950 border border-red-900/60 rounded-2xl p-4">
          <div className="text-xs text-zinc-400 uppercase font-bold tracking-wider">
            Selected Day ({selectedDate})
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-1">
            {formatPeso(totalSales)}
          </div>
          <div className="text-[11px] text-red-400 mt-1 font-medium">
            {filteredSales.length} transaction{filteredSales.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* RECHARTS DATA VISUALIZATION CARD */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 mb-6 shadow-2xl relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-3 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
                <BarChart3 className="w-4 h-4" />
              </span>
              <h3 className="text-base font-black text-white tracking-tight">
                7-Day Sales Performance Bar Chart
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Trends over the past week · Tap any bar to inspect daily sales breakdown
            </p>
          </div>

          {/* Chart View Toggle */}
          <div className="flex items-center gap-1 bg-black border border-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setChartMode('total')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                chartMode === 'total'
                  ? 'bg-emerald-600 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Total Sales</span>
            </button>
            <button
              onClick={() => setChartMode('breakdown')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                chartMode === 'breakdown'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Payment Breakdown</span>
            </button>
          </div>
        </div>

        {/* Recharts BarChart Container */}
        <div className="w-full h-72 sm:h-80 select-none">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={last7DaysData}
              margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length) {
                  setSelectedDate(e.activePayload[0].payload.date);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="dayLabel"
                stroke="#a1a1aa"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#3f3f46' }}
              />
              <YAxis
                stroke="#a1a1aa"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#3f3f46' }}
                tickFormatter={(val) => `₱${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />

              {chartMode === 'total' ? (
                <Bar
                  dataKey="total"
                  name="Total Sales (₱)"
                  radius={[8, 8, 0, 0]}
                  cursor="pointer"
                  animationDuration={800}
                >
                  {last7DaysData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.date === selectedDate
                          ? '#22c55e' // Bright active green
                          : '#16a34a' // Standard emerald green
                      }
                      stroke={entry.date === selectedDate ? '#ffffff' : '#15803d'}
                      strokeWidth={entry.date === selectedDate ? 2 : 1}
                    />
                  ))}
                </Bar>
              ) : (
                <>
                  <Legend
                    wrapperStyle={{ paddingTop: 12, fontSize: 11 }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="cash"
                    name="Cash"
                    stackId="a"
                    fill="#16a34a"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="gcash"
                    name="GCash"
                    stackId="a"
                    fill="#3b82f6"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="utang"
                    name="Utang (Credit)"
                    stackId="a"
                    fill="#dc2626"
                    radius={[6, 6, 0, 0]}
                  />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-3 border-t border-zinc-900 mt-2">
          <span>Active filter: {selectedDate}</span>
          <span className="text-emerald-400 font-medium">
            Green = Cash Sales · Blue = GCash · Red = Utang (Credit)
          </span>
        </div>
      </div>

      {/* Selected Day Payment Breakdown Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <div className="text-[11px] text-zinc-400 font-semibold uppercase">Cash Sales</div>
          <div className="text-xl font-black font-mono text-emerald-400 mt-1">
            {formatPeso(cashSales)}
          </div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <div className="text-[11px] text-zinc-400 font-semibold uppercase">GCash Sales</div>
          <div className="text-xl font-black font-mono text-blue-400 mt-1">
            {formatPeso(gcashSales)}
          </div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <div className="text-[11px] text-zinc-400 font-semibold uppercase">Utang Sales (+14%)</div>
          <div className="text-xl font-black font-mono text-red-400 mt-1">
            {formatPeso(utangSales)}
          </div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <div className="text-[11px] text-zinc-400 font-semibold uppercase">Total Sold Qty</div>
          <div className="text-xl font-black font-mono text-white mt-1">
            {totalItemsSold} pcs
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-zinc-900/90 border-b border-zinc-800 px-5 py-3.5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-red-500" />
            <span>Recorded Purchases for {selectedDate}</span>
          </h3>
          <span className="text-xs text-zinc-400 font-mono">{filteredSales.length} sales</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/40 text-zinc-400 uppercase border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Sale ID</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No sales recorded for {selectedDate}.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-900/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-red-400">{s.id}</td>
                    <td className="py-3 px-4 text-zinc-400">{s.time || '—'}</td>
                    <td className="py-3 px-4 text-zinc-200 max-w-xs truncate">{s.summary}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.paymentMethod === 'Cash'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : s.paymentMethod === 'GCash'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800'
                            : s.paymentMethod === 'Utang'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-purple-950 text-purple-400 border border-purple-800'
                        }`}
                      >
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-300 font-medium">
                      {s.customer || <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                      {formatPeso(s.total)}
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
