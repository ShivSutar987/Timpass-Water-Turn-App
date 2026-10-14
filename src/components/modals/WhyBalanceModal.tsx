/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calculator, CheckCircle2, HelpCircle, X } from 'lucide-react';
import { Member, MemberBalanceCalculation } from '../../types';

interface WhyBalanceModalProps {
  member: Member | null;
  calculation: MemberBalanceCalculation | null;
  isOpen: boolean;
  onClose: () => void;
  itemName?: string;
  currency?: string;
}

export const WhyBalanceModal: React.FC<WhyBalanceModalProps> = ({
  member,
  calculation,
  isOpen,
  onClose,
  itemName = 'Can',
  currency = '₹',
}) => {
  if (!isOpen || !member || !calculation) return null;

  const isPositive = calculation.balance >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-cyan-500/30 p-6 shadow-2xl text-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner border"
            style={{ backgroundColor: `${member.color}25`, borderColor: member.color }}
          >
            {member.emoji}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{member.name}&apos;s Math</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {calculation.isCurrentPresent ? 'Present' : 'Away'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Presence-weighted fair share calculation
            </p>
          </div>
        </div>

        {/* Big Balance Breakdown Equation */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="text-center mb-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Net {itemName} Balance
            </span>
            <div
              className={`text-3xl font-black mt-0.5 ${
                isPositive ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isPositive ? '+' : ''}
              {calculation.balance.toFixed(2)}
            </div>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              {isPositive
                ? `${calculation.balance.toFixed(2)} cans ahead of fair share`
                : `${Math.abs(calculation.balance).toFixed(2)} cans behind fair share`}
            </p>
          </div>

          {/* Formula step */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center text-xs">
            <div className="bg-slate-900/80 p-2 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">Credits Earned</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">
                +{calculation.totalCredits}
              </div>
              <div className="text-[9px] text-slate-500">Brought / Benefited</div>
            </div>

            <div className="flex items-center justify-center text-slate-500 font-black text-lg">
              −
            </div>

            <div className="bg-slate-900/80 p-2 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">Fair Share Owed</div>
              <div className="text-base font-bold text-rose-400 mt-0.5">
                {calculation.totalFairSharesOwed.toFixed(2)}
              </div>
              <div className="text-[9px] text-slate-500">Sum of 1/|Present|</div>
            </div>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400">Financial Balance:</span>
            <span
              className={`ml-2 font-bold ${
                calculation.costBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {calculation.costBalance >= 0 ? 'Owed +' : 'Owes '}
              {currency}
              {Math.abs(calculation.costBalance).toFixed(0)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            Paid {currency}{calculation.costPaid.toFixed(0)} • Owed {currency}{calculation.costFairShareOwed.toFixed(0)}
          </span>
        </div>

        {/* Explanatory rules */}
        <div className="mt-4 space-y-2">
          <div className="flex items-start gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>Away members:</strong> Owe 0 shares for cans brought during their absence.
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>New joiners:</strong> Only split cans delivered after the date they joined.
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>Proxies / Swaps:</strong> Whoever was designated beneficiary receives the credit.
            </span>
          </div>
        </div>

        {/* Detailed audit logs for this member */}
        {calculation.whyDetails.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Present Events Breakdown ({calculation.whyDetails.length})
            </h4>
            <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-300">
              {calculation.whyDetails.map((detail, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-900 last:border-0">
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};
