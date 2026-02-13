package com.retra.actionitem.domain

import com.retra.shared.domain.DomainEvent

sealed class ActionItemEvent : DomainEvent {

    data class ActionItemCreated(
        val actionItemId: String,
        val boardSlug: String,
        val boardId: String
    ) : ActionItemEvent()

    data class ActionItemUpdated(
        val actionItemId: String,
        val boardSlug: String
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
