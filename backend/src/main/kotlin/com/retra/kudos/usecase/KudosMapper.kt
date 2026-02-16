package com.retra.kudos.usecase

import com.retra.kudos.domain.Kudos

object KudosMapper {
    fun toResponse(kudos: Kudos): KudosResponse {
        return KudosResponse(
            id = kudos.id,
            boardId = kudos.board?.id ?: "",
            senderId = kudos.sender?.id ?: "",
            senderNickname = kudos.sender?.nickname ?: "",
            receiverId = kudos.receiver?.id ?: "",
            receiverNickname = kudos.receiver?.nickname ?: "",
            category = kudos.category.name,
            message = kudos.message,
            createdAt = kudos.createdAt
        )
    }
}
