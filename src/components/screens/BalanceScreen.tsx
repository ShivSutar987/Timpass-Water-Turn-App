/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BarChart2,
  Droplet,
  HelpCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WhyBalanceModal } from '../modals/WhyBalanceModal';
import { Member, MemberBalanceCalculation } from '../../types';

export const BalanceScreen: React.FC = () => {
  const { room, members, fairTurn, claims } = useApp();

  const [selectedWhyMember, setSelectedWhyMember] = useState<{
    member: Member;
    calculation: MemberBalanceCalculation;
  } | null>(null);

  if (!room) return null;

  const totalConfirmedCans = claims.filter((c) => c.status === 'confirmed').length;

  // Active (non-archived) members sorted by balance ascending (lowest balance first = owes most)
  const activeMembers = members.filter((m) => !m.isArchived);

  const sortedMembers = [...activeMembers].sort((a, b) => {
    const balA = fairTurn.balances[a.id]?.balance ?? 0;
    const balB = fairTurn.balances[b.id]?.balance ?? 0;
    return balA - balB;
  });

  // Calculate maximum absolute balance for normalizing visual bar lengths
  const maxAbsBalance = Math.max(
    1,
    ...activeMembers.map((m) => Math.abs(fairTurn.balances[m.id]?.balance ?? 0))
  );

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Turn Balances</h2>
          <p className="text-xs text-slate-400">
            Presence-weighted fair share distribution
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-semibold">
          <Droplet className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
          <span>{totalConfirmedCans} Total {room.itemName}s</span>
        </div>
      </div>

      {/* Visual Bar Chart Breakdown */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 space-y-4 shadow-xl">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
          <span>Roommate &amp; Cans</span>
          <span>Balance &amp; Math</span>
        </div>

        <div className="space-y-4">
          {sortedMembers.map((member) => {
            const calc = fairTurn.balances[member.id];
            const balance = calc?.balance ?? 0;
            const isAhead = balance >= 0;
            const percentage = Math.min(100, (Math.abs(balance) / maxAbsBalance) * 100);

            return (
              <div key={member.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{member.emoji}</span>
                    <span className="font-bold text-white truncate">
                      {member.name}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {calc?.cansCount ?? 0} brought
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className={`font-black text-xs flex items-center gap-0.5 ${
                        isAhead ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {isAhead ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>
                        {isAhead ? '+' : ''}
                        {balance.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setSelectedWhyMember({
                          member,
                          calculation: calc,
                        })
                      }
                      className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 px-2 py-0.5 rounded-md border border-cyan-500/30 transition active:scale-95"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Why?</span>
                    </button>
                  </div>
                </div>

                {/* Progress Bar Track */}
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800/80">
                  {/* Left half: Behind (negative) | Right half: Ahead (positive) */}
                  <div className="w-1/2 flex justify-end">
                    {!isAhead && (
                      <div
                        className="h-full bg-gradient-to-l from-amber-500 to-rose-500 rounded-l-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    )}
                  </div>
                  <div className="w-0.5 h-full bg-slate-700" />
                  <div className="w-1/2 flex justify-start">
                    {isAhead && (
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-r-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
                  <span>
                    Owed: {calc?.totalFairSharesOwed.toFixed(2)} shares
                  </span>
                  <span>
                    Status: {calc?.isCurrentPresent ? 'Present' : 'Away'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Logic Summary Note */}
      <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-300 space-y-1">
        <div className="font-bold text-cyan-300 flex items-center gap-1.5">
          <BarChart2 className="w-4 h-4" />
          <span>How Turns Are Calculated</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          The next turn automatically goes to the present member with the lowest balance.
          Every confirmed {room.itemName} adds <strong>+1 credit</strong> to whoever got it and charges{' '}
          <strong>1 / |Present members|</strong> to each flatmate present on that day.
        </p>
      </div>

      {/* Why Math Modal */}
      {selectedWhyMember && (
        <WhyBalanceModal
          member={selectedWhyMember.member}
          calculation={selectedWhyMember.calculation}
          isOpen={selectedWhyMember !== null}
          onClose={() => setSelectedWhyMember(null)}
          itemName={room.itemName}
          currency={room.currency}
        />
      )}
    </div>
  );
};
