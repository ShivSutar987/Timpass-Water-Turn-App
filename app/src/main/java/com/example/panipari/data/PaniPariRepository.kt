package com.example.panipari.data

import com.example.panipari.logic.FairTurnLogic
import com.example.panipari.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID

class PaniPariRepository {

    private val _room = MutableStateFlow<Room?>(null)
    val room: StateFlow<Room?> = _room.asStateFlow()

    private val _members = MutableStateFlow<List<Member>>(emptyList())
    val members: StateFlow<List<Member>> = _members.asStateFlow()

    private val _presenceChanges = MutableStateFlow<List<PresenceChange>>(emptyList())
    val presenceChanges: StateFlow<List<PresenceChange>> = _presenceChanges.asStateFlow()

    private val _claims = MutableStateFlow<List<Claim>>(emptyList())
    val claims: StateFlow<List<Claim>> = _claims.asStateFlow()

    private val _auditEvents = MutableStateFlow<List<AuditEvent>>(emptyList())
    val auditEvents: StateFlow<List<AuditEvent>> = _auditEvents.asStateFlow()

    private val _activeMemberId = MutableStateFlow<String?>(null)
    val activeMemberId: StateFlow<String?> = _activeMemberId.asStateFlow()

    private val _isDemo = MutableStateFlow<Boolean>(false)
    val isDemo: StateFlow<Boolean> = _isDemo.asStateFlow()

    data class RoomBundle(
        val room: Room,
        val members: List<Member>,
        val presence: List<PresenceChange>,
        val claims: List<Claim>,
        val events: List<AuditEvent>
    )

    private val savedRoomsMap = mutableMapOf<String, RoomBundle>()
    private val _savedRooms = MutableStateFlow<List<Room>>(emptyList())
    val savedRooms: StateFlow<List<Room>> = _savedRooms.asStateFlow()

    init {
        // By default, start with demo loaded or empty
        startDemo()
    }

    fun setActiveMemberId(id: String?) {
        _activeMemberId.value = id
    }

