/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AuditEvent,
  Claim,
  Member,
  PresenceChange,
  PresenceStatus,
  Room,
} from '../types';

export interface StorageAdapter {
  getRoom(roomId: string): Promise<Room | null>;
  getRoomByCode(code: string): Promise<Room | null>;
  saveRoom(room: Room): Promise<void>;

  getMembers(roomId: string): Promise<Member[]>;
  addMember(member: Member): Promise<void>;
  updateMember(member: Member): Promise<void>;
  archiveMember(memberId: string, roomId: string): Promise<void>;
  unarchiveMember(memberId: string, roomId: string): Promise<void>;

  getPresenceChanges(roomId: string): Promise<PresenceChange[]>;
  setPresence(
    memberId: string,
    roomId: string,
    status: PresenceStatus,
    reason?: string
  ): Promise<void>;

  getClaims(roomId: string): Promise<Claim[]>;
  addClaim(
    claim: Omit<Claim, 'id' | 'createdAt' | 'status'> & {
      id?: string;
      createdAt?: number;
    }
  ): Promise<{ success: boolean; claim?: Claim; error?: string }>;
  confirmClaim(
    claimId: string,
    roomId: string,
    confirmedByMemberId: string
  ): Promise<{ success: boolean; error?: string }>;
  disputeClaim(
    claimId: string,
    roomId: string,
    disputedByMemberId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }>;
  resolveDispute(
    claimId: string,
    roomId: string,
    memberId: string,
    resolution: 'confirm' | 'remove'
  ): Promise<{ success: boolean; message: string }>;

  checkAutoConfirmations(
    roomId: string,
    timeOffsetMs?: number
  ): Promise<number>;

  getAuditEvents(roomId: string): Promise<AuditEvent[]>;
  addAuditEvent(
    event: Omit<AuditEvent, 'id' | 'createdAt'> & { createdAt?: number }
  ): Promise<void>;

  setEmptyAlert(
    roomId: string,
    reportedByMemberId: string,
    targetMemberId: string
  ): Promise<void>;
  resolveEmptyAlert(roomId: string): Promise<void>;

  sendNudge(
    roomId: string,
    fromMemberId: string,
    targetMemberId: string,
    message: string,
    isAnonymous: boolean
  ): Promise<void>;

  recordSettlement(
    roomId: string,
    fromMemberId: string,
    toMemberId: string,
    amount: number,
    note?: string
  ): Promise<void>;
}

const LOCAL_STORAGE_PREFIX = 'panipari_v1_';

