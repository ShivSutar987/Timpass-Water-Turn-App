/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import confetti from 'canvas-confetti';
import {
  AuditEvent,
  Claim,
  FairTurnResult,
  Member,
  PresenceChange,
  Room,
} from '../types';
import { calculateFairTurn } from '../utils/fairTurnLogic';
import {
  getStorage,
  resetDemoStorage,
  StorageAdapter,
} from '../services/storage';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

interface AppContextType {
  room: Room | null;
  members: Member[];
  presenceChanges: PresenceChange[];
  claims: Claim[];
  auditEvents: AuditEvent[];
  fairTurn: FairTurnResult;
  isDemo: boolean;
  activeMemberId: string | null;
  setActiveMemberId: (id: string) => void;
  activeMember: Member | null;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  activeTab: 'home' | 'members' | 'balance' | 'costs' | 'history' | 'settings' | 'ai';
  setActiveTab: (tab: 'home' | 'members' | 'balance' | 'costs' | 'history' | 'settings' | 'ai') => void;

  // Actions
  createRoom: (roomName: string, itemName: string, itemUnit: string, creatorName: string) => Promise<boolean>;
  joinRoomByCode: (code: string) => Promise<boolean>;
  leaveRoom: () => void;
  startDemo: () => void;
  exitDemo: () => void;

