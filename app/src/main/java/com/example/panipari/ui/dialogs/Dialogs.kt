package com.example.panipari.ui.dialogs

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.panipari.model.*
import com.example.panipari.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun ClaimDialog(
    room: Room,
    members: List<Member>,
    activeMemberId: String?,
    onDismiss: () -> Unit,
    onSubmit: (cost: Double?, note: String?, onBehalfOf: String?) -> Unit
) {
    var costText by remember { mutableStateOf(room.defaultCost.toInt().toString()) }
    var note by remember { mutableStateOf("") }
    var onBehalfOfId by remember { mutableStateOf(activeMemberId ?: members.firstOrNull()?.id ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Slate900,
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(text = "💧", fontSize = 22.sp)
                Text(text = "Log ${room.itemName} Delivery", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Log delivery for flatmate verification. Once verified, turn balance updates automatically.",
                    fontSize = 12.sp,
                    color = Slate300
                )

                // Cost input
                OutlinedTextField(
                    value = costText,
                    onValueChange = { costText = it },
                    label = { Text("Cost (${room.currency})") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Cyan400,
                        unfocusedBorderColor = Slate700,
                        focusedLabelColor = Cyan400
                    )
                )

                // On behalf of selector
                Column {
                    Text(text = "Credit Beneficiary:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Slate300)
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        members.filter { !it.isArchived }.forEach { m ->
                            val isSelected = m.id == onBehalfOfId
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isSelected) Sky600 else Slate800)
                                    .clickable { onBehalfOfId = m.id }
                                    .padding(horizontal = 8.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = "${m.emoji} ${m.name}",
                                    fontSize = 11.sp,
                                    color = if (isSelected) Color.White else Slate300,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            }
                        }
                    }
                }

                // Note
                OutlinedTextField(
                    value = note,
                    onValueChange = { note = it },
                    label = { Text("Optional Note (e.g. from local vendor)") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Cyan400,
                        unfocusedBorderColor = Slate700,
                        focusedLabelColor = Cyan400
                    )
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val cost = costText.toDoubleOrNull() ?: room.defaultCost
                    onSubmit(cost, note.ifEmpty { null }, onBehalfOfId)
                },
                colors = ButtonDefaults.buttonColors(containerColor = Sky600)
            ) {
                Text("Log Delivery", color = Color.White, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = Slate400)
            }
        }
    )
}

@Composable
fun DisputeDialog(
    claim: Claim,
    claimant: Member?,
    room: Room,
    onDismiss: () -> Unit,
    onSubmitDispute: (reason: String) -> Unit
) {
    var reason by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Slate900,
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(imageVector = Icons.Default.Warning, contentDescription = null, tint = Amber400)
                Text(text = "Dispute Delivery Claim", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "Flagging ${claimant?.name ?: "roommate"}'s claim for ${room.currency}${claim.cost}. Please state reason for group review:",
                    fontSize = 12.sp,
                    color = Slate300
                )
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    placeholder = { Text("e.g. Can arrived empty, wasn't delivered, wrong cost") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Amber400,
                        unfocusedBorderColor = Slate700
                    )
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (reason.isNotBlank()) onSubmitDispute(reason)
                },
                colors = ButtonDefaults.buttonColors(containerColor = Rose500)
            ) {
                Text("Flag Dispute", color = Color.White, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = Slate400)
            }
        }
    )
}

@Composable
fun NudgeDialog(
    targetMember: Member,
    room: Room,
    onDismiss: () -> Unit,
    onSendNudge: (message: String, isAnonymous: Boolean) -> Unit
) {
    var message by remember { mutableStateOf("Hey ${targetMember.name}, flat is low on ${room.itemName}! Please check when possible 💧") }
    var isAnonymous by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Slate900,
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(imageVector = Icons.Default.NotificationsActive, contentDescription = null, tint = Cyan400)
                Text(text = "Nudge ${targetMember.name}", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Send a gentle notification to the person whose turn is next.",
                    fontSize = 12.sp,
                    color = Slate300
                )

                OutlinedTextField(
                    value = message,
                    onValueChange = { message = it },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Cyan400,
                        unfocusedBorderColor = Slate700
                    )
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(Slate800)
                        .clickable { isAnonymous = !isAnonymous }
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(text = "Send Anonymously", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                        Text(text = "Keeps roommate relations friction-free", fontSize = 10.sp, color = Slate400)
                    }
                    Switch(
                        checked = isAnonymous,
                        onCheckedChange = { isAnonymous = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = Cyan400, checkedTrackColor = Cyan950)
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onSendNudge(message, isAnonymous) },
                colors = ButtonDefaults.buttonColors(containerColor = Sky600)
            ) {
                Text("Send Nudge", color = Color.White, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = Slate400)
            }
        }
    )
}

