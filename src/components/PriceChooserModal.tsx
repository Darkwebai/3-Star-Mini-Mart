import React from 'react';
import { Item } from '../types';
import { Package, Tag, X } from 'lucide-react';

interface Props {
  item: Item;
  onChoose: (mode: 'unit' | 'piece') => void;
  onClose: () => void;
}

export const PriceChooserModal: React.FC<Props> = ({ item, onChoose, onClose }) => {
  const formatPeso = (n: number) => {
    return '₱' + (Math.round(n * 100) / 100).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-2xl">
            🏷️
          </div>
          <div>
            <h3 className="text-lg font-black text-white line-clamp-1">{item.name}</h3>
            <p className="text-xs text-zinc-400">Choose pricing option to sell</p>
          </div>
        </div>

        {item.stock !== null && item.stock <= 3 && (
          <div className="bg-amber-950/60 border border-amber-800/80 rounded-xl p-3 mb-4 text-xs text-amber-300 font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>Only {item.stock} left in stock.</span>
          </div>
        )}

        <div className="flex flex-col gap-3 my-2">
          {/* Option 1: Whole Unit */}
          <button
            type="button"
            onClick={() => onChoose('unit')}
            className="p-4 rounded-2xl bg-zinc-900 border-2 border-zinc-700 hover:border-emerald-500 hover:bg-zinc-800/80 text-left transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 group-hover:text-emerald-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black text-white group-hover:text-emerald-300">
                  Selling Price per Unit
                </div>
                <div className="text-xs text-zinc-400">Whole {item.unit || 'pack'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-mono font-black text-emerald-400">
                {formatPeso(item.price)}
              </div>
            </div>
          </button>

          {/* Option 2: Individual Piece */}
          <button
            type="button"
            onClick={() => onChoose('piece')}
            className="p-4 rounded-2xl bg-zinc-900 border-2 border-zinc-700 hover:border-red-500 hover:bg-zinc-800/80 text-left transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 group-hover:text-red-400">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black text-white group-hover:text-red-300">
                  Price per Piece / Tingi
                </div>
                <div className="text-xs text-zinc-400">1 single piece</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-mono font-black text-red-400">
                {formatPeso(item.piecePrice)}
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-bold rounded-xl text-xs transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
