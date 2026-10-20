package com.example.panipari.data

import android.content.Context
import android.content.SharedPreferences
import android.net.Uri
import com.example.panipari.model.*
import org.json.JSONArray
import org.json.JSONObject
import java.net.URLDecoder
import java.net.URLEncoder

data class RoomDataBundle(
    val room: Room,
    val members: List<Member>,
    val presenceChanges: List<PresenceChange>,
    val claims: List<Claim>,
    val auditEvents: List<AuditEvent>,
    val activeMemberId: String? = null
)

data class ParsedInvite(
    val code: String,
    val roomName: String? = null,
    val itemName: String? = null,
    val itemUnit: String? = null,
    val creatorName: String? = null
)

class PaniPariStorage(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("panipari_local_db", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_ACTIVE_ROOM_ID = "active_room_id"
        private const val KEY_ACTIVE_MEMBER_ID = "active_member_id"
        private const val KEY_IS_DEMO = "is_demo_active"
        private const val KEY_SAVED_ROOM_IDS = "saved_room_ids"
        private const val PREFIX_ROOM_BUNDLE = "bundle_room_"
        private const val PREFIX_CODE_INDEX = "code_index_"
    }

    // Active room pointer
    fun getActiveRoomId(): String? = prefs.getString(KEY_ACTIVE_ROOM_ID, null)

    fun setActiveRoomId(roomId: String?) {
        prefs.edit().apply {
            if (roomId == null) remove(KEY_ACTIVE_ROOM_ID) else putString(KEY_ACTIVE_ROOM_ID, roomId)
            apply()
        }
    }

    fun getActiveMemberId(): String? = prefs.getString(KEY_ACTIVE_MEMBER_ID, null)

    fun setActiveMemberId(memberId: String?) {
        prefs.edit().apply {
            if (memberId == null) remove(KEY_ACTIVE_MEMBER_ID) else putString(KEY_ACTIVE_MEMBER_ID, memberId)
            apply()
        }
    }

    fun isDemo(): Boolean = prefs.getBoolean(KEY_IS_DEMO, false)

    fun setDemo(isDemo: Boolean) {
        prefs.edit().putBoolean(KEY_IS_DEMO, isDemo).apply()
    }

    // Save full room data to persistent mobile storage
    fun saveRoomBundle(bundle: RoomDataBundle) {
        val roomId = bundle.room.id
        val roomCode = bundle.room.code.trim().uppercase()

        val json = JSONObject().apply {
            put("room", roomToJson(bundle.room))
            put("members", membersToJson(bundle.members))
            put("presence", presenceToJson(bundle.presenceChanges))
            put("claims", claimsToJson(bundle.claims))
            put("audit", auditToJson(bundle.auditEvents))
            put("activeMemberId", bundle.activeMemberId ?: "")
        }

        val savedIds = getSavedRoomIds().toMutableSet().apply { add(roomId) }

        prefs.edit().apply {
            putString(PREFIX_ROOM_BUNDLE + roomId, json.toString())
            putString(PREFIX_CODE_INDEX + roomCode, roomId)
            putStringSet(KEY_SAVED_ROOM_IDS, savedIds)
            apply()
        }
    }

    fun getRoomBundle(roomId: String): RoomDataBundle? {
        val raw = prefs.getString(PREFIX_ROOM_BUNDLE + roomId, null) ?: return null
        return try {
            val json = JSONObject(raw)
            val room = jsonToRoom(json.getJSONObject("room"))
            val members = jsonToMembers(json.getJSONArray("members"))
            val presence = jsonToPresence(json.getJSONArray("presence"))
            val claims = jsonToClaims(json.getJSONArray("claims"))
            val audit = jsonToAudit(json.getJSONArray("audit"))
            val activeMember = json.optString("activeMemberId", "").ifEmpty { null }

            RoomDataBundle(
                room = room,
                members = members,
                presenceChanges = presence,
                claims = claims,
                auditEvents = audit,
                activeMemberId = activeMember
            )
        } catch (e: Exception) {
            null
        }
    }

    fun getRoomBundleByCode(code: String): RoomDataBundle? {
        val normalized = code.trim().uppercase()
        val roomId = prefs.getString(PREFIX_CODE_INDEX + normalized, null) ?: return null
        return getRoomBundle(roomId)
    }

    fun getAllSavedRooms(): List<Room> {
        val ids = getSavedRoomIds()
        val rooms = mutableListOf<Room>()
        for (id in ids) {
            getRoomBundle(id)?.let { rooms.add(it.room) }
        }
        return rooms.sortedByDescending { it.createdAt }
    }

    fun deleteRoom(roomId: String) {
        val bundle = getRoomBundle(roomId)
        val savedIds = getSavedRoomIds().toMutableSet().apply { remove(roomId) }

        prefs.edit().apply {
            remove(PREFIX_ROOM_BUNDLE + roomId)
            bundle?.let { remove(PREFIX_CODE_INDEX + it.room.code.trim().uppercase()) }
            putStringSet(KEY_SAVED_ROOM_IDS, savedIds)
            if (getActiveRoomId() == roomId) {
                remove(KEY_ACTIVE_ROOM_ID)
                remove(KEY_ACTIVE_MEMBER_ID)
            }
            apply()
        }
    }

    fun clearAllData() {
        prefs.edit().clear().apply()
    }

    private fun getSavedRoomIds(): Set<String> {
        return prefs.getStringSet(KEY_SAVED_ROOM_IDS, emptySet()) ?: emptySet()
    }

    // Portable Invite URI Generator & Parser
    fun createInviteUri(room: Room, creatorName: String? = null): String {
        val c = URLEncoder.encode(room.code, "UTF-8")
        val n = URLEncoder.encode(room.name, "UTF-8")
        val i = URLEncoder.encode(room.itemName, "UTF-8")
        val u = URLEncoder.encode(room.itemUnit, "UTF-8")
        val by = URLEncoder.encode(creatorName ?: "", "UTF-8")
        return "panipari://join?c=$c&n=$n&i=$i&u=$u&by=$by"
    }

    fun parseInviteText(text: String): ParsedInvite? {
        val trimmed = text.trim()
        if (trimmed.isEmpty()) return null

        // 1. Try URI Parsing
        if (trimmed.startsWith("panipari://join", ignoreCase = true) ||
            trimmed.contains("?join=", ignoreCase = true) ||
            trimmed.contains("join?c=", ignoreCase = true)
        ) {
            try {
                val uri = Uri.parse(trimmed)
                val code = uri.getQueryParameter("c")
                    ?: uri.getQueryParameter("code")
                    ?: uri.getQueryParameter("join")
                if (!code.isNullOrBlank()) {
                    val name = uri.getQueryParameter("n") ?: uri.getQueryParameter("name")
                    val item = uri.getQueryParameter("i") ?: uri.getQueryParameter("item")
                    val unit = uri.getQueryParameter("u") ?: uri.getQueryParameter("unit")
                    val by = uri.getQueryParameter("by") ?: uri.getQueryParameter("creator")
                    return ParsedInvite(
                        code = code.trim().uppercase(),
                        roomName = name?.let { URLDecoder.decode(it, "UTF-8") },
                        itemName = item?.let { URLDecoder.decode(it, "UTF-8") },
                        itemUnit = unit?.let { URLDecoder.decode(it, "UTF-8") },
                        creatorName = by?.let { URLDecoder.decode(it, "UTF-8") }
                    )
                }
            } catch (_: Exception) {
                //
            }
        }

        // 2. Try Regex matching 6-character room code from text (e.g., from WhatsApp invite)
        val codeRegex = Regex("\\b([A-HJ-NP-Z2-9]{6})\\b", RegexOption.IGNORE_CASE)
        val match = codeRegex.find(trimmed)
        if (match != null) {
            val code = match.value.uppercase()
            // Try extracting Flat name if present in text like "Join our flat Flat 302 Boys on PaniPari"
            val flatMatch = Regex("flat\\s+([a-zA-Z0-9\\s]{2,25})\\s+on\\s+PaniPari", RegexOption.IGNORE_CASE).find(trimmed)
            val detectedName = flatMatch?.groupValues?.getOrNull(1)?.trim()

            return ParsedInvite(
                code = code,
                roomName = detectedName
            )
        }

        // 3. Fallback: If 4-8 chars alphanumeric, treat as raw code
        if (trimmed.length in 4..8 && trimmed.all { it.isLetterOrDigit() }) {
            return ParsedInvite(code = trimmed.uppercase())
        }

        return null
    }

    // JSON serialization helpers
    private fun roomToJson(r: Room): JSONObject = JSONObject().apply {
        put("id", r.id)
        put("code", r.code)
        put("name", r.name)
        put("itemName", r.itemName)
        put("itemUnit", r.itemUnit)
        put("autoConfirmHours", r.autoConfirmHours)
        put("defaultCost", r.defaultCost)
        put("currency", r.currency)
        put("createdAt", r.createdAt)
        r.emptyAlert?.let {
            put("emptyAlert", JSONObject().apply {
                put("reportedAt", it.reportedAt)
                put("reportedByMemberId", it.reportedByMemberId)
                put("targetMemberId", it.targetMemberId)
                put("resolved", it.resolved)
            })
        }
    }

    private fun jsonToRoom(obj: JSONObject): Room {
        val emptyAlert = if (obj.has("emptyAlert") && !obj.isNull("emptyAlert")) {
            val a = obj.getJSONObject("emptyAlert")
            EmptyAlert(
                reportedAt = a.optLong("reportedAt"),
                reportedByMemberId = a.optString("reportedByMemberId"),
                targetMemberId = a.optString("targetMemberId"),
                resolved = a.optBoolean("resolved")
            )
        } else null

        return Room(
            id = obj.getString("id"),
            code = obj.getString("code"),
            name = obj.getString("name"),
            itemName = obj.optString("itemName", "20L Water Can"),
            itemUnit = obj.optString("itemUnit", "Can"),
            autoConfirmHours = obj.optInt("autoConfirmHours", 24),
            defaultCost = obj.optDouble("defaultCost", 35.0),
            currency = obj.optString("currency", "₹"),
            createdAt = obj.optLong("createdAt", System.currentTimeMillis()),
            emptyAlert = emptyAlert
        )
    }

    private fun membersToJson(list: List<Member>): JSONArray = JSONArray().apply {
        for (m in list) {
            put(JSONObject().apply {
                put("id", m.id)
                put("roomId", m.roomId)
                put("name", m.name)
                put("color", m.color)
                put("emoji", m.emoji)
                put("upiId", m.upiId ?: "")
                put("joinedAt", m.joinedAt)
                put("isArchived", m.isArchived)
            })
        }
    }

    private fun jsonToMembers(arr: JSONArray): List<Member> {
        val list = mutableListOf<Member>()
        for (i in 0 until arr.length()) {
            val obj = arr.getJSONObject(i)
            list.add(
                Member(
                    id = obj.getString("id"),
                    roomId = obj.getString("roomId"),
                    name = obj.getString("name"),
                    color = obj.optString("color", "#0284c7"),
                    emoji = obj.optString("emoji", "💧"),
                    upiId = obj.optString("upiId", "").ifEmpty { null },
                    joinedAt = obj.optLong("joinedAt", System.currentTimeMillis()),
                    isArchived = obj.optBoolean("isArchived", false)
                )
            )
        }
        return list
    }

    private fun presenceToJson(list: List<PresenceChange>): JSONArray = JSONArray().apply {
        for (p in list) {
            put(JSONObject().apply {
                put("id", p.id)
                put("roomId", p.roomId)
                put("memberId", p.memberId)
                put("status", p.status.name)
                put("changedAt", p.changedAt)
                put("reason", p.reason ?: "")
            })
        }
    }

    private fun jsonToPresence(arr: JSONArray): List<PresenceChange> {
        val list = mutableListOf<PresenceChange>()
        for (i in 0 until arr.length()) {
            val obj = arr.getJSONObject(i)
            list.add(
                PresenceChange(
                    id = obj.getString("id"),
                    roomId = obj.getString("roomId"),
                    memberId = obj.getString("memberId"),
                    status = try {
                        PresenceStatus.valueOf(obj.getString("status"))
                    } catch (_: Exception) {
                        PresenceStatus.PRESENT
                    },
                    changedAt = obj.optLong("changedAt", System.currentTimeMillis()),
                    reason = obj.optString("reason", "").ifEmpty { null }
                )
            )
        }
        return list
    }

    private fun claimsToJson(list: List<Claim>): JSONArray = JSONArray().apply {
        for (c in list) {
            put(JSONObject().apply {
                put("id", c.id)
                put("roomId", c.roomId)
                put("broughtByMemberId", c.broughtByMemberId)
                put("onBehalfOfMemberId", c.onBehalfOfMemberId)
                put("cost", c.cost)
                put("note", c.note ?: "")
                put("status", c.status.name)
                put("createdAt", c.createdAt)
                put("confirmedByMemberId", c.confirmedByMemberId ?: "")
                put("confirmedAt", c.confirmedAt ?: 0L)
                put("disputeReason", c.disputeReason ?: "")
                put("disputedByMemberId", c.disputedByMemberId ?: "")
                put("disputedAt", c.disputedAt ?: 0L)
            })
        }
    }

    private fun jsonToClaims(arr: JSONArray): List<Claim> {
        val list = mutableListOf<Claim>()
        for (i in 0 until arr.length()) {
            val obj = arr.getJSONObject(i)
            list.add(
                Claim(
                    id = obj.getString("id"),
                    roomId = obj.getString("roomId"),
                    broughtByMemberId = obj.getString("broughtByMemberId"),
                    onBehalfOfMemberId = obj.optString("onBehalfOfMemberId", obj.getString("broughtByMemberId")),
                    cost = obj.optDouble("cost", 0.0),
                    note = obj.optString("note", "").ifEmpty { null },
                    status = try {
                        ClaimStatus.valueOf(obj.getString("status"))
                    } catch (_: Exception) {
                        ClaimStatus.PENDING
                    },
                    createdAt = obj.optLong("createdAt", System.currentTimeMillis()),
                    confirmedByMemberId = obj.optString("confirmedByMemberId", "").ifEmpty { null },
                    confirmedAt = obj.optLong("confirmedAt", 0L).let { if (it > 0) it else null },
                    disputeReason = obj.optString("disputeReason", "").ifEmpty { null },
                    disputedByMemberId = obj.optString("disputedByMemberId", "").ifEmpty { null },
                    disputedAt = obj.optLong("disputedAt", 0L).let { if (it > 0) it else null }
                )
            )
        }
        return list
    }

    private fun auditToJson(list: List<AuditEvent>): JSONArray = JSONArray().apply {
        for (a in list) {
            put(JSONObject().apply {
                put("id", a.id)
                put("roomId", a.roomId)
                put("type", a.type.name)
                put("memberId", a.memberId ?: "")
                put("details", a.details)
                put("createdAt", a.createdAt)
            })
        }
    }

    private fun jsonToAudit(arr: JSONArray): List<AuditEvent> {
        val list = mutableListOf<AuditEvent>()
        for (i in 0 until arr.length()) {
            val obj = arr.getJSONObject(i)
            list.add(
                AuditEvent(
                    id = obj.getString("id"),
                    roomId = obj.getString("roomId"),
                    type = try {
                        EventType.valueOf(obj.getString("type"))
                    } catch (_: Exception) {
                        EventType.CLAIM_CREATED
                    },
                    memberId = obj.optString("memberId", "").ifEmpty { null },
                    details = obj.getString("details"),
                    createdAt = obj.optLong("createdAt", System.currentTimeMillis())
                )
            )
        }
        return list
    }
}