export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix: string = LOCAL_STORAGE_PREFIX) {
    this.prefix = prefix;
  }

  private getKey(category: string, id: string = ''): string {
    return `${this.prefix}${category}${id ? `_${id}` : ''}`;
  }

  private read<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private write<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage write error:', e);
    }
  }

  async getRoom(roomId: string): Promise<Room | null> {
    const rooms = this.read<Room[]>(this.getKey('rooms'), []);
    return rooms.find((r) => r.id === roomId) || null;
  }

  async getRoomByCode(code: string): Promise<Room | null> {
    const rooms = this.read<Room[]>(this.getKey('rooms'), []);
    const normalized = code.trim().toUpperCase();
    return rooms.find((r) => r.code.toUpperCase() === normalized) || null;
  }

  async saveRoom(room: Room): Promise<void> {
    const rooms = this.read<Room[]>(this.getKey('rooms'), []);
    const idx = rooms.findIndex((r) => r.id === room.id);
    if (idx >= 0) {
      rooms[idx] = room;
    } else {
      rooms.push(room);
    }
    this.write(this.getKey('rooms'), rooms);
  }

  async getMembers(roomId: string): Promise<Member[]> {
    const members = this.read<Member[]>(this.getKey('members', roomId), []);
    return members;
  }

  async addMember(member: Member): Promise<void> {
    const members = await this.getMembers(member.roomId);
    members.push(member);
    this.write(this.getKey('members', member.roomId), members);

    await this.addAuditEvent({
      roomId: member.roomId,
      type: 'member_added',
      memberId: member.id,
      details: `${member.name} joined the room`,
    });
  }

  async updateMember(member: Member): Promise<void> {
    const members = await this.getMembers(member.roomId);
    const idx = members.findIndex((m) => m.id === member.id);
    if (idx >= 0) {
      members[idx] = member;
      this.write(this.getKey('members', member.roomId), members);
    }
  }

  async archiveMember(memberId: string, roomId: string): Promise<void> {
    const members = await this.getMembers(roomId);
    const m = members.find((x) => x.id === memberId);
    if (m) {
      m.isArchived = true;
      this.write(this.getKey('members', roomId), members);
      await this.addAuditEvent({
        roomId,
        type: 'member_archived',
        memberId,
        details: `${m.name} was moved to past members (history preserved)`,
      });
    }
  }

  async unarchiveMember(memberId: string, roomId: string): Promise<void> {
    const members = await this.getMembers(roomId);
    const m = members.find((x) => x.id === memberId);
    if (m) {
      m.isArchived = false;
      this.write(this.getKey('members', roomId), members);
      await this.addAuditEvent({
        roomId,
        type: 'member_unarchived',
        memberId,
        details: `${m.name} was reactivated`,
      });
    }
  }

  async getPresenceChanges(roomId: string): Promise<PresenceChange[]> {
    return this.read<PresenceChange[]>(this.getKey('presence', roomId), []);
  }

  async setPresence(
    memberId: string,
    roomId: string,
    status: PresenceStatus,
    reason?: string
  ): Promise<void> {
    const changes = await this.getPresenceChanges(roomId);
    const newChange: PresenceChange = {
      id: 'pc_' + Math.random().toString(36).substring(2, 9),
      roomId,
      memberId,
      status,
      changedAt: Date.now(),
      reason,
    };
    changes.push(newChange);
    this.write(this.getKey('presence', roomId), changes);

    const members = await this.getMembers(roomId);
    const memberName = members.find((m) => m.id === memberId)?.name || 'Member';

    await this.addAuditEvent({
      roomId,
      type: 'presence_changed',
      memberId,
      details: `${memberName} marked status as ${status === 'away' ? 'Away (paused from turns)' : 'Present (back in rotation)'}${reason ? ` (${reason})` : ''}`,
    });
  }

  async getClaims(roomId: string): Promise<Claim[]> {
    return this.read<Claim[]>(this.getKey('claims', roomId), []);
  }

  async addClaim(
    claimData: Omit<Claim, 'id' | 'createdAt' | 'status'> & {
      id?: string;
      createdAt?: number;
    }
  ): Promise<{ success: boolean; claim?: Claim; error?: string }> {
    const claims = await this.getClaims(claimData.roomId);

    // Rate-limiting check: Duplicate claim prevention within 10 minutes
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    const recentDuplicate = claims.find(
      (c) =>
        c.broughtByMemberId === claimData.broughtByMemberId &&
        c.createdAt > tenMinutesAgo &&
        c.status !== 'removed'
    );

    if (recentDuplicate) {
      const waitMinutes = Math.ceil(
        (recentDuplicate.createdAt + 10 * 60 * 1000 - Date.now()) / (60 * 1000)
      );
      return {
        success: false,
        error: `A claim was logged recently by you. To avoid duplicates, please wait ~${Math.max(1, waitMinutes)} min or verify previous claim.`,
      };
    }

    const newClaim: Claim = {
      id: claimData.id || 'clm_' + Math.random().toString(36).substring(2, 10),
      roomId: claimData.roomId,
      broughtByMemberId: claimData.broughtByMemberId,
      onBehalfOfMemberId:
        claimData.onBehalfOfMemberId || claimData.broughtByMemberId,
      cost: Number(claimData.cost) || 0,
      note: claimData.note?.trim() || undefined,
      status: 'pending',
      createdAt: claimData.createdAt || Date.now(),
    };

    claims.push(newClaim);
    this.write(this.getKey('claims', claimData.roomId), claims);

    const members = await this.getMembers(claimData.roomId);
    const courier = members.find((m) => m.id === newClaim.broughtByMemberId)?.name || 'Someone';
    const beneficiary = members.find((m) => m.id === newClaim.onBehalfOfMemberId)?.name || courier;

    const proxyText =
      newClaim.onBehalfOfMemberId !== newClaim.broughtByMemberId
        ? ` on behalf of ${beneficiary}`
        : '';

    await this.addAuditEvent({
      roomId: newClaim.roomId,
      type: 'claim_created',
      memberId: newClaim.broughtByMemberId,
      details: `${courier} claimed bringing a can${proxyText} (awaiting roommate confirmation)`,
    });

    return { success: true, claim: newClaim };
  }

  async confirmClaim(
    claimId: string,
    roomId: string,
    confirmedByMemberId: string
  ): Promise<{ success: boolean; error?: string }> {
    const claims = await this.getClaims(roomId);
    const claim = claims.find((c) => c.id === claimId);

    if (!claim) {
      return { success: false, error: 'Claim not found.' };
    }

    // Acceptance Test 6: Claimant cannot confirm their own claim!
    if (claim.broughtByMemberId === confirmedByMemberId) {
      return {
        success: false,
        error: 'You cannot confirm your own claim! A roommate must verify it.',
      };
    }

    if (claim.status === 'confirmed') {
      return { success: true };
    }

    claim.status = 'confirmed';
    claim.confirmedByMemberId = confirmedByMemberId;
    claim.confirmedAt = Date.now();

    this.write(this.getKey('claims', roomId), claims);

    const members = await this.getMembers(roomId);
    const confirmer = members.find((m) => m.id === confirmedByMemberId)?.name || 'A roommate';
    const claimant = members.find((m) => m.id === claim.broughtByMemberId)?.name || 'Roommate';

    await this.addAuditEvent({
      roomId,
      type: 'claim_confirmed',
      memberId: confirmedByMemberId,
      details: `${confirmer} verified ${claimant}'s can delivery. Balances updated!`,
    });

    // If there was an active can empty alert, resolve it automatically
    await this.resolveEmptyAlert(roomId);

    return { success: true };
  }

  async disputeClaim(
    claimId: string,
    roomId: string,
    disputedByMemberId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    const claims = await this.getClaims(roomId);
    const claim = claims.find((c) => c.id === claimId);

    if (!claim) {
      return { success: false, error: 'Claim not found.' };
    }

    claim.status = 'disputed';
    claim.disputeReason = reason;
    claim.disputedByMemberId = disputedByMemberId;
    claim.disputedAt = Date.now();

    this.write(this.getKey('claims', roomId), claims);

    const members = await this.getMembers(roomId);
    const disputer = members.find((m) => m.id === disputedByMemberId)?.name || 'A roommate';

    await this.addAuditEvent({
      roomId,
      type: 'claim_disputed',
      memberId: disputedByMemberId,
      details: `${disputer} raised a query: "${reason}" (can is excluded from balance until resolved)`,
    });

    return { success: true };
  }

  async resolveDispute(
    claimId: string,
    roomId: string,
    memberId: string,
    resolution: 'confirm' | 'remove'
  ): Promise<{ success: boolean; message: string }> {
    const claims = await this.getClaims(roomId);
    const claim = claims.find((c) => c.id === claimId);

    if (!claim) {
      return { success: false, message: 'Claim not found.' };
    }

    const members = await this.getMembers(roomId);
    const memberName = members.find((m) => m.id === memberId)?.name || 'Roommate';

    // Track resolvers: any 2 roommates agreement or direct resolution
    if (!claim.resolvedByMemberIds) claim.resolvedByMemberIds = [];
    if (!claim.resolvedByMemberIds.includes(memberId)) {
      claim.resolvedByMemberIds.push(memberId);
    }

    if (resolution === 'confirm') {
      claim.status = 'confirmed';
      claim.confirmedAt = Date.now();
      claim.confirmedByMemberId = memberId;
      this.write(this.getKey('claims', roomId), claims);

      await this.addAuditEvent({
        roomId,
        type: 'claim_resolved',
        memberId,
        details: `${memberName} resolved query and confirmed the can.`,
      });

      return { success: true, message: 'Dispute resolved: Can confirmed!' };
    } else {
      claim.status = 'removed';
      this.write(this.getKey('claims', roomId), claims);

      await this.addAuditEvent({
        roomId,
        type: 'claim_removed',
        memberId,
        details: `${memberName} resolved query: claim discarded by agreement.`,
      });

      return { success: true, message: 'Dispute resolved: Claim removed.' };
    }
  }

  async checkAutoConfirmations(roomId: string, timeOffsetMs: number = 0): Promise<number> {
    const room = await this.getRoom(roomId);
    if (!room) return 0;

    const claims = await this.getClaims(roomId);
    const currentTime = Date.now() + timeOffsetMs;
    const autoConfirmThresholdMs = room.autoConfirmHours * 60 * 60 * 1000;

    let confirmedCount = 0;

    for (const c of claims) {
      if (c.status === 'pending') {
        const elapsed = currentTime - c.createdAt;
        if (elapsed >= autoConfirmThresholdMs) {
          c.status = 'confirmed';
          c.confirmedAt = currentTime;
          c.confirmedByMemberId = 'system_auto_confirm';
          confirmedCount++;

          await this.addAuditEvent({
            roomId,
            type: 'claim_confirmed',
            details: `Auto-confirmed after ${room.autoConfirmHours}h without dispute.`,
            createdAt: currentTime,
          });
        }
      }
    }

    if (confirmedCount > 0) {
      this.write(this.getKey('claims', roomId), claims);
      await this.resolveEmptyAlert(roomId);
    }

    return confirmedCount;
  }

  async getAuditEvents(roomId: string): Promise<AuditEvent[]> {
    const events = this.read<AuditEvent[]>(this.getKey('events', roomId), []);
    return events.sort((a, b) => b.createdAt - a.createdAt);
  }

  async addAuditEvent(
    event: Omit<AuditEvent, 'id' | 'createdAt'> & { createdAt?: number }
  ): Promise<void> {
    const events = await this.getAuditEvents(event.roomId);
    const newEvent: AuditEvent = {
      id: 'evt_' + Math.random().toString(36).substring(2, 10),
      roomId: event.roomId,
      type: event.type,
      memberId: event.memberId,
      details: event.details,
      metadata: event.metadata,
      createdAt: event.createdAt || Date.now(),
    };
    events.unshift(newEvent);
    // Keep max 200 events in local storage
    const trimmed = events.slice(0, 200);
    this.write(this.getKey('events', event.roomId), trimmed);
  }

  async setEmptyAlert(
    roomId: string,
    reportedByMemberId: string,
    targetMemberId: string
  ): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) return;

    room.emptyAlert = {
      reportedAt: Date.now(),
      reportedByMemberId,
      targetMemberId,
      resolved: false,
    };
    await this.saveRoom(room);

    const members = await this.getMembers(roomId);
    const reporter = members.find((m) => m.id === reportedByMemberId)?.name || 'Someone';
    const target = members.find((m) => m.id === targetMemberId)?.name || 'Next member';

    await this.addAuditEvent({
      roomId,
      type: 'can_empty_alert',
      memberId: reportedByMemberId,
      details: `🪣 ${reporter} reported the ${room.itemName || 'can'} is empty! It is ${target}'s turn.`,
    });
  }

  async resolveEmptyAlert(roomId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (room && room.emptyAlert && !room.emptyAlert.resolved) {
      room.emptyAlert.resolved = true;
      await this.saveRoom(room);
    }
  }

  async sendNudge(
    roomId: string,
    fromMemberId: string,
    targetMemberId: string,
    message: string,
    isAnonymous: boolean
  ): Promise<void> {
    const members = await this.getMembers(roomId);
    const target = members.find((m) => m.id === targetMemberId)?.name || 'Roommate';
    const sender = isAnonymous
      ? 'A flatmate (anonymously)'
      : members.find((m) => m.id === fromMemberId)?.name || 'Roommate';

    await this.addAuditEvent({
      roomId,
      type: 'nudge_sent',
      memberId: isAnonymous ? undefined : fromMemberId,
      details: `💬 ${sender} sent a gentle nudge to ${target}: "${message}"`,
    });
  }

  async recordSettlement(
    roomId: string,
    fromMemberId: string,
    toMemberId: string,
    amount: number,
    note?: string
  ): Promise<void> {
    const members = await this.getMembers(roomId);
    const fromName = members.find((m) => m.id === fromMemberId)?.name || 'Member';
    const toName = members.find((m) => m.id === toMemberId)?.name || 'Member';

    await this.addAuditEvent({
      roomId,
      type: 'cost_settled',
      memberId: fromMemberId,
      details: `💸 ${fromName} settled ₹${amount.toFixed(0)} with ${toName}${note ? ` (${note})` : ''}`,
    });
  }
}

