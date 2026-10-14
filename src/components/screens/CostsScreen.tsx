/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
  CreditCard,
  ExternalLink,
  IndianRupee,
  QrCode,
  Send,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { QRShareModal } from '../modals/QRShareModal';
import { Member } from '../../types';

export const CostsScreen: React.FC = () => {
  const {
    room,
    members,
    fairTurn,
    activeMemberId,
    activeMember,
    recordSettlement,
  } = useApp();

  const [settleTarget, setSettleTarget] = useState<{
    member: Member;
    amount: number;
  } | null>(null);

  const [showUpiQR, setShowUpiQR] = useState<string | null>(null);
  const [settleNote, setSettleNote] = useState('PaniPari share settlement');
  const [isRecording, setIsRecording] = useState(false);

  if (!room) return null;

  const currency = room.currency || '₹';

  // Active members
  const activeMembers = members.filter((m) => !m.isArchived);

  // Split into Creditors (owed money, costBalance > 0) and Debtors (owe money, costBalance < 0)
  const creditors = activeMembers
    .map((m) => ({
      member: m,
      net: fairTurn.balances[m.id]?.costBalance ?? 0,
      paid: fairTurn.balances[m.id]?.costPaid ?? 0,
      owed: fairTurn.balances[m.id]?.costFairShareOwed ?? 0,
    }))
    .filter((x) => x.net > 0.5)
    .sort((a, b) => b.net - a.net);

  const debtors = activeMembers
    .map((m) => ({
      member: m,
      net: fairTurn.balances[m.id]?.costBalance ?? 0,
      paid: fairTurn.balances[m.id]?.costPaid ?? 0,
      owed: fairTurn.balances[m.id]?.costFairShareOwed ?? 0,
    }))
    .filter((x) => x.net < -0.5)
    .sort((a, b) => a.net - b.net);

  // Generate pairwise debts for simplified settle up
  const pairwiseDebts: {
    from: Member;
    to: Member;
    amount: number;
  }[] = [];

  // Greedy debt resolution
  const credList = creditors.map((c) => ({ ...c, remaining: c.net }));
  const debtList = debtors.map((d) => ({ ...d, remaining: Math.abs(d.net) }));

  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < credList.length && dIdx < debtList.length) {
    const cred = credList[cIdx];
    const debt = debtList[dIdx];
    const settleAmt = Math.min(cred.remaining, debt.remaining);

    if (settleAmt > 0.5) {
      pairwiseDebts.push({
        from: debt.member,
        to: cred.member,
        amount: Math.round(settleAmt),
      });
    }

    cred.remaining -= settleAmt;
    debt.remaining -= settleAmt;

    if (cred.remaining < 0.5) cIdx++;
    if (debt.remaining < 0.5) dIdx++;
  }

  const buildUpiLink = (upiId: string, name: string, amount: number) => {
    const cleanUpi = upiId.trim();
    const cleanName = encodeURIComponent(name);
    const cleanNote = encodeURIComponent(`PaniPari ${room.itemName} settlement`);
    return `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${cleanName}&am=${amount.toFixed(2)}&cu=INR&tn=${cleanNote}`;
  };

  const handleConfirmSettlement = async () => {
    if (!settleTarget || !activeMemberId) return;
    setIsRecording(true);
    await recordSettlement(
      settleTarget.member.id,
      settleTarget.amount,
      settleNote.trim()
    );
    setIsRecording(false);
    setSettleTarget(null);
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Expense &amp; Costs</h2>
          <p className="text-xs text-slate-400">
            Default cost: {currency}{room.defaultCost} per {room.itemName}
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            Owed To Roommates
          </div>
          <div className="text-2xl font-black text-white mt-0.5">
            {currency}
            {creditors.reduce((acc, c) => acc + c.net, 0).toFixed(0)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {creditors.length} member(s) paid extra
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Default Can Cost
          </div>
          <div className="text-2xl font-black text-cyan-300 mt-0.5">
            {currency}
            {room.defaultCost}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Split across present members
          </div>
        </div>
      </div>

      {/* Suggested Pairwise Settlements with UPI Deep Links */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
          <span className="font-bold text-white uppercase tracking-wider">
            Settle Up Transfers
          </span>
          <span className="text-[10px] text-cyan-400">Deep Link &amp; UPI</span>
        </div>

        {pairwiseDebts.length > 0 ? (
          <div className="space-y-2.5">
            {pairwiseDebts.map((item, idx) => {
              const isCurrentUserDebtor = item.from.id === activeMemberId;
              const hasUpi = Boolean(item.to.upiId);
              const upiLink = hasUpi
                ? buildUpiLink(item.to.upiId!, item.to.name, item.amount)
                : null;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition ${
                    isCurrentUserDebtor
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.from.emoji}</span>
                      <span className="font-bold text-white">{item.from.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-base">{item.to.emoji}</span>
                      <span className="font-bold text-white">{item.to.name}</span>
                    </div>

                    <div className="text-base font-black text-emerald-400">
                      {currency}{item.amount}
                    </div>
                  </div>

                  {/* Settle Action Bar */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {hasUpi ? `UPI: ${item.to.upiId}` : 'No UPI registered'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {hasUpi && upiLink && (
                        <a
                          href={upiLink}
                          className="flex items-center gap-1 text-[11px] font-bold text-white bg-cyan-600 hover:bg-cyan-500 px-2.5 py-1 rounded-lg shadow-sm transition active:scale-95"
                        >
                          <Send className="w-3 h-3" />
                          <span>Pay via UPI</span>
                        </a>
                      )}

                      {hasUpi && upiLink && (
                        <button
                          onClick={() => setShowUpiQR(upiLink)}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Show UPI QR"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() =>
                          setSettleTarget({
                            member: item.to,
                            amount: item.amount,
                          })
                        }
                        className="text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg transition"
                      >
                        Mark Settled
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
            <span>All flatmates are completely settled up! No outstanding balances.</span>
          </div>
        )}
      </div>

      {/* Member Expense Balances Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Individual Financial Balances
        </h3>
        <div className="space-y-2 pt-1">
          {activeMembers.map((m) => {
            const calc = fairTurn.balances[m.id];
            const net = calc?.costBalance ?? 0;
            const isOwed = net >= 0;

            return (
              <div
                key={m.id}
                className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span>{m.emoji}</span>
                  <span className="font-semibold text-slate-200">{m.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400">
                    Paid {currency}{calc?.costPaid.toFixed(0) || '0'}
                  </span>
                  <span
                    className={`font-black ${
                      isOwed ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isOwed ? `+${currency}${net.toFixed(0)}` : `-${currency}${Math.abs(net).toFixed(0)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mark Settled Modal */}
      {settleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-white mb-2">Record Payment</h3>
            <p className="text-xs text-slate-300 mb-4">
              Record that {activeMember?.name || 'you'} paid{' '}
              <strong className="text-emerald-400">
                {currency}{settleTarget.amount}
              </strong>{' '}
              to <strong>{settleTarget.member.name}</strong>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Note
                </label>
                <input
                  type="text"
                  value={settleNote}
                  onChange={(e) => setSettleNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleTarget(null)}
                  className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isRecording}
                  onClick={handleConfirmSettlement}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                >
                  {isRecording ? 'Recording...' : 'Confirm Settled'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPI QR Modal */}
      {showUpiQR && (
        <QRShareModal
          isOpen={showUpiQR !== null}
          onClose={() => setShowUpiQR(null)}
          roomCode={room.code}
          roomName={room.name}
          itemName={room.itemName}
          customDataUrl={showUpiQR}
          customTitle="UPI Payment QR"
        />
      )}
    </div>
  );
};
