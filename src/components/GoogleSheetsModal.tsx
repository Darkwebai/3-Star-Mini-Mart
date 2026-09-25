import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  X,
  Lock,
  Database,
} from 'lucide-react';

interface Props {
  user: User | null;
  spreadsheetId: string;
  onUpdateSpreadsheetId: (id: string) => void;
  onSyncFromSheet: () => Promise<void>;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onClose: () => void;
  syncStatus: {
    state: 'idle' | 'syncing' | 'success' | 'error';
    message?: string;
  };
}

export const GoogleSheetsModal: React.FC<Props> = ({
  user,
  spreadsheetId,
  onUpdateSpreadsheetId,
  onSyncFromSheet,
  onSignIn,
  onSignOut,
  onClose,
  syncStatus,
}) => {
  const [tempId, setTempId] = useState(spreadsheetId);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveId = () => {
    onUpdateSpreadsheetId(tempId.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/50 text-emerald-400 flex items-center justify-center text-2xl shadow-lg">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Google Sheets Integration</h3>
            <p className="text-xs text-zinc-400">
              Direct live sync for Items, Sales, Expenses, and Utang
            </p>
          </div>
        </div>

        {/* User Auth Status */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 mb-4">
          <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2">
            Google Account Status
          </div>
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-emerald-500" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-900 text-emerald-300 flex items-center justify-center font-bold text-xs">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-white">{user.displayName || 'Authorized User'}</div>
                  <div className="text-[11px] text-zinc-400">{user.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="text-xs text-red-400 hover:underline font-bold"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-zinc-300">
                Connect your Google account to grant permission to sync with your spreadsheet.
              </p>
              <button
                type="button"
                onClick={onSignIn}
                className="py-2.5 px-4 bg-white hover:bg-zinc-100 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          )}
        </div>

        {/* Spreadsheet ID Configuration */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 mb-4 flex flex-col gap-2">
          <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
            Connected Spreadsheet ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tempId}
              onChange={(e) => setTempId(e.target.value)}
              className="flex-1 bg-black border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
              placeholder="Google Spreadsheet ID"
            />
            <button
              onClick={handleSaveId}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition"
            >
              {isSaved ? 'Saved ✓' : 'Save'}
            </button>
          </div>
          <div className="flex justify-between items-center text-[11px] text-zinc-400 mt-1">
            <span>Default: 196T5L2f0uyvhAMPHPCFlfps7V24ao_Uxrxg98YmW3SA</span>
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
            >
              <span>View Sheet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onSyncFromSheet}
            disabled={syncStatus.state === 'syncing' || !user}
            className={`w-full py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition shadow-lg ${
              user
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:brightness-110 text-black'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <RefreshCw
              className={`w-4 h-4 ${syncStatus.state === 'syncing' ? 'animate-spin' : ''}`}
            />
            <span>
              {syncStatus.state === 'syncing'
                ? 'Pulling data from Google Sheets…'
                : 'Pull & Sync All Data from Google Sheet'}
            </span>
          </button>

          {/* Sync Status Banner */}
          {syncStatus.message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 font-medium ${
                syncStatus.state === 'error'
                  ? 'bg-red-950/80 border border-red-800 text-red-300'
                  : 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
              }`}
            >
              {syncStatus.state === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{syncStatus.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
