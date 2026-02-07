package com.retra.card.domain

import com.retra.shared.domain.DomainEvent

sealed class CardEvent : DomainEvent {

    data class CardCreated(
        val slug: String,
        val cardId: String,
        val columnId: String,
        val content: String,
        val authorNickname: String?,
        val participantId: String?,
        val voteCount: Int,
        val sortOrder: Int,
        val createdAt: String,
        val updatedAt: String
    ) : CardEvent()

    data class CardUpdated(
        val slug: String,
        val cardId: String,
        val columnId: String,
        val content: String,
        val authorNickname: String?,
        val participantId: String?,
        val voteCount: Int,
        val sortOrder: Int,
        val createdAt: String,
        val updatedAt: String
    ) : CardEvent()

    data class CardDeleted(
        val slug: String,
        val cardId: String,
        val columnId: String
    ) : CardEvent()

    data class CardMoved(
        val slug: String,
        val cardId: String,
        val sourceColumnId: String,
        val targetColumnId: String,
        val sortOrder: Int
    ) : CardEvent()
}
