/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { ToastContainer } from './components/common/ToastContainer';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { MembersScreen } from './components/screens/MembersScreen';
import { BalanceScreen } from './components/screens/BalanceScreen';
import { CostsScreen } from './components/screens/CostsScreen';
import { HistoryScreen } from './components/screens/HistoryScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { AIChatScreen } from './components/screens/AIChatScreen';

const MainAppContent: React.FC = () => {
  const { room, activeTab, joinRoomByCode } = useApp();

  // Support direct ?join=ROOMCODE url parameter with optional encoded metadata
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    const encodedData = params.get('d') || params.get('data');
    if (joinCode && !room) {
      let parsed: any = undefined;
      if (encodedData) {
        try {
          const decoded = decodeURIComponent(escape(atob(encodedData)));
          parsed = JSON.parse(decoded);
        } catch {
          // ignore
        }
      }
      joinRoomByCode(
        joinCode.toUpperCase(),
        undefined,
        parsed
          ? {
              name: parsed.n,
              item: parsed.i,
              unit: parsed.u,
              members: parsed.m,
              cost: parsed.cost,
            }
          : undefined
      );
    }
  }, [joinRoomByCode, room]);

  if (!room) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        <WelcomeScreen />
        <ToastContainer />
        <OfflineIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 flex flex-col">
      <Header />

      <main className="flex-1 max-w-md mx-auto w-full">
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'members' && <MembersScreen />}
        {activeTab === 'balance' && <BalanceScreen />}
        {activeTab === 'costs' && <CostsScreen />}
        {activeTab === 'ai' && <AIChatScreen />}
        {activeTab === 'history' && <HistoryScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </main>

      <BottomNav />
      <ToastContainer />
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
