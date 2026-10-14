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
  Flame,
  Milk,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const WelcomeScreen: React.FC = () => {
  const { createRoom, joinRoomByCode, startDemo } = useApp();

  const [mode, setMode] = useState<'welcome' | 'create' | 'join'>('welcome');

  // Create Room state
  const [roomName, setRoomName] = useState('');
  const [itemName, setItemName] = useState('20L Water Can');
  const [itemUnit, setItemUnit] = useState('Can');
  const [creatorName, setCreatorName] = useState('');

  // Join Room state
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

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
    await joinRoomByCode(joinCode.trim());
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 max-w-md mx-auto">
      {/* Header Splash */}
      <div className="pt-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-600 shadow-2xl shadow-cyan-500/30 text-white mb-4 relative">
          <Droplet className="w-10 h-10 fill-white" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-300"></span>
          </span>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-white">
          PaniPari
        </h1>
        <p className="text-xs uppercase tracking-widest text-cyan-400 font-bold mt-1">
          Fair Turn & Cost Tracker
        </p>
        <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
          Zero arguments over 20L water cans, LPG cylinders, or milk. Presence-weighted, peer-verified turns.
        </p>
      </div>

      {/* Main Action View Container */}
      <div className="my-6">
        {mode === 'welcome' && (
          <div className="space-y-3 animate-fade-in">
            {/* Primary Action: Create Room */}
            <button
              onClick={() => setMode('create')}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-600/30 flex items-center justify-between transition-all active:scale-98"
            >
              <div className="text-left">
                <div className="font-extrabold text-base">Create Flat / Room</div>
                <div className="text-xs text-cyan-100 font-normal opacity-90">
                  Set up your flat & generate a 6-character room code
                </div>
              </div>
              <ArrowRight className="w-5 h-5 shrink-0" />
            </button>

            {/* Secondary Action: Join with Code */}
            <button
              onClick={() => setMode('join')}
              className="w-full py-3.5 px-5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-semibold text-sm shadow-md flex items-center justify-between transition-all active:scale-98"
            >
              <div className="text-left">
                <div className="font-bold">Join with Room Code</div>
                <div className="text-xs text-slate-400 font-normal">
                  Enter your roommate&apos;s 6-character code
                </div>
              </div>
              <QrCode className="w-5 h-5 text-cyan-400 shrink-0" />
            </button>

            {/* Try Demo Mode Sandbox */}
            <div className="pt-2">
              <button
                onClick={startDemo}
                className="w-full py-3 px-4 rounded-2xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Try Demo (Isolated Sandbox with Sample Flatmates)</span>
              </button>
            </div>

            {/* Value Highlights */}
            <div className="mt-8 grid grid-cols-3 gap-2 text-center pt-2">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <Zap className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <div className="text-[11px] font-bold text-white">10-Sec Use</div>
                <div className="text-[9px] text-slate-400">One tap & done</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <div className="text-[11px] font-bold text-white">Peer Verified</div>
                <div className="text-[9px] text-slate-400">No single admin</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <Users className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <div className="text-[11px] font-bold text-white">Away Mode</div>
                <div className="text-[9px] text-slate-400">Zero owed when out</div>
              </div>
            </div>
          </div>
        )}

        {/* Create Room Form */}
        {mode === 'create' && (
          <form
            onSubmit={handleCreate}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl space-y-4 animate-fade-in"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="font-bold text-base text-white">Create New Room</h2>
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
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Item Name Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Shared Essential Item
              </label>
              <div className="grid grid-cols-2 gap-1.5 mb-2">
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
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium transition text-left border ${
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
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
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
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !roomName.trim() || !creatorName.trim()}
              className="w-full mt-2 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'Creating...' : 'Create Room & Get Code'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Join with Code Form */}
        {mode === 'join' && (
          <form
            onSubmit={handleJoin}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl space-y-4 animate-fade-in"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="font-bold text-base text-white">Join Room</h2>
              <button
                type="button"
                onClick={() => setMode('welcome')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
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
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-3 text-center text-xl font-mono font-bold tracking-widest text-cyan-300 uppercase placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                Ask your roommate to open PaniPari and share the code or QR.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !joinCode.trim()}
              className="w-full mt-2 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'Joining...' : 'Join Flat'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Footer Info */}
      <div className="pb-4 text-center text-[11px] text-slate-500">
        PaniPari • No signup required • Peer-verified turns
      </div>
    </div>
  );
};