    fun startDemo() {
        _isDemo.value = true
        val roomId = "demo-room-402"
        val now = System.currentTimeMillis()
        val oneDay = 24 * 60 * 60 * 1000L

        val demoRoom = Room(
            id = roomId,
            code = "DEMO42",
            name = "Flat 402 Hydration Hub",
            itemName = "20L Water Can",
            itemUnit = "Can",
            autoConfirmHours = 24,
            defaultCost = 35.0,
            currency = "₹",
            createdAt = now - 14 * oneDay,
            emptyAlert = EmptyAlert(
                reportedAt = now - 45 * 60 * 1000L,
                reportedByMemberId = "demo-rohan",
                targetMemberId = "demo-aarav",
                resolved = false
            )
        )

        val demoMembers = listOf(
            Member(
                id = "demo-aarav",
                roomId = roomId,
                name = "Aarav",
                color = "#0284c7",
                emoji = "💧",
                upiId = "aarav@okaxis",
                joinedAt = now - 14 * oneDay
            ),
            Member(
                id = "demo-priya",
                roomId = roomId,
                name = "Priya",
                color = "#ec4899",
                emoji = "✨",
                upiId = "priya@okhdfcbank",
                joinedAt = now - 14 * oneDay
            ),
            Member(
                id = "demo-rohan",
                roomId = roomId,
                name = "Rohan",
                color = "#10b981",
                emoji = "🥤",
                upiId = "rohan@icici",
                joinedAt = now - 14 * oneDay
            ),
            Member(
                id = "demo-sneha",
                roomId = roomId,
                name = "Sneha",
                color = "#f59e0b",
                emoji = "🪣",
                upiId = "sneha@paytm",
                joinedAt = now - 7 * oneDay
            )
        )

        val demoPresence = listOf(
            PresenceChange(
                id = "pc-1",
                roomId = roomId,
                memberId = "demo-sneha",
                status = PresenceStatus.AWAY,
                changedAt = now - 5 * oneDay,
                reason = "Weekend trip home"
            ),
            PresenceChange(
                id = "pc-2",
                roomId = roomId,
                memberId = "demo-sneha",
                status = PresenceStatus.PRESENT,
                changedAt = now - 3 * oneDay,
                reason = "Back in flat"
            )
        )

        val demoClaims = listOf(
            Claim(
                id = "c-1",
                roomId = roomId,
                broughtByMemberId = "demo-aarav",
                cost = 35.0,
                status = ClaimStatus.CONFIRMED,
                createdAt = now - 12 * oneDay,
                confirmedByMemberId = "demo-priya",
                confirmedAt = now - 12 * oneDay
            ),
            Claim(
                id = "c-2",
                roomId = roomId,
                broughtByMemberId = "demo-priya",
                cost = 35.0,
                status = ClaimStatus.CONFIRMED,
                createdAt = now - 9 * oneDay,
                confirmedByMemberId = "demo-rohan",
                confirmedAt = now - 9 * oneDay
            ),
            Claim(
                id = "c-3",
                roomId = roomId,
                broughtByMemberId = "demo-rohan",
                cost = 35.0,
                status = ClaimStatus.CONFIRMED,
                createdAt = now - 6 * oneDay,
                confirmedByMemberId = "demo-priya",
                confirmedAt = now - 6 * oneDay
            ),
            Claim(
                id = "c-4",
                roomId = roomId,
                broughtByMemberId = "demo-priya",
                cost = 35.0,
                status = ClaimStatus.CONFIRMED,
                createdAt = now - 3 * oneDay,
                confirmedByMemberId = "demo-rohan",
                confirmedAt = now - 3 * oneDay
            ),
            Claim(
                id = "c-5",
                roomId = roomId,
                broughtByMemberId = "demo-sneha",
                cost = 35.0,
                note = "Ordered via water delivery app",
                status = ClaimStatus.PENDING,
                createdAt = now - 20 * 60 * 1000L
            )
        )

        val demoEvents = listOf(
            AuditEvent(
                id = "evt-1",
                roomId = roomId,
                type = EventType.CAN_EMPTY_ALERT,
                memberId = "demo-rohan",
                details = "🪣 Rohan reported the 20L Water Can is empty! It is Aarav's turn.",
                createdAt = now - 45 * 60 * 1000L
            ),
            AuditEvent(
                id = "evt-2",
                roomId = roomId,
                type = EventType.CLAIM_CREATED,
                memberId = "demo-sneha",
                details = "Sneha claimed bringing a 20L Water Can (awaiting roommate confirmation)",
                createdAt = now - 20 * 60 * 1000L
            ),
            AuditEvent(
                id = "evt-3",
                roomId = roomId,
                type = EventType.CLAIM_CONFIRMED,
                memberId = "demo-rohan",
                details = "Rohan verified Priya's can delivery. Balances updated!",
                createdAt = now - 3 * oneDay
            ),
            AuditEvent(
                id = "evt-4",
                roomId = roomId,
                type = EventType.PRESENCE_CHANGED,
                memberId = "demo-sneha",
                details = "Sneha marked status as Present (back in rotation)",
                createdAt = now - 3 * oneDay
            )
        )

        _room.value = demoRoom
        _members.value = demoMembers
        _presenceChanges.value = demoPresence
        _claims.value = demoClaims
        _auditEvents.value = demoEvents
        _activeMemberId.value = "demo-aarav"
    }

    fun exitDemo() {
        _isDemo.value = false
        _room.value = null
        _members.value = emptyList()
        _presenceChanges.value = emptyList()
        _claims.value = emptyList()
        _auditEvents.value = emptyList()
        _activeMemberId.value = null
    }

