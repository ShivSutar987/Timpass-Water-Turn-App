package com.example.panipari.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.panipari.model.Room
import com.example.panipari.ui.theme.*

@Composable
fun SettingsScreen(
    room: Room,
    isDemo: Boolean,
    onSaveSettings: (name: String, itemName: String, itemUnit: String, autoConfirmHours: Int, defaultCost: Double) -> Unit,
    onShowQR: () -> Unit,
    onFastForward: (hours: Int) -> Unit,
    onLeaveRoom: () -> Unit
) {
    val clipboardManager = LocalClipboardManager.current

    var name by remember(room) { mutableStateOf(room.name) }
    var itemName by remember(room) { mutableStateOf(room.itemName) }
    var itemUnit by remember(room) { mutableStateOf(room.itemUnit) }
    var autoConfirmHours by remember(room) { mutableStateOf(room.autoConfirmHours.toString()) }
    var defaultCost by remember(room) { mutableStateOf(room.defaultCost.toInt().toString()) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(horizontal = 16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Spacer(modifier = Modifier.height(8.dp))

        // Title
        Column {
            Text(
                text = "Room Settings",
                fontSize = 20.sp,
                fontWeight = FontWeight.Black,
                color = Color.White
            )
            Text(
                text = "Configure rotation rules, share code, or test logic",
                fontSize = 11.sp,
                color = Slate400
            )
        }

        // Room Code Card
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = Slate900,
            border = androidx.compose.foundation.BorderStroke(1.dp, Cyan400.copy(alpha = 0.3f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(text = "ROOM CODE", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Cyan400, letterSpacing = 1.sp)
                    Text(
                        text = room.code,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                        letterSpacing = 2.sp
                    )
                    Text(text = "Share with flatmates to let them join", fontSize = 11.sp, color = Slate400)
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    IconButton(
                        onClick = { clipboardManager.setText(AnnotatedString(room.code)) },
                        colors = IconButtonDefaults.iconButtonColors(containerColor = Slate800)
                    ) {
                        Icon(imageVector = Icons.Default.ContentCopy, contentDescription = "Copy", tint = Cyan400)
                    }
                    Button(
                        onClick = onShowQR,
                        colors = ButtonDefaults.buttonColors(containerColor = Sky600),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(imageVector = Icons.Default.QrCode, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("QR")
                    }
                }
            }
        }

        // Settings Form Card
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = Slate900,
            border = androidx.compose.foundation.BorderStroke(1.dp, Slate800),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "EDIT ROTATION RULES",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate400,
                    letterSpacing = 1.sp
                )

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Flat Name") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Cyan400, unfocusedBorderColor = Slate700)
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedTextField(
                        value = itemName,
                        onValueChange = { itemName = it },
                        label = { Text("Item Name") },
                        modifier = Modifier.weight(1.5f),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Cyan400, unfocusedBorderColor = Slate700)
                    )
                    OutlinedTextField(
                        value = itemUnit,
                        onValueChange = { itemUnit = it },
                        label = { Text("Unit") },
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Cyan400, unfocusedBorderColor = Slate700)
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedTextField(
                        value = autoConfirmHours,
                        onValueChange = { autoConfirmHours = it },
                        label = { Text("Auto-confirm (Hours)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Cyan400, unfocusedBorderColor = Slate700)
                    )
                    OutlinedTextField(
                        value = defaultCost,
                        onValueChange = { defaultCost = it },
                        label = { Text("Default Cost (${room.currency})") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Cyan400, unfocusedBorderColor = Slate700)
                    )
                }

                Button(
                    onClick = {
                        val hours = autoConfirmHours.toIntOrNull() ?: 24
                        val cost = defaultCost.toDoubleOrNull() ?: 35.0
                        onSaveSettings(name, itemName, itemUnit, hours, cost)
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Sky600),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(imageVector = Icons.Default.Save, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Save Changes", fontWeight = FontWeight.Bold)
                }
            }
        }

        // Fast-Forward Testing Tool
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = Slate900,
            border = androidx.compose.foundation.BorderStroke(1.dp, Slate800),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(imageVector = Icons.Default.FastForward, contentDescription = null, tint = Cyan400)
                    Text(text = "Testing & Simulation Tools", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
                Text(
                    text = "Simulate elapsed time to verify 24h auto-confirmation of pending claims without waiting.",
                    fontSize = 11.sp,
                    color = Slate400
                )
                Button(
                    onClick = { onFastForward(24) },
                    colors = ButtonDefaults.buttonColors(containerColor = Slate800),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(imageVector = Icons.Default.FastForward, contentDescription = null, tint = Cyan400, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Fast Forward +24 Hours", color = Cyan400, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }

        // Leave Flat button
        Button(
            onClick = onLeaveRoom,
            colors = ButtonDefaults.buttonColors(containerColor = Rose500.copy(alpha = 0.2f)),
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp)
        ) {
            Icon(imageVector = Icons.Default.Logout, contentDescription = null, tint = Rose400, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text(text = if (isDemo) "Exit Demo Mode" else "Leave Flat", color = Rose400, fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}
