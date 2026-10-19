/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Check,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FastForward,
  LogOut,
  Maximize2,
  QrCode,
  Save,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { QRShareModal } from '../modals/QRShareModal';
import { TestRunnerModal } from '../modals/TestRunnerModal';

export const SettingsScreen: React.FC = () => {
  const {
    room,
    updateRoomSettings,
    leaveRoom,
    fastForwardTime,
    showToast,
    isDemo,
  } = useApp();

  const [name, setName] = useState(room?.name || '');
  const [itemName, setItemName] = useState(room?.itemName || '20L Water Can');
  const [itemUnit, setItemUnit] = useState(room?.itemUnit || 'Can');
  const [autoConfirmHours, setAutoConfirmHours] = useState(
    room?.autoConfirmHours ? String(room.autoConfirmHours) : '24'
  );
  const [defaultCost, setDefaultCost] = useState(
    room?.defaultCost ? String(room.defaultCost) : '35'
  );

  const [showQRModal, setShowQRModal] = useState(false);
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // QR Code generator states
  const [qrSrc, setQrSrc] = useState<string>('');
  const [qrType, setQrType] = useState<'link' | 'code'>('link');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const joinUrl = typeof window !== 'undefined' && room ? `${window.location.origin}?join=${room.code}` : '';

  useEffect(() => {
    if (!room) return;
    const payload = qrType === 'link' ? joinUrl : room.code;
    QRCode.toDataURL(payload, {
      width: 240,
      margin: 2,
      color: {
        dark: '#0369a1',
        light: '#ffffff',
      },
    })
      .then((url) => setQrSrc(url))
      .catch((err) => console.error('Error generating QR code in Settings', err));
  }, [room?.code, qrType, joinUrl]);

  if (!room) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateRoomSettings({
      name: name.trim() || room.name,
      itemName: itemName.trim() || room.itemName,
      itemUnit: itemUnit.trim() || room.itemUnit,
      autoConfirmHours: Math.max(1, parseInt(autoConfirmHours, 10) || 24),
      defaultCost: Math.max(0, parseFloat(defaultCost) || 0),
    });
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopiedCode(true);
      showToast(`Copied room code: ${room.code}`, 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      //
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      showToast('Copied direct join link to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      //
    }
  };

  const shareInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${room.name} on PaniPari`,
          text: `Join our flat on PaniPari to track ${room.itemName} turns! Room Code: ${room.code}`,
          url: joinUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      copyLink();
    }
  };

  const handleFastForward = async (hours: number) => {
    setSimulating(true);
    await fastForwardTime(hours);
    setSimulating(false);
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-4 animate-fade-in">
      <div>
        <h2 className="text-xl font-black text-white">Room Settings</h2>
        <p className="text-xs text-slate-400">
          Configure rotation rules, share code, or test logic
        </p>
      </div>

      {/* Embedded Live QR Code & Sharing Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Instant Room QR</h3>
              <p className="text-[11px] text-slate-400">Scan to join {room.name}</p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-[10px]">
            <button
              onClick={() => setQrType('link')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                qrType === 'link'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Direct Link
            </button>
            <button
              onClick={() => setQrType('code')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                qrType === 'code'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Code Only
            </button>
          </div>
        </div>

        {/* QR Code Canvas Frame */}
        <div className="flex flex-col items-center justify-center pt-1">
          <div className="relative group p-3 bg-white rounded-2xl shadow-xl shadow-cyan-950/40 border-4 border-cyan-400/30">
            {qrSrc ? (
              <img
                src={qrSrc}
                alt={`QR code for room ${room.code}`}
                className="w-44 h-44 rounded-xl object-contain"
              />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                Generating QR...
              </div>
            )}
            <button
              onClick={() => setShowQRModal(true)}
              className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center text-white text-xs font-bold transition-opacity"
            >
              <Maximize2 className="w-6 h-6 mb-1 text-cyan-300" />
              <span>Tap to Enlarge</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mt-2.5 text-center">
            {qrType === 'link'
              ? 'Point phone camera at QR to join flat instantly in browser'
              : `Point camera to scan the 6-character code: ${room.code}`}
          </p>
        </div>

        {/* 6-Character Room Code Banner */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest block">
              Room Code
            </span>
            <span className="text-2xl font-black tracking-widest text-white font-mono">
              {room.code}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={copyCode}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition active:scale-95 ${
                copiedCode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
              }`}
              title="Copy Room Code"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>

            <button
              onClick={() => setShowQRModal(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition active:scale-95 border border-slate-700"
              title="Enlarge QR"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons: Share Link & Copy Link */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={shareInvite}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30 transition active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Invite</span>
          </button>
          <button
            onClick={copyLink}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition active:scale-95"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Join Link'}</span>
          </button>
        </div>
      </div>

      {/* Room Configuration Form */}
      <form
        onSubmit={handleSave}
        className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3.5 shadow-xl"
      >
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Flat &amp; Item Details
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Flat / Room Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Item Name
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Unit Label
            </label>
            <input
              type="text"
              value={itemUnit}
              onChange={(e) => setItemUnit(e.target.value)}
              placeholder="Can, Cylinder, Liter"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Auto-Confirm Hours
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={autoConfirmHours}
              onChange={(e) => setAutoConfirmHours(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Default Cost ({room.currency})
            </label>
            <input
              type="number"
              min="0"
              value={defaultCost}
              onChange={(e) => setDefaultCost(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-2 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </button>
      </form>

      {/* Auto-Confirmation Time Simulator (Acceptance Test 7 testing) */}
      <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2.5">
        <div className="flex items-center gap-2">
          <FastForward className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Time Simulation (Auto-Confirm Test)
          </h3>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Claims auto-confirm if undisputed after {room.autoConfirmHours}h. Fast-forward time to test this workflow immediately!
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => handleFastForward(12)}
            disabled={simulating}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 border border-slate-700 transition"
          >
            +12 Hours
          </button>
          <button
            onClick={() => handleFastForward(25)}
            disabled={simulating}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 border border-slate-700 transition"
          >
            +25 Hours ({room.autoConfirmHours}h+ threshold)
          </button>
        </div>
      </div>

      {/* Acceptance Test Suite Runner */}
      <div className="p-4 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>10 Acceptance Tests</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Verify turn logic, tie-breakers, proxy swaps, and isolation
          </p>
        </div>
        <button
          onClick={() => setShowTestRunner(true)}
          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95 shrink-0"
        >
          Run Suite
        </button>
      </div>

      {/* Leave Room Action */}
      <div className="pt-2">
        <button
          onClick={() => {
            if (confirm('Leave this room? You can rejoin anytime with the 6-character room code.')) {
              leaveRoom();
            }
          }}
          className="w-full py-3 rounded-2xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span>Leave Room</span>
        </button>
      </div>

      {/* Modals */}
      {showQRModal && (
        <QRShareModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          roomCode={room.code}
          roomName={room.name}
          itemName={room.itemName}
        />
      )}

      {showTestRunner && (
        <TestRunnerModal
          isOpen={showTestRunner}
          onClose={() => setShowTestRunner(false)}
        />
      )}
    </div>
  );
};