    fun leaveRoom() {
        val curr = _room.value
        if (curr != null && !_isDemo.value) {
            savedRoomsMap[curr.id] = RoomBundle(curr, _members.value, _presenceChanges.value, _claims.value, _auditEvents.value)
            _savedRooms.value = savedRoomsMap.values.map { it.room }
        }
        _room.value = null
        _members.value = emptyList()
        _presenceChanges.value = emptyList()
        _claims.value = emptyList()
        _auditEvents.value = emptyList()
        _activeMemberId.value = null
        _isDemo.value = false
    }

    fun openSavedRoom(roomId: String): Boolean {
        val bundle = savedRoomsMap[roomId] ?: return false
        _room.value = bundle.room
        _members.value = bundle.members
        _presenceChanges.value = bundle.presence
        _claims.value = bundle.claims
        _auditEvents.value = bundle.events
        _activeMemberId.value = bundle.members.firstOrNull()?.id
        _isDemo.value = false
        return true
    }

    fun deleteSavedRoom(roomId: String) {
        savedRoomsMap.remove(roomId)
        _savedRooms.value = savedRoomsMap.values.map { it.room }
        if (_room.value?.id == roomId) {
            leaveRoom()
        }
    }

    fun createRoom(roomName: String, itemName: String, itemUnit: String, creatorName: String): Boolean {
        val roomId = "rm_" + UUID.randomUUID().toString().substring(0, 8)
        val codeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        val code = (1..6).map { codeChars.random() }.joinToString("")
        val now = System.currentTimeMillis()

        val newRoom = Room(
            id = roomId,
            code = code,
            name = roomName.trim(),
            itemName = itemName.trim().ifEmpty { "20L Water Can" },
            itemUnit = itemUnit.trim().ifEmpty { "Can" },
            createdAt = now
        )

        val creator = Member(
            id = "mem_" + UUID.randomUUID().toString().substring(0, 8),
            roomId = roomId,
            name = creatorName.trim(),
            color = "#0284c7",
            emoji = "💧",
            joinedAt = now
        )

        val events = listOf(
            AuditEvent(
                id = "evt_" + UUID.randomUUID().toString().substring(0, 8),
                roomId = roomId,
                type = EventType.MEMBER_ADDED,
                memberId = creator.id,
                details = "Room created by ${creator.name}. Code: $code",
                createdAt = now
            )
        )

        _room.value = newRoom
        _members.value = listOf(creator)
        _presenceChanges.value = emptyList()
        _claims.value = emptyList()
        _auditEvents.value = events
        _activeMemberId.value = creator.id
        _isDemo.value = false

        // Save into device flat storage
        savedRoomsMap[newRoom.id] = RoomBundle(newRoom, listOf(creator), emptyList(), emptyList(), events)
        _savedRooms.value = savedRoomsMap.values.map { it.room }
        return true
    }

    fun joinRoomByCode(code: String, userName: String? = null): Boolean {
        val clean = code.trim().uppercase()
        val current = _room.value
        if (current != null && current.code.equals(clean, ignoreCase = true)) {
            return true
        }
        // Check saved rooms on this phone
        val saved = savedRoomsMap.values.find { it.room.code.equals(clean, ignoreCase = true) }
        if (saved != null) {
            openSavedRoom(saved.room.id)
            return true
        }
        // Demo room
        if (clean == "DEMO42") {
            startDemo()
            return true
        }
        // Import or connect friend's room
        val newId = "rm_" + UUID.randomUUID().toString().substring(0, 8)
        val importedRoom = Room(
            id = newId,
            code = clean,
            name = "Flat $clean",
            itemName = "20L Water Can",
            itemUnit = "Can",
            createdAt = System.currentTimeMillis()
        )
        val joiner = Member(
            id = "mem_" + UUID.randomUUID().toString().substring(0, 8),
            roomId = newId,
            name = userName?.trim()?.ifEmpty { "Me" } ?: "Me",
            color = "#0284c7",
            emoji = "💧",
            joinedAt = System.currentTimeMillis()
        )
        val events = listOf(
            AuditEvent(
                id = "evt_" + UUID.randomUUID().toString().substring(0, 8),
                roomId = newId,
                type = EventType.MEMBER_ADDED,
                memberId = joiner.id,
                details = "${joiner.name} joined room $clean",
                createdAt = System.currentTimeMillis()
            )
        )
        val bundle = RoomBundle(importedRoom, listOf(joiner), emptyList(), emptyList(), events)
        savedRoomsMap[newId] = bundle
        _savedRooms.value = savedRoomsMap.values.map { it.room }
        openSavedRoom(newId)
        return true
    }

