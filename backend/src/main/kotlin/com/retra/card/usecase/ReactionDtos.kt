package com.retra.card.usecase

import jakarta.validation.constraints.NotBlank

data class AddReactionRequest(
    @field:NotBlank
    val cardId: String,
    @field:NotBlank
    val participantId: String,
    @field:NotBlank
    val emoji: String
)

data class RemoveReactionRequest(
    @field:NotBlank
    val cardId: String,
    @field:NotBlank
    val participantId: String,
    @field:NotBlank
    val emoji: String
)

data class ReactionResponse(
    val id: String,
    val cardId: String,
    val participantId: String,
    val emoji: String,
    val createdAt: String
)
