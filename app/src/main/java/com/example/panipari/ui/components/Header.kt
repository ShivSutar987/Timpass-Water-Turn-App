package com.example.panipari.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.panipari.model.Member
import com.example.panipari.model.Room
import com.example.panipari.ui.theme.*

@Composable
fun AppHeader(
    room: Room,
    members: List<Member>,
    activeMemberId: String?,
    isDemo: Boolean,
    onSelectMember: (String) -> Unit,
    onShowQR: () -> Unit
) {
    val clipboardManager = LocalClipboardManager.current
    var showMemberMenu by remember { mutableStateOf(false) }

    val activeMember = members.find { it.id == activeMemberId }

    Surface(
        color = Slate950,
        contentColor = Slate100,
        tonalElevation = 2.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Left: Logo & Room Name
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Sky600),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = "💧", fontSize = 20.sp)
                    }

                    Column {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = room.name,
                                fontWeight = FontWeight.Black,
                                fontSize = 16.sp,
                                color = Color.White
                            )
                            if (isDemo) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(Cyan950)
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = "DEMO",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Cyan400
                                    )
                                }
                            }
                        }
                        Text(
                            text = "${room.itemName} Rotation",
                            fontSize = 11.sp,
                            color = Slate400
                        )
                    }
                }

                // Right: Active Member Switcher Chip
                Box {
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(16.dp))
                            .background(Slate900)
                            .clickable { showMemberMenu = true }
                            .padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(24.dp)
                                .clip(CircleShape)
                                .background(Sky600),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = activeMember?.emoji ?: "👤",
                                fontSize = 13.sp
                            )
                        }
                        Text(
                            text = activeMember?.name ?: "Switch",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White
                        )
                        Icon(
                            imageVector = Icons.Default.ArrowDropDown,
                            contentDescription = "Switch Member",
                            tint = Slate400,
                            modifier = Modifier.size(16.dp)
                        )
                    }

                    DropdownMenu(
                        expanded = showMemberMenu,
                        onDismissRequest = { showMemberMenu = false }
                    ) {
                        Text(
                            text = "Acting as:",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate400,
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                        )
                        members.filter { !it.isArchived }.forEach { m ->
                            DropdownMenuItem(
                                text = {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Text(text = m.emoji, fontSize = 16.sp)
                                        Text(
                                            text = m.name,
                                            fontWeight = if (m.id == activeMemberId) FontWeight.Bold else FontWeight.Normal
                                        )
                                        if (m.id == activeMemberId) {
                                            Text(
                                                text = "(You)",
                                                fontSize = 11.sp,
                                                color = Cyan400
                                            )
                                        }
                                    }
                                },
                                onClick = {
                                    onSelectMember(m.id)
                                    showMemberMenu = false
                                }
                            )
                        }
                    }
                }
            }

            // Room Code Chip Bar
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(Slate900)
                        .clickable {
                            clipboardManager.setText(AnnotatedString(room.code))
                        }
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(text = "Code:", fontSize = 11.sp, color = Slate400)
                    Text(
                        text = room.code,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Cyan400
                    )
                    Icon(
                        imageVector = Icons.Default.ContentCopy,
                        contentDescription = "Copy Code",
                        tint = Slate400,
                        modifier = Modifier.size(12.dp)
                    )
                }

                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(Slate900)
                        .clickable { onShowQR() }
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.QrCode,
                        contentDescription = "QR Code",
                        tint = Cyan400,
                        modifier = Modifier.size(13.dp)
                    )
                    Text(text = "Share Flat", fontSize = 11.sp, color = Slate300)
                }
            }
        }
    }
}