    fun claimBroughtCan(
        cost: Double?,
        note: String?,
        onBehalfOfMemberId: String?
    ): Result<Claim> {
        val r = _room.value ?: return Result.failure(Exception("No active room"))
        val currentMemberId = _activeMemberId.value ?: return Result.failure(Exception("Select active member"))

        val tenMinutesAgo = System.currentTimeMillis() - 10 * 60 * 1000L
        val recentDuplicate = _claims.value.find {
            it.broughtByMemberId == currentMemberId &&
                    it.createdAt > tenMinutesAgo &&
                    it.status != ClaimStatus.REMOVED
        }
        if (recentDuplicate != null) {
            val waitMins = Math.max(1, ((recentDuplicate.createdAt + 10 * 60 * 1000L - System.currentTimeMillis()) / (60 * 1000L)).toInt())
            return Result.failure(Exception("A delivery claim was logged recently by you. To avoid duplicates, please wait ~$waitMins min."))
        }

        val beneficiary = onBehalfOfMemberId ?: currentMemberId
        val finalCost = cost ?: r.defaultCost
        val now = System.currentTimeMillis()

        val newClaim = Claim(
            id = "clm_" + UUID.randomUUID().toString().substring(0, 8),
            roomId = r.id,
            broughtByMemberId = currentMemberId,
            onBehalfOfMemberId = beneficiary,
            cost = finalCost,
            note = note?.trim()?.ifEmpty { null },
            status = ClaimStatus.PENDING,
            createdAt = now
        )

        _claims.value = _claims.value + newClaim

        val courier = _members.value.find { it.id == currentMemberId }?.name ?: "Someone"
        val proxyTarget = _members.value.find { it.id == beneficiary }?.name ?: courier
        val proxyText = if (beneficiary != currentMemberId) " on behalf of $proxyTarget" else ""

        val event = AuditEvent(
            id = "evt_" + UUID.randomUUID().toString().substring(0, 8),
            roomId = r.id,
            type = EventType.CLAIM_CREATED,
            memberId = currentMemberId,
            details = "$courier claimed bringing a ${r.itemName}$proxyText (awaiting roommate confirmation)",
            createdAt = now
        )
        _auditEvents.value = listOf(event) + _auditEvents.value
        return Result.success(newClaim)
    }

    fun confirmClaim(claimId: String): Result<Unit> {
        val r = _room.value ?: return Result.failure(Exception("No active room"))
        val currentMemberId = _activeMemberId.value ?: return Result.failure(Exception("Select active member"))

        val claim = _claims.value.find { it.id == claimId } ?: return Result.failure(Exception("Claim not found"))

        // Peer-verification rule: cannot verify your own claim
        if (claim.broughtByMemberId == currentMemberId) {
            return Result.failure(Exception("You cannot confirm your own claim! A roommate must verify it."))
        }

        if (claim.status == ClaimStatus.CONFIRMED) {
            return Result.success(Unit)
        }

        val now = System.currentTimeMillis()
        val updated = claim.copy(
            status = ClaimStatus.CONFIRMED,
            confirmedByMemberId = currentMemberId,
            confirmedAt = now
        )

        _claims.value = _claims.value.map { if (it.id == claimId) updated else it }

        // Also resolve empty alert if one is active
        if (r.emptyAlert != null && !r.emptyAlert.resolved) {
            _room.value = r.copy(emptyAlert = r.emptyAlert.copy(resolved = true))
        }

        val confirmer = _members.value.find { it.id == currentMemberId }?.name ?: "A roommate"
        val claimant = _members.value.find { it.id == claim.broughtByMemberId }?.name ?: "Roommate"

        val event = AuditEvent(
            id = "evt_" + UUID.randomUUID().toString().substring(0, 8),
            roomId = r.id,
            type = EventType.CLAIM_CONFIRMED,
            memberId = currentMemberId,
            details = "$confirmer verified $claimant's ${r.itemName} delivery. Balances updated!",
            createdAt = now
        )
        _auditEvents.value = listOf(event) + _auditEvents.value
        return Result.success(Unit)
    }

