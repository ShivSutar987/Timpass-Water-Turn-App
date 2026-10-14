/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Droplet,
  Moon,
  Sun,
  UserCheck,
  QrCode,
  FlaskConical,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import { QRShareModal } from '../modals/QRShareModal';

export const Header: React.FC = () => {
  const {
    room,
    members,
    activeMemberId,
    setActiveMemberId,
    activeMember,
    theme,
    setTheme,
    isDemo,
    exitDemo,
  } = useApp();

  const [showMemberSwitch, setShowMemberSwitch] = useState(false);
  const [showQR, setShowQR] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-slate-950/80 dark:bg-slate-950/85 light:bg-white/85 border-b border-cyan-900/30 dark:border-cyan-900/40 light:border-slate-200 transition-colors">
        {/* Demo Mode banner if active */}
        {isDemo && (
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-3 py-1.5 text-xs text-white flex items-center justify-between font-medium shadow-inner">
            <div className="flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>
                <strong>Demo Sandbox:</strong> In-memory mode (doesn't touch real rooms).
              </span>
            </div>
            <button
              onClick={exitDemo}
              className="flex items-center gap-1 bg-black/25 hover:bg-black/40 px-2 py-0.5 rounded-full text-[11px] font-semibold transition active:scale-95"
            >
              <LogOut className="w-3 h-3" />
              <span>Exit Demo</span>
            </button>
          </div>
        )}

        <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
          {/* Brand Logo & Room badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 shrink-0">
              <Droplet className="w-5 h-5 fill-white/80" />
              <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-300"></span>
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                  PaniPari
                </span>
                {room && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                    {room.code}
                  </span>
                )}
              </div>
              {room && (
                <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate">
                  {room.name} • {room.itemName}
                </p>
              )}
            </div>
          </div>

          {/* Right side controls: Identity Selector, QR, Theme, PWA */}
          <div className="flex items-center gap-1.5 shrink-0">
            <PWAInstallButton />

            {/* Room QR Code trigger */}
            {room && (
              <button
                onClick={() => setShowQR(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 dark:hover:bg-slate-800/80 transition"
                title="View Room QR Code"
              >
                <QrCode className="w-4 h-4" />
              </button>
            )}

            {/* Roommate Identity Selector (Essential for peer verification) */}
            {room && members.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowMemberSwitch(!showMemberSwitch)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-100 border border-slate-700/60 hover:border-cyan-500/40 text-xs font-medium text-slate-200 transition"
                  title="Switch acting roommate"
                >
                  <span className="text-sm">{activeMember?.emoji || '👤'}</span>
                  <span className="max-w-[65px] truncate font-semibold text-cyan-300">
                    {activeMember?.name || 'Select'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showMemberSwitch && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMemberSwitch(false)}
                    />
                    <div className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1 flex items-center justify-between">
                        <span>Acting As (Your Phone)</span>
                        <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div className="max-h-56 overflow-y-auto space-y-1">
                        {members.map((m) => {
                          const isSelected = m.id === activeMemberId;
                          return (
                            <button
                              key={m.id}
                              onClick={() => {
                                setActiveMemberId(m.id);
                                setShowMemberSwitch(false);
                              }}
                              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition ${
                                isSelected
                                  ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 font-semibold'
                                  : 'text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span>{m.emoji}</span>
                                <span className="truncate">{m.name}</span>
                                {m.isArchived && (
                                  <span className="text-[10px] text-slate-500">(Past)</span>
                                )}
                              </div>
                              {isSelected && (
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-2 px-1 text-[10px] text-slate-400 border-t border-slate-800 pt-1.5 leading-tight">
                        Tap any flatmate to simulate peer confirmations or log on their behalf.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 dark:hover:bg-slate-800 transition"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-cyan-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* QR Code Modal for sharing room code */}
      {showQR && room && (
        <QRShareModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          roomCode={room.code}
          roomName={room.name}
          itemName={room.itemName}
        />
      )}
    </>
  );
};
