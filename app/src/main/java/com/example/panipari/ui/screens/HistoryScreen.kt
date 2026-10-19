package com.example.panipari.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
fun HistoryScreen(
    auditEvents: List<AuditEvent>,
    members: List<Member>
) {
    var selectedCategory by remember { mutableStateOf("all") }
    var selectedMemberId by remember { mutableStateOf<String?>(null) }

    val categories = listOf(
        Pair("all", "All Events"),
        Pair("cans", "Deliveries"),
        Pair("presence", "Presence"),
        Pair("alerts", "Alerts & Nudges"),
        Pair("settlements", "Settlements")
    )

    val filteredEvents = auditEvents.filter { event ->
        val matchesCategory = when (selectedCategory) {
            "cans" -> event.type in listOf(
                EventType.CLAIM_CREATED,
                EventType.CLAIM_CONFIRMED,
                EventType.CLAIM_DISPUTED,
                EventType.CLAIM_RESOLVED,
                EventType.CLAIM_REMOVED
            )
            "presence" -> event.type == EventType.PRESENCE_CHANGED
            "alerts" -> event.type in listOf(EventType.CAN_EMPTY_ALERT, EventType.NUDGE_SENT)
            "settlements" -> event.type == EventType.COST_SETTLED
            else -> true
        }

        val matchesMember = selectedMemberId == null || event.memberId == selectedMemberId

        matchesCategory && matchesMember
    }

    val dateFormat = SimpleDateFormat("MMM d, h:mm a", Locale.getDefault())

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        contentPadding = PaddingValues(top = 12.dp, bottom = 24.dp)
    ) {
        // Header
        item {
            Column {
                Text(
                    text = "Audit Trail",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )
                Text(
                    text = "Immutable log of all flat actions, turns & verifications",
                    fontSize = 11.sp,
                    color = Slate400
                )
            }
        }

        // Category Filter Chips
        item {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(categories) { (key, label) ->
                    val isSelected = selectedCategory == key
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isSelected) Sky600 else Slate900)
                            .clickable { selectedCategory = key }
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = label,
                            fontSize = 11.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            color = if (isSelected) Color.White else Slate300
                        )
                    }
                }
            }
        }

        if (filteredEvents.isEmpty()) {
            item {
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = Slate900,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(modifier = Modifier.padding(24.dp), contentAlignment = Alignment.Center) {
                        Text(
                            text = "No events match this filter.",
                            fontSize = 12.sp,
                            color = Slate400
                        )
                    }
                }
            }
        } else {
            items(filteredEvents) { event ->
                val initiator = members.find { it.id == event.memberId }

                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = Slate900,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.Top,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(CircleShape)
                                .background(Slate800),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = when (event.type) {
                                    EventType.CLAIM_CONFIRMED -> "✅"
                                    EventType.CLAIM_CREATED -> "💧"
                                    EventType.CLAIM_DISPUTED -> "⚠️"
                                    EventType.CLAIM_RESOLVED -> "⚖️"
                                    EventType.CAN_EMPTY_ALERT -> "🪣"
                                    EventType.NUDGE_SENT -> "💬"
                                    EventType.PRESENCE_CHANGED -> "✈️"
                                    EventType.COST_SETTLED -> "💸"
                                    EventType.MEMBER_ADDED -> "👋"
                                    EventType.MEMBER_ARCHIVED -> "📦"
                                    else -> "📋"
                                },
                                fontSize = 16.sp
                            )
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = event.details,
                                fontSize = 13.sp,
                                color = Color.White,
                                lineHeight = 17.sp
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = dateFormat.format(Date(event.createdAt)),
                                    fontSize = 10.sp,
                                    color = Slate400
                                )
                                if (initiator != null) {
                                    Text(text = "•", fontSize = 10.sp, color = Slate400)
                                    Text(
                                        text = "${initiator.emoji} ${initiator.name}",
                                        fontSize = 10.sp,
                                        color = Cyan400
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