@Composable
fun WhyBalanceDialog(
    member: Member,
    calculation: MemberBalanceCalculation,
    room: Room,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Slate900,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(text = member.emoji, fontSize = 24.sp)
                        Column {
                            Text(text = member.name, fontWeight = FontWeight.Black, fontSize = 18.sp, color = Color.White)
                            Text(text = "Fair Turn Math & Breakdown", fontSize = 11.sp, color = Slate400)
                        }
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Slate400)
                    }
                }

                Divider(color = Slate800)

                // Summary Stats
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Slate800)
                            .padding(10.dp)
                    ) {
                        Text(text = "Deliveries Brought", fontSize = 10.sp, color = Slate400)
                        Text(text = "${calculation.cansCount} cans", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.White)
                        Text(text = "+${calculation.totalCredits.toInt()} credit", fontSize = 10.sp, color = Emerald400)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Slate800)
                            .padding(10.dp)
                    ) {
                        Text(text = "Fair Shares Owed", fontSize = 10.sp, color = Slate400)
                        Text(text = "${"%.2f".format(calculation.totalFairSharesOwed)} cans", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.White)
                        Text(text = "Sum of 1/|P(t)|", fontSize = 10.sp, color = Amber400)
                    }
                }

                // Balance formula banner
                val isAhead = calculation.balance >= 0
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (isAhead) Emerald950 else Amber950)
                        .padding(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(text = "Net Balance", fontSize = 11.sp, color = if (isAhead) Emerald400 else Amber400, fontWeight = FontWeight.Bold)
                            Text(
                                text = "Credits (${calculation.totalCredits.toInt()}) − Owed (${"%.2f".format(calculation.totalFairSharesOwed)})",
                                fontSize = 10.sp,
                                color = Slate300
                            )
                        }
                        Text(
                            text = "${if (isAhead) "+" else ""}${"%.2f".format(calculation.balance)}",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Black,
                            color = if (isAhead) Emerald400 else Amber400
                        )
                    }
                }

                Text(
                    text = "Event-by-Event Fair Shares Log:",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Slate300
                )

                if (calculation.whyDetails.isEmpty()) {
                    Text(text = "No deliveries confirmed yet while present in flat.", fontSize = 11.sp, color = Slate400)
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 200.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        items(calculation.whyDetails) { detail ->
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Slate800)
                                    .padding(8.dp)
                            ) {
                                Text(text = detail, fontSize = 11.sp, color = Slate300)
                            }
                        }
                    }
                }

                Button(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Slate800)
                ) {
                    Text("Got It", color = Color.White)
                }
            }
        }
    }
}

@Composable
fun SettleUpDialog(
    debt: PairwiseDebt,
    room: Room,
    onDismiss: () -> Unit,
    onConfirmSettlement: (note: String?) -> Unit
) {
    val context = LocalContext.current
    var note by remember { mutableStateOf("PaniPari ${room.itemName} settlement") }

    val upiId = debt.to.upiId

    val cleanUpi = upiId?.trim() ?: ""
    val upiUri = if (cleanUpi.isNotEmpty()) {
        "upi://pay?pa=$cleanUpi&pn=${Uri.encode(debt.to.name)}&am=${"%.2f".format(debt.amount)}&cu=INR&tn=${Uri.encode(note)}"
    } else null

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Slate900,
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(text = "💸", fontSize = 22.sp)
                Text(text = "Settle Up Expense", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Slate800)
                        .padding(12.dp)
                ) {
                    Column {
                        Text(text = "Settlement Amount", fontSize = 10.sp, color = Slate400)
                        Text(
                            text = "${room.currency}${"%.0f".format(debt.amount)}",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Black,
                            color = Cyan400
                        )
                        Text(
                            text = "${debt.from.name} pays ${debt.to.name}",
                            fontSize = 12.sp,
                            color = Slate300
                        )
                    }
                }

                if (!debt.to.upiId.isNullOrBlank()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(Cyan950)
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(text = "Receiver's UPI ID:", fontSize = 10.sp, color = Cyan400)
                            Text(text = debt.to.upiId, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                        if (upiUri != null) {
                            Button(
                                onClick = {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(upiUri))
                                    context.startActivity(intent)
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Cyan500),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Text("Pay UPI", fontSize = 11.sp, color = Slate950, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                OutlinedTextField(
                    value = note,
                    onValueChange = { note = it },
                    label = { Text("Settlement Note") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Cyan400,
                        unfocusedBorderColor = Slate700
                    )
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirmSettlement(note) },
                colors = ButtonDefaults.buttonColors(containerColor = Emerald500)
            ) {
                Text("Mark as Settled", color = Color.White, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = Slate400)
            }
        }
    )
}

