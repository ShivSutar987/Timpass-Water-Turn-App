/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Claim, Member, PresenceChange, FairTurnResult, MemberBalanceCalculation } from '../types';

/**
 * Determines whether a member was Present at a specific timestamp t.
 *
 * Rules:
 * 1. A member who joined AFTER t was not yet in the room -> false.
 * 2. Look up the most recent PresenceChange on or before t.
 *    If found, return true if status is 'present', false if 'away'.
 * 3. If no presence change exists prior to t, default to 'present' (active from join date).
 */
export function isMemberPresentAt(
  member: Member,
  t: number,
  presenceChanges: PresenceChange[]
): boolean {
  // Member hadn't joined yet
  if (member.joinedAt > t) {
    return false;
  }

  // Filter changes for this member up to timestamp t, sorted ascending
  const memberChanges = presenceChanges
    .filter((pc) => pc.memberId === member.id && pc.changedAt <= t)
    .sort((a, b) => a.changedAt - b.changedAt);

  if (memberChanges.length === 0) {
    return true; // Default to present upon joining
  }

  // The latest status up to time t
  const latestStatus = memberChanges[memberChanges.length - 1].status;
  return latestStatus === 'present';
}

/**
 * Gets the current presence status of a member right now (or at latest timestamp).
 */
export function isMemberCurrentlyPresent(
  member: Member,
  presenceChanges: PresenceChange[],
  now: number = Date.now()
): boolean {
  if (member.isArchived) return false;
  return isMemberPresentAt(member, now, presenceChanges);
}

/**
 * Pure function to calculate fair-turn balances and select the next turn member.
 *
 * Formula:
 * For every confirmed can event at time t:
 *   - Let P(t) be the set of members who were Present at t.
 *   - Every member m in P(t) owes a fair share: 1 / |P(t)| of that can.
 *   - The member credited (c.onBehalfOfMemberId || c.broughtByMemberId) gets +1 credit.
 *
 * balance(member) = total credits − total fair shares owed.
 *
 * The next turn goes to the currently Present (and non-archived) member with the LOWEST balance.
 * Tie-breakers, in order:
 *   1. Longest time since last brought a can (never brought a can comes first, oldest timestamp next).
 *   2. Alphabetical (member.name).
 *
 * @param members - Array of all members (active and archived)
 * @param claims - Array of claims (only 'confirmed' claims are factored into balance)
 * @param presenceChanges - Log of presence changes
 * @param asOfTimestamp - Timestamp at which calculation is evaluated (default: Date.now())
 */
