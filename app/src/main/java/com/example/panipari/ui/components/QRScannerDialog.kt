package com.example.panipari.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.panipari.ui.theme.*

@Composable
fun QRScannerDialog(
    storage: Any? = null,
    onDismiss: () -> Unit,
    onJoinSuccess: (String, String?, Any?) -> Unit
) {
    var codeInput by remember { mutableStateOf("") }
    var userNameInput by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Slate900,
            border = androidx.compose.foundation.BorderStroke(1.dp, Slate800),
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
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .background(Cyan950, RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.QrCodeScanner,
                                contentDescription = null,
                                tint = Cyan400,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Text(
                            text = "Join Room with Code",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = Color.White
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Slate400)
                    }
                }

                Text(
                    text = "Enter the 6-character room code or paste the invite link shared by your roommate.",
                    fontSize = 12.sp,
                    color = Slate400
                )

                OutlinedTextField(
                    value = codeInput,
                    onValueChange = {
                        val trimmed = it.trim()
                        // If pasted URL, parse code
                        if (trimmed.contains("join=")) {
                            val extracted = trimmed.substringAfter("join=").substringBefore("&").take(8)
                            codeInput = extracted.uppercase()
                        } else {
                            codeInput = trimmed.take(8).uppercase()
                        }
                        errorMessage = null
                    },
                    label = { Text("Room Code (e.g. PP402A)") },
                    placeholder = { Text("PP402A") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Cyan400,
                        unfocusedBorderColor = Slate700
                    )
                )

                OutlinedTextField(
                    value = userNameInput,
                    onValueChange = { userNameInput = it },
                    label = { Text("Your Name (Optional)") },
                    placeholder = { Text("e.g. Aarav, Rohan") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Cyan400,
                        unfocusedBorderColor = Slate700
                    )
                )

                errorMessage?.let { err ->
                    Text(
                        text = err,
                        color = Rose400,
                        fontSize = 12.sp
                    )
                }

                Button(
                    onClick = {
                        val clean = codeInput.trim()
                        if (clean.length < 4) {
                            errorMessage = "Please enter a valid room code (at least 4 characters)"
                            return@Button
                        }
                        onJoinSuccess(clean, userNameInput.trim().ifEmpty { null }, null)
                    },
                    enabled = codeInput.trim().length >= 4,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Cyan500),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = "Join Room",
                        color = Slate950,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