    fun disputeClaim(claimId: String, reason: String): Result<Unit> {
        val r = _room.value ?: return Result.failure(Exception("No active room"))
        val currentMemberId = _activeMemberId.value ?: return Result.failure(Exception("Select active member"))

        val claim = _claims.value.find { it.id == claimId } ?: return Result.failure(Exception("Claim not found"))
        val now = System.currentTimeMillis()

        val updated = claim.copy(
            status = ClaimStatus.DISPUTED,
            disputeReason = reason.trim(),
            disputedByMemberId = currentMemberId,
            disputedAt = now
        )

        _claims.value = _claims.value.map { if (it.id == claimId) updated else it }

        val disputer = _members.value.find { it.id == currentMemberId }?.name ?: "A roommate"
        val claimant = _members.value.find { it.id == claim.broughtByMemberId }?.name ?: "Roommate"

        val event = AuditEvent(
            id = "evt_" + UUID.randomUUID().toString().substring(0, 8),
            roomId = r.id,
            type = EventType.CLAIM_DISPUTED,
            memberId = currentMemberId,
            details = "⚠️ $disputer disputed $claimant's claim: \"${reason.trim()}\"",
            createdAt = now
        )
        _auditEvents.value = listOf(event) + _auditEvents.value
        return Result.success(Unit)
    }

    fun resolveDispute(claimId: String, resolution: String): Result<String> {
        val r = _room.value ?: return Result.failure(Exception("No active room"))
        val currentMemberId = _activeMemberId.value ?: return Result.failure(Exception("Select active member"))
        val claim = _claims.value.find { it.id == claimId } ?: return Result.failure(Exception("Claim not found"))

        val now = System.currentTimeMillis()
        val resolverName = _members.value.find { it.id == currentMemberId }?.name ?: "Roommates"

        val updated = if (resolution == "confirm") {
            claim.copy(status = ClaimStatus.CONFIRMED, confirmedAt = now, resolvedAt = now)
        } else {
            claim.copy(status = ClaimStatus.REMOVED, resolvedAt = now)
        }

        _claims.value = _claims.value.map { if (it.id == claimId) updated else it }

        val details = if (resolution == "confirm") {
            "✅ $resolverName voted to confirm disputed claim."
        } else {
            "❌ $resolverName voted to remove disputed claim."
        }

        val event = AuditEvent(
            id = "evt_" + UUID.randomUUID().toString().substring(0, 8),
            roomId = r.id,
            type = EventType.CLAIM_RESOLVED,
            memberId = currentMemberId,
            details = details,
            createdAt = now
        )
        _auditEvents.value = listOf(event) + _auditEvents.value
        return Result.success(if (resolution == "confirm") "Claim confirmed" else "Claim removed")
    }

