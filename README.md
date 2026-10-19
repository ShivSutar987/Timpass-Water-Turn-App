# PaniPari – Fair Turn & Cost Tracker for Shared Essentials

A modern Android application built with **Kotlin** and **Jetpack Compose (Material 3)** for managing shared household essentials (such as 20L water cans, LPG cylinders, milk subscriptions, and groceries) in shared flats and student hostels.

---

## 🎯 Problem & Purpose

In shared accommodations, flatmates often argue over who ordered or picked up the last 20L water can, cylinder, or groceries, who paid for it, and who was actually present in the flat to consume it.

PaniPari solves this through **presence-weighted, peer-verified turn tracking**:
1. **Presence-Weighted Fairness**: When flatmates go home or travel, their status is toggled to **Away**. They owe **0 fair shares** for items brought during their absence.
2. **Peer Verification**: Any flatmate can claim bringing an essential, but a roommate must verify it. Self-confirmation is prevented.
3. **Turn Calculation Engine**: Balances are calculated as `total credits − sum(1 / |P(t)|)`. The next turn is determined by the lowest balance, with tie-breakers for longest time since last delivery, then alphabetical order.
4. **Expense Ledger & Debt Simplification**: A greedy resolution algorithm reduces complex group expenses into simple pairwise UPI settle-ups with deep-link payment shortcuts.

---

## 📱 Features

- **Hero Turn Dashboard**: Clear visual card showing who's next in rotation, transparent rationale, and a quick turn indicator.
- **Peer-Verified Claims**: 10-minute duplicate protection, on-behalf-of delivery proxy support, and dispute flagging.
- **Empty Essential Alert**: Instant broadcast banner across flatmates when a can/cylinder runs out.
- **Roommate Management**: Real-time presence toggles (Present / Away), avatar emoji selection, and archiving.
- **Turn Balances & Explanations**: Interactive two-sided visual bar charts comparing deliveries brought vs. fair shares owed, with a detailed event-by-event breakdown dialog.
- **Expense Settlements**: Direct UPI deep-linking (`upi://pay?pa=...`) and settlement recording.
- **Audit Trail**: Complete filterable history of all delivery claims, verifications, disputes, presence changes, and settlements.
- **Time Fast-Forward Simulator**: Test 24-hour auto-confirmations for unverified deliveries without waiting.

---

## 🏗️ Architecture

- **Language**: Kotlin
- **UI Framework**: Jetpack Compose (Material 3)
- **Design System**: Slate-950 dark theme with Cyan and Sky accents
- **State Management**: Reactive `StateFlow` and MVVM architecture
- **Build System**: Gradle (Kotlin DSL) with Version Catalog (`libs.versions.toml`)

---

## 🚀 Getting Started

1. Open the project in Android Studio (Ladybug or newer).
2. Sync the project with Gradle files.
3. Run on an Android device or emulator running Android 8.0 (API 26) or higher.
