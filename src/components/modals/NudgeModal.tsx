/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bell, EyeOff, Send, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Member } from '../../types';

interface NudgeModalProps {
  targetMember: Member | null;
  isOpen: boolean;
  onClose: () => void;
}

export const NudgeModal: React.FC<NudgeModalProps> = ({
  targetMember,
  isOpen,
  onClose,
}) => {
  const { sendNudge, room } = useApp();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !targetMember || !room) return null;

  const item = room.itemName || 'can';

  const defaultTemplates = [
    `💧 Hey ${targetMember.name}, the ${item} is running low! Time to grab the next one.`,
    `🪣 Empty ${item} alert: thirsty flatmates are counting on you!`,
    `🥤 Gentle ping for the ${item} whenever you get a minute. No rush!`,
    `🌊 Keeping our flat hydrated — your turn on the ${item}!`,
  ];

  const handleSend = async (messageToSend: string) => {
    setSubmitting(true);
    await sendNudge(targetMember.id, messageToSend, isAnonymous);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-cyan-500/30 p-6 shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Bell className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-white">
              Gentle Nudge to {targetMember.name}
            </h3>
            <p className="text-xs text-slate-400">Calm, friendly reminder</p>
          </div>
        </div>

        {/* Anonymous toggle */}
        <div className="mt-4 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-xs font-semibold text-slate-200">Send Anonymously</div>
              <div className="text-[10px] text-slate-400">Don&apos;t display who nudged</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              isAnonymous ? 'bg-cyan-600 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition" />
          </button>
        </div>

        {/* Quick template choices */}
        <div className="mt-4 space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Choose a friendly message:
          </label>
          {defaultTemplates.map((tpl, i) => (
            <button
              key={i}
              type="button"
              disabled={submitting}
              onClick={() => handleSend(tpl)}
              className="w-full text-left p-2.5 rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition active:scale-98 flex items-center justify-between group"
            >
              <span className="truncate pr-2">{tpl}</span>
              <Send className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0" />
            </button>
          ))}
        </div>

        {/* Custom text */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Or custom message:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              placeholder="e.g. Can you order before 5 PM?"
              maxLength={80}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              disabled={submitting || !customMsg.trim()}
              onClick={() => handleSend(customMsg.trim())}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
