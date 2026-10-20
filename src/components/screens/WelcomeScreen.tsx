/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Droplet,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  QrCode,
  Camera,
  Trash2,
  FolderOpen,
  Upload,
  HardDrive,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { QRScannerModal } from '../modals/QRScannerModal';

export const WelcomeScreen: React.FC = () => {
  const {
    createRoom,
    joinRoomByCode,
    startDemo,
    savedRooms,
    openSavedRoom,
    deleteSavedRoom,
    importFlatData,
    showToast,
  } = useApp();

  const [mode, setMode] = useState<'welcome' | 'create' | 'join'>('welcome');

  // Create Room state
  const [roomName, setRoomName] = useState('');
  const [itemName, setItemName] = useState('20L Water Can');
  const [itemUnit, setItemUnit] = useState('Can');
  const [creatorName, setCreatorName] = useState('');

  // Join Room state
  const [joinCode, setJoinCode] = useState('');
  const [joinUserName, setJoinUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Quick preset items
  const presets = [
    { name: '20L Water Can', unit: 'Can', icon: '💧' },
    { name: 'LPG Cylinder', unit: 'Cylinder', icon: '🔥' },
    { name: 'Daily Milk', unit: 'Liter', icon: '🥛' },
    { name: 'Grocery Supplies', unit: 'Order', icon: '🛒' },
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !creatorName.trim()) return;

    setLoading(true);
    await createRoom(roomName, itemName, itemUnit, creatorName);
    setLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setLoading(true);
    await joinRoomByCode(joinCode.trim(), joinUserName.trim());
    setLoading(false);
  };

  const handleQrScanned = async (code: string, parsedDetails?: { name?: string; item?: string }) => {
    setJoinCode(code);
    setLoading(true);
    await joinRoomByCode(code, joinUserName.trim(), parsedDetails);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 max-w-md mx-auto animate-fade-in">
      {/* Header Splash */}
      <div className="pt-6 text-center">
        <div className="inline-flex items-center justify-center w-18 h-18 rounded-3xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-600 shadow-2xl shadow-cyan-500/30 text-white mb-3 relative">
          <Droplet className="w-9 h-9 fill-white" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-300"></span>
          </span>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-white">
          PaniPari
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mt-0.5">
          Fair Turn & Cost Tracker
        </p>
        <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
          Zero arguments over 20L water cans, cylinders, or milk. Presence-weighted, peer-verified turns.
        </p>
      </div>

      {/* Main Action View Container */}
      <div className="my-5">
        {mode === 'welcome' && (
          <div className="space-y-3">
            {/* Previously Saved Flats on this Phone */}
            {savedRooms && savedRooms.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-lg space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Saved Flats on this Phone</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">{savedRooms.length} flat(s)</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {savedRooms.map((saved) => (
                    <div
                      key={saved.id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-cyan-500/50 transition"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-white truncate">{saved.name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-cyan-300 font-semibold">{saved.code}</span>
                          <span>•</span>
                          <span className="truncate">{saved.itemName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openSavedRoom(saved.id)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] shadow-sm transition active:scale-95"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove "${saved.name}" from saved list?`)) {
                              deleteSavedRoom(saved.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition"
                          title="Delete from phone"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Primary Action: Create Room */}
            <button
              onClick={() => setMode('create')}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-600/30 flex items-center justify-between transition-all active:scale-98"
            >
              <div className="text-left">
                <div className="font-extrabold text-sm">Create Flat / Room</div>
                <div className="text-[11px] text-cyan-100 font-normal opacity-90">
                  Set up your flat & generate a 6-character room code
                </div>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            {/* Secondary Action: Join with Code */}
            <button
              onClick={() => setMode('join')}
              className="w-full py-3 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-semibold text-xs shadow-md flex items-center justify-between transition-all active:scale-98"
            >
              <div className="text-left">
                <div className="font-bold text-xs">Join with Room Code</div>
                <div className="text-[10px] text-slate-400 font-normal">
                  Enter your roommate&apos;s 6-character code
                </div>
              </div>
              <QrCode className="w-4 h-4 text-cyan-400 shrink-0" />
            </button>

            {/* Scan QR Code Trigger */}
            <button
              onClick={() => setShowScanner(true)}
              className="w-full py-3 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-cyan-200 font-semibold text-xs shadow-md flex items-center justify-between transition-all active:scale-98"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Scan Room QR Code</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    Scan photo, screenshot or camera
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
            </button>

            {/* Try Demo Mode Sandbox & Restore from Phone */}
            <div className="pt-1 space-y-1.5">
              <button
                onClick={startDemo}
                className="w-full py-2.5 px-3 rounded-2xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-200 text-[11px] font-semibold flex items-center justify-center gap-2 transition active:scale-98"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Try Demo Sandbox (Flat 402 with Sample Flatmates)</span>
              </button>

              <label className="w-full py-2 px-3 rounded-2xl bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-medium flex items-center justify-center gap-1.5 cursor-pointer transition">
                <Upload className="w-3 h-3 text-cyan-400" />
                <span>Restore Flat Backup from Phone Storage</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const text = await file.text();
                      await importFlatData(text);
                    } catch (err: any) {
                      showToast(`Could not read backup file: ${err.message}`, 'error');
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Value Highlights */}
            <div className="mt-6 grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <Zap className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-1" />
                <div className="text-[10px] font-bold text-white">10-Sec Use</div>
                <div className="text-[9px] text-slate-400">One tap & done</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                <div className="text-[10px] font-bold text-white">Peer Verified</div>
                <div className="text-[9px] text-slate-400">No single admin</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <Users className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                <div className="text-[10px] font-bold text-white">Away Mode</div>
                <div className="text-[9px] text-slate-400">Zero owed when out</div>
              </div>
            </div>
          </div>
        )}

        {/* Create Room Form */}
        {mode === 'create' && (
          <form
            onSubmit={handleCreate}
            className="p-4 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl space-y-3.5 animate-fade-in"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="font-bold text-sm text-white">Create New Room</h2>
              <button
                type="button"
                onClick={() => setMode('welcome')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            {/* Room Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Room / Flat Name
              </label>
              <input
                type="text"
                required
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. Flat 302 Boys, Block C Hostel"
                maxLength={40}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Item Name Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Shared Essential Item
              </label>
              <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                {presets.map((p) => {
                  const isSelected = itemName === p.name;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setItemName(p.name);
                        setItemUnit(p.unit);
                      }}
                      className={`flex items-center gap-1.5 p-1.5 rounded-xl text-[11px] font-medium transition text-left border ${
                        isSelected
                          ? 'bg-cyan-600/30 text-cyan-200 border-cyan-500/60 font-semibold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span>{p.icon}</span>
                      <span className="truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Custom item name"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-1.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Your Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="e.g. Aarav"
                maxLength={25}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !roomName.trim() || !creatorName.trim()}
              className="w-full mt-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'Creating...' : 'Create Room & Save to Phone'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Join with Code Form */}
        {mode === 'join' && (
          <form
            onSubmit={handleJoin}
            className="p-4 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="font-bold text-sm text-white">Join Room</h2>
              <button
                type="button"
                onClick={() => setMode('welcome')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            {/* Camera / QR Scan Action */}
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Scan QR Code from Photo / Camera</span>
            </button>

            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <div className="h-px bg-slate-800 flex-1"></div>
              <span>or enter code</span>
              <div className="h-px bg-slate-800 flex-1"></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Enter 6-Character Room Code
              </label>
              <input
                type="text"
                required
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. PP402A"
                maxLength={8}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-center text-lg font-mono font-bold tracking-widest text-cyan-300 uppercase placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Your Name (Optional)
              </label>
              <input
                type="text"
                value={joinUserName}
                onChange={(e) => setJoinUserName(e.target.value)}
                placeholder="e.g. Priya, Rohit"
                maxLength={25}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !joinCode.trim()}
              className="w-full mt-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'Joining...' : 'Join Flat'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>

      {/* Footer Info */}
      <div className="pb-3 text-center text-[10px] text-slate-500">
        PaniPari • Saved on your device • Peer-verified turns
      </div>

      {/* QR Code Scanner / Image Decoder Modal */}
      {showScanner && (
        <QRScannerModal
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScanned={handleQrScanned}
        />
      )}
    </div>
  );
};
