package com.retra.card.domain

import com.retra.shared.domain.DomainEvent

sealed class CardEvent : DomainEvent() {

    data class CardCreated(
        val boardSlug: String,
        val cardId: String,
        val columnId: String,
        val content: String,
        val authorNickname: String?,
        val participantId: String?,
        val voteCount: Int,
        val sortOrder: Int,
        val isAnonymous: Boolean,
        val isPrivateWriting: Boolean = false,
        val createdAt: String,
        val updatedAt: String
    ) : CardEvent()

    data class CardUpdated(
        val boardSlug: String,
        val cardId: String,
        val columnId: String,
        val content: String,
        val authorNickname: String?,
        val participantId: String?,
        val voteCount: Int,
        val sortOrder: Int,
        val isAnonymous: Boolean,
        val createdAt: String,
        val updatedAt: String
    ) : CardEvent()

    data class CardDeleted(
        val boardSlug: String,
        val cardId: String,
        val columnId: String
    ) : CardEvent()

    data class CardMoved(
        val boardSlug: String,
        val cardId: String,
        val sourceColumnId: String,
        val targetColumnId: String,
        val sortOrder: Int
    ) : CardEvent()

    data class CardDiscussionMarked(
        val boardSlug: String,
        val cardId: String,
        val isDiscussed: Boolean,
        val discussionOrder: Int
    ) : CardEvent()
}
