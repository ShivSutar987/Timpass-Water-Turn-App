/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Archive,
  ChevronDown,
  ChevronUp,
  Info,
  Plus,
  RotateCcw,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isMemberCurrentlyPresent } from '../../utils/fairTurnLogic';

export const MembersScreen: React.FC = () => {
  const {
    room,
    members,
    presenceChanges,
    toggleMemberPresence,
    addNewMember,
    archiveMember,
    unarchiveMember,
    activeMemberId,
    setActiveMemberId,
  } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('💧');
  const [color, setColor] = useState('#0284c7');
  const [upiId, setUpiId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!room) return null;

  const activeMembers = members.filter((m) => !m.isArchived);
  const archivedMembers = members.filter((m) => m.isArchived);

  const availableEmojis = ['💧', '🥤', '🪣', '🌊', '🧊', '✨', '⚡️', '🚀', '🌟', '🫖', '🥛', '☕️'];
  const availableColors = [
    '#0284c7', // Sky Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#14b8a6', // Teal
  ];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    await addNewMember(name.trim(), color, emoji, upiId.trim());
    setName('');
    setUpiId('');
    setShowAddForm(false);
    setSubmitting(false);
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-4 animate-fade-in">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Flatmates</h2>
          <p className="text-xs text-slate-400">
            {activeMembers.length} active in rotation
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md active:scale-95 transition"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Member</span>
        </button>
      </div>

      {/* Away Status Explanatory Card */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Away toggle:</strong> When someone is away for a trip or weekend, toggle to{' '}
          <strong className="text-amber-300">Away</strong>. They are skipped for turns and owe <strong>0 cans</strong> while away!
        </p>
      </div>

      {/* Add Member Collapsible Form */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/40 space-y-3 animate-fade-in shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white">Add New Roommate</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul, Sneha, Dev"
              maxLength={25}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select Emoji
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableEmojis.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition ${
                    emoji === em ? 'bg-cyan-600/40 border-2 border-cyan-400' : 'bg-slate-950 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Badge Color
            </label>
            <div className="flex gap-2">
              {availableColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              UPI ID (optional, for settlements)
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. rahul@okaxis"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="w-full mt-2 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Roommate'}
          </button>
        </form>
      )}

      {/* Active Members List */}
      <div className="space-y-2.5">
        {activeMembers.map((member) => {
          const isPresent = isMemberCurrentlyPresent(member, presenceChanges);
          const isActingUser = member.id === activeMemberId;

          return (
            <div
              key={member.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                isActingUser
                  ? 'bg-slate-900/90 border-cyan-500/50 shadow-lg'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Member Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border"
                    style={{
                      backgroundColor: `${member.color}20`,
                      borderColor: member.color,
                    }}
                  >
                    {member.emoji}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white truncate">
                        {member.name}
                      </h3>
                      {isActingUser && (
                        <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.2 rounded">
                          Acting as
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPresent
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isPresent ? 'Present (In Rotation)' : 'Away (Paused)'}
                      </span>
                      {member.upiId && (
                        <span className="text-[10px] text-slate-400 font-mono truncate">
                          UPI: {member.upiId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Presence Toggle & Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleMemberPresence(member.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                      isPresent
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                    }`}
                    title="Toggle between Present and Away"
                  >
                    {isPresent ? 'Mark Away' : 'Mark Back'}
                  </button>

                  {/* Switch to this user identity */}
                  {!isActingUser && (
                    <button
                      onClick={() => setActiveMemberId(member.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
                      title="Act as this roommate"
                    >
                      <UserCheck className="w-4 h-4" />
                    </button>
                  )}

                  {/* Soft delete archive member */}
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Move ${member.name} to past members? All history and past calculations are safely preserved.`
                        )
                      ) {
                        archiveMember(member.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Move to past flatmates (Archive)"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Archived / Past Flatmates Accordion */}
      {archivedMembers.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              <span>Past Flatmates ({archivedMembers.length})</span>
            </div>
            {showArchived ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showArchived && (
            <div className="mt-2 space-y-2 animate-fade-in">
              {archivedMembers.map((archived) => (
                <div
                  key={archived.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="opacity-50">{archived.emoji}</span>
                    <span className="text-slate-400">{archived.name}</span>
                    <span className="text-[10px] text-slate-400">(Archived)</span>
                  </div>
                  <button
                    onClick={() => unarchiveMember(archived.id)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reactivate</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