/**
 * In-memory sandbox storage adapter for DEMO mode.
 * Completely detached from localStorage, discards on exit!
 */
export class InMemoryDemoAdapter implements StorageAdapter {
  private rooms: Map<string, Room> = new Map();
  private members: Map<string, Member[]> = new Map();
  private presence: Map<string, PresenceChange[]> = new Map();
  private claims: Map<string, Claim[]> = new Map();
  private events: Map<string, AuditEvent[]> = new Map();

  constructor() {
    this.seedDemoData();
  }

  private seedDemoData(): void {
    const roomId = 'demo-room-402';
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const demoRoom: Room = {
      id: roomId,
      code: 'DEMO42',
      name: 'Flat 402 Hydration Hub',
      itemName: '20L Water Can',
      itemUnit: 'Can',
      autoConfirmHours: 24,
      defaultCost: 35,
      currency: '₹',
      createdAt: now - 14 * oneDay,
      emptyAlert: {
        reportedAt: now - 45 * 60 * 1000,
        reportedByMemberId: 'demo-rohan',
        targetMemberId: 'demo-aarav',
        resolved: false,
      },
    };
    this.rooms.set(roomId, demoRoom);

    const demoMembers: Member[] = [
      {
        id: 'demo-aarav',
        roomId,
        name: 'Aarav',
        color: '#0284c7', // Sky blue
        emoji: '💧',
        upiId: 'aarav@okaxis',
        joinedAt: now - 14 * oneDay,
        isArchived: false,
      },
      {
        id: 'demo-priya',
        roomId,
        name: 'Priya',
        color: '#ec4899', // Pink
        emoji: '✨',
        upiId: 'priya@okhdfcbank',
        joinedAt: now - 14 * oneDay,
        isArchived: false,
      },
      {
        id: 'demo-rohan',
        roomId,
        name: 'Rohan',
        color: '#10b981', // Emerald
        emoji: '🥤',
        upiId: 'rohan@icici',
        joinedAt: now - 14 * oneDay,
        isArchived: false,
      },
      {
        id: 'demo-sneha',
        roomId,
        name: 'Sneha',
        color: '#f59e0b', // Amber
        emoji: '🪣',
        upiId: 'sneha@paytm',
        joinedAt: now - 7 * oneDay, // Joined 1 week ago
        isArchived: false,
      },
    ];
    this.members.set(roomId, demoMembers);

    // Presence: Priya is away visiting parents this weekend
    const demoPresence: PresenceChange[] = [
      {
        id: 'pc-demo-1',
        roomId,
        memberId: 'demo-priya',
        status: 'away',
        changedAt: now - 2 * oneDay,
        reason: 'Home for the weekend',
      },
    ];
    this.presence.set(roomId, demoPresence);

    // Claims history
    const demoClaims: Claim[] = [
      // 10 days ago: Rohan brought a can (all 3 present: Aarav, Priya, Rohan)
      {
        id: 'clm-demo-1',
        roomId,
        broughtByMemberId: 'demo-rohan',
        onBehalfOfMemberId: 'demo-rohan',
        cost: 35,
        note: 'Bisleri 20L cool blue',
        status: 'confirmed',
        createdAt: now - 10 * oneDay,
        confirmedByMemberId: 'demo-aarav',
        confirmedAt: now - 10 * oneDay + 3600000,
      },
      // 6 days ago: Priya brought a can (all 4 present)
      {
        id: 'clm-demo-2',
        roomId,
        broughtByMemberId: 'demo-priya',
        onBehalfOfMemberId: 'demo-priya',
        cost: 35,
        note: 'Kinley seal verified',
        status: 'confirmed',
        createdAt: now - 6 * oneDay,
        confirmedByMemberId: 'demo-rohan',
        confirmedAt: now - 6 * oneDay + 1800000,
      },
      // 3 days ago: Sneha brought a can (all 4 present)
      {
        id: 'clm-demo-3',
        roomId,
        broughtByMemberId: 'demo-sneha',
        onBehalfOfMemberId: 'demo-sneha',
        cost: 40,
        note: 'Emergency delivery from local vendor',
        status: 'confirmed',
        createdAt: now - 3 * oneDay,
        confirmedByMemberId: 'demo-aarav',
        confirmedAt: now - 3 * oneDay + 7200000,
      },
      // Yesterday: Rohan brought another can while Priya was Away! (P(t) = Aarav, Rohan, Sneha)
      {
        id: 'clm-demo-4',
        roomId,
        broughtByMemberId: 'demo-rohan',
        onBehalfOfMemberId: 'demo-rohan',
        cost: 35,
        note: 'Standard delivery',
        status: 'confirmed',
        createdAt: now - 1 * oneDay,
        confirmedByMemberId: 'demo-sneha',
        confirmedAt: now - 1 * oneDay + 2400000,
      },
      // 2 hours ago: Aarav logged a new pending claim! (Ready for roommate confirmation in demo)
      {
        id: 'clm-demo-5',
        roomId,
        broughtByMemberId: 'demo-aarav',
        onBehalfOfMemberId: 'demo-aarav',
        cost: 35,
        note: 'Placed near dispenser',
        status: 'pending',
        createdAt: now - 2 * 3600 * 1000,
      },
    ];
    this.claims.set(roomId, demoClaims);

    // Initial audit events
    const demoEvents: AuditEvent[] = [
      {
        id: 'evt-demo-1',
        roomId,
        type: 'can_empty_alert',
        memberId: 'demo-rohan',
        details: '🪣 Rohan reported water can is empty! Aarav is next.',
        createdAt: now - 45 * 60 * 1000,
      },
      {
        id: 'evt-demo-2',
        roomId,
        type: 'claim_created',
        memberId: 'demo-aarav',
        details: 'Aarav claimed bringing a 20L Water Can (pending roommate verification).',
        createdAt: now - 2 * 3600 * 1000,
      },
      {
        id: 'evt-demo-3',
        roomId,
        type: 'presence_changed',
        memberId: 'demo-priya',
        details: 'Priya marked status as Away (Home for the weekend).',
        createdAt: now - 2 * oneDay,
      },
      {
        id: 'evt-demo-4',
        roomId,
        type: 'claim_confirmed',
        memberId: 'demo-sneha',
        details: 'Sneha verified Rohan\'s can delivery.',
        createdAt: now - 1 * oneDay + 2400000,
      },
    ];
    this.events.set(roomId, demoEvents);
  }

