package com.example.panipari.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.panipari.data.PaniPariRepository
import com.example.panipari.logic.FairTurnLogic
import com.example.panipari.model.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

enum class AppTab(val title: String) {
    HOME("Turn"),
    MEMBERS("Roommates"),
    BALANCE("Balance"),
    COSTS("Costs"),
    AI("AI Help"),
    HISTORY("History"),
    SETTINGS("Settings")
}

class PaniPariViewModel(
    val repository: PaniPariRepository = PaniPariRepository()
) : ViewModel() {

    val room = repository.room
    val members = repository.members
    val presenceChanges = repository.presenceChanges
    val claims = repository.claims
    val auditEvents = repository.auditEvents
    val activeMemberId = repository.activeMemberId
    val isDemo = repository.isDemo
    val savedRooms = repository.savedRooms
    val storage = repository

    private val _activeTab = MutableStateFlow(AppTab.HOME)
    val activeTab: StateFlow<AppTab> = _activeTab.asStateFlow()

    private val _toastMessage = MutableStateFlow<String?>(null)
    val toastMessage: StateFlow<String?> = _toastMessage.asStateFlow()

    // Dialog state
    var showClaimDialog = MutableStateFlow(false)
    var showNudgeDialog = MutableStateFlow(false)
    var showDisputeDialogForClaim = MutableStateFlow<Claim?>(null)
    var showWhyDialogForMember = MutableStateFlow<Pair<Member, MemberBalanceCalculation>?>(null)
    var showSettleDialogForDebt = MutableStateFlow<PairwiseDebt?>(null)
    var showQrShareDialog = MutableStateFlow(false)
    var showQrScannerDialog = MutableStateFlow(false)
    var showAddMemberDialog = MutableStateFlow(false)

    val fairTurnResult: StateFlow<FairTurnResult> = combine(
        members,
        claims,
        presenceChanges
    ) { mList, cList, pList ->
        FairTurnLogic.calculateFairTurn(mList, cList, pList)
    }.stateIn(
        viewModelScope,
        SharingStarted.Eagerly,
        FairTurnResult(null, "Calculating...", emptyMap(), emptyList())
    )

    val activeMember: StateFlow<Member?> = combine(
        members,
        activeMemberId
    ) { mList, id ->
        mList.find { it.id == id }
    }.stateIn(viewModelScope, SharingStarted.Eagerly, null)

    fun setActiveTab(tab: AppTab) {
        _activeTab.value = tab
    }

    fun setActiveMemberId(id: String) {
        repository.setActiveMemberId(id)
        showToast("Switched active member")
    }

    fun showToast(message: String) {
        _toastMessage.value = message
    }

    fun clearToast() {
        _toastMessage.value = null
    }

    fun createRoom(name: String, itemName: String, itemUnit: String, creatorName: String) {
        if (repository.createRoom(name, itemName, itemUnit, creatorName)) {
            _activeTab.value = AppTab.HOME
            showToast("Room created! Saved permanently to phone storage.")
        }
    }

    fun joinRoom(code: String, userName: String? = null, parsedInvite: Any? = null) {
        if (repository.joinRoomByCode(code, userName)) {
            _activeTab.value = AppTab.HOME
            showToast("Joined flat successfully! Saved to phone.")
        } else {
            showToast("Room code not found. Try 'DEMO42'")
        }
    }

    fun openSavedRoom(roomId: String) {
        if (repository.openSavedRoom(roomId)) {
            _activeTab.value = AppTab.HOME
            showToast("Opened flat from phone storage")
        }
    }

    fun deleteSavedRoom(roomId: String) {
        repository.deleteSavedRoom(roomId)
        showToast("Flat removed from phone storage")
    }

    fun leaveRoom() {
        repository.leaveRoom()
        _activeTab.value = AppTab.HOME
        showToast("Left flat. Rejoin anytime from your saved flats list.")
    }

    fun startDemo() {
        repository.startDemo()
        _activeTab.value = AppTab.HOME
        showToast("Entered Demo Mode (Flat 402)")
    }

    fun exitDemo() {
        repository.exitDemo()
        _activeTab.value = AppTab.HOME
        showToast("Exited demo")
    }

    fun claimBroughtCan(cost: Double?, note: String?, onBehalfOfMemberId: String?) {
        val result = repository.claimBroughtCan(cost, note, onBehalfOfMemberId)
        result.onSuccess {
            showClaimDialog.value = false
            showToast("Delivery logged! Awaiting roommate verification.")
        }.onFailure {
            showToast(it.message ?: "Failed to log delivery")
        }
    }

    fun confirmClaim(claimId: String) {
        val result = repository.confirmClaim(claimId)
        result.onSuccess {
            showToast("Delivery verified! Balances updated.")
        }.onFailure {
            showToast(it.message ?: "Could not confirm")
        }
    }

    fun disputeClaim(claimId: String, reason: String) {
        val result = repository.disputeClaim(claimId, reason)
        result.onSuccess {
            showDisputeDialogForClaim.value = null
            showToast("Dispute flagged for flatmate review.")
        }.onFailure {
            showToast(it.message ?: "Error raising dispute")
        }
    }

    fun resolveDispute(claimId: String, resolution: String) {
        val result = repository.resolveDispute(claimId, resolution)
        result.onSuccess {
            showToast(it)
        }.onFailure {
            showToast(it.message ?: "Error resolving dispute")
        }
    }

    fun toggleMemberPresence(memberId: String, reason: String? = null) {
        repository.toggleMemberPresence(memberId, reason)
        showToast("Presence status updated")
    }

    fun addNewMember(name: String, color: String, emoji: String, upiId: String?) {
        repository.addNewMember(name, color, emoji, upiId)
        showAddMemberDialog.value = false
        showToast("$name added to flat!")
    }

    fun archiveMember(memberId: String) {
        repository.archiveMember(memberId)
        showToast("Flatmate archived")
    }

    fun unarchiveMember(memberId: String) {
        repository.unarchiveMember(memberId)
        showToast("Flatmate unarchived")
    }

    fun reportCanEmpty() {
        repository.reportCanEmpty()
        showToast("Empty alert broadcasted to flat!")
    }

    fun sendNudge(targetMemberId: String, message: String, isAnonymous: Boolean) {
        repository.sendNudge(targetMemberId, message, isAnonymous)
        showNudgeDialog.value = false
        showToast("Nudge sent!")
    }

    fun recordSettlement(toMemberId: String, amount: Double, note: String?) {
        repository.recordSettlement(toMemberId, amount, note)
        showSettleDialogForDebt.value = null
        showToast("Settlement recorded!")
    }

    fun updateRoomSettings(name: String, itemName: String, itemUnit: String, autoConfirmHours: Int, defaultCost: Double) {
        repository.updateRoomSettings(name, itemName, itemUnit, autoConfirmHours, defaultCost)
        showToast("Room settings saved")
    }

    fun fastForwardTime(hours: Int) {
        val count = repository.fastForwardTime(hours)
        showToast("Fast-forwarded $hours hrs: $count auto-confirmed")
    }
}
