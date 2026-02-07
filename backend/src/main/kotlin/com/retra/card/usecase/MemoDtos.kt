package com.retra.card.usecase

data class CreateMemoRequest(
    val content: String,
    val participantId: String
)

data class UpdateMemoRequest(
    val content: String,
    val participantId: String
)

data class DeleteMemoRequest(
    val participantId: String
)

data class MemoResponse(
    val id: String,
    val cardId: String,
    val content: String,
    val authorNickname: String?,
    val participantId: String?,
    val createdAt: String,
    val updatedAt: String
)
