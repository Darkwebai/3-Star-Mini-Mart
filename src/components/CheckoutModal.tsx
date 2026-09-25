import React, { useState, useEffect } from 'react';
import { CartItem, Sale } from '../types';
import { sound } from '../services/soundEffects';
import confetti from 'canvas-confetti';
import { displaySync } from '../services/broadcastChannel';
import { QRCodeSVG } from 'qrcode.react';
import {
  Banknote,
  Smartphone,
  CreditCard,
  BookOpen,
  Printer,
  X,
  CheckCircle,
  AlertCircle,
  Receipt,
  UserCheck,
  Building2,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface Props {
  items: CartItem[];
  subtotal: number;
  onClose: () => void;
  onConfirmSale: (sale: Sale) => Promise<void>;
  cashierName: string;
}

const UTANG_SURCHARGE_RATE = 0.14; // 14% Utang credit surcharge

export const CheckoutModal: React.FC<Props> = ({
  items,
  subtotal: baseSubtotal,
  onClose,
  onConfirmSale,
  cashierName,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<
    'Cash' | 'GCash' | 'Bank' | 'Card' | 'Utang'
  >('Cash');
  const [tenderedStr, setTenderedStr] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [referenceCode, setReferenceCode] = useState<string>('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const isUtang = paymentMethod === 'Utang';
  const isOnlinePayment = paymentMethod === 'GCash' || paymentMethod === 'Bank';

  // Calculate final total based on method (Utang adds 14% per item rounded)
  const calculateLineTotal = (item: CartItem) => {
    if (isUtang) {
      return item.qty * Math.round(item.unitPrice * (1 + UTANG_SURCHARGE_RATE));
    }
    return item.qty * item.unitPrice;
  };

  const finalTotal = items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  const vat = (finalTotal * 0.12) / 1.12;

  const tenderedNum = paymentMethod === 'Cash' ? Number(tenderedStr) || 0 : finalTotal;
  const changeDue = paymentMethod === 'Cash' ? Math.max(0, tenderedNum - finalTotal) : 0;
  const isCashSufficient = paymentMethod !== 'Cash' || tenderedNum >= finalTotal;

  // For GCash and Bank, allow proceeding if reference code is typed in the box
  const hasValidRefCode = !isOnlinePayment || referenceCode.trim().length > 0;
  const canConfirm =
    isCashSufficient &&
    hasValidRefCode &&
    (!isUtang || customerName.trim().length > 0);

  // Sync to customer display live during checkout
  useEffect(() => {
    displaySync.publish({
      items,
      total: finalTotal,
      tendered: tenderedNum,
      change: changeDue,
      paymentMethod,
      customer: customerName,
      status: 'checkout',
      updatedAt: Date.now(),
    });
  }, [items, finalTotal, tenderedNum, changeDue, paymentMethod, customerName]);

  const quickBills = [20, 50, 100, 200, 500, 1000];

  const handleQuickBill = (amount: number) => {
    setTenderedStr(String(amount));
  };

  const handleExactCash = () => {
    setTenderedStr(String(finalTotal));
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleGenerateSampleRef = () => {
    const randomRef = 'REF-' + Math.floor(10000000 + Math.random() * 90000000);
    setReferenceCode(randomRef);
  };

  const handleConfirm = async () => {
    if (!canConfirm || isProcessing) return;
    setIsProcessing(true);

    const saleId = 'SALE-' + Math.floor(100000 + Math.random() * 900000);
    const saleItems = items.map((it) => {
      const linePrice = isUtang
        ? Math.round(it.unitPrice * (1 + UTANG_SURCHARGE_RATE))
        : it.unitPrice;
      return {
        barcode: it.barcode,
        name: it.name + (it.mode === 'piece' ? ' (per pc)' : ''),
        qty: it.qty,
        price: linePrice,
        mode: it.mode,
      };
    });

    const summary = saleItems.map((l) => `${l.qty}× ${l.name}`).join(', ');

    const newSale: Sale = {
      id: saleId,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      items: saleItems,
      summary,
      total: finalTotal,
      paymentMethod,
      referenceCode: referenceCode.trim() || undefined,
      tendered: tenderedNum,
      change: changeDue,
      cashier: cashierName || 'Cashier 1',
      customer: isUtang ? customerName.trim() : undefined,
    };

    try {
      sound.playCashRegister();

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#dc2626', '#16a34a', '#fbbf24', '#ffffff'],
      });

      await onConfirmSale(newSale);
      setCompletedSale(newSale);

      displaySync.publish({
        items,
        total: finalTotal,
        tendered: tenderedNum,
        change: changeDue,
        paymentMethod,
        customer: customerName,
        status: 'completed',
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error(err);
      sound.playWarning();
    } finally {
      setIsProcessing(false);
    }
  };

  // Triggers browser print dialog utilizing the thermal printer media query in index.css
  const handlePrintReceipt = () => {
    window.print();
  };

  const formatPeso = (val: number) => {
    return '₱' + (Math.round(val * 100) / 100).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Items for print receipt
  const activeReceiptItems = completedSale ? completedSale.items : items.map(it => ({
    barcode: it.barcode,
    name: it.name + (it.mode === 'piece' ? ' (per pc)' : ''),
    qty: it.qty,
    price: isUtang ? Math.round(it.unitPrice * (1 + UTANG_SURCHARGE_RATE)) : it.unitPrice,
  }));
  const activeReceiptTotal = completedSale ? completedSale.total : finalTotal;
  const activeReceiptId = completedSale ? completedSale.id : 'DRAFT-' + Math.floor(100000 + Math.random() * 900000);
  const activeReceiptDate = completedSale ? completedSale.date : new Date().toISOString().slice(0, 10);
  const activeReceiptTime = completedSale ? completedSale.time : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const activeReceiptMethod = completedSale ? completedSale.paymentMethod : paymentMethod;
  const activeReceiptRef = completedSale ? completedSale.referenceCode : referenceCode;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 text-white shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!completedSale ? (
          <div>
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 pr-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Checkout & Payment</h3>
                  <p className="text-xs text-zinc-400">Select payment method & complete transaction</p>
                </div>
              </div>

              {/* Direct Print Order Slip Button */}
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 hover:border-emerald-500 text-zinc-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0"
                title="Print 80mm thermal receipt before checkout"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Print Slip</span>
              </button>
            </div>

            {/* Total Display Banner (Red, Black, and Green aesthetic) */}
            <div className="bg-black border-2 border-emerald-500/90 rounded-2xl p-4 mb-4 text-center shadow-[0_0_25px_rgba(16,185,129,0.2)]">
              <div className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-1">
                Total Amount Due
              </div>
              <div className="text-4xl sm:text-5xl font-black font-mono text-emerald-400 tracking-tight">
                {formatPeso(finalTotal)}
              </div>
              {isUtang && (
                <div className="text-xs text-amber-400 font-bold mt-1">
                  ⚠️ Includes +14% credit surcharge applied per item
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="mb-4">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash')}
                  className={`py-2.5 px-2 rounded-xl border flex flex-col items-center gap-1 transition text-xs font-bold ${
                    paymentMethod === 'Cash'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  <span>Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('GCash')}
                  className={`py-2.5 px-2 rounded-xl border flex flex-col items-center gap-1 transition text-xs font-bold ${
                    paymentMethod === 'GCash'
                      ? 'bg-blue-950/80 border-blue-500 text-blue-300 shadow-md ring-1 ring-blue-500'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span>GCash QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Bank')}
                  className={`py-2.5 px-2 rounded-xl border flex flex-col items-center gap-1 transition text-xs font-bold ${
                    paymentMethod === 'Bank'
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md ring-1 ring-cyan-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span>GoTyme</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Card')}
                  className={`py-2.5 px-2 rounded-xl border flex flex-col items-center gap-1 transition text-xs font-bold ${
                    paymentMethod === 'Card'
                      ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-md ring-1 ring-purple-500'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  <span>Card POS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Utang')}
                  className={`py-2.5 px-2 rounded-xl border flex flex-col items-center gap-1 transition text-xs font-bold col-span-2 sm:col-span-1 ${
                    paymentMethod === 'Utang'
                      ? 'bg-red-950/80 border-red-500 text-red-300 shadow-md ring-1 ring-red-500'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-red-400" />
                  <span>Utang (+14%)</span>
                </button>
              </div>
            </div>

            {/* GCASH QR PAYMENT CARD (Using User's Uploaded QR details & 09941873216) */}
            {paymentMethod === 'GCash' && (
              <div className="bg-gradient-to-b from-blue-950/70 to-zinc-950 border-2 border-blue-500 rounded-2xl p-4 mb-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-3 border-b border-blue-900/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📲</span>
                    <div>
                      <h4 className="font-black text-sm text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span>GCash Official instaPay QR</span>
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                      </h4>
                      <p className="text-[11px] text-zinc-400">Scan using the GCash app to pay</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-600 text-white font-black px-2 py-0.5 rounded-full">
                    instaPay
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-950/90 border border-blue-900/50 rounded-xl p-3.5">
                  {/* Generated Real Scannable GCash QR Code matching user image */}
                  <div className="bg-white p-2.5 rounded-xl shrink-0 flex flex-col items-center shadow-lg border-2 border-blue-400">
                    <QRCodeSVG
                      value="00020101021226620014ph.com.gcash0111099418732165204000053036085802PH5908DE***S D6008Caloocan6304"
                      size={140}
                      level="M"
                    />
                    <div className="mt-1 text-[9px] font-black text-blue-700 tracking-wider flex items-center gap-0.5">
                      <span>insta</span><span className="text-red-600">Pay</span>
                    </div>
                  </div>

                  {/* GCash Account & Mobile Info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5 text-xs text-left w-full">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                        Account Name
                      </span>
                      <strong className="text-sm font-black text-white">DE***S D.</strong>
                      <span className="text-[11px] text-zinc-400 ml-1">(Dennis De Jesus)</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                        GCash Mobile Number
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <strong className="font-mono text-base font-black text-blue-400 tracking-wider bg-black border border-blue-900/80 px-2.5 py-1 rounded-lg">
                          09941873216
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleCopy('09941873216', 'gcash')}
                          className="p-1.5 bg-blue-900/40 hover:bg-blue-800 border border-blue-700 text-blue-300 rounded-lg transition"
                          title="Copy Mobile Number"
                        >
                          {copiedText === 'gcash' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="text-[10px] text-zinc-500 font-mono">
                      User ID: ••••••••••••REB36W · Transfer fees may apply
                    </div>
                  </div>
                </div>

                {/* Reference Code Input: Enables Confirm on Type */}
                <div className="mt-3.5 pt-3 border-t border-blue-900/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>GCash Reference Code / Trace No.</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSampleRef}
                      className="text-[10px] font-bold text-blue-400 hover:text-blue-300 underline"
                    >
                      Sample Ref #
                    </button>
                  </div>
                  <input
                    type="text"
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    placeholder="Type reference code here (e.g. 1002 9845 2819)"
                    className="w-full bg-black border-2 border-blue-600/80 text-white rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-400 placeholder-zinc-600 font-bold"
                    autoFocus
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Once the customer completes the GCash transfer, type their reference code to proceed.
                  </p>
                </div>
              </div>
            )}

            {/* BANK (GOTYME BANK) QR PAYMENT CARD (Using User's Uploaded QR image details) */}
            {paymentMethod === 'Bank' && (
              <div className="bg-gradient-to-b from-cyan-950/70 to-zinc-950 border-2 border-cyan-400 rounded-2xl p-4 mb-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-3 border-b border-cyan-900/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏦</span>
                    <div>
                      <h4 className="font-black text-sm text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span>GoTyme Bank instaPay QR</span>
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      </h4>
                      <p className="text-[11px] text-zinc-400">Scan using GoTyme or any Bank App</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-cyan-400 text-black font-black px-2 py-0.5 rounded-full">
                    GoTyme bank
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-950/90 border border-cyan-900/50 rounded-xl p-3.5">
                  {/* Generated Real Scannable GoTyme QR Code matching user image */}
                  <div className="bg-white p-2.5 rounded-xl shrink-0 flex flex-col items-center shadow-lg border-2 border-cyan-400">
                    <QRCodeSVG
                      value="00020101021226600018ph.com.gotyme.bank01120000000066895204000053036085802PH5915DENNIS DE JESUS6008Caloocan6304"
                      size={140}
                      level="M"
                    />
                    <div className="mt-1 text-[9px] font-black text-cyan-800 tracking-wider flex items-center gap-0.5">
                      <span>insta</span><span className="text-red-600">Pay</span>
                    </div>
                  </div>

                  {/* GoTyme Account Info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5 text-xs text-left w-full">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                        Account Holder Name
                      </span>
                      <strong className="text-sm font-black text-white">DENNIS DE JESUS</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                        Bank & Account
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <strong className="font-mono text-base font-black text-cyan-300 tracking-wider bg-black border border-cyan-900/80 px-2.5 py-1 rounded-lg">
                          •••••••• 6689
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleCopy('6689', 'gotyme')}
                          className="p-1.5 bg-cyan-900/40 hover:bg-cyan-800 border border-cyan-700 text-cyan-300 rounded-lg transition"
                          title="Copy Account Digits"
                        >
                          {copiedText === 'gotyme' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="text-[10px] text-zinc-400">
                      GoTyme Bank Inc. · Transfer fees may apply
                    </div>
                  </div>
                </div>

                {/* Reference Code Input */}
                <div className="mt-3.5 pt-3 border-t border-cyan-900/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Bank Transfer Ref # / Trace Code</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSampleRef}
                      className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 underline"
                    >
                      Sample Ref #
                    </button>
                  </div>
                  <input
                    type="text"
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    placeholder="Type bank reference number (e.g. BTRF-8849201)"
                    className="w-full bg-black border-2 border-cyan-400/80 text-white rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-cyan-300 placeholder-zinc-600 font-bold"
                    autoFocus
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Enter the reference code from the customer's transfer confirmation to proceed.
                  </p>
                </div>
              </div>
            )}

            {/* Utang Customer Name Input */}
            {isUtang && (
              <div className="bg-red-950/40 border border-red-800/80 rounded-2xl p-4 mb-4 animate-in fade-in duration-200">
                <label className="text-xs font-bold text-red-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-red-400" />
                  Customer Name (Required for Utang)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mang Ben, Aling Nena, Ate Grace..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-black border border-red-700/80 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 font-semibold"
                  autoFocus
                />
                <p className="text-xs text-zinc-400 mt-1.5">
                  This will be tracked in the Utang sheet and customer credit ledger.
                </p>
              </div>
            )}

            {/* Cash Tendered Fields */}
            {paymentMethod === 'Cash' && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Amount Tendered
                  </label>
                  <button
                    type="button"
                    onClick={handleExactCash}
                    className="text-xs font-bold text-emerald-400 hover:underline"
                  >
                    Exact: {formatPeso(finalTotal)}
                  </button>
                </div>

                <div className="relative mb-3">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-500">
                    ₱
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={tenderedStr}
                    onChange={(e) => setTenderedStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-black border border-zinc-700 text-emerald-400 rounded-xl pl-9 pr-4 py-3 text-2xl font-mono font-black focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {quickBills.map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => handleQuickBill(bill)}
                      className="px-3 py-1.5 bg-zinc-950 border border-zinc-700 hover:border-emerald-500 text-zinc-200 text-xs font-mono font-bold rounded-lg transition"
                    >
                      ₱{bill}
                    </button>
                  ))}
                </div>

                {/* Change Calculation */}
                <div className="border-t border-zinc-800 pt-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Change Due
                  </span>
                  <span
                    className={`text-2xl font-mono font-black ${
                      tenderedNum < finalTotal ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {formatPeso(changeDue)}
                  </span>
                </div>
                {tenderedNum < finalTotal && tenderedNum > 0 && (
                  <div className="text-xs text-red-400 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Kulay pula: Short by {formatPeso(finalTotal - tenderedNum)}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl text-sm transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePrintReceipt}
                className="py-3 px-4 bg-zinc-900 border border-zinc-700 hover:border-emerald-500 text-zinc-200 hover:text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition"
                title="Print thermal receipt slip using browser print dialog"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Print Receipt</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canConfirm || isProcessing}
                className={`flex-1 py-3 px-6 font-black rounded-xl text-sm flex items-center justify-center gap-2 transition ${
                  canConfirm && !isProcessing
                    ? 'bg-gradient-to-r from-red-600 via-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-900/30 hover:brightness-110 active:scale-98 cursor-pointer'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {isProcessing
                  ? 'Processing…'
                  : isOnlinePayment && !referenceCode.trim()
                  ? 'Type Ref # to Proceed'
                  : `Confirm Payment (${formatPeso(finalTotal)})`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Receipt Screen on Completion */
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white">Sale Successfully Recorded!</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Sale ID: <strong className="text-zinc-200">{completedSale.id}</strong> · {completedSale.paymentMethod}
              {completedSale.referenceCode && (
                <span className="text-emerald-400 ml-2 font-mono">
                  (Ref: {completedSale.referenceCode})
                </span>
              )}
            </p>

            {/* Change banner for cashier */}
            {completedSale.paymentMethod === 'Cash' && (
              <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-2xl p-4 mb-4">
                <div className="text-xs uppercase text-emerald-400 font-bold">
                  Change to Return to Customer
                </div>
                <div className="text-3xl font-black font-mono text-emerald-400">
                  {formatPeso(completedSale.change)}
                </div>
              </div>
            )}

            {/* Thermal Slip Preview Box */}
            <div className="bg-white text-black p-4 rounded-xl text-left font-mono text-xs max-w-sm mx-auto shadow-xl mb-4 border border-zinc-300">
              <div className="text-center pb-2 border-b border-dashed border-zinc-400">
                <div className="font-bold text-sm">⭐ 3 STARS MINI MART</div>
                <div className="text-[10px] text-zinc-600">Barangay 171, Caloocan City</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">
                  Date: {completedSale.date} {completedSale.time}
                </div>
                <div className="text-[10px] font-bold mt-0.5">Receipt #{completedSale.id}</div>
              </div>

              <div className="py-2 border-b border-dashed border-zinc-400 divide-y divide-dotted divide-zinc-200">
                {completedSale.items.map((it, idx) => (
                  <div key={idx} className="py-1 flex justify-between">
                    <div>
                      <div className="font-semibold">{it.name}</div>
                      <div className="text-[10px] text-zinc-500">
                        {it.qty} × {formatPeso(it.price)}
                      </div>
                    </div>
                    <div className="font-bold">{formatPeso(it.qty * it.price)}</div>
                  </div>
                ))}
              </div>

              <div className="py-2 border-b border-dashed border-zinc-400 flex flex-col gap-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Sub Total (Net):</span>
                  <span>{formatPeso(completedSale.total - (completedSale.total * 0.12) / 1.12)}</span>
                </div>
                <div className="flex justify-between">
                  <span>12% VAT:</span>
                  <span>{formatPeso((completedSale.total * 0.12) / 1.12)}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-zinc-300">
                  <span>TOTAL:</span>
                  <span>{formatPeso(completedSale.total)}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span>Payment:</span>
                  <span>{completedSale.paymentMethod}</span>
                </div>
                {completedSale.referenceCode && (
                  <div className="flex justify-between text-[11px] text-blue-700 font-bold">
                    <span>Reference #:</span>
                    <span>{completedSale.referenceCode}</span>
                  </div>
                )}
                {completedSale.paymentMethod === 'Cash' && (
                  <>
                    <div className="flex justify-between text-[11px]">
                      <span>Tendered:</span>
                      <span>{formatPeso(completedSale.tendered)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xs">
                      <span>Change:</span>
                      <span>{formatPeso(completedSale.change)}</span>
                    </div>
                  </>
                )}
                {completedSale.paymentMethod === 'Utang' && (
                  <div className="flex justify-between font-bold text-xs text-red-600">
                    <span>Customer:</span>
                    <span>{completedSale.customer}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[10px] text-zinc-600 pt-2 font-mono">
                Thank you for shopping at 3 Stars Mini Mart!
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 py-3 bg-zinc-900 border-2 border-emerald-500 hover:bg-emerald-950 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Print Thermal Receipt</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-black rounded-xl text-sm transition"
              >
                Next Customer
              </button>
            </div>
          </div>
        )}

        {/* HIDDEN PRINT-ONLY CONTAINER FORMATTED FOR 80MM / 74MM THERMAL PRINTER MEDIA QUERY */}
        <div id="printableReceipt" className="hidden">
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>⭐ 3 STARS MINI MART ⭐</div>
            <div style={{ fontSize: '8pt' }}>Barangay 171, Caloocan City</div>
            <div style={{ fontSize: '8pt' }}>Tel: (02) 8921-4321 · VAT Reg TIN: 421-998-120</div>
            <div style={{ fontSize: '8pt', marginTop: '4px' }}>
              DATE: {activeReceiptDate}  TIME: {activeReceiptTime}
            </div>
            <div style={{ fontSize: '8pt', fontWeight: 'bold' }}>RECEIPT: {activeReceiptId}</div>
            <div style={{ fontSize: '8pt' }}>CASHIER: {cashierName || 'Cashier 1'}</div>
          </div>

          <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
            <table style={{ width: '100%', fontSize: '8pt', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                  <th style={{ padding: '2px 0' }}>QTY</th>
                  <th style={{ padding: '2px 0' }}>ITEM</th>
                  <th style={{ padding: '2px 0', textAlign: 'right' }}>PRICE</th>
                  <th style={{ padding: '2px 0', textAlign: 'right' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {activeReceiptItems.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px dotted #ccc' }}>
                    <td style={{ verticalAlign: 'top', padding: '2px 0' }}>{item.qty}x</td>
                    <td style={{ verticalAlign: 'top', padding: '2px 0' }}>{item.name}</td>
                    <td style={{ verticalAlign: 'top', padding: '2px 0', textAlign: 'right' }}>
                      {item.price.toFixed(2)}
                    </td>
                    <td style={{ verticalAlign: 'top', padding: '2px 0', textAlign: 'right', fontWeight: 'bold' }}>
                      {(item.qty * item.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px', fontSize: '8pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>TOTAL ITEMS:</span>
              <span>{activeReceiptItems.reduce((acc, c) => acc + c.qty, 0)} pcs</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>SUBTOTAL (Net):</span>
              <span>₱{(activeReceiptTotal - (activeReceiptTotal * 0.12) / 1.12).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>12% VAT:</span>
              <span>₱{((activeReceiptTotal * 0.12) / 1.12).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11pt', fontWeight: 'bold', marginTop: '4px', borderTop: '1px solid #000', paddingTop: '4px' }}>
              <span>TOTAL DUE:</span>
              <span>₱{activeReceiptTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span>PAYMENT:</span>
              <span>{activeReceiptMethod}</span>
            </div>
            {activeReceiptRef && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>REF NO:</span>
                <span style={{ fontWeight: 'bold' }}>{activeReceiptRef}</span>
              </div>
            )}
            {activeReceiptMethod === 'Cash' && completedSale && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>TENDERED:</span>
                  <span>₱{completedSale.tendered.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>CHANGE:</span>
                  <span>₱{completedSale.change.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          <div style={{ textAlign: 'center', fontSize: '7.5pt', marginTop: '6px' }}>
            <div>THANK YOU FOR SHOPPING!</div>
            <div>PLEASE KEEP THIS RECEIPT FOR YOUR RECORDS</div>
            <div style={{ marginTop: '4px', letterSpacing: '2px', fontSize: '9pt' }}>||||| | |||| || |||||| |</div>
          </div>
        </div>
      </div>
    </div>
  );
};