  async getRoom(roomId: string): Promise<Room | null> {
    return this.rooms.get(roomId) || null;
  }

  async getRoomByCode(code: string): Promise<Room | null> {
    const normalized = code.trim().toUpperCase();
    for (const room of this.rooms.values()) {
      if (room.code.toUpperCase() === normalized) return room;
    }
    return null;
  }

  async saveRoom(room: Room): Promise<void> {
    this.rooms.set(room.id, room);
  }

  async getMembers(roomId: string): Promise<Member[]> {
    return this.members.get(roomId) || [];
  }

  async addMember(member: Member): Promise<void> {
    const list = await this.getMembers(member.roomId);
    list.push(member);
    this.members.set(member.roomId, list);
    await this.addAuditEvent({
      roomId: member.roomId,
      type: 'member_added',
      memberId: member.id,
      details: `${member.name} joined the room`,
    });
  }

  async updateMember(member: Member): Promise<void> {
    const list = await this.getMembers(member.roomId);
    const idx = list.findIndex((m) => m.id === member.id);
    if (idx >= 0) list[idx] = member;
  }

  async archiveMember(memberId: string, roomId: string): Promise<void> {
    const list = await this.getMembers(roomId);
    const m = list.find((x) => x.id === memberId);
    if (m) {
      m.isArchived = true;
      await this.addAuditEvent({
        roomId,
        type: 'member_archived',
        memberId,
        details: `${m.name} was moved to past members (history preserved)`,
      });
    }
  }

