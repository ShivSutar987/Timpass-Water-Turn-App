package com.example.panipari.logic

import com.example.panipari.model.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.abs

object FairTurnLogic {

    fun isMemberPresentAt(
        member: Member,
        t: Long,
        presenceChanges: List<PresenceChange>
    ): Boolean {
        if (member.joinedAt > t) {
            return false
        }

        val memberChanges = presenceChanges
            .filter { it.memberId == member.id && it.changedAt <= t }
            .sortedBy { it.changedAt }

        if (memberChanges.isEmpty()) {
            return true
        }

        return memberChanges.last().status == PresenceStatus.PRESENT
    }

    fun isMemberCurrentlyPresent(
        member: Member,
        presenceChanges: List<PresenceChange>,
        now: Long = System.currentTimeMillis()
    ): Boolean {
        if (member.isArchived) return false
        return isMemberPresentAt(member, now, presenceChanges)
    }

    fun calculateFairTurn(
        members: List<Member>,
        claims: List<Claim>,
        presenceChanges: List<PresenceChange>,
        asOfTimestamp: Long = System.currentTimeMillis()
    ): FairTurnResult {
        val balanceMap = mutableMapOf<String, MemberBalanceCalculation>()

        for (m in members) {
            val isPresent = isMemberCurrentlyPresent(m, presenceChanges, asOfTimestamp)
            balanceMap[m.id] = MemberBalanceCalculation(
                memberId = m.id,
                memberName = m.name,
                isCurrentPresent = isPresent,
                totalCredits = 0.0,
                totalFairSharesOwed = 0.0,
                balance = 0.0,
                lastBroughtAt = null,
                cansCount = 0,
                costPaid = 0.0,
                costFairShareOwed = 0.0,
                costBalance = 0.0,
                whyDetails = emptyList()
            )
        }

        val confirmedClaims = claims
            .filter { it.status == ClaimStatus.CONFIRMED && (it.confirmedAt ?: it.createdAt) <= asOfTimestamp }
            .sortedBy { it.confirmedAt ?: it.createdAt }

        val dateFormat = SimpleDateFormat("MMM d", Locale.getDefault())

        for (claim in confirmedClaims) {
            val eventTime = claim.confirmedAt ?: claim.createdAt
            val presentAtEvent = members.filter { isMemberPresentAt(it, eventTime, presenceChanges) }
            val groupSize = presentAtEvent.size
            val canCost = if (claim.cost > 0) claim.cost else 0.0

            val beneficiaryId = if (claim.onBehalfOfMemberId.isNotBlank()) claim.onBehalfOfMemberId else claim.broughtByMemberId
            balanceMap[beneficiaryId]?.let { bRecord ->
                val newLastBrought = if (bRecord.lastBroughtAt == null || eventTime > bRecord.lastBroughtAt) {
                    eventTime
                } else {
                    bRecord.lastBroughtAt
                }
                balanceMap[beneficiaryId] = bRecord.copy(
                    totalCredits = bRecord.totalCredits + 1.0,
                    cansCount = bRecord.cansCount + 1,
                    lastBroughtAt = newLastBrought
                )
            }

            val payerId = claim.broughtByMemberId
            balanceMap[payerId]?.let { pRecord ->
                balanceMap[payerId] = pRecord.copy(
                    costPaid = pRecord.costPaid + canCost
                )
            }

            if (groupSize > 0) {
                val perMemberCanShare = 1.0 / groupSize
                val perMemberCostShare = canCost / groupSize

                for (presentMember in presentAtEvent) {
                    balanceMap[presentMember.id]?.let { record ->
                        val dateStr = dateFormat.format(Date(eventTime))
                        val costNote = if (canCost > 0) ", ₹${"%.0f".format(perMemberCostShare)}" else ""
                        val detail = "Delivery on $dateStr: 1/$groupSize share (${"%.2f".format(perMemberCanShare)} can$costNote)"

                        balanceMap[presentMember.id] = record.copy(
                            totalFairSharesOwed = record.totalFairSharesOwed + perMemberCanShare,
                            costFairShareOwed = record.costFairShareOwed + perMemberCostShare,
                            whyDetails = record.whyDetails + detail
                        )
                    }
                }
            }
        }

        // Finalize calculations
        for (m in members) {
            balanceMap[m.id]?.let { rec ->
                val finalBal = rec.totalCredits - rec.totalFairSharesOwed
                val finalCostBal = rec.costPaid - rec.costFairShareOwed
                balanceMap[m.id] = rec.copy(
                    balance = Math.round(finalBal * 10000.0) / 10000.0,
                    costBalance = Math.round(finalCostBal * 100.0) / 100.0
                )
            }
        }

        val activePresentMembers = members.filter {
            !it.isArchived && isMemberCurrentlyPresent(it, presenceChanges, asOfTimestamp)
        }

        if (activePresentMembers.isEmpty()) {
            return FairTurnResult(
                nextMember = null,
                reason = "No members are currently marked present.",
                balances = balanceMap,
                sortedCandidates = emptyList()
            )
        }

        val sorted = activePresentMembers.sortedWith { a, b ->
            val balA = balanceMap[a.id]?.balance ?: 0.0
            val balB = balanceMap[b.id]?.balance ?: 0.0

            if (abs(balA - balB) > 0.0001) {
                balA.compareTo(balB)
            } else {
                val lastA = balanceMap[a.id]?.lastBroughtAt
                val lastB = balanceMap[b.id]?.lastBroughtAt

                if (lastA == null && lastB != null) -1
                else if (lastA != null && lastB == null) 1
                else if (lastA != null && lastB != null && lastA != lastB) {
                    lastA.compareTo(lastB)
                } else {
                    a.name.compareTo(b.name, ignoreCase = true)
                }
            }
        }

        val nextMember = sorted.first()
        val nextRecord = balanceMap[nextMember.id] ?: MemberBalanceCalculation(nextMember.id, nextMember.name, true)
        val presentCount = activePresentMembers.size

        val reason = when {
            confirmedClaims.isEmpty() -> {
                "${nextMember.name}: No items logged yet. Selected first by tie-breaker (has not brought one yet)."
            }
            nextRecord.balance < -0.05 -> {
                val cansBehind = "%.1f".format(abs(nextRecord.balance))
                "${nextMember.name}: Balance ${"%.2f".format(nextRecord.balance)} ($cansBehind cans behind fair share among $presentCount present)."
            }
            abs(nextRecord.balance) <= 0.05 -> {
                val sign = if (nextRecord.balance >= 0) "+" else ""
                "${nextMember.name}: Balance $sign${"%.2f".format(nextRecord.balance)} (tied on fair share, longest since last turn)."
            }
            else -> {
                "${nextMember.name}: Balance +${"%.2f".format(nextRecord.balance)} (lowest balance among all $presentCount present members)."
            }
        }

        val sortedCandidates = sorted.map { m ->
            val rec = balanceMap[m.id] ?: MemberBalanceCalculation(m.id, m.name, true)
            val sign = if (rec.balance >= 0) "+" else ""
            var note = "Balance: $sign${"%.2f".format(rec.balance)}"
            note += if (rec.lastBroughtAt == null) {
                " • Never brought yet"
            } else {
                " • Last brought: ${dateFormat.format(Date(rec.lastBroughtAt))}"
            }
            CandidateInfo(
                member = m,
                balance = rec.balance,
                lastBroughtAt = rec.lastBroughtAt,
                explanation = note
            )
        }

        return FairTurnResult(
            nextMember = nextMember,
            reason = reason,
            balances = balanceMap,
            sortedCandidates = sortedCandidates
        )
    }

