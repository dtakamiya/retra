package com.retra.actionitem.usecase

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class CreateActionItemRequest(
    @field:NotBlank
    @field:Size(max = 2000)
    val content: String,
    @field:NotBlank
    val participantId: String,
    val cardId: String? = null,
    val assigneeId: String? = null,
    val dueDate: String? = null,
    val priority: String = "MEDIUM"
)

data class UpdateActionItemRequest(
    @field:NotBlank
    @field:Size(max = 2000)
    val content: String,
    @field:NotBlank
    val participantId: String,
    val assigneeId: String? = null,
    val dueDate: String? = null,
    val priority: String? = null
)

data class UpdateActionItemStatusRequest(
    @field:NotBlank
    val status: String,
    @field:NotBlank
    val participantId: String
)

data class DeleteActionItemRequest(
    @field:NotBlank
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