  claimBroughtCan: (cost?: number, note?: string, onBehalfOfMemberId?: string) => Promise<{ success: boolean; error?: string }>;
  confirmClaim: (claimId: string) => Promise<{ success: boolean; error?: string }>;
  disputeClaim: (claimId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  resolveDispute: (claimId: string, resolution: 'confirm' | 'remove') => Promise<{ success: boolean; message: string }>;

  toggleMemberPresence: (memberId: string, reason?: string) => Promise<void>;
  addNewMember: (name: string, color?: string, emoji?: string, upiId?: string) => Promise<void>;
  archiveMember: (memberId: string) => Promise<void>;
  unarchiveMember: (memberId: string) => Promise<void>;

  reportCanEmpty: () => Promise<void>;
  sendNudge: (targetMemberId: string, message: string, isAnonymous: boolean) => Promise<void>;
  recordSettlement: (toMemberId: string, amount: number, note?: string) => Promise<void>;
  updateRoomSettings: (updates: Partial<Room>) => Promise<void>;

  fastForwardTime: (hours: number) => Promise<number>;
  triggerConfetti: () => void;
  toasts: ToastState[];
  showToast: (message: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
  removeToast: (id: string) => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_EMOJIS = ['💧', '🥤', '🪣', '🌊', '🧊', '✨', '⚡️', '🚀', '🌟', '🫖'];
const DEFAULT_COLORS = [
  '#0284c7', // Sky Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemo, setIsDemo] = useState<boolean>(() => {
    return sessionStorage.getItem('panipari_is_demo') === 'true';
  });

  const [activeRoomId, setActiveRoomId] = useState<string | null>(() => {
    if (sessionStorage.getItem('panipari_is_demo') === 'true') {
      return 'demo-room-402';
    }
    return localStorage.getItem('panipari_active_room_id');
  });

  const [activeMemberId, setActiveMemberIdState] = useState<string | null>(() => {
    return localStorage.getItem('panipari_active_member_id') || null;
  });

  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [presenceChanges, setPresenceChanges] = useState<PresenceChange[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'members' | 'balance' | 'costs' | 'history' | 'settings' | 'ai'>('home');
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('panipari_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // Glassmorphism dark default
  });

  const setTheme = (t: 'dark' | 'light') => {
    setThemeState(t);
    localStorage.setItem('panipari_theme', t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#0284c7', '#0ea5e9', '#34d399', '#f472b6'],
      });
    } catch {
      // Fallback gracefully
    }
  }, []);

  const setActiveMemberId = (id: string) => {
    setActiveMemberIdState(id);
    localStorage.setItem('panipari_active_member_id', id);
  };

  const storage: StorageAdapter = useMemo(() => {
    return getStorage(isDemo);
  }, [isDemo]);

  const refreshData = useCallback(async () => {
    if (!activeRoomId) {
      setRoom(null);
      setMembers([]);
      setPresenceChanges([]);
      setClaims([]);
      setAuditEvents([]);
      return;
    }

    try {
      // Check auto confirmations first
      await storage.checkAutoConfirmations(activeRoomId);

      const [r, mems, pres, clms, evts] = await Promise.all([
        storage.getRoom(activeRoomId),
        storage.getMembers(activeRoomId),
        storage.getPresenceChanges(activeRoomId),
        storage.getClaims(activeRoomId),
        storage.getAuditEvents(activeRoomId),
      ]);

      setRoom(r);
      setMembers(mems);
      setPresenceChanges(pres);
      setClaims(clms);
      setAuditEvents(evts);

      // If no active member selected or current selection invalid, pick the first active member
      if (mems.length > 0) {
        if (!activeMemberId || !mems.some((m) => m.id === activeMemberId)) {
          const firstPresent = mems.find((m) => !m.isArchived) || mems[0];
          setActiveMemberId(firstPresent.id);
        }
      }
    } catch (e) {
      console.error('Failed to load room data:', e);
    }
  }, [activeRoomId, storage, activeMemberId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Compute fair-turn dynamically whenever members, claims, or presence changes update
  const fairTurn: FairTurnResult = useMemo(() => {
    return calculateFairTurn(members, claims, presenceChanges);
  }, [members, claims, presenceChanges]);

  const activeMember = useMemo(() => {
    return members.find((m) => m.id === activeMemberId) || null;
  }, [members, activeMemberId]);

  const createRoom = async (
    roomName: string,
    itemName: string,
    itemUnit: string,
    creatorName: string
  ): Promise<boolean> => {
    const trimmedRoom = roomName.trim() || 'Our Flat';
    const trimmedItem = itemName.trim() || 'Water Can';
    const trimmedUnit = itemUnit.trim() || 'Can';
    const trimmedCreator = creatorName.trim() || 'Me';

    // Generate unique 6-character room code (alphanumeric, upper)
    const code =
      'PP' +
      Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase();

    const roomId = 'room_' + Math.random().toString(36).substring(2, 10);
    const now = Date.now();

    const newRoom: Room = {
      id: roomId,
      code,
      name: trimmedRoom,
      itemName: trimmedItem,
      itemUnit: trimmedUnit,
      autoConfirmHours: 24,
      defaultCost: 35,
      currency: '₹',
      createdAt: now,
      emptyAlert: null,
    };

    const creatorMember: Member = {
      id: 'mem_' + Math.random().toString(36).substring(2, 10),
      roomId,
      name: trimmedCreator,
      color: DEFAULT_COLORS[0],
      emoji: DEFAULT_EMOJIS[0],
      joinedAt: now,
      isArchived: false,
    };

    const targetStorage = getStorage(false);
    await targetStorage.saveRoom(newRoom);
    await targetStorage.addMember(creatorMember);

    setIsDemo(false);
    sessionStorage.removeItem('panipari_is_demo');
    setActiveRoomId(roomId);
    localStorage.setItem('panipari_active_room_id', roomId);
    setActiveMemberId(creatorMember.id);

    showToast(`Room "${newRoom.name}" created! Room Code: ${code}`, 'success');
    return true;
  };

  const joinRoomByCode = async (code: string): Promise<boolean> => {
    const targetStorage = getStorage(false);
    const foundRoom = await targetStorage.getRoomByCode(code);
    if (!foundRoom) {
      showToast('Room not found. Please double check the 6-character room code.', 'error');
      return false;
    }

    setIsDemo(false);
    sessionStorage.removeItem('panipari_is_demo');
    setActiveRoomId(foundRoom.id);
    localStorage.setItem('panipari_active_room_id', foundRoom.id);

    const mems = await targetStorage.getMembers(foundRoom.id);
    if (mems.length > 0) {
      setActiveMemberId(mems[0].id);
    }

    showToast(`Joined ${foundRoom.name}!`, 'success');
    return true;
  };

  const leaveRoom = () => {
    setActiveRoomId(null);
    localStorage.removeItem('panipari_active_room_id');
    setIsDemo(false);
    sessionStorage.removeItem('panipari_is_demo');
    showToast('Left the room.', 'info');
  };

  const startDemo = () => {
    resetDemoStorage();
    setIsDemo(true);
    sessionStorage.setItem('panipari_is_demo', 'true');
    setActiveRoomId('demo-room-402');
    setActiveMemberId('demo-aarav');
    setActiveTab('home');
    showToast('Demo mode active! Runs in memory without touching real data.', 'info');
  };

  const exitDemo = () => {
    resetDemoStorage();
    setIsDemo(false);
    sessionStorage.removeItem('panipari_is_demo');
    const realRoomId = localStorage.getItem('panipari_active_room_id');
    setActiveRoomId(realRoomId);
    showToast('Exited demo mode. Welcome back!', 'info');
  };

  const claimBroughtCan = async (
    cost?: number,
    note?: string,
    onBehalfOfMemberId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!room || !activeMemberId) {
      return { success: false, error: 'Select an active member first.' };
    }

    const finalCost = cost !== undefined && cost >= 0 ? cost : room.defaultCost;
    const beneficiaryId = onBehalfOfMemberId || activeMemberId;

    const res = await storage.addClaim({
      roomId: room.id,
      broughtByMemberId: activeMemberId,
      onBehalfOfMemberId: beneficiaryId,
      cost: finalCost,
      note: note?.trim(),
    });

    if (res.success) {
      showToast('Claim submitted! Waiting for a roommate to confirm.', 'success');
      await refreshData();
    } else {
      showToast(res.error || 'Failed to submit claim.', 'error');
    }

    return res;
  };

  const confirmClaim = async (claimId: string): Promise<{ success: boolean; error?: string }> => {
    if (!room || !activeMemberId) {
      return { success: false, error: 'No active user selected.' };
    }

    const res = await storage.confirmClaim(claimId, room.id, activeMemberId);
    if (res.success) {
      triggerConfetti();
      showToast('Can confirmed! Balances updated.', 'success');
      await refreshData();
    } else {
      showToast(res.error || 'Confirmation failed.', 'error');
    }
    return res;
  };

  const disputeClaim = async (claimId: string, reason: string): Promise<{ success: boolean; error?: string }> => {
    if (!room || !activeMemberId) {
      return { success: false, error: 'No active user.' };
    }

    const res = await storage.disputeClaim(claimId, room.id, activeMemberId, reason);
    if (res.success) {
      showToast('Query raised. Claim is paused from rotation until resolved.', 'warning');
      await refreshData();
    } else {
      showToast(res.error || 'Failed to dispute claim.', 'error');
    }
    return res;
  };

  const resolveDispute = async (
    claimId: string,
    resolution: 'confirm' | 'remove'
  ): Promise<{ success: boolean; message: string }> => {
    if (!room || !activeMemberId) {
      return { success: false, message: 'No active user.' };
    }

    const res = await storage.resolveDispute(claimId, room.id, activeMemberId, resolution);
    if (res.success) {
      if (resolution === 'confirm') triggerConfetti();
      showToast(res.message, 'success');
      await refreshData();
    }
    return res;
  };

  const toggleMemberPresence = async (memberId: string, reason?: string): Promise<void> => {
    if (!room) return;
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    const currentStatus = presenceChanges
      .filter((pc) => pc.memberId === memberId)
      .sort((a, b) => a.changedAt - b.changedAt)
      .slice(-1)[0]?.status || 'present';

    const nextStatus = currentStatus === 'present' ? 'away' : 'present';

    await storage.setPresence(memberId, room.id, nextStatus, reason);
    showToast(
      `${member.name} is now ${nextStatus === 'away' ? 'Away (paused from turns)' : 'Present (in rotation)'}`,
      'info'
    );
    await refreshData();
  };

  const addNewMember = async (
    name: string,
    color?: string,
    emoji?: string,
    upiId?: string
  ): Promise<void> => {
    if (!room) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast('Please provide a roommate name.', 'error');
      return;
    }

    const colorIdx = members.length % DEFAULT_COLORS.length;
    const emojiIdx = members.length % DEFAULT_EMOJIS.length;

    const newMember: Member = {
      id: 'mem_' + Math.random().toString(36).substring(2, 10),
      roomId: room.id,
      name: trimmedName,
      color: color || DEFAULT_COLORS[colorIdx],
      emoji: emoji || DEFAULT_EMOJIS[emojiIdx],
      upiId: upiId?.trim() || undefined,
      joinedAt: Date.now(),
      isArchived: false,
    };

    await storage.addMember(newMember);
    showToast(`${newMember.name} joined the room!`, 'success');
    await refreshData();
  };

  const archiveMember = async (memberId: string): Promise<void> => {
    if (!room) return;
    await storage.archiveMember(memberId, room.id);
    showToast('Member moved to past roommates. History and balances preserved.', 'info');
    await refreshData();
  };

  const unarchiveMember = async (memberId: string): Promise<void> => {
    if (!room) return;
    await storage.unarchiveMember(memberId, room.id);
    showToast('Roommate reactivated.', 'success');
    await refreshData();
  };

  const reportCanEmpty = async (): Promise<void> => {
    if (!room || !activeMemberId) return;
    const nextPerson = fairTurn.nextMember;
    const targetId = nextPerson ? nextPerson.id : activeMemberId;

    await storage.setEmptyAlert(room.id, activeMemberId, targetId);
    showToast(`Empty ${room.itemName || 'can'} alert sent! ${nextPerson ? `${nextPerson.name} is next.` : ''}`, 'warning');
    await refreshData();
  };

  const sendNudge = async (
    targetMemberId: string,
    message: string,
    isAnonymous: boolean
  ): Promise<void> => {
    if (!room || !activeMemberId) return;
    await storage.sendNudge(room.id, activeMemberId, targetMemberId, message, isAnonymous);
    showToast('Gentle nudge sent to room feed!', 'success');
    await refreshData();
  };

  const recordSettlement = async (
    toMemberId: string,
    amount: number,
    note?: string
  ): Promise<void> => {
    if (!room || !activeMemberId) return;
    await storage.recordSettlement(room.id, activeMemberId, toMemberId, amount, note);
    triggerConfetti();
    showToast('Settlement recorded in history!', 'success');
    await refreshData();
  };

  const updateRoomSettings = async (updates: Partial<Room>): Promise<void> => {
    if (!room) return;
    const updated: Room = { ...room, ...updates };
    await storage.saveRoom(updated);
    setRoom(updated);
    showToast('Room settings saved.', 'success');
  };

  const fastForwardTime = async (hours: number): Promise<number> => {
    if (!room) return 0;
    const offsetMs = hours * 3600 * 1000;
    const count = await storage.checkAutoConfirmations(room.id, offsetMs);
    if (count > 0) {
      showToast(`Fast-forwarded ${hours}h: ${count} pending claim(s) auto-confirmed!`, 'success');
    } else {
      showToast(`Fast-forwarded ${hours}h: No pending claims reached the ${room.autoConfirmHours}h threshold.`, 'info');
    }
    await refreshData();
    return count;
  };

  return (
    <AppContext.Provider
      value={{
        room,
        members,
        presenceChanges,
        claims,
        auditEvents,
        fairTurn,
        isDemo,
        activeMemberId,
        setActiveMemberId,
        activeMember,
        theme,
        setTheme,
        activeTab,
        setActiveTab,
        createRoom,
        joinRoomByCode,
        leaveRoom,
        startDemo,
        exitDemo,
        claimBroughtCan,
        confirmClaim,
        disputeClaim,
        resolveDispute,
        toggleMemberPresence,
        addNewMember,
        archiveMember,
        unarchiveMember,
        reportCanEmpty,
        sendNudge,
        recordSettlement,
        updateRoomSettings,
        fastForwardTime,
        triggerConfetti,
        toasts,
        showToast,
        removeToast,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
