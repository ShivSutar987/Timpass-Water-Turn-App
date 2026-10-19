/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle,
  Clock,
  Droplet,
  ExternalLink,
  Flame,
  Info,
  Send,
  Sparkles,
  Users,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClaimModal } from '../modals/ClaimModal';
import { DisputeModal } from '../modals/DisputeModal';
import { NudgeModal } from '../modals/NudgeModal';
import { WaterCan3D } from '../common/WaterCan3D';
import { Claim } from '../../types';

export const HomeScreen: React.FC = () => {
  const {
    room,
    members,
    fairTurn,
    claims,
    auditEvents,
    activeMemberId,
    confirmClaim,
    reportCanEmpty,
    setActiveTab,
  } = useApp();

  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showNudgeModal, setShowNudgeModal] = useState(false);
  const [disputeTargetClaim, setDisputeTargetClaim] = useState<Claim | null>(null);

  if (!room) return null;

  const nextPerson = fairTurn.nextMember;
  const isMyTurn = nextPerson && nextPerson.id === activeMemberId;

  // Pending claims waiting for confirmation
  const pendingClaims = claims.filter((c) => c.status === 'pending');

  // Disputed claims waiting for group resolution
  const disputedClaims = claims.filter((c) => c.status === 'disputed');

  // Recent 4 activity events
  const recentEvents = auditEvents.slice(0, 4);

  // Active empty can alert check
  const activeEmptyAlert = room.emptyAlert && !room.emptyAlert.resolved ? room.emptyAlert : null;

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-4 animate-fade-in">
      {/* 1. Empty Can Alert Banner (if active) */}
      {activeEmptyAlert && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 flex items-start gap-3 shadow-lg shadow-amber-950/20">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                {room.itemName || 'Can'} is Empty!
              </h4>
              <span className="text-[10px] text-amber-400/80">
                {new Date(activeEmptyAlert.reportedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-xs text-amber-100 mt-0.5 leading-relaxed">
              Reported empty. It is{' '}
              <strong className="text-white underline">
                {nextPerson ? nextPerson.name : 'the next person'}&apos;s turn
              </strong>{' '}
              to bring or order one!
            </p>
          </div>
        </div>
      )}

      {/* 2. Pending Claims Awaiting Peer Confirmation Banner */}
      {pendingClaims.map((claim) => {
        const claimant = members.find((m) => m.id === claim.broughtByMemberId);
        const beneficiary = members.find((m) => m.id === claim.onBehalfOfMemberId);
        const isSelfClaim = claim.broughtByMemberId === activeMemberId;

        return (
          <div
            key={claim.id}
            className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-100 shadow-xl shadow-cyan-950/30 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{claimant?.emoji || '💧'}</span>
                <div>
                  <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Delivery Awaiting Confirmation</span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                  </h4>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    {claimant?.name || 'A roommate'} brought {room.itemName}
                    {beneficiary && beneficiary.id !== claimant?.id && (
                      <span className="text-xs text-amber-300 font-normal">
                        {' '}(on behalf of {beneficiary.name})
                      </span>
                    )}
                  </div>
                  {claim.note && (
                    <p className="text-xs text-slate-300 italic mt-0.5">
                      &quot;{claim.note}&quot;
                    </p>
                  )}
                </div>
              </div>
              <span className="text-xs font-bold text-cyan-300 bg-cyan-900/60 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                {room.currency}{claim.cost}
              </span>
            </div>

            {/* Peer Verification Action Buttons */}
            {isSelfClaim ? (
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Your claim is logged. Waiting for any roommate to verify.</span>
                <span className="text-cyan-400 font-mono text-[10px]">Peer-only</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => confirmClaim(claim.id)}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-700/30 flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Verified</span>
                </button>
                <button
                  onClick={() => setDisputeTargetClaim(claim)}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Raise Query</span>
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Disputed Claims Banner (if any) */}
      {disputedClaims.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-xs font-medium">
              {disputedClaims.length} claim(s) flagged for review
            </span>
          </div>
          <button
            onClick={() => setActiveTab('history')}
            className="text-xs font-bold text-rose-300 hover:underline flex items-center gap-1"
          >
            <span>Resolve in History</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 3. HERO TURN CARD: "Next turn: [Name]" with Clear Transparent Reason */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-cyan-500/30 shadow-2xl p-6 text-slate-100 backdrop-blur-xl">
        {/* Subtle background glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between text-xs mb-3">
          <span className="font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Next In Rotation</span>
          </span>
          <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/50">
            {room.itemName}
          </span>
        </div>

        {nextPerson ? (
          <div>
            <div className="flex items-center gap-3.5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 shrink-0 transition-transform hover:scale-105"
                style={{
                  backgroundColor: `${nextPerson.color}25`,
                  borderColor: nextPerson.color,
                }}
              >
                {nextPerson.emoji}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-white truncate tracking-tight">
                    {nextPerson.name}
                  </h2>
                  {isMyTurn && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 uppercase tracking-wider animate-pulse shrink-0">
                      You&apos;re Next
                    </span>
                  )}
                </div>

                {/* Plain-English Reason from Section 4 */}
                <p className="text-xs text-cyan-200/90 font-medium mt-1 leading-snug">
                  {fairTurn.reason}
                </p>
              </div>
            </div>

            {/* Quick Nudge action if not my turn */}
            {!isMyTurn && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Can running low or need a replacement?
                </span>
                <button
                  onClick={() => setShowNudgeModal(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition bg-cyan-950/60 hover:bg-cyan-900/60 px-2.5 py-1 rounded-lg border border-cyan-500/30"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Send Friendly Ping</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center">
            <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">
              No present members available for turns.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Mark at least one roommate as Present in the Members tab.
            </p>
          </div>
        )}
      </div>

      {/* 3D Hydration Hub (Three.js Interactive Procedural Model) */}
      <WaterCan3D itemName={room.itemName || '20L Water Can'} />

      {/* PaniPari AI Mediator Quick Prompt Card */}
      <div
        onClick={() => setActiveTab('ai')}
        className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-sky-950/70 border border-cyan-500/30 text-slate-200 flex items-center justify-between cursor-pointer hover:border-cyan-400/50 transition-all shadow-lg active:scale-98"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-white">Ask PaniPari AI</h4>
              <span className="text-[9px] bg-cyan-900/60 text-cyan-300 px-1.5 py-0.2 rounded font-semibold border border-cyan-500/30">
                Gemini
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Need to resolve a dispute, draft a polite nudge, or clarify balances?
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-cyan-400 shrink-0">Chat →</span>
      </div>

      {/* 4. TWO BIG ACTION BUTTONS (Section 3 & Section 2: Usable in 10 seconds) */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Button 1: "I brought it" */}
        <button
          onClick={() => setShowClaimModal(true)}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 p-4 text-left shadow-xl shadow-cyan-600/25 transition-all duration-200 active:scale-95 flex flex-col justify-between h-28"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-white/15 text-white backdrop-blur-md">
              <Droplet className="w-5 h-5 fill-white" />
            </span>
            <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full">
              +1 Credit
            </span>
          </div>
          <div>
            <div className="text-base font-black text-white group-hover:translate-x-0.5 transition-transform">
              I Brought It
            </div>
            <div className="text-[11px] text-cyan-100 font-normal opacity-90 truncate">
              Log {room.itemName || 'can'} delivery
            </div>
          </div>
        </button>

        {/* Button 2: "Can is empty" */}
        <button
          onClick={reportCanEmpty}
          className="group relative overflow-hidden rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 p-4 text-left shadow-lg transition-all duration-200 active:scale-95 flex flex-col justify-between h-28"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Alert Flat
            </span>
          </div>
          <div>
            <div className="text-base font-bold text-white group-hover:translate-x-0.5 transition-transform">
              {room.itemName || 'Can'} is Empty
            </div>
            <div className="text-[11px] text-slate-400 font-normal truncate">
              Notifies {nextPerson ? nextPerson.name : 'the turn'}
            </div>
          </div>
        </button>
      </div>

      {/* 5. Short List of Recent Activity */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Recent Room Activity
          </h3>
          <button
            onClick={() => setActiveTab('history')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {recentEvents.length > 0 ? (
          <div className="space-y-2">
            {recentEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex items-start justify-between gap-2 text-xs py-1.5 border-b border-slate-800/60 last:border-0"
              >
                <span className="text-slate-300 truncate pr-2">{evt.details}</span>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(evt.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-2 text-center">
            No activity logged yet. Tap &quot;I Brought It&quot; to log your first {room.itemName}!
          </p>
        )}
      </div>

      {/* Modals */}
      <ClaimModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
      />

      <NudgeModal
        targetMember={nextPerson}
        isOpen={showNudgeModal}
        onClose={() => setShowNudgeModal(false)}
      />

      <DisputeModal
        claim={disputeTargetClaim}
        isOpen={disputeTargetClaim !== null}
        onClose={() => setDisputeTargetClaim(null)}
      />
    </div>
  );
};
