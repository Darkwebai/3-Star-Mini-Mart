import React, { useState, useMemo } from 'react';
import { Sale, Item, POSUser, GCashTransaction, UtangRecord } from '../types';
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
  PieChart,
  Pie,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingBag,
  Receipt,
  Users,
  Calendar,
  Award,
  Download,
  FileSpreadsheet,
  Tv,
  ArrowRight,
  Shield,
  Crown,
  QrCode,
  Sparkles,
  RefreshCw,
  LogOut,
  ChevronDown,
  Link2,
} from 'lucide-react';

interface Props {
  sales: Sale[];
  items: Item[];
  users: POSUser[];
  currentUser: POSUser;
  spreadsheetId: string;
  expenses?: Expense[];
  onOpenPOS: () => void;
  onOpenCustomerDisplay: () => void;
  onOpenUserManagement: () => void;
  onOpenPosterModal: () => void;
  onOpenExpenses?: () => void;
  onOpenScreenLinks?: () => void;
  onLogout: () => void;
  onRefreshData?: () => void;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const OwnerAdminDashboard: React.FC<Props> = ({
  sales,
  items,
  users,
  currentUser,
  spreadsheetId,
  expenses = [],
  onOpenPOS,
  onOpenCustomerDisplay,
  onOpenUserManagement,
  onOpenPosterModal,
  onOpenExpenses,
  onOpenScreenLinks,
  onLogout,
  onRefreshData,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [chartMetric, setChartMetric] = useState<'sales' | 'net_profit' | 'expenses' | 'transactions'>('sales');

  const formatPeso = (val: number) => {
    return '₱' + (Math.round(val * 100) / 100).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Filter sales for the selected year
  const yearSales = useMemo(() => {
    return sales.filter((s) => {
      const year = new Date(s.date).getFullYear();
      return year === selectedYear || s.date.startsWith(String(selectedYear));
    });
  }, [sales, selectedYear]);

  // Filter expenses for the selected year
  const yearExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const year = new Date(e.date).getFullYear();
      return year === selectedYear || e.date.startsWith(String(selectedYear));
    });
  }, [expenses, selectedYear]);

  // Total sales for current year
  const yearlyTotalSales = useMemo(() => {
    return yearSales.reduce((acc, s) => acc + s.total, 0);
  }, [yearSales]);

  // Total expenses for current year
  const yearlyExpensesTotal = useMemo(() => {
    return yearExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [yearExpenses]);

  // NET PROFIT FOR CURRENT YEAR: Subtract costs from gross sales
  const yearlyNetProfit = useMemo(() => {
    return yearlyTotalSales - yearlyExpensesTotal;
  }, [yearlyTotalSales, yearlyExpensesTotal]);

  // Total sales for current month
  const monthSales = useMemo(() => {
    const monthPad = String(selectedMonth).padStart(2, '0');
    const prefix = `${selectedYear}-${monthPad}`;
    return yearSales.filter((s) => s.date.startsWith(prefix));
  }, [yearSales, selectedYear, selectedMonth]);

  const monthlyTotalSales = useMemo(() => {
    return monthSales.reduce((acc, s) => acc + s.total, 0);
  }, [monthSales]);

  // Monthly expenses
  const monthExpenses = useMemo(() => {
    const monthPad = String(selectedMonth).padStart(2, '0');
    const prefix = `${selectedYear}-${monthPad}`;
    return yearExpenses.filter((e) => e.date.startsWith(prefix));
  }, [yearExpenses, selectedYear, selectedMonth]);

  const monthlyExpensesTotal = useMemo(() => {
    return monthExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [monthExpenses]);

  // Monthly Net Profit
  const monthlyNetProfit = useMemo(() => {
    return monthlyTotalSales - monthlyExpensesTotal;
  }, [monthlyTotalSales, monthlyExpensesTotal]);

  // Today's sales & expenses
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = useMemo(() => {
    return sales.filter((s) => s.date === todayStr);
  }, [sales, todayStr]);

  const dailyTotalSales = useMemo(() => {
    return todaySales.reduce((acc, s) => acc + s.total, 0);
  }, [todaySales]);

  const todayExpenses = useMemo(() => {
    return expenses.filter((e) => e.date === todayStr);
  }, [expenses, todayStr]);

  const dailyExpensesTotal = useMemo(() => {
    return todayExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [todayExpenses]);

  const dailyNetProfit = useMemo(() => {
    return dailyTotalSales - dailyExpensesTotal;
  }, [dailyTotalSales, dailyExpensesTotal]);

  // Monthly breakdown for the selected year (Jan - Dec)
  const monthlyData = useMemo(() => {
    return MONTH_NAMES.map((name, index) => {
      const monthNum = index + 1;
      const monthPad = String(monthNum).padStart(2, '0');
      const prefix = `${selectedYear}-${monthPad}`;

      const mSales = yearSales.filter((s) => s.date.startsWith(prefix));
      const total = mSales.reduce((acc, s) => acc + s.total, 0);
      const count = mSales.length;
      const itemsCount = mSales.reduce(
        (sum, s) => sum + (s.items?.reduce((isum, it) => isum + it.qty, 0) || 0),
        0
      );

      const mExp = yearExpenses.filter((e) => e.date.startsWith(prefix));
      const expensesTotal = mExp.reduce((sum, e) => sum + e.amount, 0);
      const netProfit = total - expensesTotal;

      return {
        monthName: name,
        monthNum,
        total,
        expensesTotal,
        netProfit,
        count,
        itemsCount,
        isCurrent: selectedMonth === monthNum,
      };
    });
  }, [yearSales, yearExpenses, selectedYear, selectedMonth]);

  // Total items sold in year
  const totalItemsSoldYear = useMemo(() => {
    return yearSales.reduce((acc, s) => {
      if (s.items && s.items.length > 0) {
        return acc + s.items.reduce((sum, it) => sum + it.qty, 0);
      }
      return acc + 1;
    }, 0);
  }, [yearSales]);

  // Average transaction value
  const avgOrderValue = yearSales.length > 0 ? yearlyTotalSales / yearSales.length : 0;

  // Payment methods breakdown for pie chart / cards
  const paymentBreakdown = useMemo(() => {
    const cash = yearSales.filter((s) => s.paymentMethod === 'Cash').reduce((acc, s) => acc + s.total, 0);
    const gcash = yearSales.filter((s) => s.paymentMethod === 'GCash').reduce((acc, s) => acc + s.total, 0);
    const bank = yearSales.filter((s) => s.paymentMethod === 'Bank').reduce((acc, s) => acc + s.total, 0);
    const utang = yearSales.filter((s) => s.paymentMethod === 'Utang').reduce((acc, s) => acc + s.total, 0);
    const card = yearSales.filter((s) => s.paymentMethod === 'Card').reduce((acc, s) => acc + s.total, 0);

    return [
      { name: 'Cash', value: cash, color: '#10b981' },
      { name: 'GCash', value: gcash, color: '#3b82f6' },
      { name: 'GoTyme Bank', value: bank, color: '#06b6d4' },
      { name: 'Utang (Credit)', value: utang, color: '#ef4444' },
      { name: 'Card', value: card, color: '#a855f7' },
    ].filter((p) => p.value > 0);
  }, [yearSales]);

  // Cashier sales summary
  const cashierSummary = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    yearSales.forEach((s) => {
      const c = s.cashier || 'Cashier 1';
      if (!map[c]) map[c] = { total: 0, count: 0 };
      map[c].total += s.total;
      map[c].count += 1;
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      total: data.total,
      count: data.count,
    }));
  }, [yearSales]);

  // Expenses breakdown by category
  const expensesBreakdown = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    yearExpenses.forEach((e) => {
      const cat = e.category || 'Other';
      if (!map[cat]) map[cat] = { total: 0, count: 0 };
      map[cat].total += e.amount;
      map[cat].count += 1;
    });

    return Object.entries(map)
      .map(([name, data]) => ({ name, total: data.total, count: data.count }))
      .sort((a, b) => b.total - a.total);
  }, [yearExpenses]);

  // Top products from sales items
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    yearSales.forEach((s) => {
      if (s.items) {
        s.items.forEach((it) => {
          if (!map[it.name]) map[it.name] = { name: it.name, qty: 0, revenue: 0 };
          map[it.name].qty += it.qty;
          map[it.name].revenue += it.qty * it.price;
        });
      }
    });

    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [yearSales]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Sale ID',
      'Date',
      'Time',
      'Cashier',
      'Customer',
      'Payment Method',
      'Reference Code',
      'Total Amount (PHP)',
      '12% VAT',
      'Net Subtotal',
      'Items Summary',
    ];

    const rows = yearSales.map((s) => {
      const vat = (s.total * 0.12) / 1.12;
      const net = s.total - vat;
      const summary = (s.summary || '').replace(/"/g, '""');
      return [
        `"${s.id}"`,
        `"${s.date}"`,
        `"${s.time || ''}"`,
        `"${s.cashier || ''}"`,
        `"${s.customer || ''}"`,
        `"${s.paymentMethod}"`,
        `"${s.referenceCode || ''}"`,
        s.total.toFixed(2),
        vat.toFixed(2),
        net.toFixed(2),
        `"${summary}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `3stars_annual_sales_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans select-none pb-12">
      {/* 1. TOP OWNER / ADMIN NAVIGATION HEADER */}
      <header className="bg-zinc-950 border-b-2 border-red-600 px-4 sm:px-6 py-3.5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-black border-2 border-red-500 flex items-center justify-center text-xl shadow-lg">
            ⭐
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight uppercase">
                3 Stars Mini Mart
              </h1>
              <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                {currentUser.role === 'Owner' ? <Crown className="w-3 h-3 text-amber-300" /> : <Shield className="w-3 h-3 text-blue-300" />}
                {currentUser.role} Dashboard
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">
              Real-time Business & Sales Intelligence System · Google Sheets Sync
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Quick Switch to POS Screen */}
          <button
            onClick={onOpenPOS}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-red-600 to-emerald-600 hover:brightness-110 text-white font-bold rounded-xl text-xs transition shadow-md"
            title="Open Cashier POS Counter"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Open POS Counter</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          {/* Manage Cashiers */}
          <button
            onClick={onOpenUserManagement}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white font-bold rounded-xl text-xs transition"
            title="Manage Cashier Accounts & PINs"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Manage Staff</span>
          </button>

          {/* Promotional Poster Standee */}
          <button
            onClick={onOpenPosterModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white font-bold rounded-xl text-xs transition"
            title="Print Counter QR Standee"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Payment Standee</span>
          </button>

          {/* Store Expenses Tab Link */}
          {onOpenExpenses && (
            <button
              onClick={onOpenExpenses}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-red-500 text-zinc-200 hover:text-white font-bold rounded-xl text-xs transition"
              title="View & Log Store Operational Expenses"
            >
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              <span>Expenses</span>
            </button>
          )}

          {/* Screen URLs / Separate Links */}
          {onOpenScreenLinks && (
            <button
              onClick={onOpenScreenLinks}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-500 text-zinc-200 hover:text-white font-bold rounded-xl text-xs transition"
              title="Separate Dashboard and POS URLs"
            >
              <Link2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Screen Links</span>
            </button>
          )}

          {/* User profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
            <span className="text-xs text-zinc-300 font-bold hidden md:inline">
              {currentUser.name}
            </span>
            <button
              onClick={onLogout}
              className="p-2 bg-zinc-900 hover:bg-red-950 border border-zinc-800 hover:border-red-600 text-zinc-400 hover:text-red-400 rounded-xl transition"
              title="Logout / Switch Account"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. DASHBOARD BODY */}
      <main className="p-4 sm:p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {/* Controls Bar: Year Selector, Month Selector, CSV Export, Sheets Link */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex flex-wrap items-center gap-3">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-black border border-zinc-800 px-3 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-red-500" />
              <span className="text-xs text-zinc-400 font-bold">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-white font-black text-xs focus:outline-none cursor-pointer"
              >
                {[currentYear, currentYear - 1, currentYear - 2].map((yr) => (
                  <option key={yr} value={yr} className="bg-zinc-900 text-white">
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div className="flex items-center gap-1.5 bg-black border border-zinc-800 px-3 py-1.5 rounded-xl">
              <span className="text-xs text-zinc-400 font-bold">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-white font-black text-xs focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx + 1} className="bg-zinc-900 text-white">
                    {m} ({idx + 1})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs text-zinc-500 hidden md:inline">
              Showing figures automatically retrieved from Google Sheets database
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-300 font-bold rounded-xl text-xs transition shadow"
              title="Download Annual Sales History as CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export {selectedYear} CSV</span>
            </button>

            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold rounded-xl text-xs transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Sheets Database</span>
            </a>
          </div>
        </div>

        {/* 3. CORE METRIC TILES: NET PROFIT, GROSS SALES, EXPENSES, MONTHLY, DAILY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* NET PROFIT CARD (Subtracting Costs from Gross Sales) */}
          <div className={`border-2 rounded-3xl p-4 shadow-xl relative overflow-hidden xl:col-span-2 ${
            yearlyNetProfit >= 0
              ? 'bg-zinc-950 border-emerald-500/90 shadow-[0_0_25px_rgba(16,185,129,0.15)]'
              : 'bg-zinc-950 border-red-500/90 shadow-[0_0_25px_rgba(239,68,68,0.15)]'
          }`}>
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">
              <span className="flex items-center gap-1.5 text-white font-black">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Net Store Profit ({selectedYear})</span>
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                yearlyNetProfit >= 0
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-red-950 text-red-300 border-red-700'
              }`}>
                {yearlyTotalSales > 0 ? `${((yearlyNetProfit / yearlyTotalSales) * 100).toFixed(1)}% Margin` : '0%'}
              </span>
            </div>
            <div className={`text-3xl sm:text-4xl font-black font-mono tracking-tight drop-shadow-md ${
              yearlyNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {formatPeso(yearlyNetProfit)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-2 font-mono flex items-center justify-between border-t border-zinc-800/80 pt-1.5">
              <span>Sales: <strong className="text-white">{formatPeso(yearlyTotalSales)}</strong></span>
              <span>Less Costs: <strong className="text-red-400">-{formatPeso(yearlyExpensesTotal)}</strong></span>
            </div>
          </div>

          {/* Yearly Gross Sales */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">
              <span>Gross Sales ({selectedYear})</span>
              <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full">
                Revenue
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              {formatPeso(yearlyTotalSales)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-2 font-mono">
              <span>{yearSales.length} orders · Avg {formatPeso(avgOrderValue)}</span>
            </div>
          </div>

          {/* Total Store Expenses */}
          <div className="bg-zinc-950 border border-red-600/60 rounded-3xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">
              <span className="text-red-400 font-bold">Expenses ({selectedYear})</span>
              {onOpenExpenses ? (
                <button
                  onClick={onOpenExpenses}
                  className="text-[10px] font-mono bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 px-2 py-0.5 rounded-full transition cursor-pointer"
                >
                  Manage ➔
                </button>
              ) : (
                <span className="text-[10px] font-mono bg-red-950 border border-red-700 text-red-400 px-2 py-0.5 rounded-full">
                  Overhead
                </span>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-red-400 tracking-tight">
              {formatPeso(yearlyExpensesTotal)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-2 font-mono">
              <span>{yearExpenses.length} expense bills recorded</span>
            </div>
          </div>

          {/* Monthly Net & Sales */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">
              <span>Month {selectedMonth} Net</span>
              <span className="text-[10px] font-mono bg-blue-950 border border-blue-700 text-blue-400 px-2 py-0.5 rounded-full">
                {MONTH_NAMES[selectedMonth - 1]}
              </span>
            </div>
            <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
              monthlyNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {formatPeso(monthlyNetProfit)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-2 font-mono">
              <span>Sales: {formatPeso(monthlyTotalSales)} · Exp: -{formatPeso(monthlyExpensesTotal)}</span>
            </div>
          </div>

          {/* Today's Sales & Net */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">
              <span>Today's Net</span>
              <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-full">
                {todayStr.slice(5)}
              </span>
            </div>
            <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
              dailyNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {formatPeso(dailyNetProfit)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-2 font-mono">
              <span>Sales: {formatPeso(dailyTotalSales)} ({todaySales.length} tx)</span>
            </div>
          </div>
        </div>

        {/* 4. MONTHLY SALES BAR CHART (TOTAL SALES FOR EACH MONTH - JAN TO DEC) */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-500" />
                <span>Monthly Business Performance ({selectedYear})</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Monthly revenue, operational expenses, and net profit from Google Sheets
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 bg-black border border-zinc-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setChartMetric('sales')}
                className={`px-3 py-1 rounded-lg transition ${
                  chartMetric === 'sales'
                    ? 'bg-zinc-800 text-white font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Gross Sales
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('net_profit')}
                className={`px-3 py-1 rounded-lg transition ${
                  chartMetric === 'net_profit'
                    ? 'bg-emerald-600 text-black font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Net Profit
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('expenses')}
                className={`px-3 py-1 rounded-lg transition ${
                  chartMetric === 'expenses'
                    ? 'bg-red-600 text-white font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Expenses
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('transactions')}
                className={`px-3 py-1 rounded-lg transition ${
                  chartMetric === 'transactions'
                    ? 'bg-blue-600 text-white font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Orders Count
              </button>
            </div>
          </div>

          <div className="w-full h-72 select-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="monthName" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) =>
                    chartMetric === 'transactions'
                      ? val
                      : `₱${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`
                  }
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-950 border border-emerald-500 rounded-2xl p-3 shadow-xl font-mono text-xs text-white">
                          <div className="font-bold text-red-400 border-b border-zinc-800 pb-1 mb-1">
                            {data.monthName} {selectedYear} Financials
                          </div>
                          <div className="text-white font-bold">
                            Gross Sales: {formatPeso(data.total)}
                          </div>
                          <div className="text-red-400 font-bold mt-0.5">
                            Expenses: -{formatPeso(data.expensesTotal)}
                          </div>
                          <div className={`font-black text-sm mt-1 pt-1 border-t border-zinc-800 ${
                            data.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            Net Profit: {formatPeso(data.netProfit)}
                          </div>
                          <div className="text-zinc-400 mt-1 text-[10px]">
                            {data.count} orders · {data.itemsCount} units sold
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey={
                    chartMetric === 'sales'
                      ? 'total'
                      : chartMetric === 'net_profit'
                      ? 'netProfit'
                      : chartMetric === 'expenses'
                      ? 'expensesTotal'
                      : 'count'
                  }
                  radius={[8, 8, 0, 0]}
                  name={
                    chartMetric === 'sales'
                      ? 'Gross Revenue'
                      : chartMetric === 'net_profit'
                      ? 'Net Profit'
                      : chartMetric === 'expenses'
                      ? 'Operational Expenses'
                      : 'Orders Count'
                  }
                >
                  {monthlyData.map((entry, index) => {
                    let fill = '#10b981';
                    if (chartMetric === 'expenses') fill = '#ef4444';
                    else if (chartMetric === 'net_profit') fill = entry.netProfit >= 0 ? '#10b981' : '#ef4444';
                    else if (chartMetric === 'transactions') fill = '#3b82f6';
                    else fill = entry.monthNum === selectedMonth ? '#10b981' : '#dc2626';

                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. PAYMENT BREAKDOWN & CASHIER SALES SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Payment Method Distribution */}
          <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
                Payment Methods ({selectedYear})
              </h3>
              <p className="text-xs text-zinc-400 mb-4">
                Cash vs GCash vs Bank vs Utang revenue share
              </p>

              <div className="space-y-3 font-mono text-xs">
                {paymentBreakdown.map((pm) => {
                  const pct = yearlyTotalSales > 0 ? (pm.value / yearlyTotalSales) * 100 : 0;
                  return (
                    <div key={pm.name} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-zinc-300 flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: pm.color }}
                          />
                          {pm.name}
                        </span>
                        <span className="text-white font-black">{formatPeso(pm.value)}</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: pm.color,
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-zinc-500 text-right">
                        {pct.toFixed(1)}% of total revenue
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-400">
              💡 Track customer preferred payment channels for working capital management.
            </div>
          </div>

          {/* Cashier Performance & Top Products */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Cashier Performance */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Cashier Performance ({selectedYear})
                </h3>
                <span className="text-xs text-zinc-400 font-mono">
                  {cashierSummary.length} Active Operators
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cashierSummary.map((c) => (
                  <div
                    key={c.name}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{c.name}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        {c.count} orders processed
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-400 uppercase font-semibold text-[10px]">
                        Sales
                      </div>
                      <div className="text-sm font-black font-mono text-emerald-400">
                        {formatPeso(c.total)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Top-Selling Inventory Items</span>
                </h3>
                <span className="text-xs text-zinc-400 font-mono">By Revenue</span>
              </div>

              <div className="divide-y divide-zinc-900 max-h-56 overflow-y-auto font-mono text-xs">
                {topProducts.map((p, idx) => (
                  <div key={p.name} className="py-2 px-1 flex items-center justify-between hover:bg-zinc-900/50 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="w-5 text-zinc-500 font-bold">#{idx + 1}</span>
                      <span className="font-bold text-zinc-200 truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-zinc-400 text-[11px]">{p.qty} pcs</span>
                      <span className="text-emerald-400 font-bold w-20 text-right">
                        {formatPeso(p.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operational Overhead Expenses Breakdown */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span>Store Overhead Expenses ({selectedYear})</span>
                </h3>
                {onOpenExpenses ? (
                  <button
                    onClick={onOpenExpenses}
                    className="text-[10px] text-red-400 hover:text-white font-mono hover:underline cursor-pointer"
                  >
                    View Expenses Tab ➔
                  </button>
                ) : (
                  <span className="text-xs text-zinc-400 font-mono">Total {formatPeso(yearlyExpensesTotal)}</span>
                )}
              </div>

              <div className="space-y-3 font-mono text-xs">
                {expensesBreakdown.length === 0 ? (
                  <div className="text-zinc-500 py-3 text-center">
                    No expense records logged for {selectedYear}
                  </div>
                ) : (
                  expensesBreakdown.map((exp) => {
                    const pct = yearlyExpensesTotal > 0 ? (exp.total / yearlyExpensesTotal) * 100 : 0;
                    return (
                      <div key={exp.name} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-zinc-300">{exp.name}</span>
                          <span className="text-red-400 font-bold">{formatPeso(exp.total)}</span>
                        </div>
                        <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-zinc-500 text-right">
                          {pct.toFixed(1)}% of overhead ({exp.count} bills)
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 6. RECENT SALES TRANSACTION AUDIT TABLE */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-red-500" />
              <span>Real-Time Sales Log ({yearSales.length} Transactions)</span>
            </h3>
            <span className="text-xs text-zinc-400 font-mono">Live Google Sheets Feed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Sale ID</th>
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">Cashier</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Payment</th>
                  <th className="py-2.5 px-4">Ref #</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {yearSales.slice(0, 10).map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-900/40">
                    <td className="py-2.5 px-4 font-bold text-red-400">{s.id}</td>
                    <td className="py-2.5 px-4 text-zinc-300">
                      {s.date} {s.time}
                    </td>
                    <td className="py-2.5 px-4 text-zinc-300">{s.cashier || 'Cashier 1'}</td>
                    <td className="py-2.5 px-4 text-zinc-400">{s.customer || '—'}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.paymentMethod === 'Cash'
                            ? 'bg-emerald-950 text-emerald-400'
                            : s.paymentMethod === 'GCash'
                            ? 'bg-blue-950 text-blue-400'
                            : s.paymentMethod === 'Bank'
                            ? 'bg-cyan-950 text-cyan-400'
                            : s.paymentMethod === 'Utang'
                            ? 'bg-red-950 text-red-400'
                            : 'bg-purple-950 text-purple-400'
                        }`}
                      >
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-zinc-400 font-mono text-[10px]">
                      {s.referenceCode || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-black text-emerald-400">
                      {formatPeso(s.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
