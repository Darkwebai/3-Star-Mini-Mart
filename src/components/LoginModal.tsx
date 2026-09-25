import React, { useState } from 'react';
import { POSUser, UserRole } from '../types';
import { sound } from '../services/soundEffects';
import {
  Lock,
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Crown,
  Briefcase,
  Store,
  ChevronRight,
} from 'lucide-react';

interface Props {
  users: POSUser[];
  currentUser: POSUser | null;
  onLogin: (user: POSUser) => void;
  onClose?: () => void;
  canCancel?: boolean;
}

export const LoginModal: React.FC<Props> = ({
  users,
  currentUser,
  onLogin,
  onClose,
  canCancel = false,
}) => {
  const [selectedUser, setSelectedUser] = useState<POSUser>(
    currentUser || users[0] || {
      id: 'USR-001',
      username: 'owner',
      name: 'Dennis De Jesus',
      pin: '8888',
      role: 'Owner',
      status: 'Active',
      createdAt: '2026-01-01',
    }
  );

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDigit = (digit: string) => {
    if (enteredPin.length < 6) {
      setEnteredPin((prev) => prev + digit);
      setErrorMsg(null);
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setEnteredPin('');
    setErrorMsg(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (enteredPin === selectedUser.pin) {
      sound.playSuccess();
      onLogin(selectedUser);
    } else {
      sound.playWarning();
      setErrorMsg('Incorrect PIN code. Please try again.');
      setEnteredPin('');
    }
  };

  const handleQuickSelect = (u: POSUser) => {
    setSelectedUser(u);
    setEnteredPin('');
    setErrorMsg(null);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Owner':
        return <Crown className="w-4 h-4 text-amber-400" />;
      case 'Admin':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'Cashier':
        return <Store className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Owner':
        return 'bg-amber-950/80 border-amber-600 text-amber-300';
      case 'Admin':
        return 'bg-blue-950/80 border-blue-600 text-blue-300';
      case 'Cashier':
        return 'bg-emerald-950/80 border-emerald-600 text-emerald-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none">
      <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 text-white shadow-2xl relative animate-in zoom-in-95 duration-200">
        {/* Close button if optional */}
        {canCancel && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-black border-2 border-red-500 flex items-center justify-center mx-auto mb-2.5 shadow-lg shadow-red-950/50">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">POS Staff Login</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Select account and enter PIN for Owner, Admin, or Cashier
          </p>
        </div>

        {/* 1. Account Selection Grid */}
        <div className="mb-5">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
            Select Staff Account:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {users.map((u) => {
              const isSelected = selectedUser.id === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickSelect(u)}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-zinc-900 border-red-500 shadow-md ring-1 ring-red-500'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="min-w-0 pr-1">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                      {getRoleIcon(u.role)}
                      <span>{u.name}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      PIN: <span className="text-emerald-400 font-bold">{u.pin}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase shrink-0 ${getRoleBadge(
                      u.role
                    )}`}
                  >
                    {u.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Selected User Banner */}
        <div className="bg-black border border-zinc-800 rounded-2xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center">
              {getRoleIcon(selectedUser.role)}
            </div>
            <div>
              <div className="text-xs font-black text-white">{selectedUser.name}</div>
              <div className="text-[11px] text-zinc-400 font-medium">
                {selectedUser.role === 'Owner' && 'Full access: All systems & Owner Dashboard'}
                {selectedUser.role === 'Admin' && 'System Management & Sales Monitoring'}
                {selectedUser.role === 'Cashier' && 'Sales & Checkout Counter Only'}
              </div>
            </div>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${getRoleBadge(selectedUser.role)}`}>
            {selectedUser.role}
          </span>
        </div>

        {/* 3. PIN Display Dots */}
        <div className="mb-4 text-center">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Enter PIN for {selectedUser.name}
          </div>
          <div className="flex justify-center items-center gap-3 h-10">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = enteredPin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    isFilled
                      ? 'bg-red-500 border-red-500 scale-110 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                      : 'border-zinc-700 bg-black'
                  }`}
                />
              );
            })}
          </div>
          {errorMsg && (
            <div className="text-xs text-red-400 font-bold mt-2 flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* 4. PIN Keypad */}
        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-4 font-mono">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(String(num))}
              className="py-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 text-lg font-bold text-white transition active:scale-95 shadow"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="py-3 rounded-2xl bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-xs font-bold text-zinc-400 transition"
          >
            CLEAR
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="py-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 text-lg font-bold text-white transition active:scale-95 shadow"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="py-3 rounded-2xl bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-xs font-bold text-zinc-400 transition"
          >
            DEL
          </button>
        </div>

        {/* 5. Login Confirm Button */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={enteredPin.length === 0}
          className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg ${
            enteredPin.length > 0
              ? 'bg-gradient-to-r from-red-600 via-emerald-600 to-emerald-700 hover:brightness-110 active:scale-98 text-white cursor-pointer'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          <span>Unlock & Login as {selectedUser.name}</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Demo PIN quick hint for convenience */}
        <div className="mt-3 text-center text-[10px] text-zinc-500 font-mono">
          Owner: 8888 · Admin: 1234 · Cashier: 0000 / 1111
        </div>
      </div>
    </div>
  );
};
