package com.retra.card.usecase

data class AddReactionRequest(
    val cardId: String,
    val participantId: String,
    val emoji: String
)

data class RemoveReactionRequest(
    val cardId: String,
    val participantId: String,
    val emoji: String
)

data class ReactionResponse(
    val id: String,
    val cardId: String,
    val participantId: String,
    val emoji: String,
    val createdAt: String
)
