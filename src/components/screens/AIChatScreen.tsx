/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Scale,
  MessageSquare,
  HelpCircle,
  Zap,
  Lightbulb,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { geminiChat, ChatMessage } from '../../services/geminiChat';

export const AIChatScreen: React.FC = () => {
  const { room, members, claims, fairTurn, activeMember } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hey! I'm **PaniPari AI**, your flatmate mediator and household essentials advisor. 💧

I have full visibility into your flat's current turns, presence logs, and balances. How can I help you today?
- Resolve a turn or expense disagreement
- Draft a polite or funny reminder for the next water can
- Explain the fair-turn calculation math
- Suggest house rules for holidays or visitors`,
      timestamp: Date.now(),
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    { label: '⚖️ Who owes the next can?', prompt: "Who is next in our flat rotation right now, and what's the exact reason for their turn?" },
    { label: '💬 Draft a polite nudge', prompt: `Draft a friendly, non-passive-aggressive message to remind the next person that our ${room?.itemName || 'water can'} is empty.` },
    { label: '🏖️ Away rules explanation', prompt: "How does PaniPari handle someone going away for a weekend trip? Do they still owe cans?" },
    { label: '💸 Explain expense balance', prompt: "Can you break down our flat's current cost balances and how we should settle up?" },
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputValue('');
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, text: m.text }));

      const contextData = room
        ? {
            room,
            members,
            claims,
            fairTurn,
            activeMember,
          }
        : undefined;

      const aiResponseText = await geminiChat.sendMessage(
        history,
        text,
        contextData,
        selectedModel
      );

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: aiResponseText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: `Oops, couldn't fetch an answer: ${err.message || 'Network error'}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        text: "Conversation cleared! I'm ready for new questions about your flat.",
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto flex flex-col h-[calc(100vh-140px)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-gradient-to-tr from-cyan-600 to-sky-500 text-white shadow-md shadow-cyan-600/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-black text-white">PaniPari AI</h2>
              <span className="px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-[9px] font-bold">
                Mediator
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Context-aware assistant for flat chores &amp; fairness
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Model Switcher */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
            <option value="gemini-3.1-flash-lite">3.1 Flash Lite (Fast)</option>
          </select>

          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            title="Clear Chat History"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Messages Thread */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3.5 scrollbar-none">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-sm ${
                  isUser
                    ? 'bg-sky-600 text-white'
                    : 'bg-cyan-950 border border-cyan-500/40 text-cyan-300'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed space-y-1 ${
                  isUser
                    ? 'bg-sky-600 text-white rounded-tr-none shadow-md shadow-sky-950/40'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div
                  className={`text-[9px] text-right ${
                    isUser ? 'text-sky-200' : 'text-slate-500'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-2 animate-pulse">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>PaniPari AI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2 shrink-0 scrollbar-none">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp.prompt)}
            disabled={loading}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 whitespace-nowrap hover:text-white transition active:scale-95 disabled:opacity-50"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Message Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 pt-2 border-t border-slate-800 shrink-0"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Ask PaniPari AI about ${room?.name || 'the flat'}...`}
          disabled={loading}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || loading}
          className="p-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-semibold transition active:scale-95 disabled:opacity-50 shadow-md shadow-cyan-600/30"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