@Composable
fun QRShareDialog(
    room: Room,
    onDismiss: () -> Unit
) {
    val clipboardManager = LocalClipboardManager.current
    val context = LocalContext.current

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Slate900,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = room.name, fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color.White)
                        Text(text = "Scan to Join Flat Rotation", fontSize = 11.sp, color = Slate400)
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Slate400)
                    }
                }

                val inviteUri = "panipari://join?c=${room.code}&n=${java.net.URLEncoder.encode(room.name, "UTF-8")}&i=${java.net.URLEncoder.encode(room.itemName, "UTF-8")}&u=${java.net.URLEncoder.encode(room.itemUnit, "UTF-8")}"

                // Render Canvas-based QR Code
                com.example.panipari.ui.components.QRCodeView(
                    data = inviteUri,
                    sizeDp = 180.dp,
                    moduleColor = Sky600
                )

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(14.dp))
                        .background(Slate950)
                        .border(1.dp, Cyan400.copy(alpha = 0.5f), RoundedCornerShape(14.dp))
                        .padding(horizontal = 20.dp, vertical = 10.dp)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = "ROOM CODE", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Cyan400, letterSpacing = 1.sp)
                        Text(
                            text = room.code,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White,
                            letterSpacing = 3.sp
                        )
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = {
                            clipboardManager.setText(AnnotatedString(room.code))
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Sky600),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(imageVector = Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Copy Code", fontSize = 12.sp)
                    }

                    Button(
                        onClick = {
                            val shareMessage = "💧 Join our flat ${room.name} on PaniPari!\n" +
                                "📦 Tracking: ${room.itemName}\n" +
                                "🔑 Room Code: ${room.code}\n" +
                                "👉 Direct Link: $inviteUri\n\n" +
                                "Scan the QR in PaniPari or enter code ${room.code} to join!"

                            val sendIntent = Intent().apply {
                                action = Intent.ACTION_SEND
                                putExtra(Intent.EXTRA_TEXT, shareMessage)
                                type = "text/plain"
                            }
                            context.startActivity(Intent.createChooser(sendIntent, "Share Room Invite"))
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Slate800),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Share, contentDescription = null, tint = Cyan400, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Share", color = Cyan400, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}


@Composable
fun AddMemberDialog(
    onDismiss: () -> Unit,
    onSubmit: (name: String, color: String, emoji: String, upiId: String?) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var selectedEmoji by remember { mutableStateOf("💧") }
    var selectedColor by remember { mutableStateOf("#0284c7") }
    var upiId by remember { mutableStateOf("") }

    val emojis = listOf("💧", "🥤", "🪣", "🌊", "🧊", "✨", "⚡️", "🚀", "🌟", "🫖")
    val colors = listOf("#0284c7", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4")

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Slate900,
        title = {
            Text(text = "Add Flatmate", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Cyan400,
                        unfocusedBorderColor = Slate700
                    )
                )

                Column {
                    Text(text = "Choose Emoji:", fontSize = 11.sp, color = Slate400)
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        emojis.take(6).forEach { em ->
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(if (em == selectedEmoji) Sky600 else Slate800)
                                    .clickable { selectedEmoji = em },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(text = em, fontSize = 16.sp)
                            }
                        }
                    }
                }

                OutlinedTextField(
                    value = upiId,
                    onValueChange = { upiId = it },
                    label = { Text("UPI ID (optional, e.g. name@upi)") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Cyan400,
                        unfocusedBorderColor = Slate700
                    )
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isNotBlank()) {
                        onSubmit(name, selectedColor, selectedEmoji, upiId.ifEmpty { null })
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Sky600)
            ) {
                Text("Add to Flat", color = Color.White)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = Slate400)
            }
        }
    )
}
