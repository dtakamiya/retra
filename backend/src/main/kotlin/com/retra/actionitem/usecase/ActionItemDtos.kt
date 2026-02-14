package com.retra.actionitem.usecase

data class CreateActionItemRequest(
    val content: String,
    val participantId: String,
    val cardId: String? = null,
    val assigneeId: String? = null,
    val dueDate: String? = null,
    val priority: String = "MEDIUM"
)

data class UpdateActionItemRequest(
    val content: String,
    val participantId: String,
    val assigneeId: String? = null,
    val dueDate: String? = null,
    val priority: String? = null
)

data class UpdateActionItemStatusRequest(
    val status: String,
    val participantId: String
)

data class DeleteActionItemRequest(
    val participantId: String
)

data class ActionItemResponse(
    val id: String,
    val boardId: String,
    val cardId: String?,
    val content: String,
    val assigneeId: String?,
    val assigneeNickname: String?,
    val dueDate: String?,
    val status: String,
    val priority: String,
    val sortOrder: Int,
    val createdAt: String,
    val updatedAt: String
)
