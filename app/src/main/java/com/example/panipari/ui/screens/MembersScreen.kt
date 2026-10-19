package com.example.panipari.ui.screens

import androidx.compose.animation.AnimatedVisibility
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
import com.example.panipari.logic.FairTurnLogic
import com.example.panipari.model.Member
import com.example.panipari.model.PresenceChange
import com.example.panipari.ui.theme.*

@Composable
fun MembersScreen(
    members: List<Member>,
    presenceChanges: List<PresenceChange>,
    activeMemberId: String?,
    onTogglePresence: (memberId: String) -> Unit,
    onSelectActiveMember: (memberId: String) -> Unit,
    onOpenAddMemberDialog: () -> Unit,
    onArchiveMember: (memberId: String) -> Unit,
    onUnarchiveMember: (memberId: String) -> Unit
) {
    var showArchived by remember { mutableStateOf(false) }

    val activeMembers = members.filter { !it.isArchived }
    val archivedMembers = members.filter { it.isArchived }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(top = 12.dp, bottom = 24.dp)
    ) {
        // Title & Add button
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Flatmates",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                    Text(
                        text = "${activeMembers.size} active in rotation",
                        fontSize = 11.sp,
                        color = Slate400
                    )
                }

                Button(
                    onClick = onOpenAddMemberDialog,
                    colors = ButtonDefaults.buttonColors(containerColor = Sky600),
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Icon(imageVector = Icons.Default.PersonAdd, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Add Member", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Presence Explanatory Card
        item {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = Slate900,
                border = androidx.compose.foundation.BorderStroke(1.dp, Slate800),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = Cyan400,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "Away toggle: When someone travels or visits home, switch them to Away. They are skipped for turns and owe 0 fair shares for cans while away!",
                        fontSize = 12.sp,
                        color = Slate300,
                        lineHeight = 16.sp
                    )
                }
            }
        }

        // List of Active Members
        items(activeMembers) { member ->
            val isPresent = FairTurnLogic.isMemberCurrentlyPresent(member, presenceChanges)
            val isCurrentActive = member.id == activeMemberId

            Surface(
                shape = RoundedCornerShape(18.dp),
                color = Slate900,
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (isCurrentActive) Sky500 else Slate800
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(CircleShape)
                                    .background(Slate800)
                                    .border(
                                        2.dp,
                                        if (isPresent) Emerald400 else Amber400,
                                        CircleShape
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(text = member.emoji, fontSize = 22.sp)
                            }

                            Column {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = member.name,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                    if (isCurrentActive) {
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(6.dp))
                                                .background(Sky600)
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = "YOU",
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color.White
                                            )
                                        }
                                    }
                                }

                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(7.dp)
                                            .clip(CircleShape)
                                            .background(if (isPresent) Emerald400 else Amber400)
                                    )
                                    Text(
                                        text = if (isPresent) "Present in Flat" else "Away (Skipped)",
                                        fontSize = 11.sp,
                                        color = if (isPresent) Emerald400 else Amber400,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        }

                        // Toggle switch for presence
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Switch(
                                checked = isPresent,
                                onCheckedChange = { onTogglePresence(member.id) },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Emerald400,
                                    checkedTrackColor = Emerald950,
                                    uncheckedThumbColor = Amber400,
                                    uncheckedTrackColor = Amber950
                                )
                            )
                        }
                    }

                    // Bottom Row: Act as member & Archive
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (!isCurrentActive) {
                            TextButton(
                                onClick = { onSelectActiveMember(member.id) },
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                Text(text = "Switch To This Member", fontSize = 11.sp, color = Cyan400)
                            }
                        } else {
                            Text(text = "Currently logged as this user", fontSize = 11.sp, color = Slate400)
                        }

                        IconButton(
                            onClick = { onArchiveMember(member.id) },
                            modifier = Modifier.size(28.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Archive,
                                contentDescription = "Archive",
                                tint = Slate400,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }
        }

        // Archived Members Section
        if (archivedMembers.isNotEmpty()) {
            item {
                Surface(
                    onClick = { showArchived = !showArchived },
                    shape = RoundedCornerShape(14.dp),
                    color = Slate900,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Archived Flatmates (${archivedMembers.size})",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Slate400
                        )
                        Icon(
                            imageVector = if (showArchived) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                            contentDescription = null,
                            tint = Slate400
                        )
                    }
                }
            }

            if (showArchived) {
                items(archivedMembers) { member ->
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = Slate900.copy(alpha = 0.5f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Slate800),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(text = member.emoji, fontSize = 20.sp)
                                Column {
                                    Text(text = member.name, fontSize = 14.sp, color = Slate300)
                                    Text(text = "Moved out", fontSize = 10.sp, color = Slate400)
                                }
                            }
                            Button(
                                onClick = { onUnarchiveMember(member.id) },
                                colors = ButtonDefaults.buttonColors(containerColor = Slate800),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Text(text = "Restore", fontSize = 11.sp, color = Cyan400)
                            }
                        }
                    }
                }
            }
        }
    }
}