  async unarchiveMember(memberId: string, roomId: string): Promise<void> {
    const list = await this.getMembers(roomId);
    const m = list.find((x) => x.id === memberId);
    if (m) {
      m.isArchived = false;
      await this.addAuditEvent({
        roomId,
        type: 'member_unarchived',
        memberId,
        details: `${m.name} was reactivated`,
      });
    }
  }

  async getPresenceChanges(roomId: string): Promise<PresenceChange[]> {
    return this.presence.get(roomId) || [];
  }

  async setPresence(
    memberId: string,
    roomId: string,
    status: PresenceStatus,
    reason?: string
  ): Promise<void> {
    const list = await this.getPresenceChanges(roomId);
    const item: PresenceChange = {
      id: 'pc_' + Math.random().toString(36).substring(2, 9),
      roomId,
      memberId,
      status,
      changedAt: Date.now(),
      reason,
    };
    list.push(item);
    this.presence.set(roomId, list);

    const members = await this.getMembers(roomId);
    const memberName = members.find((m) => m.id === memberId)?.name || 'Member';

    await this.addAuditEvent({
      roomId,
      type: 'presence_changed',
      memberId,
      details: `${memberName} marked status as ${status === 'away' ? 'Away (paused from turns)' : 'Present (back in rotation)'}${reason ? ` (${reason})` : ''}`,
    });
  }

