import React, { useState } from 'react';
import { Item, CartItem } from '../types';
import { sound } from '../services/soundEffects';
import { CATEGORIES, CATEGORY_ICONS } from '../data/initialData';
import { PriceChooserModal } from './PriceChooserModal';
import {
  Search,
  Barcode,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ExternalLink,
  Tv,
  ArrowRight,
  Receipt,
  CheckCircle2,
  Sparkles,
  Calculator,
  User,
  MoreVertical,
  ChevronDown,
  Layers,
  Clock,
  RotateCcw,
  Check,
} from 'lucide-react';

interface Props {
  items: Item[];
  cart: CartItem[];
  lastScannedItem?: {
    barcode: string;
    name: string;
    price: number;
    qty: number;
    mode: 'unit' | 'piece';
    image?: string;
    timestamp: number;
  } | null;
  onAddToCart: (item: Item, mode: 'unit' | 'piece') => void;
  onUpdateQty: (barcode: string, mode: 'unit' | 'piece', delta: number) => void;
  onClearCart: () => void;
  onOpenCheckout: () => void;
  onOpenCustomerDisplay: () => void;
  onOpenCalculator?: () => void;
  onSelectTab?: (tab: 'pos' | 'sales' | 'inventory' | 'gcash' | 'utang') => void;
  totalSalesCount?: number;
  currentUser?: {
    id: string;
    name: string;
    role: string;
    username: string;
  } | null;
  onSwitchUser?: () => void;
  onOpenPosterModal?: () => void;
}

