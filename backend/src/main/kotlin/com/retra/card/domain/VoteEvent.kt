package com.retra.card.domain

import com.retra.shared.domain.DomainEvent

sealed class VoteEvent : DomainEvent() {

    data class VoteAdded(
        val boardSlug: String,
        val voteId: String,
        val cardId: String,
        val participantId: String,
        val createdAt: String
    ) : VoteEvent()

    data class VoteRemoved(
        val boardSlug: String,
        val cardId: String,
        val participantId: String
    ) : VoteEvent()
}
