import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer,
  X,
  Smartphone,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Store,
  QrCode,
} from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const PromotionalPosterModal: React.FC<Props> = ({ onClose }) => {
  const [selectedQR, setSelectedQR] = useState<'both' | 'gcash' | 'gotyme'>('both');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 text-white shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Modal Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Payment Counter QR Poster</h3>
              <p className="text-xs text-zinc-400">
                Printable branded standee with official GCash and instaPay QR codes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* QR Mode Selector */}
            <div className="hidden sm:flex items-center bg-black border border-zinc-800 rounded-xl p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedQR('both')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  selectedQR === 'both' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
                }`}
              >
                Dual QR
              </button>
              <button
                type="button"
                onClick={() => setSelectedQR('gcash')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  selectedQR === 'gcash' ? 'bg-blue-600 text-white' : 'text-zinc-400'
                }`}
              >
                GCash Only
              </button>
              <button
                type="button"
                onClick={() => setSelectedQR('gotyme')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  selectedQR === 'gotyme' ? 'bg-cyan-500 text-black' : 'text-zinc-400'
                }`}
              >
                GoTyme
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-emerald-600 hover:brightness-110 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
              title="Print poster for checkout counter"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Poster</span>
            </button>

            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE COUNTER POSTER CONTAINER */}
        <div
          id="promotionalPosterPrint"
          className="bg-white text-zinc-900 rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-red-600 relative overflow-hidden select-none"
        >
          {/* Top Decorative Header */}
          <div className="text-center pb-4 border-b-2 border-red-600 relative">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-3xl text-amber-500">⭐</span>
              <h1 className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight uppercase">
                3 Stars Mini Mart
              </h1>
              <span className="text-3xl text-amber-500">⭐</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-zinc-700 tracking-wide">
              Barangay 171, Bagumbong, Caloocan City · Everyday Needs Closer to You
            </p>
            <div className="mt-2 inline-block bg-zinc-950 text-white text-xs sm:text-sm font-black px-4 py-1 rounded-full uppercase tracking-widest shadow">
              SCAN TO PAY HERE • CASHLESS CHECKOUT
            </div>
          </div>

          {/* QR Codes Display Section */}
          <div className="py-5">
            <div className={`grid gap-4 ${selectedQR === 'both' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-sm mx-auto'}`}>
              {/* GCash QR Card */}
              {(selectedQR === 'both' || selectedQR === 'gcash') && (
                <div className="bg-gradient-to-b from-blue-50 to-blue-100/60 border-2 border-blue-600 rounded-2xl p-4 flex flex-col items-center text-center shadow-md relative">
                  <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-blue-200">
                    <div className="flex items-center gap-1.5 font-black text-blue-700 text-sm">
                      <Smartphone className="w-4 h-4" />
                      <span>GCash QR</span>
                    </div>
                    <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full">
                      instaPay
                    </span>
                  </div>

                  {/* QR SVG */}
                  <div className="bg-white p-3 rounded-2xl border-2 border-blue-500 shadow-lg my-1">
                    <QRCodeSVG
                      value="00020101021226620014ph.com.gcash0111099418732165204000053036085802PH5908DE***S D6008Caloocan6304"
                      size={160}
                      level="H"
                    />
                    <div className="mt-1 text-[10px] font-black text-blue-700 tracking-wider flex items-center justify-center gap-0.5">
                      <span>insta</span>
                      <span className="text-red-600">Pay</span>
                    </div>
                  </div>

                  {/* Account Details */}
                  <div className="mt-2.5 w-full bg-white/90 rounded-xl p-2.5 border border-blue-300">
                    <div className="text-[10px] uppercase font-bold text-zinc-600">Account Name</div>
                    <div className="text-sm font-black text-zinc-900">DE***S D. (Dennis De Jesus)</div>
                    <div className="mt-1 flex items-center justify-center gap-1.5 bg-blue-950 text-blue-300 px-2 py-1 rounded-lg font-mono text-sm font-black">
                      <span>0994 187 3216</span>
                    </div>
                    <div className="text-[9px] text-zinc-500 font-mono mt-1">
                      User ID: ••••••••••••REB36W
                    </div>
                  </div>
                </div>
              )}

              {/* GoTyme Bank QR Card */}
              {(selectedQR === 'both' || selectedQR === 'gotyme') && (
                <div className="bg-gradient-to-b from-cyan-50 to-cyan-100/60 border-2 border-cyan-500 rounded-2xl p-4 flex flex-col items-center text-center shadow-md relative">
                  <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-cyan-200">
                    <div className="flex items-center gap-1.5 font-black text-cyan-800 text-sm">
                      <Building2 className="w-4 h-4 text-cyan-600" />
                      <span>GoTyme Bank</span>
                    </div>
                    <span className="text-[10px] font-black bg-cyan-500 text-black px-2 py-0.5 rounded-full">
                      instaPay
                    </span>
                  </div>

                  {/* QR SVG */}
                  <div className="bg-white p-3 rounded-2xl border-2 border-cyan-500 shadow-lg my-1">
                    <QRCodeSVG
                      value="00020101021226600018ph.com.gotyme.bank01120000000066895204000053036085802PH5915DENNIS DE JESUS6008Caloocan6304"
                      size={160}
                      level="H"
                    />
                    <div className="mt-1 text-[10px] font-black text-cyan-800 tracking-wider flex items-center justify-center gap-0.5">
                      <span>insta</span>
                      <span className="text-red-600">Pay</span>
                    </div>
                  </div>

                  {/* Account Details */}
                  <div className="mt-2.5 w-full bg-white/90 rounded-xl p-2.5 border border-cyan-300">
                    <div className="text-[10px] uppercase font-bold text-zinc-600">Account Name</div>
                    <div className="text-sm font-black text-zinc-900">DENNIS DE JESUS</div>
                    <div className="mt-1 flex items-center justify-center gap-1.5 bg-zinc-950 text-cyan-300 px-2 py-1 rounded-lg font-mono text-sm font-black">
                      <span>•••••••• 6689</span>
                    </div>
                    <div className="text-[9px] text-zinc-500 font-mono mt-1">
                      GoTyme Bank Inc. (Any Bank / E-Wallet)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4-Step How to Pay Instruction Strip */}
          <div className="bg-zinc-100 border border-zinc-300 rounded-2xl p-3.5 mb-4">
            <div className="text-xs font-black uppercase text-zinc-800 tracking-wider text-center mb-2 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>How to Pay in 4 Easy Steps:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
              <div className="bg-white p-2 rounded-xl border border-zinc-200">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center mx-auto mb-1">
                  1
                </span>
                <span className="font-bold text-zinc-800 block">Open GCash / Bank</span>
                <span className="text-[10px] text-zinc-500">Tap "Scan QR"</span>
              </div>

              <div className="bg-white p-2 rounded-xl border border-zinc-200">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center mx-auto mb-1">
                  2
                </span>
                <span className="font-bold text-zinc-800 block">Scan QR Code</span>
                <span className="text-[10px] text-zinc-500">Align with phone</span>
              </div>

              <div className="bg-white p-2 rounded-xl border border-zinc-200">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center mx-auto mb-1">
                  3
                </span>
                <span className="font-bold text-zinc-800 block">Enter Exact Total</span>
                <span className="text-[10px] text-zinc-500">See counter price</span>
              </div>

              <div className="bg-white p-2 rounded-xl border border-zinc-200">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center mx-auto mb-1">
                  4
                </span>
                <span className="font-bold text-zinc-800 block">Show Reference #</span>
                <span className="text-[10px] text-zinc-500">Show to cashier</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-2 border-t border-zinc-300 flex items-center justify-between text-[10px] text-zinc-600 font-bold">
            <span>Official POS Counter Standee · 3 Stars Mini Mart</span>
            <span className="text-emerald-700">Maraming Salamat Po Sa Pag-Tangkilik!</span>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="mt-4 flex justify-end gap-3 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 via-emerald-600 to-emerald-700 hover:brightness-110 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Counter Standee</span>
          </button>
        </div>
      </div>
    </div>
  );
};
