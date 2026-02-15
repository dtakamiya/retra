package com.retra.card.domain

import com.retra.shared.domain.DomainEvent

sealed class MemoEvent : DomainEvent() {

    data class MemoCreated(
        val boardSlug: String,
        val cardId: String,
        val memoId: String,
        val content: String,
        val authorNickname: String?,
        val participantId: String?,
        val createdAt: String,
        val updatedAt: String
    ) : MemoEvent()

    data class MemoUpdated(
        val boardSlug: String,
        val cardId: String,
        val memoId: String,
        val content: String,
        val authorNickname: String?,
        val participantId: String?,
        val createdAt: String,
        val updatedAt: String
    ) : MemoEvent()

    data class MemoDeleted(
        val boardSlug: String,
        val cardId: String,
        val memoId: String
    ) : MemoEvent()
}
