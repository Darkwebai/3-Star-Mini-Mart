import React, { useState } from 'react';
import { Item } from '../types';
import { CATEGORIES, CATEGORY_ICONS } from '../data/initialData';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Calendar,
  X,
  CheckCircle,
} from 'lucide-react';

interface Props {
  items: Item[];
  onSaveItem: (item: Item) => void;
  onDeleteItem: (barcode: string) => void;
}

export const InventoryView: React.FC<Props> = ({ items, onSaveItem, onDeleteItem }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Item>>({});

  const formatPeso = (n: number) => {
    return '₱' + (Math.round(n * 100) / 100).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const filteredItems = items.filter((it) => {
    const matchCat = category === 'All' || it.category === category;
    const q = search.toLowerCase();
    const matchSearch =
      !q || it.name.toLowerCase().includes(q) || it.barcode.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const handleOpenEdit = (it: Item) => {
    setEditingItem(it);
    setFormData({ ...it });
    setIsAddingNew(false);
  };

  const handleOpenAdd = () => {
    const newBarcode = 'SKU-' + Math.floor(100000 + Math.random() * 900000);
    setFormData({
      barcode: newBarcode,
      name: '',
      category: 'Others',
      unit: 'pc',
      cost: 0,
      totalCost: 0,
      price: 0,
      piecePrice: 0,
      stock: 10,
      reorder: 5,
      expiry: '',
    });
    setEditingItem(null);
    setIsAddingNew(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.barcode) return;

    const fullItem: Item = {
      barcode: formData.barcode,
      name: formData.name,
      category: formData.category || 'Others',
      unit: formData.unit || 'pc',
      cost: Number(formData.cost) || 0,
      totalCost: (Number(formData.cost) || 0) * (Number(formData.stock) || 0),
      price: Number(formData.price) || 0,
      piecePrice: Number(formData.piecePrice) || 0,
      stock: formData.stock !== undefined ? Number(formData.stock) : null,
      reorder: Number(formData.reorder) || 5,
      expiry: formData.expiry || '',
      image: formData.image || '',
    };

    onSaveItem(fullItem);
    setIsAddingNew(false);
    setEditingItem(null);
  };

  const lowStockCount = items.filter((i) => i.stock !== null && i.stock <= i.reorder).length;
  const outOfStockCount = items.filter((i) => i.stock !== null && i.stock <= 0).length;

  return (
    <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="text-red-500">📦</span> Store Inventory & Prices
          </h2>
          <p className="text-xs text-zinc-400">
            Catalog, barcodes, wholesale costs, retail prices & stock monitoring
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-emerald-600 hover:brightness-110 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950/40 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Item</span>
        </button>
      </div>

      {/* Stock Health Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-medium">Total Products</span>
          <span className="font-mono font-black text-white text-base">{items.length}</span>
        </div>
        <div className="bg-zinc-950 border border-amber-900/60 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs text-amber-400 font-medium">Low Stock Watch</span>
          <span className="font-mono font-black text-amber-400 text-base">{lowStockCount}</span>
        </div>
        <div className="bg-zinc-950 border border-red-900/60 rounded-xl p-3 flex items-center justify-between col-span-2 sm:col-span-1">
          <span className="text-xs text-red-400 font-medium">Out of Stock</span>
          <span className="font-mono font-black text-red-500 text-base">{outOfStockCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 mb-5 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-red-500" />
          <input
            type="text"
            placeholder="Search items or barcode…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black border border-zinc-800 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-red-500"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full sm:w-auto bg-black border border-zinc-800 text-zinc-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 font-medium"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Items Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/60 text-zinc-400 uppercase border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Barcode</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Piece Price</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500">
                    No items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((it) => {
                  const isLow = it.stock !== null && it.stock <= it.reorder && it.stock > 0;
                  const isZero = it.stock !== null && it.stock <= 0;

                  return (
                    <tr key={it.barcode} className="hover:bg-zinc-900/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{CATEGORY_ICONS[it.category] || '📦'}</span>
                          <span>{it.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-400">{it.barcode}</td>
                      <td className="py-3 px-4">
                        <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px] text-zinc-300">
                          {it.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-400">
                        {formatPeso(it.cost)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatPeso(it.price)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-300">
                        {it.piecePrice > 0 ? (
                          formatPeso(it.piecePrice)
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {it.stock === null ? (
                          <span className="text-zinc-500">Unlimited</span>
                        ) : (
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded-full text-[10px] ${
                              isZero
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : isLow
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-400'
                            }`}
                          >
                            {it.stock} {it.unit}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(it)}
                          className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500 text-zinc-300 hover:text-white transition"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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

      {/* Edit or Add Item Modal */}
      {(isAddingNew || editingItem) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl relative">
            <button
              onClick={() => {
                setIsAddingNew(false);
                setEditingItem(null);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-4">
              {isAddingNew ? 'Add New Product' : `Edit ${editingItem?.name}`}
            </h3>

            <form onSubmit={handleSave} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1 font-bold">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  placeholder="e.g. Ariel Powder 60g"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1 font-bold">Barcode (SKU)</label>
                  <input
                    type="text"
                    required
                    value={formData.barcode || ''}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-bold">Category</label>
                  <select
                    value={formData.category || 'Others'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1 font-bold">Cost Price (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost ?? ''}
                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-bold">Selling Price (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price ?? ''}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1 font-bold">Piece / Tingi Price (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.piecePrice ?? ''}
                    onChange={(e) =>
                      setFormData({ ...formData, piecePrice: Number(e.target.value) })
                    }
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono"
                    placeholder="0 if not sold per piece"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-bold">Current Stock Qty</label>
                  <input
                    type="number"
                    value={formData.stock ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono"
                    placeholder="Blank = unlimited"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-4">
                {editingItem && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete ${editingItem.name}?`)) {
                        onDeleteItem(editingItem.barcode);
                        setEditingItem(null);
                      }
                    }}
                    className="px-3 py-2 bg-red-950 border border-red-800 text-red-400 rounded-xl font-bold hover:bg-red-900 transition mr-auto"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-black rounded-xl"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
