import React from 'react';
import { User } from 'firebase/auth';
import { POSUser } from '../types';
import {
  ShoppingBag,
  BarChart3,
  Package,
  Smartphone,
  BookOpen,
  Tv,
  Calculator,
  FileSpreadsheet,
  Volume2,
  VolumeX,
  ExternalLink,
  Crown,
  Shield,
  Store,
  QrCode,
  LayoutDashboard,
  LogOut,
  Users,
  Link2,
  TrendingDown,
} from 'lucide-react';

interface Props {
  currentTab: 'pos' | 'sales' | 'inventory' | 'expenses' | 'gcash' | 'utang' | 'dashboard';
  onSelectTab: (tab: 'pos' | 'sales' | 'inventory' | 'expenses' | 'gcash' | 'utang' | 'dashboard') => void;
  onOpenCustomerDisplay: () => void;
  onOpenCalculator: () => void;
  onOpenSheetsModal: () => void;
  onOpenPosterModal?: () => void;
  onOpenUserManagement?: () => void;
  onOpenScreenLinks?: () => void;
  onSwitchUser?: () => void;
  currentUser: POSUser | null;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  user: User | null;
  syncState: 'idle' | 'syncing' | 'success' | 'error';
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  onOpenCustomerDisplay,
  onOpenCalculator,
  onOpenSheetsModal,
  onOpenPosterModal,
  onOpenUserManagement,
  onOpenScreenLinks,
  onSwitchUser,
  currentUser,
  isSoundEnabled,
  onToggleSound,
  user,
  syncState,
}) => {
  const isCashier = currentUser?.role === 'Cashier';
  const isOwnerOrAdmin = currentUser?.role === 'Owner' || currentUser?.role === 'Admin';

  // Tabs based on role
  const allTabs = [
    ...(isOwnerOrAdmin
      ? [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, isBadge: true }]
      : []),
    { id: 'pos', label: 'Sell (POS)', icon: ShoppingBag },
    ...(isOwnerOrAdmin
      ? [
          { id: 'sales', label: 'Sales Reports', icon: BarChart3 },
          { id: 'expenses', label: 'Expenses', icon: TrendingDown },
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'gcash', label: 'GCash', icon: Smartphone },
          { id: 'utang', label: 'Utang Ledger', icon: BookOpen },
        ]
      : []),
  ] as const;

  return (
    <header className="bg-gradient-to-r from-red-950 via-zinc-950 to-black border-b border-red-900/60 px-3 md:px-5 py-2.5 shadow-xl sticky top-0 z-40 select-none">
      <div className="max-w-[1680px] mx-auto flex items-center justify-between gap-3 flex-wrap">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-black border-2 border-red-500 shadow-md flex items-center justify-center text-lg shadow-red-600/30">
            ⭐
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base md:text-lg font-black tracking-tight text-white uppercase">
                3 Stars Mini Mart
              </span>
              <span className="hidden sm:inline-block bg-emerald-600 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                POS
              </span>
            </div>
            <p className="hidden md:block text-[10px] text-zinc-400">
              Barangay 171, Caloocan City · Point of Sale
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Restricted for Cashier to POS only) */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1">
          {allTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/60 border border-red-500'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Tools, User Account Badge & Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {/* QR Payment Poster Standee */}
          {onOpenPosterModal && (
            <button
              onClick={onOpenPosterModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-emerald-500 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition shadow-sm"
              title="Print Counter QR Standee"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">QR Standee</span>
            </button>
          )}

          {/* Manage Staff (Owner/Admin) */}
          {isOwnerOrAdmin && onOpenUserManagement && (
            <button
              onClick={onOpenUserManagement}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition shadow-sm"
              title="Manage Cashier Accounts"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden xl:inline">Staff</span>
            </button>
          )}

          {/* Independent Screen URLs & Links (Owner/Admin) */}
          {isOwnerOrAdmin && onOpenScreenLinks && (
            <button
              onClick={onOpenScreenLinks}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-500 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition shadow-sm"
              title="Independent Screen Links (?view=pos, ?view=owner, ?view=admin, ?view=display)"
            >
              <Link2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Screen Links</span>
            </button>
          )}

          {/* Dedicated Customer Display Trigger */}
          <button
            onClick={onOpenCustomerDisplay}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/50 hover:border-emerald-400 text-emerald-400 rounded-xl text-xs font-bold transition shadow-sm"
            title="Launch Full Customer-Facing Display"
          >
            <Tv className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Customer Screen</span>
          </button>

          {/* Calculator Tool */}
          <button
            onClick={onOpenCalculator}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl text-xs transition"
            title="Till Calculator"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl text-xs transition"
            title={isSoundEnabled ? 'Audio Effects Enabled' : 'Audio Muted'}
          >
            {isSoundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
            )}
          </button>

          {/* Google Sheets Sync Pill (Owner/Admin only) */}
          {isOwnerOrAdmin && (
            <button
              onClick={onOpenSheetsModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition ${
                user
                  ? syncState === 'syncing'
                    ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 animate-pulse'
                    : 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400'
              }`}
              title="Google Sheets Database"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden 2xl:inline">
                {user ? (syncState === 'syncing' ? 'Syncing…' : 'Sheets Synced') : 'Connect'}
              </span>
            </button>
          )}

          {/* Logged in User Badge & Switcher */}
          {currentUser && (
            <button
              onClick={onSwitchUser}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-xl text-xs font-bold transition shadow-sm ml-1"
              title="Click to Switch User / Lock"
            >
              {currentUser.role === 'Owner' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
              {currentUser.role === 'Admin' && <Shield className="w-3.5 h-3.5 text-blue-400" />}
              {currentUser.role === 'Cashier' && <Store className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="truncate max-w-[100px]">{currentUser.name.split(' ')[0]}</span>
              <LogOut className="w-3 h-3 text-zinc-500" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