  async getClaims(roomId: string): Promise<Claim[]> {
    return this.claims.get(roomId) || [];
  }

  async addClaim(
    claimData: Omit<Claim, 'id' | 'createdAt' | 'status'> & {
      id?: string;
      createdAt?: number;
    }
  ): Promise<{ success: boolean; claim?: Claim; error?: string }> {
    const claims = await this.getClaims(claimData.roomId);

    // Rate limiting
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    const recentDuplicate = claims.find(
      (c) =>
        c.broughtByMemberId === claimData.broughtByMemberId &&
        c.createdAt > tenMinutesAgo &&
        c.status !== 'removed'
    );

    if (recentDuplicate) {
      return {
        success: false,
        error: 'A claim was logged recently by you. Please wait a bit to avoid accidental duplicates.',
      };
    }

    const newClaim: Claim = {
      id: claimData.id || 'clm_' + Math.random().toString(36).substring(2, 10),
      roomId: claimData.roomId,
      broughtByMemberId: claimData.broughtByMemberId,
      onBehalfOfMemberId:
        claimData.onBehalfOfMemberId || claimData.broughtByMemberId,
      cost: Number(claimData.cost) || 0,
      note: claimData.note?.trim() || undefined,
      status: 'pending',
      createdAt: claimData.createdAt || Date.now(),
    };

    claims.push(newClaim);
    this.claims.set(claimData.roomId, claims);

    const members = await this.getMembers(claimData.roomId);
    const courier = members.find((m) => m.id === newClaim.broughtByMemberId)?.name || 'Someone';
    const beneficiary = members.find((m) => m.id === newClaim.onBehalfOfMemberId)?.name || courier;
    const proxyText =
      newClaim.onBehalfOfMemberId !== newClaim.broughtByMemberId
        ? ` on behalf of ${beneficiary}`
        : '';

    await this.addAuditEvent({
      roomId: newClaim.roomId,
      type: 'claim_created',
      memberId: newClaim.broughtByMemberId,
      details: `${courier} claimed bringing a can${proxyText} (awaiting roommate confirmation)`,
    });

    return { success: true, claim: newClaim };
  }