export const CashierPOS: React.FC<Props> = ({
  items,
  cart,
  lastScannedItem,
  onAddToCart,
  onUpdateQty,
  onClearCart,
  onOpenCheckout,
  onOpenCustomerDisplay,
  onOpenCalculator,
  onSelectTab,
  totalSalesCount = 0,
  currentUser,
  onSwitchUser,
  onOpenPosterModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedItemForChooser, setSelectedItemForChooser] = useState<Item | null>(null);

  const formatPeso = (val: number) => {
    return '₱' + (Math.round(val * 100) / 100).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Filter items by category & search query
  const filteredItems = items.filter((it) => {
    const matchesCat = selectedCategory === 'All' || it.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q || it.name.toLowerCase().includes(q) || it.barcode.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  // Handle barcode scanner Enter press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = searchQuery.trim();
      if (!q) return;

      // Exact barcode match first
      const exactBarcode = items.find((i) => i.barcode === q);
      if (exactBarcode) {
        handleItemClick(exactBarcode);
        setSearchQuery('');
        return;
      }

      // Name match
      const matching = items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));
      if (matching.length === 1) {
        handleItemClick(matching[0]);
        setSearchQuery('');
      }
    }
  };

  const handleItemClick = (item: Item) => {
    // If item has a piece price different from unit price, show chooser
    if (item.piecePrice > 0 && item.piecePrice !== item.price) {
      setSelectedItemForChooser(item);
    } else {
      sound.playScanBeep();
      onAddToCart(item, 'unit');
    }
  };

  const totalCart = cart.reduce((sum, it) => sum + it.qty * it.unitPrice, 0);
  const vatAmount = (totalCart * 0.12) / 1.12;
  const netSubtotal = totalCart - vatAmount;
  const totalItemCount = cart.reduce((acc, curr) => acc + curr.qty, 0);

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden bg-black text-white">
      {/* 1. TOP HEADER BAR (Matching the sleek POS header in sample layout) */}
      <header className="bg-zinc-950 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-md">
        {/* Brand & Search Bar */}
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="flex items-center gap-2 font-black text-lg text-white shrink-0 tracking-tight">
            <span className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white text-base shadow">
              ⭐
            </span>
            <span className="hidden sm:inline">3 Stars POS</span>
          </div>

          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-red-500" />
            <input
              type="text"
              placeholder="Search products or scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2 text-xs md:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-medium transition"
              autoFocus
            />
          </div>
        </div>

        {/* Cashier & Order Header Info */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Payment QR Standee Poster Trigger */}
          {onOpenPosterModal && (
            <button
              onClick={onOpenPosterModal}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-emerald-500 text-zinc-300 hover:text-white text-xs font-bold transition"
              title="Print QR Counter Standee Poster"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-400" />
              <span>QR Poster</span>
            </button>
          )}

          <div className="flex flex-col text-right">
            <button
              type="button"
              onClick={onSwitchUser}
              className="text-xs font-bold text-white flex items-center gap-1.5 justify-end hover:text-red-400 transition"
              title="Click to Switch Staff Account"
            >
              <span>{currentUser?.name || 'Dennis De Jesus'}</span>
              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                <User className="w-3.5 h-3.5" />
              </div>
            </button>
            <span className="text-[10px] text-zinc-400 font-mono">
              Counter 01 · {currentUser?.role || 'Staff'} (Order #T05)
            </span>
          </div>

          {/* Customer Display Button */}
          <button
            onClick={onOpenCustomerDisplay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-black hover:from-red-500 border border-red-500/50 text-white font-bold text-xs shadow transition"
            title="Open customer-facing price display"
          >
            <Tv className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Customer Screen</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE: 3 COLUMNS (Category Rail, Product Catalog Grid, and Cart Ticket) */}
      <div className="flex-1 flex overflow-hidden">
        {/* COLUMN 1: LEFT VERTICAL CATEGORY RAIL (Matching the vertical category list in image.png) */}
        <aside className="w-32 sm:w-40 md:w-44 bg-zinc-950 border-r border-zinc-800 flex flex-col shrink-0 overflow-y-auto select-none scrollbar-none">
          <div className="p-2 flex flex-col gap-1.5">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full py-3 px-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center text-center gap-1 border ${
                    isSelected
                      ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/60 font-black scale-[1.02]'
                      : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <span className="text-xl">{CATEGORY_ICONS[cat] || '📦'}</span>
                  <span className="line-clamp-2 leading-tight text-[11px]">{cat}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* COLUMN 2: CENTER PRODUCT CATALOG GRID (Exact layout and card design from image.png) */}
        <section className="flex-1 flex flex-col overflow-hidden bg-black">
          {/* Top Live Customer Purchases Price Display (Zero clicks needed) */}
          <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border-b-2 border-emerald-500 px-4 py-2.5 flex items-center justify-between gap-3 shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black border border-emerald-500/60 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <Receipt className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-black tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  Live Customer Purchases Total
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 leading-tight">
                  {formatPeso(totalCart)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {lastScannedItem && (
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Just Scanned:</div>
                  <div className="text-xs font-bold text-white truncate max-w-[150px]">
                    {lastScannedItem.name}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 font-bold">
                    {formatPeso(lastScannedItem.price)}
                  </div>
                </div>
              )}

              <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded-lg text-zinc-300">
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>

          {/* Product Cards Grid (Matching clean layout with price top-left, image center, title bottom) */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {filteredItems.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-500">
                <Barcode className="w-12 h-12 text-zinc-700 mb-2" />
                <p className="font-bold text-sm text-zinc-300">No items in this category</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Try another category or clear search filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredItems.map((it) => {
                  const isOutOfStock = it.stock !== null && it.stock <= 0;
                  const isLowStock = it.stock !== null && it.stock <= it.reorder && it.stock > 0;
                  const hasPiecePrice = it.piecePrice > 0 && it.piecePrice !== it.price;

                  return (
                    <div
                      key={it.barcode}
                      onClick={() => !isOutOfStock && handleItemClick(it)}
                      className={`group relative bg-white text-zinc-900 rounded-2xl p-3 flex flex-col justify-between transition-all duration-150 select-none shadow hover:shadow-xl ${
                        isOutOfStock
                          ? 'opacity-40 cursor-not-allowed bg-zinc-200'
                          : 'cursor-pointer hover:scale-[1.02] border-2 border-transparent hover:border-emerald-500'
                      }`}
                    >
                      {/* Top Row: Price on Top-Left in Bold Red (Exact match to sample image!) */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm sm:text-base font-black font-mono text-red-600 tracking-tight">
                          {formatPeso(it.price)}
                        </span>

                        {/* Stock or piece badge on top right */}
                        {isOutOfStock ? (
                          <span className="bg-red-100 text-red-700 text-[10px] font-black px-1.5 py-0.5 rounded">
                            OUT
                          </span>
                        ) : isLowStock ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {it.stock} left
                          </span>
                        ) : hasPiecePrice ? (
                          <span className="bg-red-50 text-red-600 border border-red-200 text-[9px] font-bold px-1.5 py-0.5 rounded">
                            {formatPeso(it.piecePrice)}/pc
                          </span>
                        ) : null}
                      </div>

                      {/* Center: Image or Category Icon */}
                      <div className="w-full h-24 sm:h-28 flex items-center justify-center my-1 overflow-hidden">
                        {it.image ? (
                          <img
                            src={it.image}
                            alt={it.name}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-200"
                          />
                        ) : (
                          <span className="text-4xl sm:text-5xl filter drop-shadow">
                            {CATEGORY_ICONS[it.category] || '📦'}
                          </span>
                        )}
                      </div>

                      {/* Bottom: Item Name (Centered, just like sample image) */}
                      <div className="text-center mt-2 pt-1 border-t border-zinc-100">
                        <h4 className="text-xs font-bold text-zinc-900 line-clamp-2 leading-tight group-hover:text-red-600 transition">
                          {it.name}
                        </h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* COLUMN 3: RIGHT ORDER / CART LIST (Exact layout from image.png) */}
        <aside className="w-80 sm:w-96 md:w-[380px] bg-zinc-950 border-l border-zinc-800 flex flex-col shrink-0 overflow-hidden shadow-2xl">
          {/* Cart Header (Matching 'Standard v' in image.png) */}
          <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-xs font-black tracking-wide text-white uppercase flex items-center gap-1">
                <span>Standard Order</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono bg-emerald-950 border border-emerald-700/60 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                {totalItemCount} pcs
              </span>
              {cart.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition"
                  title="Clear Cart"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Cart Items List (Formatted with row styling like image.png) */}
          <div className="flex-1 overflow-y-auto p-2 divide-y divide-zinc-900 font-sans">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <ShoppingBag className="w-10 h-10 text-zinc-800 mb-2" />
                <p className="text-sm font-bold text-zinc-400">Cart is empty</p>
                <p className="text-xs text-zinc-600 mt-1 max-w-xs">
                  Tap any product on the left or scan barcode to add to this order.
                </p>
              </div>
            ) : (
              cart.map((c) => {
                const lineTotal = c.qty * c.unitPrice;
                // Highlight the newly added / last scanned item (Matching the highlighted row in image.png!)
                const isHighlighted = lastScannedItem?.barcode === c.barcode;

                return (
                  <div
                    key={c.barcode + c.mode}
                    className={`p-2.5 rounded-xl transition ${
                      isHighlighted
                        ? 'bg-red-600 text-white shadow-md'
                        : 'hover:bg-zinc-900/60 text-zinc-100'
                    }`}
                  >
                    {/* Line 1: Item Name on Left, Line Total on Right */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-xs leading-snug line-clamp-2">
                        {c.name}
                        {c.mode === 'piece' && (
                          <span
                            className={`ml-1 text-[10px] font-bold px-1 rounded ${
                              isHighlighted ? 'bg-black/30 text-white' : 'text-red-400 bg-red-950'
                            }`}
                          >
                            Piece
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-sm font-black font-mono shrink-0 ${
                          isHighlighted ? 'text-white' : 'text-emerald-400'
                        }`}
                      >
                        {formatPeso(lineTotal)}
                      </div>
                    </div>

                    {/* Line 2: Qty / Rate / Controls */}
                    <div
                      className={`flex items-center justify-between mt-1 text-[11px] font-mono ${
                        isHighlighted ? 'text-red-100' : 'text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>
                          {c.qty} Nos @ {formatPeso(c.unitPrice)}
                        </span>
                        <span className="text-[10px] opacity-75">· VAT 12%</span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 shrink-0 bg-black/40 rounded-lg p-0.5 border border-black/20">
                        <button
                          onClick={() => onUpdateQty(c.barcode, c.mode, -1)}
                          className="w-5 h-5 rounded bg-black/30 hover:bg-black/60 flex items-center justify-center transition text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-bold text-xs text-white">
                          {c.qty}
                        </span>
                        <button
                          onClick={() => onUpdateQty(c.barcode, c.mode, 1)}
                          className="w-5 h-5 rounded bg-black/30 hover:bg-black/60 flex items-center justify-center transition text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* CHECKOUT BUTTON DIRECTLY IN THE AREA BELOW ITEMS (Per User Request & image.png) */}
            {cart.length > 0 && (
              <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.15)] flex flex-col gap-2.5 shrink-0">
                {/* Total and Items Count */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      Total Due
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono font-bold">
                      {totalItemCount} {totalItemCount === 1 ? 'pc' : 'pcs'}
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight">
                    {formatPeso(totalCart)}
                  </div>
                </div>

                {/* Subtotal & VAT Breakdown */}
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>Net: {formatPeso(netSubtotal)}</span>
                  <span>12% VAT: {formatPeso(vatAmount)}</span>
                </div>

                {/* Main Checkout Button right below items */}
                <button
                  type="button"
                  onClick={onOpenCheckout}
                  className="w-full py-3 px-3 bg-gradient-to-r from-red-600 via-emerald-600 to-emerald-700 hover:brightness-110 active:scale-[0.98] text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-950/40 flex items-center justify-between gap-1 cursor-pointer transition"
                  title="Proceed to checkout and tender payment"
                >
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4" />
                    <span>CHECKOUT ORDER</span>
                  </span>
                  <span className="font-mono text-sm font-black flex items-center gap-1">
                    <span>{formatPeso(totalCart)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </button>

                {/* Next Customer / Reset Order Action */}
                <div className="flex items-center justify-between pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Clear current order and proceed to next customer?')) {
                        onClearCart();
                      }
                    }}
                    className="text-[10px] text-zinc-400 hover:text-red-400 font-bold flex items-center gap-1 transition"
                    title="Clear cart for next customer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Next Customer</span>
                  </button>

                  <span className="text-[10px] text-zinc-500 font-mono">
                    Ready for payment
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Cart Breakdown Summary Strip (Matching lower strip in image.png) */}
          <div className="bg-zinc-900 border-t border-zinc-800 p-3 flex flex-col gap-1 text-xs font-mono text-zinc-400 shrink-0">
            <div className="flex justify-between">
              <span>Subtotal (Net Sales):</span>
              <span className="text-zinc-200">{formatPeso(netSubtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>12% VAT Included:</span>
              <span className="text-zinc-200">{formatPeso(vatAmount)}</span>
            </div>
          </div>

          {/* GIANT BOTTOM ACTION BUTTON (Matching the big orange PAY bar in image.png!) */}
          <div className="p-3 bg-zinc-950 border-t border-zinc-800 shrink-0">
            <button
              onClick={onOpenCheckout}
              disabled={cart.length === 0}
              className={`w-full py-3.5 px-4 rounded-2xl flex items-center justify-between font-black transition shadow-lg ${
                cart.length > 0
                  ? 'bg-gradient-to-r from-red-600 via-emerald-600 to-emerald-700 hover:brightness-110 active:scale-98 text-white shadow-emerald-950/40 cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg uppercase tracking-wider">PAY</span>
                <span className="text-xs font-normal opacity-85">
                  ({totalItemCount} Items)
                </span>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black font-mono tracking-tight">
                  {formatPeso(totalCart)}
                </span>
              </div>
            </button>
          </div>
        </aside>
      </div>

      {/* 3. BOTTOM QUICK ACTION BAR (Matching bottom action bar in image.png) */}
      <footer className="bg-zinc-950 border-t border-zinc-800 px-4 py-2 flex items-center justify-between text-xs text-zinc-400 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedCategory('All')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold transition"
          >
            <Layers className="w-3.5 h-3.5 text-red-500" />
            <span>All Categories</span>
          </button>

          {onSelectTab && (
            <button
              onClick={() => onSelectTab('sales')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold transition"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-400" />
              <span>Orders History</span>
              {totalSalesCount > 0 && (
                <span className="bg-emerald-600 text-black text-[10px] font-black px-1.5 rounded-full">
                  {totalSalesCount}
                </span>
              )}
            </button>
          )}

          {onOpenCalculator && (
            <button
              onClick={onOpenCalculator}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold transition"
            >
              <Calculator className="w-3.5 h-3.5 text-blue-400" />
              <span>Calculator</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-mono text-zinc-400">
            System Online · 3 Stars Mini Mart POS
          </span>
        </div>
      </footer>

      {/* Price Chooser Modal if item selected */}
      {selectedItemForChooser && (
        <PriceChooserModal
          item={selectedItemForChooser}
          onChoose={(mode) => {
            sound.playScanBeep();
            onAddToCart(selectedItemForChooser, mode);
            setSelectedItemForChooser(null);
          }}
          onClose={() => setSelectedItemForChooser(null)}
        />
      )}
    </div>
  );
};
