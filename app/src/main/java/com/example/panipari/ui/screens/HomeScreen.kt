package com.example.panipari.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.panipari.model.*
import com.example.panipari.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun HomeScreen(
    room: Room,
    members: List<Member>,
    activeMemberId: String?,
    fairTurn: FairTurnResult,
    claims: List<Claim>,
    auditEvents: List<AuditEvent>,
    onOpenClaimDialog: () -> Unit,
    onOpenNudgeDialog: () -> Unit,
    onConfirmClaim: (String) -> Unit,
    onOpenDisputeDialog: (Claim) -> Unit,
    onReportEmpty: () -> Unit,
    onResolveDispute: (claimId: String, resolution: String) -> Unit,
    onNavigateToHistory: () -> Unit
) {
    val nextPerson = fairTurn.nextMember
    val isMyTurn = nextPerson != null && nextPerson.id == activeMemberId

    val pendingClaims = claims.filter { it.status == ClaimStatus.PENDING }
    val disputedClaims = claims.filter { it.status == ClaimStatus.DISPUTED }
    val activeEmptyAlert = if (room.emptyAlert != null && !room.emptyAlert.resolved) room.emptyAlert else null

    val timeFormat = SimpleDateFormat("h:mm a", Locale.getDefault())

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 8.dp, bottom = 24.dp)
    ) {
        // 1. Empty Alert Banner
        if (activeEmptyAlert != null) {
            item {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Amber950.copy(alpha = 0.8f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Amber500.copy(alpha = 0.6f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.Top,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Amber500.copy(alpha = 0.3f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(imageVector = Icons.Default.Warning, contentDescription = null, tint = Amber400)
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "${room.itemName.uppercase()} IS EMPTY!",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Amber400
                                )
                                Text(
                                    text = timeFormat.format(Date(activeEmptyAlert.reportedAt)),
                                    fontSize = 10.sp,
                                    color = Amber400.copy(alpha = 0.8f)
                                )
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Reported empty. It is ${nextPerson?.name ?: "the next flatmate"}'s turn to order or bring one!",
                                fontSize = 12.sp,
                                color = Slate100
                            )
                        }
                    }
                }
            }
        }

        // 2. Pending Verification Banners (Peer verification!)
        items(pendingClaims) { claim ->
            val claimant = members.find { it.id == claim.broughtByMemberId }
            val beneficiary = members.find { it.id == claim.onBehalfOfMemberId }
            val isSelfClaim = claim.broughtByMemberId == activeMemberId

            Surface(
                shape = RoundedCornerShape(18.dp),
                color = Cyan950.copy(alpha = 0.7f),
                border = androidx.compose.foundation.BorderStroke(1.dp, Cyan400.copy(alpha = 0.4f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text(text = claimant?.emoji ?: "💧", fontSize = 24.sp)
                            Column {
                                Text(
                                    text = "DELIVERY AWAITING CONFIRMATION",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Cyan400,
                                    letterSpacing = 1.sp
                                )
                                Text(
                                    text = "${claimant?.name ?: "A flatmate"} brought ${room.itemName}",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                if (beneficiary != null && beneficiary.id != claimant?.id) {
                                    Text(
                                        text = "(on behalf of ${beneficiary.name})",
                                        fontSize = 11.sp,
                                        color = Amber400
                                    )
                                }
                                if (!claim.note.isNullOrBlank()) {
                                    Text(
                                        text = "\"${claim.note}\"",
                                        fontSize = 11.sp,
                                        color = Slate300
                                    )
                                }
                            }
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(Cyan950)
                                .border(1.dp, Cyan400.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "${room.currency}${"%.0f".format(claim.cost)}",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Cyan400
                            )
                        }
                    }

                    // Peer Action Buttons
                    if (isSelfClaim) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(Slate900)
                                .padding(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Your claim is logged. Waiting for roommate verification.",
                                    fontSize = 11.sp,
                                    color = Slate400
                                )
                                Text(
                                    text = "Peer-only",
                                    fontSize = 10.sp,
                                    color = Cyan400,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    } else {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = { onConfirmClaim(claim.id) },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = Emerald500),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(imageVector = Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Verify Delivery", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                            Button(
                                onClick = { onOpenDisputeDialog(claim) },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = Slate800),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(imageVector = Icons.Default.Warning, contentDescription = null, tint = Amber400, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Dispute", color = Amber400, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }

        // 3. Disputed Claims Banners (if any)
        items(disputedClaims) { claim ->
            val claimant = members.find { it.id == claim.broughtByMemberId }
            val disputer = members.find { it.id == claim.disputedByMemberId }

            Surface(
                shape = RoundedCornerShape(18.dp),
                color = Rose500.copy(alpha = 0.15f),
                border = androidx.compose.foundation.BorderStroke(1.dp, Rose500.copy(alpha = 0.5f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "⚠️ DISPUTED CLAIM (${claimant?.name}'s ${room.itemName})",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Rose400
                    )
                    Text(
                        text = "Disputed by ${disputer?.name ?: "Flatmate"}: \"${claim.disputeReason ?: "Reason not specified"}\"",
                        fontSize = 12.sp,
                        color = Slate200
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = { onResolveDispute(claim.id, "confirm") },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Emerald500),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Vote Confirm", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                        Button(
                            onClick = { onResolveDispute(claim.id, "remove") },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Rose500),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Vote Remove", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // 4. Hero Card: WHOSE TURN IS IT?
        item {
            Surface(
                shape = RoundedCornerShape(26.dp),
                color = Slate900,
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (isMyTurn) Sky500 else Slate800
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "NEXT IN ROTATION",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            color = if (isMyTurn) Sky400 else Slate400,
                            letterSpacing = 1.5.sp
                        )
                        if (isMyTurn) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Sky600)
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text(
                                    text = "YOUR TURN! 🪣",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White
                                )
                            }
                        }
                    }

                    // Avatar Circle
                    Box(
                        modifier = Modifier
                            .size(80.dp)
                            .clip(CircleShape)
                            .background(if (isMyTurn) Sky600 else Slate800)
                            .border(
                                2.dp,
                                if (isMyTurn) Cyan400 else Slate700,
                                CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = nextPerson?.emoji ?: "💧",
                            fontSize = 42.sp
                        )
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = nextPerson?.name ?: "No members present",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = fairTurn.reason,
                            fontSize = 12.sp,
                            color = Slate300,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 8.dp)
                        )
                    }

                    Divider(color = Slate800)

                    // Quick Actions
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = onOpenClaimDialog,
                            modifier = Modifier.weight(1.3f),
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Sky600)
                        ) {
                            Icon(imageVector = Icons.Default.AddCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Log Delivery", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }

                        Button(
                            onClick = onReportEmpty,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Amber500)
                        ) {
                            Icon(imageVector = Icons.Default.Warning, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Empty", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Slate950)
                        }

                        if (nextPerson != null && !isMyTurn) {
                            Button(
                                onClick = onOpenNudgeDialog,
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Slate800)
                            ) {
                                Icon(imageVector = Icons.Default.Notifications, contentDescription = null, tint = Cyan400, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Nudge", color = Cyan400, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }

        // 5. Recent Activity Feed
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Recent Activity",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                TextButton(onClick = onNavigateToHistory) {
                    Text(text = "View All →", fontSize = 12.sp, color = Cyan400)
                }
            }
        }

        items(auditEvents.take(4)) { event ->
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = Slate900,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(Slate800),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = when (event.type) {
                                EventType.CLAIM_CONFIRMED -> "✅"
                                EventType.CLAIM_CREATED -> "💧"
                                EventType.CAN_EMPTY_ALERT -> "🪣"
                                EventType.NUDGE_SENT -> "💬"
                                EventType.PRESENCE_CHANGED -> "✈️"
                                EventType.COST_SETTLED -> "💸"
                                else -> "📋"
                            },
                            fontSize = 14.sp
                        )
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = event.details,
                            fontSize = 12.sp,
                            color = Slate200,
                            lineHeight = 16.sp
                        )
                        Text(
                            text = timeFormat.format(Date(event.createdAt)),
                            fontSize = 10.sp,
                            color = Slate400
                        )
                    }
                }
            }
        }
    }
}
