package com.example.panipari.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import com.example.panipari.model.Room
import com.example.panipari.ui.theme.*

@Composable
fun WelcomeScreen(
    savedRooms: List<Room> = emptyList(),
    onOpenSavedRoom: (roomId: String) -> Unit = {},
    onDeleteSavedRoom: (roomId: String) -> Unit = {},
    onOpenQrScanner: () -> Unit = {},
    onCreateRoom: (name: String, itemName: String, itemUnit: String, creatorName: String) -> Unit,
    onJoinRoom: (code: String, userName: String) -> Unit,
    onStartDemo: () -> Unit
) {
    var mode by remember { mutableStateOf("welcome") } // "welcome", "create", "join"

    var roomName by remember { mutableStateOf("") }
    var itemName by remember { mutableStateOf("20L Water Can") }
    var itemUnit by remember { mutableStateOf("Can") }
    var creatorName by remember { mutableStateOf("") }

    var joinCode by remember { mutableStateOf("") }
    var joinUserName by remember { mutableStateOf("") }

    val presets = listOf(
        Triple("20L Water Can", "Can", "💧"),
        Triple("LPG Cylinder", "Cylinder", "🔥"),
        Triple("Daily Milk", "Liter", "🥛"),
        Triple("Groceries", "Order", "🛒")
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(18.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Header
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(top = 24.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(68.dp)
                    .clip(RoundedCornerShape(22.dp))
                    .background(Sky600),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "💧", fontSize = 34.sp)
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = "PaniPari",
                fontSize = 30.sp,
                fontWeight = FontWeight.Black,
                color = Color.White
            )

            Text(
                text = "FAIR TURN & COST TRACKER",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = Cyan400,
                letterSpacing = 2.sp
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "Zero arguments over 20L water cans, LPG cylinders, or milk. Presence-weighted, peer-verified turns.",
                fontSize = 12.sp,
                color = Slate400,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                modifier = Modifier.padding(horizontal = 12.dp)
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Center Action Container
        when (mode) {
            "welcome" -> {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Previously Saved Flats Card (if any saved on this phone)
                    if (savedRooms.isNotEmpty()) {
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = Slate900,
                            border = androidx.compose.foundation.BorderStroke(1.dp, Cyan400.copy(alpha = 0.4f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "SAVED FLATS ON THIS PHONE",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Cyan400,
                                        letterSpacing = 1.sp
                                    )
                                    Text(
                                        text = "${savedRooms.size} flat(s)",
                                        fontSize = 11.sp,
                                        color = Slate400
                                    )
                                }

                                savedRooms.forEach { saved ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(Slate950)
                                            .clickable { onOpenSavedRoom(saved.id) }
                                            .padding(12.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = saved.name,
                                                fontSize = 14.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color.White
                                            )
                                            Text(
                                                text = "Code: ${saved.code} • ${saved.itemName}",
                                                fontSize = 11.sp,
                                                color = Slate400
                                            )
                                        }

                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Button(
                                                onClick = { onOpenSavedRoom(saved.id) },
                                                colors = ButtonDefaults.buttonColors(containerColor = Sky600),
                                                shape = RoundedCornerShape(8.dp),
                                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                                                modifier = Modifier.height(30.dp)
                                            ) {
                                                Text("Open", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                            }

                                            IconButton(
                                                onClick = { onDeleteSavedRoom(saved.id) },
                                                modifier = Modifier.size(28.dp)
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Default.DeleteOutline,
                                                    contentDescription = "Delete",
                                                    tint = Slate500,
                                                    modifier = Modifier.size(16.dp)
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Create Flat Card Button
                    Surface(
                        onClick = { mode = "create" },
                        shape = RoundedCornerShape(20.dp),
                        color = Sky600,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(text = "Create Flat / Room", fontSize = 16.sp, fontWeight = FontWeight.Black, color = Color.White)
                                Text(text = "Set up your flat & generate a 6-character code", fontSize = 11.sp, color = Slate100)
                            }
                            Icon(imageVector = Icons.Default.ArrowForward, contentDescription = null, tint = Color.White)
                        }
                    }

                    // Join Flat Card Button
                    Surface(
                        onClick = { mode = "join" },
                        shape = RoundedCornerShape(20.dp),
                        color = Slate900,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Slate700),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(text = "Join with Room Code", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                Text(text = "Enter 6-char code shared by your roommate", fontSize = 11.sp, color = Slate400)
                            }
                            Icon(imageVector = Icons.Default.Key, contentDescription = null, tint = Cyan400)
                        }
                    }

                    // Quick QR Scanner Trigger Button
                    Surface(
                        onClick = onOpenQrScanner,
                        shape = RoundedCornerShape(20.dp),
                        color = Slate900,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Cyan500.copy(alpha = 0.5f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(Cyan950),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(imageVector = Icons.Default.QrCodeScanner, contentDescription = null, tint = Cyan400, modifier = Modifier.size(20.dp))
                                }
                                Column {
                                    Text(text = "Scan Flat QR Code", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    Text(text = "Scan photo/screenshot or paste WhatsApp link", fontSize = 11.sp, color = Slate400)
                                }
                            }
                            Icon(imageVector = Icons.Default.ArrowForward, contentDescription = null, tint = Cyan400)
                        }
                    }

                    // Demo Mode Sandbox
                    Surface(
                        onClick = onStartDemo,
                        shape = RoundedCornerShape(16.dp),
                        color = Slate900.copy(alpha = 0.5f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Slate800),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(imageVector = Icons.Default.Science, contentDescription = null, tint = Cyan400, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = "Try Demo Mode (Flat 402 Sandbox)", fontSize = 12.sp, color = Cyan300, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }

            "create" -> {
                Surface(
                    shape = RoundedCornerShape(24.dp),
                    color = Slate900,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = "Create Flat / Room", fontWeight = FontWeight.Black, fontSize = 18.sp, color = Color.White)
                            IconButton(onClick = { mode = "welcome" }) {
                                Icon(imageVector = Icons.Default.Close, contentDescription = "Cancel", tint = Slate400)
                            }
                        }

                        OutlinedTextField(
                            value = roomName,
                            onValueChange = { roomName = it },
                            label = { Text("Flat / Room Name") },
                            placeholder = { Text("e.g. Flat 302 Boys, Ganga Hostel") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Cyan400, unfocusedBorderColor = Slate700)
                        )

                        OutlinedTextField(
                            value = creatorName,
                            onValueChange = { creatorName = it },
                            label = { Text("Your Name") },
                            placeholder = { Text("e.g. Aarav, Rohan") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Cyan400, unfocusedBorderColor = Slate700)
                        )

                        // Preset Essential selector
                        Column {
                            Text(text = "Tracked Essential:", fontSize = 11.sp, color = Slate400)
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                presets.forEach { (name, unit, icon) ->
                                    val isSelected = itemName == name
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(if (isSelected) Sky600 else Slate800)
                                            .clickable {
                                                itemName = name
                                                itemUnit = unit
                                            }
                                            .padding(horizontal = 8.dp, vertical = 6.dp)
                                    ) {
                                        Text(text = "$icon $unit", fontSize = 11.sp, color = if (isSelected) Color.White else Slate300)
                                    }
                                }
                            }
                        }

                        Button(
                            onClick = {
                                if (roomName.isNotBlank() && creatorName.isNotBlank()) {
                                    onCreateRoom(roomName, itemName, itemUnit, creatorName)
                                }
                            },
                            enabled = roomName.isNotBlank() && creatorName.isNotBlank(),
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = Sky600)
                        ) {
                            Text("Create & Save Flat to Phone", fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }
                }
            }

            "join" -> {
                Surface(
                    shape = RoundedCornerShape(24.dp),
                    color = Slate900,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = "Join Flat", fontWeight = FontWeight.Black, fontSize = 18.sp, color = Color.White)
                            IconButton(onClick = { mode = "welcome" }) {
                                Icon(imageVector = Icons.Default.Close, contentDescription = "Cancel", tint = Slate400)
                            }
                        }

                        // Button to scan QR directly
                        Button(
                            onClick = onOpenQrScanner,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = Sky600),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(imageVector = Icons.Default.QrCodeScanner, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Scan QR Code from Camera / Photo", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            HorizontalDivider(modifier = Modifier.weight(1f), color = Slate800)
                            Text("  OR ENTER CODE  ", fontSize = 10.sp, color = Slate500, fontWeight = FontWeight.Bold)
                            HorizontalDivider(modifier = Modifier.weight(1f), color = Slate800)
                        }

                        OutlinedTextField(
                            value = joinCode,
                            onValueChange = { joinCode = it.uppercase().take(8) },
                            label = { Text("Room Code (e.g. PP402A or DEMO42)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Cyan400, unfocusedBorderColor = Slate700)
                        )

                        OutlinedTextField(
                            value = joinUserName,
                            onValueChange = { joinUserName = it },
                            label = { Text("Your Name (Optional)") },
                            placeholder = { Text("e.g. Priya, Rohit") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Cyan400, unfocusedBorderColor = Slate700)
                        )

                        Button(
                            onClick = {
                                if (joinCode.isNotBlank()) {
                                    onJoinRoom(joinCode, joinUserName)
                                }
                            },
                            enabled = joinCode.isNotBlank(),
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = Cyan500)
                        ) {
                            Text("Join Room Now", fontWeight = FontWeight.Bold, color = Slate950)
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "PaniPari • Fair Turn Tracking for Shared Flats",
            fontSize = 10.sp,
            color = Slate400,
            modifier = Modifier.padding(bottom = 8.dp)
        )
    }
}
