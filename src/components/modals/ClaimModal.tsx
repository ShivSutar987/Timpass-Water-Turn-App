/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CheckCircle, Sparkles, User, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({ isOpen, onClose }) => {
  const { room, members, activeMemberId, claimBroughtCan } = useApp();

  const [cost, setCost] = useState<string>(room?.defaultCost ? String(room.defaultCost) : '35');
  const [note, setNote] = useState('');
  const [onBehalfOfId, setOnBehalfOfId] = useState<string>(activeMemberId || '');
  const [submitting, setSubmitting] = useState(false);

  // Active (non-archived) members
  const activeMembers = members.filter((m) => !m.isArchived);

  if (!isOpen || !room) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const parsedCost = parseFloat(cost) || 0;
    const res = await claimBroughtCan(
      parsedCost >= 0 ? parsedCost : 0,
      note,
      onBehalfOfId || activeMemberId || undefined
    );

    setSubmitting(false);
    if (res.success) {
      onClose();
    }
  };

  const isProxy = onBehalfOfId && onBehalfOfId !== activeMemberId;
  const beneficiary = members.find((m) => m.id === onBehalfOfId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-xl font-bold text-white">Log {room.itemName || 'Can'}</h3>
            <p className="text-xs text-slate-400">Takes 5 seconds • Peer verified</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Who gets credit: Normal turn or Proxy / Swap */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Whose turn does this count for? (Credit)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
              {activeMembers.map((m) => {
                const isSelected = (onBehalfOfId || activeMemberId) === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setOnBehalfOfId(m.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition text-left ${
                      isSelected
                        ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-500/60 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span className="truncate">{m.name}</span>
                    {m.id === activeMemberId && (
                      <span className="text-[10px] text-cyan-400 ml-auto">(You)</span>
                    )}
                  </button>
                );
              })}
            </div>
            {isProxy && beneficiary && (
              <p className="text-[11px] text-amber-300 mt-1.5 flex items-center gap-1">
                <User className="w-3 h-3" />
                Proxy swap: You are carrying this on behalf of{' '}
                <strong>{beneficiary.name}</strong>. {beneficiary.name} gets the +1 credit!
              </p>
            )}
          </div>

          {/* Cost Entry */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Amount Paid ({room.currency || '₹'})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">
                {room.currency || '₹'}
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="35"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-8 pr-3 text-sm text-white font-semibold focus:outline-none focus:border-cyan-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Cost will be split equally among flatmates present today.
            </p>
          </div>

          {/* Note / Details (optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Bisleri seal checked, kept near kitchen"
              maxLength={80}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{submitting ? 'Submitting...' : 'Confirm "I Brought It"'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