    fun toggleMemberPresence(memberId: String, reason: String? = null) {
        val r = _room.value ?: return
        val currentStatus = FairTurnLogic.isMemberCurrentlyPresent(
            _members.value.find { it.id == memberId } ?: return,
            _presenceChanges.value
        )
        val newStatus = if (currentStatus) PresenceStatus.AWAY else PresenceStatus.PRESENT
        val now = System.currentTimeMillis()

        val pc = PresenceChange(
            id = "pc_" + UUID.randomUUID().toString().substring(0, 8),
            roomId = r.id,
            memberId = memberId,
            status = newStatus,
            changedAt = now,
            reason = reason
        )
        _presenceChanges.value = _presenceChanges.value + pc

        val memberName = _members.value.find { it.id == memberId }?.name ?: "Member"
        val statusText = if (newStatus == PresenceStatus.AWAY) "Away (paused from turns)" else "Present (back in rotation)"
        val reasonText = if (!reason.isNullOrBlank()) " ($reason)" else ""

        val event = AuditEvent(
            id = "evt_" + UUID.randomUUID().toString().substring(0, 8),
            roomId = r.id,
            type = EventType.PRESENCE_CHANGED,
            memberId = memberId,
            details = "$memberName marked status as $statusText$reasonText",
            createdAt = now
        )
        _auditEvents.value = listOf(event) + _auditEvents.value
    }

    fun addNewMember(name: String, color: String = "#0284c7", emoji: String = "💧", upiId: String? = null) {
        val r = _room.value ?: return
        val newMember = Member(
            id = "mem_" + UUID.randomUUID().toString().substring(0, 8),
            roomId = r.id,
            name = name.trim(),
            color = color,
            emoji = emoji,
            upiId = upiId?.trim()?.ifEmpty { null },
            joinedAt = System.currentTimeMillis()
        )
        _members.value = _members.value + newMember

        val event = AuditEvent(
            id = "evt_" + UUID.randomUUID().toString().substring(0, 8),
            roomId = r.id,
            type = EventType.MEMBER_ADDED,
            memberId = newMember.id,
            details = "${newMember.name} joined the rotation!",
            createdAt = System.currentTimeMillis()
        )
        _auditEvents.value = listOf(event) + _auditEvents.value
    }

    fun archiveMember(memberId: String) {
        val r = _room.value ?: return
        _members.value = _members.value.map {
            if (it.id == memberId) it.copy(isArchived = true) else it
        }
        val name = _members.value.find { it.id == memberId }?.name ?: "Member"
        val event = AuditEvent(
            id = "evt_" + UUID.randomUUID().toString().substring(0, 8),
            roomId = r.id,
            type = EventType.MEMBER_ARCHIVED,
            memberId = memberId,
            details = "$name moved out (archived).",
            createdAt = System.currentTimeMillis()
        )
        _auditEvents.value = listOf(event) + _auditEvents.value
    }

    fun unarchiveMember(memberId: String) {
        val r = _room.value ?: return
        _members.value = _members.value.map {
            if (it.id == memberId) it.copy(isArchived = false) else it
        }
        val name = _members.value.find { it.id == memberId }?.name ?: "Member"
        val event = AuditEvent(
            id = "evt_" + UUID.randomUUID().toString().substring(0, 8),
            roomId = r.id,
            type = EventType.MEMBER_UNARCHIVED,
            memberId = memberId,
            details = "$name unarchived and back in flat rotation.",
            createdAt = System.currentTimeMillis()
        )
        _auditEvents.value = listOf(event) + _auditEvents.value
    }

    fun reportCanEmpty() {
        val r = _room.value ?: return
        val currentMemberId = _activeMemberId.value ?: return
        val result = FairTurnLogic.calculateFairTurn(_members.value, _claims.value, _presenceChanges.value)
        val targetId = result.nextMember?.id ?: ""
        val now = System.currentTimeMillis()

        _room.value = r.copy(
            emptyAlert = EmptyAlert(
                reportedAt = now,
                reportedByMemberId = currentMemberId,
                targetMemberId = targetId,
                resolved = false
            )
        )

        val reporter = _members.value.find { it.id == currentMemberId }?.name ?: "Someone"
        val targetName = result.nextMember?.name ?: "The next person"

        val event = AuditEvent(
            id = "evt_" + UUID.randomUUID().toString().substring(0, 8),
            roomId = r.id,
            type = EventType.CAN_EMPTY_ALERT,
            memberId = currentMemberId,
            details = "🪣 $reporter reported the ${r.itemName} is empty! It is $targetName's turn.",
            createdAt = now
        )
        _auditEvents.value = listOf(event) + _auditEvents.value
    }

