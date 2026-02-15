package com.retra.card.usecase

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class CreateMemoRequest(
    @field:NotBlank
    @field:Size(max = 2000)
    val content: String,
    @field:NotBlank
    val participantId: String
)

data class UpdateMemoRequest(
    @field:NotBlank
    @field:Size(max = 2000)
    val content: String,
    @field:NotBlank
    val participantId: String
)

data class DeleteMemoRequest(
    @field:NotBlank
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
