/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { Room, Member, Claim, FairTurnResult } from '../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export class GeminiChatService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async sendMessage(
    history: { role: 'user' | 'model'; text: string }[],
    userMessage: string,
    context?: {
      room: Room;
      members: Member[];
      claims: Claim[];
      fairTurn: FairTurnResult;
      activeMember?: Member | null;
    },
    modelName: string = 'gemini-3.8-flash'
  ): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!this.ai) {
      if (apiKey) {
        this.ai = new GoogleGenAI({ apiKey });
      } else {
        return "I'm PaniPari AI. Please ensure your Gemini API key is configured in the AI Studio environment to chat!";
      }
    }

    // Build rich domain context
    let systemInstruction = `You are "PaniPari AI", a friendly, witty, highly diplomatic flatmate mediator and household essentials advisor.
Your mission is to keep roommate living peaceful, fair, and fun.
You specialize in shared essentials like 20L water cans, LPG cylinders, groceries, and chore rotations.

Key Rules of PaniPari:
1. Presence-Weighted Fairness: Flatmates away on vacation or trips owe 0 fair shares for items consumed while away.
2. Peer Verification: A flatmate cannot confirm their own delivery claim; a roommate must verify it.
3. Fair Turn Formula: Balance = total credits - sum(1 / |P(t)|). The person with the lowest balance is next. Tie-breakers: longest since last delivery, then alphabetical name.
4. Settle-ups: Debts are resolved greedily into simple pairwise transfers with UPI deep links.

Guidelines for responses:
- Keep answers concise, actionable, and warm. Use formatting (bullet points, bold text) for clarity.
- When drafting nudges or messages, offer 2 styles: "Casual & Friendly" and "Direct & Polite".
- Use emojis appropriately (💧, 🪣, ✨, 🤝, 💸).`;

    if (context && context.room) {
      const activeMembers = context.members.filter((m) => !m.isArchived);
      const nextPerson = context.fairTurn.nextMember;
      const turnExplanation = context.fairTurn.reason;

      const balancesSummary = activeMembers
        .map((m) => {
          const bal = context.fairTurn.balances[m.id];
          return `- ${m.name} (${m.emoji}): balance ${bal?.balance >= 0 ? '+' : ''}${bal?.balance.toFixed(2)} (${bal?.cansCount || 0} brought, net cost ₹${bal?.costBalance.toFixed(0)})`;
        })
        .join('\n');

      systemInstruction += `\n\nCURRENT FLAT CONTEXT:
Flat Name: ${context.room.name}
Tracked Essential: ${context.room.itemName} (Default Cost: ${context.room.currency}${context.room.defaultCost})
Current User: ${context.activeMember?.name || 'A flatmate'}
Next in Rotation: ${nextPerson ? `${nextPerson.name} (${nextPerson.emoji})` : 'None'}
Rotation Rationale: ${turnExplanation}
Flatmates in Rotation:
${balancesSummary}
Pending Claims to Verify: ${context.claims.filter((c) => c.status === 'pending').length}
Empty Alert Active: ${context.room.emptyAlert && !context.room.emptyAlert.resolved ? 'YES (item reported empty!)' : 'No'}`;
    }

    try {
      // Map history into Gemini format
      const formattedContents = history.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      }));

      // Add latest user message
      formattedContents.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      const response = await this.ai.models.generateContent({
        model: modelName,
        contents: formattedContents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      return response.text || 'I understood that, but have no text response.';
    } catch (err: any) {
      console.error('Gemini chat error:', err);
      return `PaniPari AI encountered an issue: ${err.message || 'Please try again in a moment.'}`;
    }
  }
}

export const geminiChat = new GeminiChatService();