    fun sendNudge(targetMemberId: String, message: String, isAnonymous: Boolean) {
        val r = _room.value ?: return
        val currentMemberId = _activeMemberId.value
        val target = _members.value.find { it.id == targetMemberId }?.name ?: "Roommate"
        val sender = if (isAnonymous) "A flatmate (anonymously)" else (_members.value.find { it.id == currentMemberId }?.name ?: "Roommate")

        val event = AuditEvent(
            id = "evt_" + UUID.randomUUID().toString().substring(0, 8),
            roomId = r.id,
            type = EventType.NUDGE_SENT,
            memberId = if (isAnonymous) null else currentMemberId,
            details = "💬 $sender sent a gentle nudge to $target: \"$message\"",
            createdAt = System.currentTimeMillis()
        )
        _auditEvents.value = listOf(event) + _auditEvents.value
    }

    fun recordSettlement(toMemberId: String, amount: Double, note: String?) {
        val r = _room.value ?: return
        val currentMemberId = _activeMemberId.value ?: return
        val fromName = _members.value.find { it.id == currentMemberId }?.name ?: "Member"
        val toName = _members.value.find { it.id == toMemberId }?.name ?: "Member"
        val noteText = if (!note.isNullOrBlank()) " ($note)" else ""

        val event = AuditEvent(
            id = "evt_" + UUID.randomUUID().toString().substring(0, 8),
            roomId = r.id,
            type = EventType.COST_SETTLED,
            memberId = currentMemberId,
            details = "💸 $fromName settled ₹${"%.0f".format(amount)} with $toName$noteText",
            createdAt = System.currentTimeMillis()
        )
        _auditEvents.value = listOf(event) + _auditEvents.value
    }

    fun updateRoomSettings(
        name: String,
        itemName: String,
        itemUnit: String,
        autoConfirmHours: Int,
        defaultCost: Double
    ) {
        val r = _room.value ?: return
        _room.value = r.copy(
            name = name.trim().ifEmpty { r.name },
            itemName = itemName.trim().ifEmpty { r.itemName },
            itemUnit = itemUnit.trim().ifEmpty { r.itemUnit },
            autoConfirmHours = maxOf(1, autoConfirmHours),
            defaultCost = maxOf(0.0, defaultCost)
        )
    }

    fun fastForwardTime(hours: Int): Int {
        val r = _room.value ?: return 0
        val threshold = System.currentTimeMillis() - (r.autoConfirmHours - hours) * 3600 * 1000L
        var autoConfirmedCount = 0

        val updatedClaims = _claims.value.map { c ->
            if (c.status == ClaimStatus.PENDING && c.createdAt <= threshold) {
                autoConfirmedCount++
                c.copy(
                    status = ClaimStatus.CONFIRMED,
                    confirmedByMemberId = "auto-system",
                    confirmedAt = System.currentTimeMillis()
                )
            } else {
                c
            }
        }
        _claims.value = updatedClaims

        if (autoConfirmedCount > 0) {
            val event = AuditEvent(
                id = "evt_" + UUID.randomUUID().toString().substring(0, 8),
                roomId = r.id,
                type = EventType.CLAIM_CONFIRMED,
                memberId = "auto-system",
                details = "⏰ Fast-forward simulated $hours hrs: $autoConfirmedCount pending delivery auto-confirmed (${r.autoConfirmHours}h timeout reached).",
                createdAt = System.currentTimeMillis()
            )
            _auditEvents.value = listOf(event) + _auditEvents.value
        }
        return autoConfirmedCount
    }
}
