package com.example.panipari.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
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
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class AndroidChatMessage(
    val id: String,
    val isUser: Boolean,
    val text: String,
    val timestamp: Long = System.currentTimeMillis()
)

@Composable
fun AIChatScreen(
    room: Room,
    members: List<Member>,
    fairTurn: FairTurnResult,
    activeMemberId: String?
) {
    val coroutineScope = rememberCoroutineScope()
    val listState = rememberLazyListState()

    val activeMember = members.find { it.id == activeMemberId }
    val nextPerson = fairTurn.nextMember

    var messages by remember {
        mutableStateOf(
            listOf(
                AndroidChatMessage(
                    id = "welcome",
                    isUser = false,
                    text = "Hey! I'm PaniPari AI, your flatmate mediator and household essentials advisor. 💧\n\nI have full visibility into ${room.name}'s turns, presence logs, and balances. How can I help you today?\n• Who is next in rotation and why?\n• Draft a diplomatic nudge message\n• Explain rules for flatmates traveling away\n• Mediate a delivery or cost disagreement"
                )
            )
        )
    }

    var inputText by remember { mutableStateOf("") }
    var isThinking by remember { mutableStateOf(false) }

    val quickPrompts = listOf(
        "Who is next in rotation & why?",
        "Draft a polite reminder for the next turn",
        "Rules when someone is away for a week?",
        "How should we settle our cost balances?"
    )

    fun generateAIResponse(userQuery: String): String {
        val q = userQuery.lowercase()
        val activeMembers = members.filter { !it.isArchived }

        return when {
            "next" in q || "turn" in q || "who" in q -> {
                if (nextPerson != null) {
                    val bal = fairTurn.balances[nextPerson.id]?.balance ?: 0.0
                    "Right now, **${nextPerson.name} (${nextPerson.emoji})** is next in rotation! 🪣\n\n" +
                            "**Rationale:** ${fairTurn.reason}\n\n" +
                            "Their current balance is ${if (bal >= 0) "+" else ""}${"%.2f".format(bal)} cans compared to the fair share of ${activeMembers.size} flatmates currently present."
                } else {
                    "Currently no flatmates are marked as Present. Please mark at least one member present in the Roommates tab!"
                }
            }
            "nudge" in q || "remind" in q || "message" in q || "draft" in q -> {
                val targetName = nextPerson?.name ?: "roommate"
                "Here are two diplomatic message options you can send to ${targetName}:\n\n" +
                        "**Option 1 (Casual & Friendly):**\n" +
                        "\"Hey ${targetName}! Flat is out of ${room.itemName} 💧 Whenever you're heading back or free, could you pick one up?\"\n\n" +
                        "**Option 2 (Direct & Clear):**\n" +
                        "\"Hi ${targetName}, quick heads-up that the ${room.itemName} is empty and rotation shows it's your turn. Let us know if you need someone to proxy for you! 🤝\""
            }
            "away" in q || "trip" in q || "vacation" in q || "travel" in q || "holiday" in q -> {
                "In PaniPari, fairness is **presence-weighted**:\n\n" +
                        "1. When a flatmate is away, toggle their status to **Away** in the Roommates tab.\n" +
                        "2. They are **skipped for turns** while away.\n" +
                        "3. They owe **0 cans and ₹0 cost** for any delivery brought during their absence.\n" +
                        "4. When they return, switch them back to **Present** and they rejoin the rotation!"
            }
            "settle" in q || "cost" in q || "money" in q || "pay" in q || "expense" in q -> {
                val payerSummary = activeMembers.joinToString("\n") { m ->
                    val b = fairTurn.balances[m.id]
                    "• ${m.name}: Paid ₹${"%.0f".format(b?.costPaid ?: 0.0)}, Share ₹${"%.0f".format(b?.costFairShareOwed ?: 0.0)} (${if ((b?.costBalance ?: 0.0) >= 0) "Owed" else "Owes"} ₹${"%.0f".format(kotlin.math.abs(b?.costBalance ?: 0.0))})"
                }
                "Here is the breakdown of shared expenses for ${room.name}:\n\n$payerSummary\n\n" +
                        "👉 Tip: Use the **Costs** tab for simplified settle-up transfers with direct UPI deep links!"
            }
            else -> {
                "Understood! As ${room.name}'s mediator, I recommend checking the **Turn** tab for rotation queue, or the **Balance** tab to inspect the 1/|P(t)| fair share mathematical breakdown. Let me know if you need help drafting a message or adjusting house rules!"
            }
        }
    }

    fun sendMessage(text: String) {
        val userText = text.trim()
        if (userText.isEmpty() || isThinking) return

        val userMsg = AndroidChatMessage(
            id = "user_${System.currentTimeMillis()}",
            isUser = true,
            text = userText
        )
        messages = messages + userMsg
        inputText = ""
        isThinking = true

        coroutineScope.launch {
            delay(100)
            listState.animateScrollToItem(messages.size - 1)

            // Simulate AI response delay
            delay(500)
            val aiReply = generateAIResponse(userText)
            val aiMsg = AndroidChatMessage(
                id = "ai_${System.currentTimeMillis()}",
                isUser = false,
                text = aiReply
            )
            messages = messages + aiMsg
            isThinking = false
            delay(100)
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    val timeFormat = SimpleDateFormat("h:mm a", Locale.getDefault())

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(horizontal = 16.dp)
    ) {
        // Top Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(Sky600),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(imageVector = Icons.Default.AutoAwesome, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                }
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(text = "PaniPari AI", fontSize = 16.sp, fontWeight = FontWeight.Black, color = Color.White)
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Cyan950)
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(text = "Mediator", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Cyan400)
                        }
                    }
                    Text(text = "Flatmate mediator & chore advisor", fontSize = 11.sp, color = Slate400)
                }
            }

            IconButton(
                onClick = {
                    messages = listOf(
                        AndroidChatMessage(
                            id = "welcome_${System.currentTimeMillis()}",
                            isUser = false,
                            text = "Chat cleared! What would you like to ask about ${room.name}?"
                        )
                    )
                }
            ) {
                Icon(imageVector = Icons.Default.Refresh, contentDescription = "Clear", tint = Slate400, modifier = Modifier.size(18.dp))
            }
        }

        HorizontalDivider(color = Slate800)

        // Messages List
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(vertical = 12.dp)
        ) {
            items(messages) { msg ->
                val isUser = msg.isUser
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.Top,
                        modifier = Modifier.fillMaxWidth(0.88f)
                    ) {
                        if (!isUser) {
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(CircleShape)
                                    .background(Cyan950),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(text = "✨", fontSize = 14.sp)
                            }
                        }

                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = if (isUser) Sky600 else Slate900,
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (isUser) Sky500 else Slate800
                            ),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = msg.text,
                                    fontSize = 12.sp,
                                    color = if (isUser) Color.White else Slate100,
                                    lineHeight = 17.sp
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = timeFormat.format(Date(msg.timestamp)),
                                    fontSize = 9.sp,
                                    color = if (isUser) Slate200 else Slate400,
                                    modifier = Modifier.align(Alignment.End)
                                )
                            }
                        }

                        if (isUser) {
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(CircleShape)
                                    .background(Slate800),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(text = activeMember?.emoji ?: "👤", fontSize = 14.sp)
                            }
                        }
                    }
                }
            }

            if (isThinking) {
                item {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.padding(start = 36.dp)
                    ) {
                        CircularProgressIndicator(
                            color = Cyan400,
                            strokeWidth = 2.dp,
                            modifier = Modifier.size(12.dp)
                        )
                        Text(text = "PaniPari AI is thinking...", fontSize = 11.sp, color = Slate400)
                    }
                }
            }
        }

        // Quick Suggestion Chips
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 6.dp)
        ) {
            items(quickPrompts) { prompt ->
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(Slate900)
                        .clickable { sendMessage(prompt) }
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Text(text = prompt, fontSize = 11.sp, color = Cyan400, fontWeight = FontWeight.SemiBold)
                }
            }
        }

        // Input Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = inputText,
                onValueChange = { inputText = it },
                placeholder = { Text("Ask PaniPari AI anything...", fontSize = 12.sp, color = Slate400) },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(20.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Cyan400,
                    unfocusedBorderColor = Slate700
                )
            )

            IconButton(
                onClick = { sendMessage(inputText) },
                enabled = inputText.isNotBlank() && !isThinking,
                colors = IconButtonDefaults.iconButtonColors(
                    containerColor = Sky600,
                    disabledContainerColor = Slate800
                ),
                modifier = Modifier.size(46.dp)
            ) {
                Icon(imageVector = Icons.Default.Send, contentDescription = "Send", tint = Color.White, modifier = Modifier.size(18.dp))
            }
        }
    }
}
