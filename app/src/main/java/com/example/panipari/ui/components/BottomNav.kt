package com.example.panipari.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.panipari.ui.theme.*
import com.example.panipari.viewmodel.AppTab

@Composable
fun AppBottomNav(
    activeTab: AppTab,
    onTabSelected: (AppTab) -> Unit
) {
    NavigationBar(
        containerColor = Slate950,
        contentColor = Slate300,
        tonalElevation = 8.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        val items = listOf(
            Triple(AppTab.HOME, Icons.Default.WaterDrop, Icons.Outlined.WaterDrop),
            Triple(AppTab.MEMBERS, Icons.Default.Group, Icons.Outlined.Group),
            Triple(AppTab.BALANCE, Icons.Default.BarChart, Icons.Outlined.BarChart),
            Triple(AppTab.COSTS, Icons.Default.ReceiptLong, Icons.Outlined.ReceiptLong),
            Triple(AppTab.HISTORY, Icons.Default.History, Icons.Outlined.History),
            Triple(AppTab.SETTINGS, Icons.Default.Settings, Icons.Outlined.Settings)
        )

        items.forEach { (tab, filledIcon, outlinedIcon) ->
            val isSelected = activeTab == tab
            NavigationBarItem(
                selected = isSelected,
                onClick = { onTabSelected(tab) },
                icon = {
                    Icon(
                        imageVector = if (isSelected) filledIcon else outlinedIcon,
                        contentDescription = tab.title,
                        tint = if (isSelected) Cyan400 else Slate400,
                        modifier = Modifier.size(22.dp)
                    )
                },
                label = {
                    Text(
                        text = tab.title,
                        fontSize = 10.sp,
                        color = if (isSelected) Cyan400 else Slate400
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    indicatorColor = Cyan950
                )
            )
        }
    }
}
