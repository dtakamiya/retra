package com.retra.kudos.domain

import com.retra.shared.domain.DomainEvent

sealed class KudosEvent : DomainEvent() {

    data class KudosSent(
        val boardSlug: String,
        val kudosId: String,
        val senderId: String,
        val senderNickname: String,
        val receiverId: String,
        val receiverNickname: String,
        val category: KudosCategory,
        val message: String?,
        val createdAt: String
    ) : KudosEvent()

    data class KudosDeleted(
        val boardSlug: String,
        val kudosId: String
    ) : KudosEvent()
}
