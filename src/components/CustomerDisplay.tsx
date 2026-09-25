import React, { useEffect, useState } from 'react';
import { CustomerDisplayState } from '../types';
import { displaySync } from '../services/broadcastChannel';
import { QRCodeSVG } from 'qrcode.react';
import {
  Sparkles,
  ShoppingBag,
  QrCode,
  ArrowLeft,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Receipt,
  Check,
  Building2,
  Smartphone,
} from 'lucide-react';

interface Props {
  onBackToCashier?: () => void;
  isStandalone?: boolean;
}

export const CustomerDisplay: React.FC<Props> = ({ onBackToCashier, isStandalone = false }) => {
  const [displayState, setDisplayState] = useState<CustomerDisplayState>({
    items: [],
    total: 0,
    tendered: 0,
    change: 0,
    paymentMethod: 'Cash',
    status: 'idle',
    updatedAt: Date.now(),
  });

  const [activeQRTab, setActiveQRTab] = useState<'gcash' | 'gotyme'>('gcash');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Subscribe to live broadcast changes from Cashier POS
    const unsubscribe = displaySync.subscribe((state) => {
      setDisplayState(state);
    });

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatPeso = (amount: number) => {
    return '₱' + (Math.round(amount * 100) / 100).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const vat = (displayState.total * 0.12) / 1.12;
  const subtotalNet = displayState.total - vat;
  const totalItemCount = displayState.items.reduce((acc, curr) => acc + curr.qty, 0);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col select-none font-sans overflow-x-hidden">
      {/* Top Banner: Deep Black & Bold Red & Green Theme */}
      <header className="bg-gradient-to-r from-red-800 via-red-700 to-zinc-950 border-b-2 border-red-600 px-6 py-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-black border-2 border-red-500 shadow-md flex items-center justify-center text-3xl shadow-red-500/20">
            ⭐
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase drop-shadow">
                3 Stars Mini Mart
              </span>
              <span className="bg-emerald-600 text-black text-xs font-black px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                Customer Price Display
              </span>
            </div>
            <p className="text-red-200 text-xs md:text-sm font-medium">
              Everyday needs, closer to you · Barangay 171, Caloocan City
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-black/60 border border-red-500/40 px-4 py-2 rounded-xl text-emerald-400 font-mono text-sm">
            <Clock className="w-4 h-4 text-red-400" />
            <span>{currentTime || '00:00:00'}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-emerald-500 text-zinc-300 hover:text-white transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {!isStandalone && onBackToCashier && (
            <button
              onClick={onBackToCashier}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Cashier POS</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Display Grid */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Side: Live Scanned Item Alert & Authentic Customer Receipt (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          {/* Real-time Scanned Item Notification */}
          {displayState.lastScanned ? (
            <div className="bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-black border-2 border-emerald-500 rounded-2xl p-4 shadow-[0_0_30px_rgba(16,185,129,0.25)] flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-xl bg-black border border-emerald-500/40 flex items-center justify-center text-2xl shrink-0">
                  {displayState.lastScanned.image ? (
                    <img
                      src={displayState.lastScanned.image}
                      alt=""
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    '🛍️'
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 text-[11px] font-black uppercase tracking-wider bg-emerald-950 border border-emerald-600 px-2 py-0.5 rounded flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                      Just Scanned & Verified Correct
                    </span>
                    <span className="text-zinc-400 text-xs font-mono">
                      Qty: {displayState.lastScanned.qty}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-white line-clamp-1 mt-1">
                    {displayState.lastScanned.name}
                  </h3>
                </div>
              </div>
              <div className="text-right shrink-0 pl-3">
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">Unit Price</div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  {formatPeso(displayState.lastScanned.price)}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between text-zinc-400">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-red-500 animate-pulse" />
                <span className="text-xs md:text-sm font-medium">
                  Welcome to 3 Stars Mini Mart! Please check your items and total on this receipt.
                </span>
              </div>
              <span className="text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-emerald-400 font-bold shrink-0">
                Ready to Scan
              </span>
            </div>
          )}

          {/* OFFICIAL THERMAL CUSTOMER RECEIPT */}
          <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl flex-1 flex flex-col overflow-hidden shadow-2xl relative font-mono">
            {/* Receipt Paper Header */}
            <div className="bg-zinc-900/90 border-b border-dashed border-zinc-700 px-6 py-4 text-center">
              <div className="text-base font-black tracking-widest text-white uppercase flex items-center justify-center gap-2">
                <Receipt className="w-4 h-4 text-red-500" />
                <span>★ 3 STARS MINI MART OFFICIAL RECEIPT ★</span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Barangay 171, Caloocan City · Tel: (02) 8921-4321
              </p>
              <div className="text-[11px] text-zinc-500 mt-2 flex justify-between px-2 border-t border-zinc-800/80 pt-1.5">
                <span>DATE: {currentDate || 'Today'}</span>
                <span>TIME: {currentTime || 'Live'}</span>
                <span>POS: #01</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase mt-1">
                • VERIFIED CUSTOMER PURCHASES •
              </div>
            </div>

            {/* Receipt Table Columns */}
            <div className="bg-zinc-900/50 px-5 py-2 border-b border-zinc-800 text-xs font-bold text-zinc-400 flex items-center justify-between uppercase">
              <span className="w-12">CHECK</span>
              <span className="flex-1 text-left px-2">ITEM DESCRIPTION</span>
              <span className="w-16 text-center">QTY</span>
              <span className="w-20 text-right">PRICE</span>
              <span className="w-24 text-right">TOTAL</span>
            </div>

            {/* Receipt Items Body */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-zinc-900 min-h-[260px] max-h-[420px] text-xs">
              {displayState.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl mb-3 text-red-500">
                    🛒
                  </div>
                  <h4 className="text-lg font-bold text-zinc-300 font-sans">Ready for Next Customer</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mt-1 font-sans">
                    Please place your goods on the counter. The cashier will scan your groceries
                    momentarily and they will appear right here on your receipt.
                  </p>
                </div>
              ) : (
                displayState.items.map((item, idx) => {
                  const lineTotal = item.qty * item.unitPrice;
                  const isJustScanned = displayState.lastScanned?.barcode === item.barcode;

                  return (
                    <div
                      key={item.barcode + idx}
                      className={`py-2.5 px-3 flex items-center justify-between rounded-xl transition ${
                        isJustScanned
                          ? 'bg-emerald-950/50 border border-emerald-500/70 text-white shadow-sm'
                          : 'hover:bg-zinc-900/50'
                      }`}
                    >
                      {/* Checkmark verification badge */}
                      <div className="w-12 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-[10px] text-zinc-500">#{idx + 1}</span>
                      </div>

                      {/* Description */}
                      <div className="flex-1 min-w-0 px-2">
                        <div className="font-bold text-sm text-zinc-100 truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 flex items-center gap-2">
                          {item.mode === 'piece' && (
                            <span className="text-red-400 font-bold bg-red-950/80 px-1 rounded">
                              Piece
                            </span>
                          )}
                          <span className="text-zinc-600 truncate">{item.barcode}</span>
                        </div>
                      </div>

                      {/* Qty */}
                      <div className="w-16 text-center font-bold text-white text-sm">
                        {item.qty}
                      </div>

                      {/* Unit Price */}
                      <div className="w-20 text-right text-zinc-300 font-medium">
                        {formatPeso(item.unitPrice)}
                      </div>

                      {/* Line Total */}
                      <div className="w-24 text-right font-black text-emerald-400 text-sm">
                        {formatPeso(lineTotal)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Receipt Summary Breakdown */}
            <div className="bg-zinc-900/90 border-t border-dashed border-zinc-700/90 p-5 flex flex-col gap-2">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>TOTAL ITEMS PURCHASED:</span>
                <span className="text-zinc-200 font-bold">{totalItemCount} pcs</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>SUBTOTAL (VAT Exclusive Net):</span>
                <span className="text-zinc-200">{formatPeso(subtotalNet)}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>12% VAT INCLUDED:</span>
                <span className="text-zinc-200">{formatPeso(vat)}</span>
              </div>

              {/* Bold Total on Receipt */}
              <div className="border-t-2 border-zinc-700 pt-2.5 mt-1 flex justify-between items-baseline">
                <span className="text-sm font-black uppercase text-zinc-300">
                  TOTAL AMOUNT PAYABLE:
                </span>
                <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                  {formatPeso(displayState.total)}
                </span>
              </div>

              <div className="text-center text-[10px] text-zinc-500 pt-2 border-t border-zinc-800">
                PLEASE VERIFY ALL PURCHASED ITEMS AND COUNT YOUR CHANGE BEFORE LEAVING THE COUNTER.
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Massive Customer Price Total Box & Payment Methods (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          {/* Hero Customer Price Display Box */}
          <div className="bg-gradient-to-b from-zinc-900 to-black border-2 border-emerald-500 rounded-3xl p-6 shadow-[0_0_50px_rgba(16,185,129,0.2)] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  Amount to Pay
                </span>
                <span className="text-xs font-bold text-zinc-400 bg-black/60 px-3 py-1 rounded-full border border-zinc-800">
                  PHP (Philippine Peso)
                </span>
              </div>

              {/* Massive Total Display */}
              <div className="py-6 my-2 text-center bg-black/90 border-2 border-emerald-500/40 rounded-2xl shadow-inner">
                <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Grand Total
                </div>
                <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-emerald-400 drop-shadow-[0_2px_20px_rgba(16,185,129,0.4)]">
                  {formatPeso(displayState.total)}
                </div>
                <div className="text-xs text-zinc-500 mt-2 font-mono">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in receipt
                </div>
              </div>
            </div>

            {/* Payment & Change Block */}
            {displayState.tendered > 0 ? (
              <div className="mt-4 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400 font-medium">Cash Tendered:</span>
                  <span className="font-mono font-bold text-zinc-100 text-lg">
                    {formatPeso(displayState.tendered)}
                  </span>
                </div>
                <div className="border-t border-zinc-800 pt-2 flex items-center justify-between">
                  <span className="text-emerald-400 font-black tracking-wider text-sm">
                    CHANGE DUE:
                  </span>
                  <span className="font-mono font-black text-2xl md:text-3xl text-emerald-400">
                    {formatPeso(displayState.change)}
                  </span>
                </div>
                {displayState.change > 0 && (
                  <div className="text-center text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 py-1.5 rounded-lg font-bold">
                    💵 Please collect your change of {formatPeso(displayState.change)}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 bg-zinc-950/90 border border-zinc-800 rounded-2xl p-3.5 text-center">
                <div className="text-xs text-zinc-400">Accepted Payment Methods</div>
                <div className="flex items-center justify-center gap-2 mt-2 font-bold text-xs flex-wrap">
                  <span className="bg-emerald-950 border border-emerald-700/60 text-emerald-300 px-3 py-1 rounded-lg">
                    💵 Cash
                  </span>
                  <span className="bg-blue-950 border border-blue-700/60 text-blue-300 px-3 py-1 rounded-lg">
                    📲 GCash
                  </span>
                  <span className="bg-red-950 border border-red-700/60 text-red-300 px-3 py-1 rounded-lg">
                    💳 Card
                  </span>
                  <span className="bg-amber-950 border border-amber-700/60 text-amber-300 px-3 py-1 rounded-lg">
                    📝 Utang
                  </span>
                </div>
              </div>
            )}

            {/* QR Payment Cards with GCash and GoTyme Bank */}
            <div className="mt-4 bg-zinc-950 border-2 border-zinc-800 rounded-2xl p-4">
              {/* Tab Selector between GCash & GoTyme Bank */}
              <div className="flex items-center justify-between gap-2 mb-3 border-b border-zinc-800 pb-2.5">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Scan to Pay (instaPay)</span>
                </span>
                <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setActiveQRTab('gcash')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      activeQRTab === 'gcash'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>GCash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveQRTab('gotyme')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      activeQRTab === 'gotyme'
                        ? 'bg-cyan-400 text-black shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-3 h-3" />
                    <span>GoTyme</span>
                  </button>
                </div>
              </div>

              {/* GCash QR Card */}
              {activeQRTab === 'gcash' && (
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-blue-950/40 via-zinc-900 to-black border border-blue-600/60 rounded-xl p-3.5">
                  <div className="bg-white p-2 rounded-xl shrink-0 flex flex-col items-center shadow-lg border-2 border-blue-400">
                    <QRCodeSVG
                      value="00020101021226620014ph.com.gcash0111099418732165204000053036085802PH5908DE***S D6008Caloocan6304"
                      size={115}
                      level="M"
                    />
                    <div className="mt-1 text-[8.5px] font-black text-blue-700 tracking-wider flex items-center gap-0.5">
                      <span>insta</span><span className="text-red-600">Pay</span>
                    </div>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs uppercase tracking-wide">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Official GCash QR</span>
                    </div>
                    <div className="text-sm font-black text-white mt-0.5">DE***S D.</div>
                    <div className="text-xs text-zinc-400 font-mono mt-0.5">
                      Mobile: <strong className="text-blue-400 font-bold">0994 187 3216</strong>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      User ID: ••••••••••••REB36W
                    </div>
                  </div>
                </div>
              )}

              {/* GoTyme Bank QR Card */}
              {activeQRTab === 'gotyme' && (
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-black border border-cyan-400/60 rounded-xl p-3.5">
                  <div className="bg-white p-2 rounded-xl shrink-0 flex flex-col items-center shadow-lg border-2 border-cyan-400">
                    <QRCodeSVG
                      value="00020101021226600018ph.com.gotyme.bank01120000000066895204000053036085802PH5915DENNIS DE JESUS6008Caloocan6304"
                      size={115}
                      level="M"
                    />
                    <div className="mt-1 text-[8.5px] font-black text-cyan-800 tracking-wider flex items-center gap-0.5">
                      <span>insta</span><span className="text-red-600">Pay</span>
                    </div>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs uppercase tracking-wide">
                      <ShieldCheck className="w-4 h-4" />
                      <span>GoTyme Bank QR</span>
                    </div>
                    <div className="text-sm font-black text-white mt-0.5">DENNIS DE JESUS</div>
                    <div className="text-xs text-zinc-400 font-mono mt-0.5">
                      Account: <strong className="text-cyan-300 font-bold">•••••••• 6689</strong>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      GoTyme Bank Inc. (instaPay)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer Service Notice */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-400 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              Verified digital receipt ticket. Please inspect all items and prices before payment.
              Maraming salamat po!
            </span>
          </div>
        </section>
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-zinc-900 bg-black px-6 py-3 text-center text-xs text-zinc-600 font-mono">
        3 Stars Mini Mart Customer Display & POS Receipt System · Powered by Google Sheets Engine
      </footer>
    </div>
  );
};
