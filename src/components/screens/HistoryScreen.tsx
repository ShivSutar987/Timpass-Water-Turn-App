/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  Droplet,
  Filter,
  IndianRupee,
  ShieldAlert,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EventType } from '../../types';

export const HistoryScreen: React.FC = () => {
  const {
    room,
    members,
    claims,
    auditEvents,
    resolveDispute,
  } = useApp();

  const [filterType, setFilterType] = useState<string>('all');
  const [filterMemberId, setFilterMemberId] = useState<string>('all');

  if (!room) return null;

  // Disputed claims that need resolution
  const disputedClaims = claims.filter((c) => c.status === 'disputed');

  // Filter audit events
  const filteredEvents = auditEvents.filter((evt) => {
    // Filter by member
    if (filterMemberId !== 'all' && evt.memberId !== filterMemberId) {
      return false;
    }

    // Filter by category
    if (filterType === 'cans') {
      return (
        evt.type === 'claim_created' ||
        evt.type === 'claim_confirmed' ||
        evt.type === 'claim_disputed' ||
        evt.type === 'claim_resolved'
      );
    }
    if (filterType === 'presence') {
      return evt.type === 'presence_changed';
    }
    if (filterType === 'alerts') {
      return evt.type === 'can_empty_alert' || evt.type === 'nudge_sent';
    }
    if (filterType === 'settlements') {
      return evt.type === 'cost_settled';
    }

    return true;
  });

  const getEventBadge = (type: EventType) => {
    switch (type) {
      case 'claim_confirmed':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          bg: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300',
        };
      case 'claim_created':
        return {
          icon: <Droplet className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />,
          bg: 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300',
        };
      case 'claim_disputed':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400" />,
          bg: 'bg-rose-950/40 border-rose-500/30 text-rose-300',
        };
      case 'claim_resolved':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />,
          bg: 'bg-teal-950/40 border-teal-500/30 text-teal-300',
        };
      case 'can_empty_alert':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-400" />,
          bg: 'bg-amber-950/40 border-amber-500/30 text-amber-300',
        };
      case 'nudge_sent':
        return {
          icon: <Bell className="w-3.5 h-3.5 text-sky-400" />,
          bg: 'bg-sky-950/40 border-sky-500/30 text-sky-300',
        };
      case 'presence_changed':
        return {
          icon: <Users className="w-3.5 h-3.5 text-violet-400" />,
          bg: 'bg-violet-950/40 border-violet-500/30 text-violet-300',
        };
      case 'cost_settled':
        return {
          icon: <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />,
          bg: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300',
        };
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5 text-slate-400" />,
          bg: 'bg-slate-900 border-slate-800 text-slate-300',
        };
    }
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-white">Audit History</h2>
        <p className="text-xs text-slate-400">
          Permanent verifiable log of claims, rotations &amp; alerts
        </p>
      </div>

      {/* Disputed Claims Resolution Center (if any) */}
      {disputedClaims.length > 0 && (
        <div className="rounded-2xl bg-rose-950/20 border border-rose-500/40 p-4 space-y-3">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Active Disputes Awaiting Resolution</span>
          </div>

          <div className="space-y-2">
            {disputedClaims.map((claim) => {
              const claimant = members.find((m) => m.id === claim.broughtByMemberId);
              return (
                <div
                  key={claim.id}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2"
                >
                  <div className="flex items-start justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">
                        {claimant?.name || 'Roommate'}&apos;s claim
                      </span>
                      <div className="text-[11px] text-rose-300 mt-0.5">
                        Query: &quot;{claim.disputeReason || 'Disputed'}&quot;
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {room.currency}{claim.cost}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                    <button
                      onClick={() => resolveDispute(claim.id, 'confirm')}
                      className="py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition"
                    >
                      Agree &amp; Confirm
                    </button>
                    <button
                      onClick={() => resolveDispute(claim.id, 'remove')}
                      className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-[11px] transition"
                    >
                      Agree &amp; Discard
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Category:</span>
          </span>

          {/* Member dropdown filter */}
          <select
            value={filterMemberId}
            onChange={(e) => setFilterMemberId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
          >
            <option value="all">All Roommates</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'cans', label: 'Cans' },
            { id: 'presence', label: 'Presence' },
            { id: 'alerts', label: 'Alerts' },
            { id: 'settlements', label: 'Settlements' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                filterType === tab.id
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Stream */}
      <div className="space-y-2.5">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((evt) => {
            const badge = getEventBadge(evt.type);
            const initiator = members.find((m) => m.id === evt.memberId);

            return (
              <div
                key={evt.id}
                className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className={`p-1.5 rounded-xl border mt-0.5 shrink-0 ${badge.bg}`}
                    >
                      {badge.icon}
                    </span>

                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200 leading-snug">
                        {evt.details}
                      </p>
                      {initiator && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                          <span>{initiator.emoji}</span>
                          <span>{initiator.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                    {new Date(evt.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    •{' '}
                    {new Date(evt.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No events match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};
