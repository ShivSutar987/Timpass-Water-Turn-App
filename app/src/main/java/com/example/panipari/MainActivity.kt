package com.example.panipari

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.panipari.ui.components.AppBottomNav
import com.example.panipari.ui.components.AppHeader
import com.example.panipari.ui.dialogs.*
import com.example.panipari.ui.screens.*
import com.example.panipari.ui.theme.*
import com.example.panipari.viewmodel.AppTab
import com.example.panipari.viewmodel.PaniPariViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            PaniPariTheme {
                val viewModel: PaniPariViewModel = viewModel()
                val room by viewModel.room.collectAsStateWithLifecycle()
                val members by viewModel.members.collectAsStateWithLifecycle()
                val presenceChanges by viewModel.presenceChanges.collectAsStateWithLifecycle()
                val claims by viewModel.claims.collectAsStateWithLifecycle()
                val auditEvents by viewModel.auditEvents.collectAsStateWithLifecycle()
                val activeMemberId by viewModel.activeMemberId.collectAsStateWithLifecycle()
                val activeTab by viewModel.activeTab.collectAsStateWithLifecycle()
                val isDemo by viewModel.isDemo.collectAsStateWithLifecycle()
                val fairTurn by viewModel.fairTurnResult.collectAsStateWithLifecycle()

                val toastMessage by viewModel.toastMessage.collectAsStateWithLifecycle()
                val snackbarHostState = remember { SnackbarHostState() }

                LaunchedEffect(toastMessage) {
                    toastMessage?.let {
                        snackbarHostState.showSnackbar(it)
                        viewModel.clearToast()
                    }
                }

                // Handle system back button
                BackHandler(enabled = activeTab != AppTab.HOME && room != null) {
                    viewModel.setActiveTab(AppTab.HOME)
                }

                // Dialog states
                val showClaim by viewModel.showClaimDialog.collectAsStateWithLifecycle()
                val showNudge by viewModel.showNudgeDialog.collectAsStateWithLifecycle()
                val disputeClaim by viewModel.showDisputeDialogForClaim.collectAsStateWithLifecycle()
                val whyMember by viewModel.showWhyDialogForMember.collectAsStateWithLifecycle()
                val settleDebt by viewModel.showSettleDialogForDebt.collectAsStateWithLifecycle()
                val showQR by viewModel.showQrShareDialog.collectAsStateWithLifecycle()
                val showAddMember by viewModel.showAddMemberDialog.collectAsStateWithLifecycle()

                Surface(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Slate950),
                    color = Slate950
                ) {
                    val currentRoom = room
                    if (currentRoom == null) {
                        WelcomeScreen(
                            onCreateRoom = { name, itemName, unit, creator ->
                                viewModel.createRoom(name, itemName, unit, creator)
                            },
                            onJoinRoom = { code -> viewModel.joinRoom(code) },
                            onStartDemo = { viewModel.startDemo() }
                        )
                    } else {
                        Scaffold(
                            containerColor = Slate950,
                            snackbarHost = { SnackbarHost(snackbarHostState) },
                            topBar = {
                                AppHeader(
                                    room = currentRoom,
                                    members = members,
                                    activeMemberId = activeMemberId,
                                    isDemo = isDemo,
                                    onSelectMember = { viewModel.setActiveMemberId(it) },
                                    onShowQR = { viewModel.showQrShareDialog.value = true }
                                )
                            },
                            bottomBar = {
                                AppBottomNav(
                                    activeTab = activeTab,
                                    onTabSelected = { viewModel.setActiveTab(it) }
                                )
                            }
                        ) { innerPadding ->
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(innerPadding)
                            ) {
                                when (activeTab) {
                                    AppTab.HOME -> HomeScreen(
                                        room = currentRoom,
                                        members = members,
                                        activeMemberId = activeMemberId,
                                        fairTurn = fairTurn,
                                        claims = claims,
                                        auditEvents = auditEvents,
                                        onOpenClaimDialog = { viewModel.showClaimDialog.value = true },
                                        onOpenNudgeDialog = { viewModel.showNudgeDialog.value = true },
                                        onConfirmClaim = { viewModel.confirmClaim(it) },
                                        onOpenDisputeDialog = { viewModel.showDisputeDialogForClaim.value = it },
                                        onReportEmpty = { viewModel.reportCanEmpty() },
                                        onResolveDispute = { id, res -> viewModel.resolveDispute(id, res) },
                                        onNavigateToHistory = { viewModel.setActiveTab(AppTab.HISTORY) }
                                    )

                                    AppTab.MEMBERS -> MembersScreen(
                                        members = members,
                                        presenceChanges = presenceChanges,
                                        activeMemberId = activeMemberId,
                                        onTogglePresence = { viewModel.toggleMemberPresence(it) },
                                        onSelectActiveMember = { viewModel.setActiveMemberId(it) },
                                        onOpenAddMemberDialog = { viewModel.showAddMemberDialog.value = true },
                                        onArchiveMember = { viewModel.archiveMember(it) },
                                        onUnarchiveMember = { viewModel.unarchiveMember(it) }
                                    )

                                    AppTab.BALANCE -> BalanceScreen(
                                        room = currentRoom,
                                        members = members,
                                        fairTurn = fairTurn,
                                        claims = claims,
                                        onOpenWhyDialog = { m, calc ->
                                            viewModel.showWhyDialogForMember.value = Pair(m, calc)
                                        }
                                    )

                                    AppTab.COSTS -> CostsScreen(
                                        room = currentRoom,
                                        members = members,
                                        fairTurn = fairTurn,
                                        activeMemberId = activeMemberId,
                                        onOpenSettleDialog = { viewModel.showSettleDialogForDebt.value = it }
                                    )

                                    AppTab.AI -> AIChatScreen(
                                        room = currentRoom,
                                        members = members,
                                        fairTurn = fairTurn,
                                        activeMemberId = activeMemberId
                                    )

                                    AppTab.HISTORY -> HistoryScreen(
                                        auditEvents = auditEvents,
                                        members = members
                                    )

                                    AppTab.SETTINGS -> SettingsScreen(
                                        room = currentRoom,
                                        isDemo = isDemo,
                                        onSaveSettings = { name, item, unit, hours, cost ->
                                            viewModel.updateRoomSettings(name, item, unit, hours, cost)
                                        },
                                        onShowQR = { viewModel.showQrShareDialog.value = true },
                                        onFastForward = { viewModel.fastForwardTime(it) },
                                        onLeaveRoom = {
                                            if (isDemo) viewModel.exitDemo() else viewModel.exitDemo()
                                        }
                                    )
                                }
                            }
                        }

                        // Modal Dialogs
                        if (showClaim) {
                            ClaimDialog(
                                room = currentRoom,
                                members = members,
                                activeMemberId = activeMemberId,
                                onDismiss = { viewModel.showClaimDialog.value = false },
                                onSubmit = { cost, note, onBehalfOf ->
                                    viewModel.claimBroughtCan(cost, note, onBehalfOf)
                                }
                            )
                        }

                        if (showNudge && fairTurn.nextMember != null) {
                            NudgeDialog(
                                targetMember = fairTurn.nextMember!!,
                                room = currentRoom,
                                onDismiss = { viewModel.showNudgeDialog.value = false },
                                onSendNudge = { msg, anon ->
                                    viewModel.sendNudge(fairTurn.nextMember!!.id, msg, anon)
                                }
                            )
                        }

                        disputeClaim?.let { claimToDispute ->
                            val claimant = members.find { it.id == claimToDispute.broughtByMemberId }
                            DisputeDialog(
                                claim = claimToDispute,
                                claimant = claimant,
                                room = currentRoom,
                                onDismiss = { viewModel.showDisputeDialogForClaim.value = null },
                                onSubmitDispute = { reason ->
                                    viewModel.disputeClaim(claimToDispute.id, reason)
                                }
                            )
                        }

                        whyMember?.let { (mem, calc) ->
                            WhyBalanceDialog(
                                member = mem,
                                calculation = calc,
                                room = currentRoom,
                                onDismiss = { viewModel.showWhyDialogForMember.value = null }
                            )
                        }

                        settleDebt?.let { debt ->
                            SettleUpDialog(
                                debt = debt,
                                room = currentRoom,
                                onDismiss = { viewModel.showSettleDialogForDebt.value = null },
                                onConfirmSettlement = { note ->
                                    viewModel.recordSettlement(debt.to.id, debt.amount, note)
                                }
                            )
                        }

                        if (showQR) {
                            QRShareDialog(
                                room = currentRoom,
                                onDismiss = { viewModel.showQrShareDialog.value = false }
                            )
                        }

                        if (showAddMember) {
                            AddMemberDialog(
                                onDismiss = { viewModel.showAddMemberDialog.value = false },
                                onSubmit = { name, color, emoji, upiId ->
                                    viewModel.addNewMember(name, color, emoji, upiId)
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
