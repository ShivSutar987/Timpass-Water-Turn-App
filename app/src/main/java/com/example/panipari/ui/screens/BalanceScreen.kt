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
import com.example.panipari.model.*
import com.example.panipari.ui.theme.*
import kotlin.math.abs
import kotlin.math.max

@Composable
fun BalanceScreen(
    room: Room,
    members: List<Member>,
    fairTurn: FairTurnResult,
    claims: List<Claim>,
    onOpenWhyDialog: (Member, MemberBalanceCalculation) -> Unit
) {
    val totalConfirmedCans = claims.count { it.status == ClaimStatus.CONFIRMED }
    val activeMembers = members.filter { !it.isArchived }

    val sortedMembers = activeMembers.sortedBy {
        fairTurn.balances[it.id]?.balance ?: 0.0
    }

    val maxAbsBalance = max(
        1.0,
        activeMembers.maxOfOrNull { abs(fairTurn.balances[it.id]?.balance ?: 0.0) } ?: 1.0
    )

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
                        text = "Turn Balances",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                    Text(
                        text = "Presence-weighted fair share distribution",
                        fontSize = 11.sp,
                        color = Slate400
                    )
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Slate900,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Slate800)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(text = "💧", fontSize = 13.sp)
                        Text(
                            text = "$totalConfirmedCans Total ${room.itemUnit}s",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Cyan400
                        )
                    }
                }
            }
        }

        // Visual Balance Breakdown Card
        item {
            Surface(
                shape = RoundedCornerShape(22.dp),
                color = Slate900,
                border = androidx.compose.foundation.BorderStroke(1.dp, Slate800),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "ROOMMATE & DELIVERIES", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Slate400)
                        Text(text = "BALANCE & REASONING", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Slate400)
                    }

                    Divider(color = Slate800)

                    sortedMembers.forEach { member ->
                        val calc = fairTurn.balances[member.id] ?: MemberBalanceCalculation(member.id, member.name, true)
                        val balance = calc.balance
                        val isAhead = balance >= 0
                        val fraction = (abs(balance) / maxAbsBalance).coerceIn(0.0, 1.0).toFloat()

                        Column(
                            verticalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text(text = member.emoji, fontSize = 20.sp)
                                    Text(
                                        text = member.name,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        color = Color.White
                                    )
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(Slate950)
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = "${calc.cansCount} brought",
                                            fontSize = 10.sp,
                                            color = Slate400
                                        )
                                    }
                                }

                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(2.dp)
                                    ) {
                                        Icon(
                                            imageVector = if (isAhead) Icons.Default.TrendingUp else Icons.Default.TrendingDown,
                                            contentDescription = null,
                                            tint = if (isAhead) Emerald400 else Amber400,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Text(
                                            text = "${if (isAhead) "+" else ""}${"%.2f".format(balance)}",
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Black,
                                            color = if (isAhead) Emerald400 else Amber400
                                        )
                                    }

                                    Button(
                                        onClick = { onOpenWhyDialog(member, calc) },
                                        shape = RoundedCornerShape(8.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = Cyan950),
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                                        modifier = Modifier.height(26.dp)
                                    ) {
                                        Icon(imageVector = Icons.Default.HelpOutline, contentDescription = null, tint = Cyan400, modifier = Modifier.size(12.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Why?", fontSize = 11.sp, color = Cyan400, fontWeight = FontWeight.SemiBold)
                                    }
                                }
                            }

                            // Progress Bar Track
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(8.dp)
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(Slate950)
                            ) {
                                Row(modifier = Modifier.fillMaxSize()) {
                                    // Left half: Behind (negative)
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .fillMaxHeight(),
                                        contentAlignment = Alignment.CenterEnd
                                    ) {
                                        if (!isAhead) {
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxHeight()
                                                    .fillMaxWidth(fraction)
                                                    .clip(RoundedCornerShape(topStart = 4.dp, bottomStart = 4.dp))
                                                    .background(Amber500)
                                            )
                                        }
                                    }

                                    // Center line separator
                                    Box(
                                        modifier = Modifier
                                            .width(2.dp)
                                            .fillMaxHeight()
                                            .background(Slate700)
                                    )

                                    // Right half: Ahead (positive)
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .fillMaxHeight(),
                                        contentAlignment = Alignment.CenterStart
                                    ) {
                                        if (isAhead) {
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxHeight()
                                                    .fillMaxWidth(fraction)
                                                    .clip(RoundedCornerShape(topEnd = 4.dp, bottomEnd = 4.dp))
                                                    .background(Emerald500)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Candidate Rotation Sequence Card
        item {
            Text(
                text = "Next Turn Queue (Tie-Broken Order)",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }

        items(fairTurn.sortedCandidates.withIndex().toList()) { (index, candidate) ->
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = Slate900,
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (index == 0) Sky500 else Slate800
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(CircleShape)
                            .background(if (index == 0) Sky600 else Slate800),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "#${index + 1}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }

                    Text(text = candidate.member.emoji, fontSize = 20.sp)

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = candidate.member.name,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = Color.White
                        )
                        Text(
                            text = candidate.explanation,
                            fontSize = 11.sp,
                            color = Slate400
                        )
                    }

                    if (index == 0) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Sky600)
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "UP NEXT",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White
                            )
                        }
                    }
                }
            }
        }
    }
}
