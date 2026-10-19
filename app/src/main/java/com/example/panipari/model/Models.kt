package com.example.panipari.model

enum class PresenceStatus {
    PRESENT,
    AWAY
}

enum class ClaimStatus {
    PENDING,
    CONFIRMED,
    DISPUTED,
    REMOVED
}

data class EmptyAlert(
    val reportedAt: Long,
    val reportedByMemberId: String,
    val targetMemberId: String,
    val resolved: Boolean
)

data class Room(
    val id: String,
    val code: String,
    val name: String,
    val itemName: String = "20L Water Can",
    val itemUnit: String = "Can",
    val autoConfirmHours: Int = 24,
    val defaultCost: Double = 35.0,
    val currency: String = "₹",
    val createdAt: Long = System.currentTimeMillis(),
    val emptyAlert: EmptyAlert? = null
)

data class Member(
    val id: String,
    val roomId: String,
    val name: String,
    val color: String = "#0284c7",
    val emoji: String = "💧",
    val upiId: String? = null,
    val joinedAt: Long = System.currentTimeMillis(),
    val isArchived: Boolean = false
)

data class PresenceChange(
    val id: String,
    val roomId: String,
    val memberId: String,
    val status: PresenceStatus,
    val changedAt: Long,
    val reason: String? = null
)

data class Claim(
    val id: String,
    val roomId: String,
    val broughtByMemberId: String,
    val onBehalfOfMemberId: String = broughtByMemberId,
    val cost: Double = 0.0,
    val note: String? = null,
    val status: ClaimStatus = ClaimStatus.PENDING,
    val createdAt: Long = System.currentTimeMillis(),
    val confirmedByMemberId: String? = null,
    val confirmedAt: Long? = null,
    val disputeReason: String? = null,
    val disputedByMemberId: String? = null,
    val disputedAt: Long? = null,
    val resolvedByMemberIds: List<String> = emptyList(),
    val resolvedAt: Long? = null
)

enum class EventType {
    CLAIM_CREATED,
    CLAIM_CONFIRMED,
    CLAIM_DISPUTED,
    CLAIM_RESOLVED,
    CLAIM_REMOVED,
    CAN_EMPTY_ALERT,
    NUDGE_SENT,
    PRESENCE_CHANGED,
    MEMBER_ADDED,
    MEMBER_ARCHIVED,
    MEMBER_UNARCHIVED,
    COST_SETTLED
}

data class AuditEvent(
    val id: String,
    val roomId: String,
    val type: EventType,
    val memberId: String? = null,
    val details: String,
    val createdAt: Long = System.currentTimeMillis()
)

data class MemberBalanceCalculation(
    val memberId: String,
    val memberName: String,
    val isCurrentPresent: Boolean,
    val totalCredits: Double = 0.0,
    val totalFairSharesOwed: Double = 0.0,
    val balance: Double = 0.0,
    val lastBroughtAt: Long? = null,
    val cansCount: Int = 0,
    val costPaid: Double = 0.0,
    val costFairShareOwed: Double = 0.0,
    val costBalance: Double = 0.0,
    val whyDetails: List<String> = emptyList()
)

data class CandidateInfo(
    val member: Member,
    val balance: Double,
    val lastBroughtAt: Long?,
    val explanation: String
)

data class FairTurnResult(
    val nextMember: Member?,
    val reason: String,
    val balances: Map<String, MemberBalanceCalculation>,
    val sortedCandidates: List<CandidateInfo>
)

data class PairwiseDebt(
    val from: Member,
    val to: Member,
    val amount: Double
)
