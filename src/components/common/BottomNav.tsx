/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Home,
  Users,
  BarChart3,
  IndianRupee,
  History,
  Settings,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, claims, room } = useApp();

  // Highlight pending claims count badge
  const pendingCount = claims.filter((c) => c.status === 'pending').length;

  const navItems = [
    { id: 'home' as const, label: 'Home', icon: Home, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'members' as const, label: 'Members', icon: Users, badge: null },
    { id: 'balance' as const, label: 'Balance', icon: BarChart3, badge: null },
    { id: 'costs' as const, label: 'Costs', icon: IndianRupee, badge: null },
    { id: 'history' as const, label: 'History', icon: History, badge: null },
    { id: 'settings' as const, label: 'Settings', icon: Settings, badge: null },
  ];

  if (!room) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-xl bg-slate-950/90 dark:bg-slate-950/90 light:bg-white/95 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isActive
                  ? 'text-cyan-400 font-semibold scale-105'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {item.badge !== null && (
                  <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] rounded-full bg-cyan-500 text-slate-950 font-bold text-[9px] flex items-center justify-center animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-cyan-400 mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