export function calculateFairTurn(
  members: Member[],
  claims: Claim[],
  presenceChanges: PresenceChange[],
  asOfTimestamp: number = Date.now()
): FairTurnResult {
  // Initialize balance records for all members
  const balanceMap: Record<string, MemberBalanceCalculation> = {};

  for (const m of members) {
    const isPresent = isMemberCurrentlyPresent(m, presenceChanges, asOfTimestamp);
    balanceMap[m.id] = {
      memberId: m.id,
      memberName: m.name,
      isCurrentPresent: isPresent,
      totalCredits: 0,
      totalFairSharesOwed: 0,
      balance: 0,
      lastBroughtAt: null,
      cansCount: 0,
      costPaid: 0,
      costFairShareOwed: 0,
      costBalance: 0,
      whyDetails: [],
    };
  }

  // Filter only CONFIRMED claims on or before the evaluation timestamp, sorted chronologically
  const confirmedClaims = claims
    .filter((c) => c.status === 'confirmed' && (c.confirmedAt || c.createdAt) <= asOfTimestamp)
    .sort((a, b) => (a.confirmedAt || a.createdAt) - (b.confirmedAt || b.createdAt));

  // Process each confirmed can event
  for (const claim of confirmedClaims) {
    const eventTime = claim.confirmedAt || claim.createdAt;

    // Identify P(t): all members present at eventTime (including members archived later)
    const presentAtEvent = members.filter((m) =>
      isMemberPresentAt(m, eventTime, presenceChanges)
    );

    const groupSize = presentAtEvent.length;
    const canCost = claim.cost > 0 ? claim.cost : 0;

    // Award +1 credit to the beneficiary (onBehalfOfMemberId takes precedence for proxies/swaps)
    const beneficiaryId = claim.onBehalfOfMemberId || claim.broughtByMemberId;
    if (balanceMap[beneficiaryId]) {
      balanceMap[beneficiaryId].totalCredits += 1;
      balanceMap[beneficiaryId].cansCount += 1;
      // Track last brought time
      if (
        balanceMap[beneficiaryId].lastBroughtAt === null ||
        eventTime > (balanceMap[beneficiaryId].lastBroughtAt ?? 0)
      ) {
        balanceMap[beneficiaryId].lastBroughtAt = eventTime;
      }
    }

    // Award cost paid to the person who paid (physically brought)
    const payerId = claim.broughtByMemberId;
    if (balanceMap[payerId]) {
      balanceMap[payerId].costPaid += canCost;
    }

    // Deduct fair shares from each member present at the time
    if (groupSize > 0) {
      const perMemberCanShare = 1 / groupSize;
      const perMemberCostShare = canCost / groupSize;

      for (const presentMember of presentAtEvent) {
        const record = balanceMap[presentMember.id];
        if (record) {
          record.totalFairSharesOwed += perMemberCanShare;
          record.costFairShareOwed += perMemberCostShare;
          record.whyDetails.push(
            `Can on ${new Date(eventTime).toLocaleDateString()}: 1/${groupSize} share (${perMemberCanShare.toFixed(2)} can${canCost > 0 ? `, ₹${perMemberCostShare.toFixed(0)}` : ''})`
          );
        }
      }
    }
  }

  // Compute final balance for each member
  for (const m of members) {
    const record = balanceMap[m.id];
    if (record) {
      record.balance = Number((record.totalCredits - record.totalFairSharesOwed).toFixed(4));
      record.costBalance = Number((record.costPaid - record.costFairShareOwed).toFixed(2));
    }
  }

  // Filter candidates for next turn:
  // Must be currently non-archived AND currently Present
  const activePresentMembers = members.filter(
    (m) => !m.isArchived && isMemberCurrentlyPresent(m, presenceChanges, asOfTimestamp)
  );

  if (activePresentMembers.length === 0) {
    return {
      nextMember: null,
      reason: 'No members are currently marked present.',
      balances: balanceMap,
      sortedCandidates: [],
    };
  }

  // Sort candidates by:
  // 1. Lowest balance ascending (lowest balance = owes the most cans)
  // 2. Longest time since last brought a can (null / never brought comes first, then older timestamp)
  // 3. Alphabetical by name
  const sorted = [...activePresentMembers].sort((a, b) => {
    const balA = balanceMap[a.id]?.balance ?? 0;
    const balB = balanceMap[b.id]?.balance ?? 0;

    // Compare balances (threshold for floating point difference)
    if (Math.abs(balA - balB) > 0.0001) {
      return balA - balB;
    }

    // Tie-breaker 1: time since last brought
    const lastA = balanceMap[a.id]?.lastBroughtAt;
    const lastB = balanceMap[b.id]?.lastBroughtAt;

    if (lastA === null && lastB !== null) return -1; // A never brought, A goes first
    if (lastA !== null && lastB === null) return 1;  // B never brought, B goes first
    if (lastA !== null && lastB !== null && lastA !== lastB) {
      return lastA - lastB; // Smaller timestamp = brought longer ago -> goes first
    }

    // Tie-breaker 2: Alphabetical by name
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  const nextMember = sorted[0];
  const nextRecord = balanceMap[nextMember.id];

  // Craft transparent, friendly rationale
  let reason = '';
  const presentCount = activePresentMembers.length;

  if (confirmedClaims.length === 0) {
    reason = `${nextMember.name}: No cans logged yet. Selected first by tie-breaker (${nextMember.name} has not brought a can yet).`;
  } else if (nextRecord.balance < -0.05) {
    const cansBehind = Math.abs(nextRecord.balance).toFixed(1);
    reason = `${nextMember.name}: Balance ${nextRecord.balance.toFixed(2)} (${cansBehind} cans behind fair share among ${presentCount} present).`;
  } else if (Math.abs(nextRecord.balance) <= 0.05) {
    reason = `${nextMember.name}: Balance ${nextRecord.balance >= 0 ? '+' : ''}${nextRecord.balance.toFixed(2)} (tied on fair share, longest since last can).`;
  } else {
    reason = `${nextMember.name}: Balance +${nextRecord.balance.toFixed(2)} (lowest balance among all ${presentCount} present members).`;
  }

  const sortedCandidates = sorted.map((m) => {
    const rec = balanceMap[m.id];
    let note = `Balance: ${rec.balance >= 0 ? '+' : ''}${rec.balance.toFixed(2)}`;
    if (rec.lastBroughtAt === null) {
      note += ' • Never brought yet';
    } else {
      note += ` • Last brought: ${new Date(rec.lastBroughtAt).toLocaleDateString()}`;
    }
    return {
      member: m,
      balance: rec.balance,
      lastBroughtAt: rec.lastBroughtAt,
      explanation: note,
    };
  });

  return {
    nextMember,
    reason,
    balances: balanceMap,
    sortedCandidates,
  };
}
