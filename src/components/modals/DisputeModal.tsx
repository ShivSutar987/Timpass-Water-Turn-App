/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Claim } from '../../types';

interface DisputeModalProps {
  claim: Claim | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({ claim, isOpen, onClose }) => {
  const { disputeClaim, members } = useApp();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !claim) return null;

  const claimant = members.find((m) => m.id === claim.broughtByMemberId);

  const presets = [
    'Bottle has not arrived at the room yet',
    'Previous bottle is still more than half full',
    'Wrong seal or broken dispenser tap',
    'Paid amount or delivery count differs',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSubmitting(true);
    const res = await disputeClaim(claim.id, reason.trim());
    setSubmitting(false);

    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-amber-500/40 p-6 shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-white">Query Claim</h3>
            <p className="text-xs text-slate-400">
              Claim logged by {claimant?.name || 'roommate'}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 mt-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          Disputing temporarily pauses this can from everyone&apos;s balances. Any two flatmates can resolve or confirm it later.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            Select or enter a reason:
          </label>

          <div className="space-y-1.5">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setReason(p)}
                className={`w-full text-left p-2 rounded-lg text-xs transition border ${
                  reason === p
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/60 font-medium'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Or type specific notes..."
            rows={2}
            maxLength={140}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
          />

          <button
            type="submit"
            disabled={submitting || !reason.trim()}
            className="w-full mt-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            {submitting ? 'Flagging...' : 'Flag for Roommate Review'}
          </button>
        </form>
      </div>
    </div>
  );
};