  async confirmClaim(
    claimId: string,
    roomId: string,
    confirmedByMemberId: string
  ): Promise<{ success: boolean; error?: string }> {
    const claims = await this.getClaims(roomId);
    const claim = claims.find((c) => c.id === claimId);

    if (!claim) return { success: false, error: 'Claim not found.' };

    if (claim.broughtByMemberId === confirmedByMemberId) {
      return {
        success: false,
        error: 'You cannot confirm your own claim! A roommate must verify it.',
      };
    }

    claim.status = 'confirmed';
    claim.confirmedByMemberId = confirmedByMemberId;
    claim.confirmedAt = Date.now();

    const members = await this.getMembers(roomId);
    const confirmer = members.find((m) => m.id === confirmedByMemberId)?.name || 'Roommate';
    const claimant = members.find((m) => m.id === claim.broughtByMemberId)?.name || 'Roommate';

    await this.addAuditEvent({
      roomId,
      type: 'claim_confirmed',
      memberId: confirmedByMemberId,
      details: `${confirmer} verified ${claimant}'s can delivery. Balances updated!`,
    });

    await this.resolveEmptyAlert(roomId);
    return { success: true };
  }

  async disputeClaim(
    claimId: string,
    roomId: string,
    disputedByMemberId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    const claims = await this.getClaims(roomId);
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return { success: false, error: 'Claim not found.' };

    claim.status = 'disputed';
    claim.disputeReason = reason;
    claim.disputedByMemberId = disputedByMemberId;
    claim.disputedAt = Date.now();

    const members = await this.getMembers(roomId);
    const disputer = members.find((m) => m.id === disputedByMemberId)?.name || 'Roommate';

    await this.addAuditEvent({
      roomId,
      type: 'claim_disputed',
      memberId: disputedByMemberId,
      details: `${disputer} queried the claim: "${reason}"`,
    });

    return { success: true };
  }

  async resolveDispute(
    claimId: string,
    roomId: string,
    memberId: string,
    resolution: 'confirm' | 'remove'
  ): Promise<{ success: boolean; message: string }> {
    const claims = await this.getClaims(roomId);
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return { success: false, message: 'Claim not found.' };

    const members = await this.getMembers(roomId);
    const memberName = members.find((m) => m.id === memberId)?.name || 'Roommate';

    if (resolution === 'confirm') {
      claim.status = 'confirmed';
      claim.confirmedAt = Date.now();
      claim.confirmedByMemberId = memberId;
      await this.addAuditEvent({
        roomId,
        type: 'claim_resolved',
        memberId,
        details: `${memberName} resolved query and confirmed the can.`,
      });
      return { success: true, message: 'Dispute resolved: Can confirmed!' };
    } else {
      claim.status = 'removed';
      await this.addAuditEvent({
        roomId,
        type: 'claim_removed',
        memberId,
        details: `${memberName} resolved query: claim discarded by agreement.`,
      });
      return { success: true, message: 'Dispute resolved: Claim removed.' };
    }
  }

