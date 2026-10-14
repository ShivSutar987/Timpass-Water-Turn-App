/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Clock,
  Copy,
  FastForward,
  LogOut,
  QrCode,
  Save,
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
      showToast(`Copied room code: ${room.code}`, 'success');
    } catch {
      //
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

      {/* Share Room Code & QR Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-500/30 shadow-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
            Room Code
          </span>
          <div className="text-2xl font-black tracking-widest text-white font-mono mt-0.5">
            {room.code}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Share with flatmates to let them join
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyCode}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 transition active:scale-95"
            title="Copy Code"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md transition active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>Show QR</span>
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
