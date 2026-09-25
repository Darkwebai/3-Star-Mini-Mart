import React, { useState } from 'react';
import { POSUser, UserRole } from '../types';
import { sound } from '../services/soundEffects';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  X,
  Shield,
  Crown,
  Store,
  Check,
  AlertCircle,
  KeyRound,
  UserCheck,
} from 'lucide-react';

interface Props {
  users: POSUser[];
  currentUser: POSUser;
  onSaveUser: (user: POSUser) => void;
  onDeleteUser: (userId: string) => void;
  onClose: () => void;
}

export const UserManagementModal: React.FC<Props> = ({
  users,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onClose,
}) => {
  const [editingUser, setEditingUser] = useState<POSUser | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // Form states
  const [formData, setFormData] = useState<{
    id: string;
    username: string;
    name: string;
    pin: string;
    role: UserRole;
    status: 'Active' | 'Inactive';
  }>({
    id: '',
    username: '',
    name: '',
    pin: '',
    role: 'Cashier',
    status: 'Active',
  });

  const [formError, setFormError] = useState<string | null>(null);

  const isOwner = currentUser.role === 'Owner';
  const isAdmin = currentUser.role === 'Admin';

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setEditingUser(null);
    setFormData({
      id: `USR-${Math.floor(100 + Math.random() * 900)}`,
      username: '',
      name: '',
      pin: '',
      role: 'Cashier',
      status: 'Active',
    });
    setFormError(null);
  };

  const handleStartEdit = (u: POSUser) => {
    setIsAddingNew(false);
    setEditingUser(u);
    setFormData({
      id: u.id,
      username: u.username,
      name: u.name,
      pin: u.pin,
      role: u.role,
      status: u.status,
    });
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Staff name is required.');
      return;
    }
    if (!formData.username.trim()) {
      setFormError('Username is required.');
      return;
    }
    if (!formData.pin || formData.pin.length < 4) {
      setFormError('PIN must be at least 4 digits.');
      return;
    }

    // Admins cannot create or edit Owner accounts
    if (isAdmin && !isOwner && formData.role === 'Owner') {
      setFormError('Only the Store Owner can assign the Owner role.');
      return;
    }

    const savedUser: POSUser = {
      id: formData.id || `USR-${Math.floor(100 + Math.random() * 900)}`,
      username: formData.username.toLowerCase().trim(),
      name: formData.name.trim(),
      pin: formData.pin.trim(),
      role: formData.role,
      status: formData.status,
      createdAt: editingUser?.createdAt || new Date().toISOString().slice(0, 10),
    };

    onSaveUser(savedUser);
    sound.playSuccess();
    setIsAddingNew(false);
    setEditingUser(null);
  };

  const handleDelete = (u: POSUser) => {
    if (u.id === currentUser.id) {
      alert('You cannot delete your own active account.');
      return;
    }
    if (u.role === 'Owner') {
      alert('The Owner account cannot be deleted.');
      return;
    }
    if (isAdmin && !isOwner && u.role === 'Admin') {
      alert('Admins cannot delete other Admin accounts.');
      return;
    }

    if (confirm(`Are you sure you want to remove account "${u.name}"?`)) {
      onDeleteUser(u.id);
      sound.playWarning();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 text-white shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Staff & Cashier Accounts</h3>
              <p className="text-xs text-zinc-400">
                Manage login PINs, cashiers, roles, and permissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAddingNew && !editingUser && (
              <button
                type="button"
                onClick={handleStartAdd}
                className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-emerald-600 hover:brightness-110 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Cashier</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form View (Add / Edit) */}
        {(isAddingNew || editingUser) ? (
          <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>{isAddingNew ? 'Create New Staff Account' : `Edit Account: ${editingUser?.name}`}</span>
            </h4>

            {formError && (
              <div className="mb-3 bg-red-950/80 border border-red-500 text-red-300 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cashier Maria, Ronald..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. maria, cashier3..."
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  4-Digit Login PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="e.g. 2026"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold tracking-widest focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Access Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-bold"
                  disabled={!isOwner && formData.role === 'Owner'}
                >
                  <option value="Cashier">Cashier (Sales & POS Only)</option>
                  <option value="Admin">Admin (Sales & System Management)</option>
                  {isOwner && <option value="Owner">Owner (Full Business Access)</option>}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingUser(null);
                }}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-black rounded-xl text-xs flex items-center gap-1.5 transition shadow"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Account</span>
              </button>
            </div>
          </form>
        ) : null}

        {/* Users List Table */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-bold uppercase">
            <span>Staff Account ({users.length})</span>
            <span>Role / PIN / Actions</span>
          </div>

          <div className="divide-y divide-zinc-800">
            {users.map((u) => {
              const isSelf = u.id === currentUser.id;
              return (
                <div
                  key={u.id}
                  className="p-3.5 flex items-center justify-between hover:bg-zinc-900/40 transition gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-black border border-zinc-700 flex items-center justify-center shrink-0">
                      {u.role === 'Owner' && <Crown className="w-4 h-4 text-amber-400" />}
                      {u.role === 'Admin' && <Shield className="w-4 h-4 text-blue-400" />}
                      {u.role === 'Cashier' && <Store className="w-4 h-4 text-emerald-400" />}
                    </div>

                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {isSelf && (
                          <span className="text-[9px] bg-red-950 border border-red-700 text-red-400 px-1 rounded font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        User: <strong className="text-zinc-300">@{u.username}</strong> · PIN:{' '}
                        <strong className="text-emerald-400">{u.pin}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${
                        u.role === 'Owner'
                          ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                          : u.role === 'Admin'
                          ? 'bg-blue-950/80 border-blue-600 text-blue-300'
                          : 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                      }`}
                    >
                      {u.role}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(u)}
                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg transition"
                      title="Edit Account"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {u.role !== 'Owner' && (
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        disabled={isSelf}
                        className="p-1.5 bg-zinc-800 hover:bg-red-950 border border-zinc-700 hover:border-red-600 text-zinc-400 hover:text-red-400 rounded-lg transition disabled:opacity-40"
                        title="Remove Cashier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl text-[11px] text-zinc-400 flex items-center justify-between">
          <span>🔒 Cashiers only have access to POS sales & scanning. Only Owner & Admin can view business analytics.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition shrink-0 ml-3"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
