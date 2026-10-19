package com.example.panipari.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val Slate950 = Color(0xFF020617)
val Slate900 = Color(0xFF0F172A)
val Slate800 = Color(0xFF1E293B)
val Slate700 = Color(0xFF334155)
val Slate400 = Color(0xFF94A3B8)
val Slate300 = Color(0xFFCBD5E1)
val Slate100 = Color(0xFFF1F5F9)

val Sky600 = Color(0xFF0284C7)
val Sky500 = Color(0xFF0EA5E9)
val Sky400 = Color(0xFF38BDF8)
val Cyan500 = Color(0xFF06B6D4)
val Cyan400 = Color(0xFF22D3EE)
val Cyan950 = Color(0xFF083344)

val Emerald500 = Color(0xFF10B981)
val Emerald400 = Color(0xFF34D399)
val Emerald950 = Color(0xFF064E3B)

val Amber500 = Color(0xFFF59E0B)
val Amber400 = Color(0xFFFBBF24)
val Amber950 = Color(0xFF451A03)

val Rose500 = Color(0xFFF43F5E)
val Rose400 = Color(0xFFFB7185)

private val DarkColorScheme = darkColorScheme(
    primary = Sky500,
    onPrimary = Color.White,
    primaryContainer = Sky600,
    onPrimaryContainer = Color.White,
    secondary = Cyan400,
    onSecondary = Slate950,
    secondaryContainer = Cyan950,
    onSecondaryContainer = Cyan400,
    background = Slate950,
    onBackground = Slate100,
    surface = Slate900,
    onSurface = Slate100,
    surfaceVariant = Slate800,
    onSurfaceVariant = Slate300,
    outline = Slate700,
    error = Rose500,
    onError = Color.White
)

@Composable
fun PaniPariTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography(),
        content = content
    )
}