  async checkAutoConfirmations(roomId: string, timeOffsetMs: number = 0): Promise<number> {
    const room = await this.getRoom(roomId);
    if (!room) return 0;
    const claims = await this.getClaims(roomId);
    const currentTime = Date.now() + timeOffsetMs;
    const threshold = room.autoConfirmHours * 3600 * 1000;
    let count = 0;

    for (const c of claims) {
      if (c.status === 'pending' && currentTime - c.createdAt >= threshold) {
        c.status = 'confirmed';
        c.confirmedAt = currentTime;
        c.confirmedByMemberId = 'system_auto_confirm';
        count++;
        await this.addAuditEvent({
          roomId,
          type: 'claim_confirmed',
          details: `Auto-confirmed after ${room.autoConfirmHours}h without dispute.`,
          createdAt: currentTime,
        });
      }
    }
    if (count > 0) {
      await this.resolveEmptyAlert(roomId);
    }
    return count;
  }

  async getAuditEvents(roomId: string): Promise<AuditEvent[]> {
    const list = this.events.get(roomId) || [];
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }

  async addAuditEvent(
    event: Omit<AuditEvent, 'id' | 'createdAt'> & { createdAt?: number }
  ): Promise<void> {
    const list = this.events.get(event.roomId) || [];
    const newEvent: AuditEvent = {
      id: 'evt_' + Math.random().toString(36).substring(2, 10),
      roomId: event.roomId,
      type: event.type,
      memberId: event.memberId,
      details: event.details,
      metadata: event.metadata,
      createdAt: event.createdAt || Date.now(),
    };
    list.unshift(newEvent);
    this.events.set(event.roomId, list);
  }

  async setEmptyAlert(
    roomId: string,
    reportedByMemberId: string,
    targetMemberId: string
  ): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) return;
    room.emptyAlert = {
      reportedAt: Date.now(),
      reportedByMemberId,
      targetMemberId,
      resolved: false,
    };
    const members = await this.getMembers(roomId);
    const reporter = members.find((m) => m.id === reportedByMemberId)?.name || 'Someone';
    const target = members.find((m) => m.id === targetMemberId)?.name || 'Roommate';

    await this.addAuditEvent({
      roomId,
      type: 'can_empty_alert',
      memberId: reportedByMemberId,
      details: `🪣 ${reporter} reported the can is empty! It is ${target}'s turn.`,
    });
  }

  async resolveEmptyAlert(roomId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (room && room.emptyAlert && !room.emptyAlert.resolved) {
      room.emptyAlert.resolved = true;
    }
  }

  async sendNudge(
    roomId: string,
    fromMemberId: string,
    targetMemberId: string,
    message: string,
    isAnonymous: boolean
  ): Promise<void> {
    const members = await this.getMembers(roomId);
    const target = members.find((m) => m.id === targetMemberId)?.name || 'Roommate';
    const sender = isAnonymous
      ? 'A flatmate (anonymously)'
      : members.find((m) => m.id === fromMemberId)?.name || 'Roommate';

    await this.addAuditEvent({
      roomId,
      type: 'nudge_sent',
      memberId: isAnonymous ? undefined : fromMemberId,
      details: `💬 ${sender} sent a gentle nudge to ${target}: "${message}"`,
    });
  }

  async recordSettlement(
    roomId: string,
    fromMemberId: string,
    toMemberId: string,
    amount: number,
    note?: string
  ): Promise<void> {
    const members = await this.getMembers(roomId);
    const fromName = members.find((m) => m.id === fromMemberId)?.name || 'Member';
    const toName = members.find((m) => m.id === toMemberId)?.name || 'Member';

    await this.addAuditEvent({
      roomId,
      type: 'cost_settled',
      memberId: fromMemberId,
      details: `💸 ${fromName} settled ₹${amount.toFixed(0)} with ${toName}${note ? ` (${note})` : ''}`,
    });
  }
}

// Single instance cache for active adapters
let localAdapterInstance: LocalStorageAdapter | null = null;
let demoAdapterInstance: InMemoryDemoAdapter | null = null;

export function getStorage(isDemo: boolean = false): StorageAdapter {
  if (isDemo) {
    if (!demoAdapterInstance) {
      demoAdapterInstance = new InMemoryDemoAdapter();
    }
    return demoAdapterInstance;
  }

  if (!localAdapterInstance) {
    localAdapterInstance = new LocalStorageAdapter();
  }
  return localAdapterInstance;
}

export function resetDemoStorage(): void {
  demoAdapterInstance = new InMemoryDemoAdapter();
}