    fun calculatePairwiseDebts(
        members: List<Member>,
        balances: Map<String, MemberBalanceCalculation>
    ): List<PairwiseDebt> {
        val active = members.filter { !it.isArchived }

        data class NetCred(val member: Member, var remaining: Double)
        data class NetDebt(val member: Member, var remaining: Double)

        val creditors = active
            .map { NetCred(it, balances[it.id]?.costBalance ?: 0.0) }
            .filter { it.remaining > 0.5 }
            .sortedByDescending { it.remaining }
            .toMutableList()

        val debtors = active
            .map { NetDebt(it, abs(balances[it.id]?.costBalance ?: 0.0)) }
            .filter { (balances[it.member.id]?.costBalance ?: 0.0) < -0.5 }
            .sortedByDescending { it.remaining }
            .toMutableList()

        val results = mutableListOf<PairwiseDebt>()
        var cIdx = 0
        var dIdx = 0

        while (cIdx < creditors.size && dIdx < debtors.size) {
            val cred = creditors[cIdx]
            val debt = debtors[dIdx]
            val settleAmt = minOf(cred.remaining, debt.remaining)

            if (settleAmt > 0.5) {
                results.add(
                    PairwiseDebt(
                        from = debt.member,
                        to = cred.member,
                        amount = Math.round(settleAmt).toDouble()
                    )
                )
            }

            cred.remaining -= settleAmt
            debt.remaining -= settleAmt

            if (cred.remaining < 0.5) cIdx++
            if (debt.remaining < 0.5) dIdx++
        }

        return results
    }
}
