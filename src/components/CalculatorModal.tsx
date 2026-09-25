import React, { useState } from 'react';
import { X, Delete } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const CalculatorModal: React.FC<Props> = ({ onClose }) => {
  const [expr, setExpr] = useState('');
  const [justEvaluated, setJustEvaluated] = useState(false);

  const handleKey = (k: string) => {
    if (k === 'C') {
      setExpr('');
      setJustEvaluated(false);
    } else if (k === 'back') {
      setExpr((prev) => prev.slice(0, -1));
    } else if (k === '=') {
      try {
        if (!/^[0-9+\-*/.%\s]+$/.test(expr)) throw new Error('Invalid');
        const safe = expr.replace(/%/g, '/100');
        // evaluate safely
        const res = Function('"use strict"; return (' + safe + ')')();
        if (!isFinite(res)) throw new Error('Infinite');
        const rounded = Math.round((res + Number.EPSILON) * 10000) / 10000;
        setExpr(String(rounded));
        setJustEvaluated(true);
      } catch {
        setExpr('Error');
        setJustEvaluated(true);
      }
    } else {
      if (justEvaluated && !'+-*/'.includes(k)) {
        setExpr(k);
      } else {
        if (expr === 'Error') setExpr(k);
        else setExpr((prev) => prev + k);
      }
      setJustEvaluated(false);
    }
  };

  const keys = [
    { label: 'C', act: 'C', cls: 'bg-red-950 text-red-400 border-red-800' },
    { label: '⌫', act: 'back', cls: 'bg-zinc-900 text-zinc-300' },
    { label: '%', act: '%', cls: 'bg-zinc-900 text-zinc-300' },
    { label: '÷', act: '/', cls: 'bg-red-600/30 text-red-300 border-red-500/40' },

    { label: '7', act: '7', cls: 'bg-zinc-950 text-white' },
    { label: '8', act: '8', cls: 'bg-zinc-950 text-white' },
    { label: '9', act: '9', cls: 'bg-zinc-950 text-white' },
    { label: '×', act: '*', cls: 'bg-red-600/30 text-red-300 border-red-500/40' },

    { label: '4', act: '4', cls: 'bg-zinc-950 text-white' },
    { label: '5', act: '5', cls: 'bg-zinc-950 text-white' },
    { label: '6', act: '6', cls: 'bg-zinc-950 text-white' },
    { label: '−', act: '-', cls: 'bg-red-600/30 text-red-300 border-red-500/40' },

    { label: '1', act: '1', cls: 'bg-zinc-950 text-white' },
    { label: '2', act: '2', cls: 'bg-zinc-950 text-white' },
    { label: '3', act: '3', cls: 'bg-zinc-950 text-white' },
    { label: '+', act: '+', cls: 'bg-red-600/30 text-red-300 border-red-500/40' },

    { label: '0', act: '0', cls: 'bg-zinc-950 text-white col-span-2' },
    { label: '.', act: '.', cls: 'bg-zinc-950 text-white' },
    { label: '=', act: '=', cls: 'bg-emerald-600 text-black font-black' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl max-w-xs w-full p-5 text-white shadow-2xl relative animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-red-500 font-bold">🧮</span>
          <h3 className="text-sm font-bold text-white">Till Calculator</h3>
        </div>

        {/* Display */}
        <div className="bg-black border border-emerald-500/50 rounded-2xl p-4 text-right font-mono font-black text-2xl text-emerald-400 mb-4 min-h-[64px] flex items-center justify-end break-all">
          {expr || '0'}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-2">
          {keys.map((k, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleKey(k.act)}
              className={`p-3.5 rounded-xl border border-zinc-800 hover:brightness-125 active:scale-95 text-base font-bold transition flex items-center justify-center ${
                k.cls
              } ${k.label === '0' ? 'col-span-2' : ''}`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
