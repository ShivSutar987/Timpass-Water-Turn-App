package com.example.panipari.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import com.example.panipari.logic.FairTurnLogic
import com.example.panipari.model.*
import com.example.panipari.ui.theme.*

@Composable
fun CostsScreen(
    room: Room,
    members: List<Member>,
    fairTurn: FairTurnResult,
    activeMemberId: String?,
    onOpenSettleDialog: (PairwiseDebt) -> Unit
) {
    val activeMembers = members.filter { !it.isArchived }
    val pairwiseDebts = FairTurnLogic.calculatePairwiseDebts(activeMembers, fairTurn.balances)

    val activeMember = members.find { it.id == activeMemberId }
    val activeCalc = fairTurn.balances[activeMemberId]

    val totalGroupSpend = activeMembers.sumOf { fairTurn.balances[it.id]?.costPaid ?: 0.0 }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 12.dp, bottom = 24.dp)
    ) {
        // Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Expense & Costs",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                    Text(
                        text = "Default: ${room.currency}${"%.0f".format(room.defaultCost)} per ${room.itemName}",
                        fontSize = 11.sp,
                        color = Slate400
                    )
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(Slate900)
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = "Total Spent: ${room.currency}${"%.0f".format(totalGroupSpend)}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Cyan400
                    )
                }
            }
        }

        // Active Member's Net Settlement Banner
        if (activeCalc != null) {
            item {
                val netCost = activeCalc.costBalance
                val isOwed = netCost >= 0

                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = if (isOwed) Emerald950.copy(alpha = 0.7f) else Amber950.copy(alpha = 0.7f),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (isOwed) Emerald500.copy(alpha = 0.5f) else Amber500.copy(alpha = 0.5f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = if (isOwed) "ROOMMATES OWE YOU" else "YOU OWE THE FLAT",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black,
                                color = if (isOwed) Emerald400 else Amber400,
                                letterSpacing = 1.sp
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "${room.currency}${"%.0f".format(kotlin.math.abs(netCost))}",
                                fontSize = 26.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White
                            )
                            Text(
                                text = "Paid: ${room.currency}${"%.0f".format(activeCalc.costPaid)} • Fair Share: ${room.currency}${"%.0f".format(activeCalc.costFairShareOwed)}",
                                fontSize = 11.sp,
                                color = Slate300
                            )
                        }

                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(if (isOwed) Emerald500 else Amber500),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = if (isOwed) "💰" else "💸",
                                fontSize = 22.sp
                            )
                        }
                    }
                }
            }
        }

        // Simplified Settle-Up Suggestions
        item {
            Text(
                text = "Simplified Settle-Up Debts",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }

        if (pairwiseDebts.isEmpty()) {
            item {
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = Slate900,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(modifier = Modifier.padding(16.dp), contentAlignment = Alignment.Center) {
                        Text(
                            text = "🎉 All expenses are even! No pending settlements.",
                            fontSize = 12.sp,
                            color = Slate400
                        )
                    }
                }
            }
        } else {
            items(pairwiseDebts) { debt ->
                val isMyDebt = debt.from.id == activeMemberId
                val isOwedToMe = debt.to.id == activeMemberId

                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Slate900,
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (isMyDebt) Amber500.copy(alpha = 0.5f) else if (isOwedToMe) Emerald500.copy(alpha = 0.5f) else Slate800
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(text = debt.from.emoji, fontSize = 20.sp)
                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Text(
                                        text = debt.from.name,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = Color.White
                                    )
                                    Icon(
                                        imageVector = Icons.Default.ArrowForward,
                                        contentDescription = null,
                                        tint = Slate400,
                                        modifier = Modifier.size(12.dp)
                                    )
                                    Text(
                                        text = debt.to.name,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = Color.White
                                    )
                                }
                                Text(
                                    text = if (!debt.to.upiId.isNullOrBlank()) "UPI: ${debt.to.upiId}" else "Cash / In-person",
                                    fontSize = 10.sp,
                                    color = Slate400
                                )
                            }
                        }

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text(
                                text = "${room.currency}${"%.0f".format(debt.amount)}",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black,
                                color = if (isMyDebt) Amber400 else if (isOwedToMe) Emerald400 else Color.White
                            )

                            Button(
                                onClick = { onOpenSettleDialog(debt) },
                                colors = ButtonDefaults.buttonColors(containerColor = Sky600),
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                modifier = Modifier.height(30.dp)
                            ) {
                                Text("Settle", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // Flatmate Spending Breakdown
        item {
            Text(
                text = "Flatmate Expense Ledger",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }

        items(activeMembers) { member ->
            val calc = fairTurn.balances[member.id] ?: MemberBalanceCalculation(member.id, member.name, true)
            val net = calc.costBalance
            val isAhead = net >= 0

            Surface(
                shape = RoundedCornerShape(14.dp),
                color = Slate900,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(text = member.emoji, fontSize = 20.sp)
                        Column {
                            Text(text = member.name, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color.White)
                            Text(
                                text = "Paid ${room.currency}${"%.0f".format(calc.costPaid)} • Share ${room.currency}${"%.0f".format(calc.costFairShareOwed)}",
                                fontSize = 10.sp,
                                color = Slate400
                            )
                        }
                    }

                    Text(
                        text = "${if (isAhead) "+" else ""}${room.currency}${"%.0f".format(net)}",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isAhead) Emerald400 else Amber400
                    )
                }
            }
        }
    }
}
