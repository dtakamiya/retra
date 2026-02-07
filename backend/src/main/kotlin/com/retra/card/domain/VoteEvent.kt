package com.retra.card.domain

import com.retra.shared.domain.DomainEvent

sealed class VoteEvent : DomainEvent {

    data class VoteAdded(
        val slug: String,
        val voteId: String,
        val cardId: String,
        val participantId: String,
        val createdAt: String
    ) : VoteEvent()

    data class VoteRemoved(
        val slug: String,
        val cardId: String,
        val participantId: String
    ) : VoteEvent()
}
