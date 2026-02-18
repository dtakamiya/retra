package com.retra.actionitem.domain

import com.retra.shared.domain.DomainEvent

sealed class ActionItemEvent : DomainEvent() {

    data class ActionItemCreated(
        val actionItemId: String,
        val boardSlug: String,
        val boardId: String,
        val cardId: String? = null,
        val content: String = "",
        val assigneeId: String? = null,
        val assigneeNickname: String? = null,
        val dueDate: String? = null,
        val status: String = "OPEN",
        val priority: String = "MEDIUM",
        val sortOrder: Int = 0,
        val createdAt: String = "",
        val updatedAt: String = ""
    ) : ActionItemEvent()

    data class ActionItemUpdated(
        val actionItemId: String,
        val boardSlug: String,
        val boardId: String = "",
        val cardId: String? = null,
        val content: String = "",
        val assigneeId: String? = null,
        val assigneeNickname: String? = null,
        val dueDate: String? = null,
        val status: String = "OPEN",
        val priority: String = "MEDIUM",
        val sortOrder: Int = 0,
        val createdAt: String = "",
        val updatedAt: String = ""
    ) : ActionItemEvent()

    data class ActionItemStatusChanged(
        val actionItemId: String,
        val boardSlug: String,
        val newStatus: ActionItemStatus
    ) : ActionItemEvent()

    data class ActionItemDeleted(
        val actionItemId: String,
        val boardSlug: String
    ) : ActionItemEvent()
}
