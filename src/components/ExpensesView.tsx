import React, { useState, useMemo } from 'react';
import { Expense, POSUser } from '../types';
import { sound } from '../services/soundEffects';
import {
  Receipt,
  Plus,
  Trash2,
  Download,
  Calendar,
  DollarSign,
  TrendingDown,
  Building2,
  Zap,
  Package,
  Users,
  Search,
  FileSpreadsheet,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

interface Props {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => Promise<void>;
  onDeleteExpense: (id: string) => void;
  currentUser: POSUser | null;
  spreadsheetId: string;
}

export const EXPENSE_CATEGORIES = [
  { id: 'Electricity', label: 'Electricity / Meralco', icon: '⚡', color: '#f59e0b' },
  { id: 'Supplies', label: 'Store Supplies & Packaging', icon: '📦', color: '#3b82f6' },
  { id: 'Salaries', label: 'Staff Salaries & Wages', icon: '👥', color: '#10b981' },
  { id: 'Rent', label: 'Store Space Rent', icon: '🏪', color: '#ec4899' },
  { id: 'Water', label: 'Water & Sanitation', icon: '💧', color: '#06b6d4' },
  { id: 'Repairs', label: 'Maintenance & Repairs', icon: '🛠️', color: '#8b5cf6' },
  { id: 'Internet', label: 'Internet & Communications', icon: '🌐', color: '#6366f1' },
  { id: 'Logistics', label: 'Transportation & Logistics', icon: '🚚', color: '#14b8a6' },
  { id: 'Permits', label: 'Permits & Barangay Taxes', icon: '🏷️', color: '#eab308' },
  { id: 'Other', label: 'Other Operational Expenses', icon: '📝', color: '#a1a1aa' },
];

export const ExpensesView: React.FC<Props> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
  currentUser,
  spreadsheetId,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Expense Form State
  const [formCategory, setFormCategory] = useState<string>('Electricity');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formAmountStr, setFormAmountStr] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const formatPeso = (val: number) => {
    return '₱' + (Math.round(val * 100) / 100).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Filter expenses for selected year
  const yearExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const yr = new Date(e.date).getFullYear();
      return yr === selectedYear || e.date.startsWith(String(selectedYear));
    });
  }, [expenses, selectedYear]);

  // Total for current year
  const totalYearExpenses = useMemo(() => {
    return yearExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [yearExpenses]);

  // Current month's expenses
  const currentMonthStr = `${selectedYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const currentMonthExpenses = useMemo(() => {
    return yearExpenses.filter((e) => e.date.startsWith(currentMonthStr));
  }, [yearExpenses, currentMonthStr]);

  const totalMonthExpenses = useMemo(() => {
    return currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [currentMonthExpenses]);

  // Today's expenses
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayExpenses = useMemo(() => {
    return expenses.filter((e) => e.date === todayStr);
  }, [expenses, todayStr]);

  const totalTodayExpenses = useMemo(() => {
    return todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [todayExpenses]);

  // Expenses grouped by Category for chart & metrics
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    yearExpenses.forEach((e) => {
      const cat = e.category || 'Other';
      if (!map[cat]) map[cat] = { total: 0, count: 0 };
      map[cat].total += e.amount;
      map[cat].count += 1;
    });

    return EXPENSE_CATEGORIES.map((cat) => ({
      name: cat.id,
      label: cat.label,
      icon: cat.icon,
      color: cat.color,
      total: map[cat.id]?.total || 0,
      count: map[cat.id]?.count || 0,
    })).sort((a, b) => b.total - a.total);
  }, [yearExpenses]);

  const topCategory = categoryBreakdown[0] || null;

  // Filtered expenses for the table
  const filteredExpenses = useMemo(() => {
    return yearExpenses.filter((e) => {
      const matchesCat = selectedCategory === 'All' || e.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [yearExpenses, selectedCategory, searchQuery]);

  // Handle Quick Bill buttons in Form
  const handleQuickAddAmount = (add: number) => {
    const current = Number(formAmountStr) || 0;
    setFormAmountStr(String(current + add));
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(formAmountStr);
    if (!amount || amount <= 0) {
      setFormError('Please enter a valid expense amount greater than 0.');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Please provide a short description for this expense.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const newExpense: Expense = {
      id: `EXP-${Date.now().toString().slice(-6)}`,
      date: formDate,
      category: formCategory,
      description: formDescription.trim(),
      amount: Math.round(amount * 100) / 100,
      loggedBy: currentUser?.name || 'Store Owner',
    };

    try {
      sound.playSuccess();
      await onAddExpense(newExpense);
      setShowAddModal(false);
      setFormDescription('');
      setFormAmountStr('');
      setFormCategory('Electricity');
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save expense to Google Sheets.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Expense ID', 'Date', 'Category', 'Description', 'Amount (PHP)', 'Logged By'];
    const rows = filteredExpenses.map((e) => {
      const desc = e.description.replace(/"/g, '""');
      return [
        `"${e.id}"`,
        `"${e.date}"`,
        `"${e.category}"`,
        `"${desc}"`,
        e.amount.toFixed(2),
        `"${e.loggedBy || 'Store Admin'}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `3stars_expenses_${selectedYear}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 bg-black text-white p-4 sm:p-6 overflow-y-auto font-sans select-none pb-16">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 1. TOP HEADER & CONTROLS */}
        <div className="bg-zinc-950 border-2 border-red-600/70 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-black border-2 border-red-500 flex items-center justify-center text-red-400 shadow-lg shadow-red-950/50">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                  Store Expenses Ledger
                </h2>
                <span className="bg-red-600/20 border border-red-500/40 text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Operating Costs
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Log utility bills, supplies, and staff payroll · Automatically synced to Google Sheets & subtracted from Net Profit
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            {/* Year selector */}
            <div className="flex items-center gap-1.5 bg-black border border-zinc-800 px-3 py-2 rounded-xl text-xs font-bold">
              <Calendar className="w-3.5 h-3.5 text-red-500" />
              <span className="text-zinc-400">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-white font-black focus:outline-none cursor-pointer"
              >
                {[currentYear, currentYear - 1].map((yr) => (
                  <option key={yr} value={yr} className="bg-zinc-900 text-white">
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Export CSV button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-bold transition shadow"
              title="Download Expenses CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            {/* Link to Google Sheets Expenses Tab */}
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-bold transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Google Sheets</span>
            </a>

            {/* Log New Expense Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-emerald-600 hover:brightness-110 text-white rounded-xl text-xs font-black shadow-lg shadow-red-950/50 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Log Expense</span>
            </button>
          </div>
        </div>

        {/* 2. SUMMARY KPI TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Annual Expenses */}
          <div className="bg-zinc-950 border border-red-600/60 rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">
              <span>Total Expenses ({selectedYear})</span>
              <span className="text-[10px] font-mono bg-red-950 border border-red-700 text-red-400 px-2 py-0.5 rounded-full">
                Yearly
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-red-400 tracking-tight drop-shadow-[0_2px_15px_rgba(239,68,68,0.3)]">
              {formatPeso(totalYearExpenses)}
            </div>
            <div className="text-xs text-zinc-400 mt-2 font-mono flex items-center justify-between">
              <span>{yearExpenses.length} expense entries recorded</span>
            </div>
          </div>

          {/* This Month's Expenses */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">
              <span>This Month's Overhead</span>
              <span className="text-[10px] font-mono bg-amber-950 border border-amber-700 text-amber-400 px-2 py-0.5 rounded-full">
                Month
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
              {formatPeso(totalMonthExpenses)}
            </div>
            <div className="text-xs text-zinc-400 mt-2 font-mono">
              <span>{currentMonthExpenses.length} entries for current month</span>
            </div>
          </div>

          {/* Today's Expenses */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">
              <span>Today's Outflow</span>
              <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full">
                {todayStr}
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
              {formatPeso(totalTodayExpenses)}
            </div>
            <div className="text-xs text-zinc-400 mt-2 font-mono">
              <span>{todayExpenses.length} expenses logged today</span>
            </div>
          </div>

          {/* Top Expense Category */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">
              <span>Top Expense Category</span>
              <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full">
                {topCategory?.icon || '📊'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight truncate">
              {topCategory?.label ? topCategory.label.split('/')[0].trim() : 'None'}
            </div>
            <div className="text-xs text-zinc-400 mt-2 font-mono">
              <span>{topCategory ? formatPeso(topCategory.total) : '₱0.00'} ({topCategory?.count || 0} bills)</span>
            </div>
          </div>
        </div>

        {/* 3. CATEGORY VISUAL BREAKDOWN & RECHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart */}
          <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <span>Expenses by Category ({selectedYear})</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Breakdown of store utilities, supplies, salaries, and operational costs
                </p>
              </div>
            </div>

            <div className="w-full h-64 select-none">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryBreakdown.filter((c) => c.total > 0)}
                  margin={{ top: 10, right: 15, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#a1a1aa"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#a1a1aa"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `₱${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-zinc-950 border border-red-500 rounded-2xl p-3 shadow-xl font-mono text-xs text-white">
                            <div className="font-bold text-red-400 border-b border-zinc-800 pb-1 mb-1">
                              {data.icon} {data.label}
                            </div>
                            <div className="text-emerald-400 font-black text-sm">
                              Amount: {formatPeso(data.total)}
                            </div>
                            <div className="text-zinc-400 mt-1">
                              {data.count} entries logged
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Share List */}
          <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
                Cost Distribution
              </h3>
              <p className="text-xs text-zinc-400 mb-3">Share of overall store expenses</p>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {categoryBreakdown.filter(c => c.total > 0).map((cat) => {
                  const pct = totalYearExpenses > 0 ? (cat.total / totalYearExpenses) * 100 : 0;
                  return (
                    <div key={cat.name} className="flex flex-col gap-1 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-zinc-300 flex items-center gap-1.5 truncate max-w-[200px]">
                          <span>{cat.icon}</span>
                          <span className="truncate">{cat.label}</span>
                        </span>
                        <span className="text-white font-bold">{formatPeso(cat.total)}</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-zinc-500 text-right">
                        {pct.toFixed(1)}% of total expenses ({cat.count} bills)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-400">
              💡 These operational costs are automatically deducted from the Gross Sales to compute the live <strong>Net Profit</strong> on the Dashboard.
            </div>
          </div>
        </div>

        {/* 4. EXPENSES SEARCH, CATEGORY PILLS & TABLE */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* Controls Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description, bill ID, category…"
                className="w-full pl-9 pr-3 py-2 bg-black border border-zinc-800 focus:border-red-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto py-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === 'All'
                    ? 'bg-red-600 text-white shadow'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                All ({yearExpenses.length})
              </button>
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                    selectedCategory === cat.id
                      ? 'bg-red-600 text-white shadow'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-900/60 text-zinc-400 border-b border-zinc-800 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Expense ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Logged By</th>
                  <th className="py-3 px-4 text-right">Amount (PHP)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-zinc-500 font-sans">
                      <Receipt className="w-10 h-10 mx-auto text-zinc-800 mb-2" />
                      <p className="text-sm font-bold text-zinc-400">No expense records found</p>
                      <p className="text-xs text-zinc-600 mt-1">
                        Click "+ Log Expense" above to record store utility bills, supplies, or payroll.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
                    const catObj = EXPENSE_CATEGORIES.find((c) => c.id === exp.category);
                    return (
                      <tr key={exp.id} className="hover:bg-zinc-900/40 transition">
                        <td className="py-3 px-4 font-bold text-red-400">{exp.id}</td>
                        <td className="py-3 px-4 text-zinc-300">{exp.date}</td>
                        <td className="py-3 px-4">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                            style={{
                              backgroundColor: `${catObj?.color || '#a1a1aa'}20`,
                              borderColor: `${catObj?.color || '#a1a1aa'}60`,
                              color: catObj?.color || '#ffffff',
                            }}
                          >
                            <span>{catObj?.icon || '📝'}</span>
                            <span>{exp.category}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans text-zinc-200 font-medium">
                          {exp.description}
                        </td>
                        <td className="py-3 px-4 text-zinc-400">{exp.loggedBy || 'Store Admin'}</td>
                        <td className="py-3 px-4 text-right font-black text-red-400 text-sm">
                          {formatPeso(exp.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm(`Delete expense ${exp.id} (${exp.description})?`)) {
                                onDeleteExpense(exp.id);
                              }
                            }}
                            className="p-1.5 hover:bg-red-950 text-zinc-500 hover:text-red-400 rounded-lg transition"
                            title="Delete this record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. LOG NEW EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 text-white shadow-2xl relative animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-800 pr-8">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Log Store Expense</h3>
                <p className="text-xs text-zinc-400">
                  Record operational overhead to Google Sheets Expenses database
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-950/80 border border-red-600 text-red-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitExpense} className="space-y-4 font-sans">
              {/* Category Select */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Expense Category
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const isSelected = formCategory === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setFormCategory(cat.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center gap-2 ${
                          isSelected
                            ? 'bg-red-600 border-red-500 text-white shadow-md'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <span className="text-base">{cat.icon}</span>
                        <span className="truncate">{cat.label.split('/')[0].trim()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Description / Note
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g., Meralco bill for Sept, Sando bags 5 packs, Staff weekly pay"
                  required
                  className="w-full p-3 bg-black border border-zinc-800 focus:border-red-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition"
                />
              </div>

              {/* Amount */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Amount (PHP ₱)
                  </label>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    {formatPeso(Number(formAmountStr) || 0)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-base font-mono">
                    ₱
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={formAmountStr}
                    onChange={(e) => setFormAmountStr(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full pl-8 pr-3 py-3 bg-black border border-zinc-800 focus:border-emerald-500 rounded-xl text-lg font-black font-mono text-emerald-400 focus:outline-none transition"
                  />
                </div>

                {/* Quick Add Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[50, 100, 500, 1000, 2500, 5000].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => handleQuickAddAmount(amt)}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg text-xs font-mono font-bold transition"
                    >
                      +₱{amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormAmountStr('')}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-red-950 border border-zinc-800 hover:border-red-700 text-zinc-400 hover:text-red-400 rounded-lg text-xs font-mono transition"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Expense Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full p-3 bg-black border border-zinc-800 focus:border-red-500 rounded-xl text-xs font-mono text-white focus:outline-none transition"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-emerald-600 hover:brightness-110 active:scale-98 text-white font-black rounded-xl text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Saving…</span>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Save & Sync to Google Sheets</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
