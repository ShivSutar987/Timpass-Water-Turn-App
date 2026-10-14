/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PresenceStatus = 'present' | 'away';

export type ClaimStatus = 'pending' | 'confirmed' | 'disputed' | 'removed';

export interface Room {
  id: string;
  code: string; // 6-character code (e.g. 'PANI24')
  name: string; // e.g. 'Flat 302 Boys'
  itemName: string; // e.g. '20L Water Can', 'LPG Cylinder', 'Milk'
  itemUnit?: string; // e.g. 'Can', 'Cylinder', 'Liter'
  autoConfirmHours: number; // default 24
  defaultCost: number; // default per unit cost, e.g. 35 (INR)
  currency: string; // default '₹'
  createdAt: number;
  emptyAlert?: {
    reportedAt: number;
    reportedByMemberId: string;
    targetMemberId: string;
    resolved: boolean;
  } | null;
}

export interface Member {
  id: string;
  roomId: string;
  name: string;
  color: string; // hex color for badge
  emoji: string; // e.g. 💧, 🥤, 🪣, 🚀
  upiId?: string; // for UPI settle up deep link
  joinedAt: number;
  isArchived: boolean; // soft delete
}

export interface PresenceChange {
  id: string;
  roomId: string;
  memberId: string;
  status: PresenceStatus;
  changedAt: number;
  reason?: string;
}

export interface Claim {
  id: string;
  roomId: string;
  broughtByMemberId: string; // Person who physically brought it
  onBehalfOfMemberId: string; // Person who gets credit (usually same, or proxy)
  cost: number;
  note?: string;
  status: ClaimStatus;
  createdAt: number;
  confirmedByMemberId?: string;
  confirmedAt?: number;
  disputeReason?: string;
  disputedByMemberId?: string;
  disputedAt?: number;
  resolvedByMemberIds?: string[]; // 2 members required to resolve
  resolvedAt?: number;
}

export type EventType =
  | 'claim_created'
  | 'claim_confirmed'
  | 'claim_disputed'
  | 'claim_resolved'
  | 'claim_removed'
  | 'can_empty_alert'
  | 'nudge_sent'
  | 'presence_changed'
  | 'member_added'
  | 'member_archived'
  | 'member_unarchived'
  | 'cost_settled';

export interface AuditEvent {
  id: string;
  roomId: string;
  type: EventType;
  memberId?: string; // initiator
  details: string; // Plain-text explanation
  metadata?: Record<string, any>;
  createdAt: number;
}

export interface MemberBalanceCalculation {
  memberId: string;
  memberName: string;
  isCurrentPresent: boolean;
  totalCredits: number; // Cans brought (or received on behalf)
  totalFairSharesOwed: number; // Sum of 1/|P(t)| for all confirmed cans while present
  balance: number; // credits - owed
  lastBroughtAt: number | null; // Timestamp of last confirmed can brought, null if never
  cansCount: number;
  costPaid: number;
  costFairShareOwed: number;
  costBalance: number; // positive = owed money, negative = owes money
  whyDetails: string[];
}

export interface FairTurnResult {
  nextMember: Member | null;
  reason: string;
  balances: Record<string, MemberBalanceCalculation>;
  sortedCandidates: {
    member: Member;
    balance: number;
    lastBroughtAt: number | null;
    explanation: string;
  }[];
}
