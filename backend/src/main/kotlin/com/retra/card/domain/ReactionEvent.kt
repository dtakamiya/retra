package com.retra.card.domain

import com.retra.shared.domain.DomainEvent

sealed class ReactionEvent : DomainEvent() {

    data class ReactionAdded(
        val boardSlug: String,
        val reactionId: String,
        val cardId: String,
        val participantId: String,
        val emoji: String,
        val createdAt: String
    ) : ReactionEvent()

    data class ReactionRemoved(
        val boardSlug: String,
        val cardId: String,
        val participantId: String,
        val emoji: String
    ) : ReactionEvent()
}
