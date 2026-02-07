package com.retra.card.usecase

import com.retra.card.domain.Memo

object MemoMapper {

    fun toMemoResponse(memo: Memo): MemoResponse {
        return MemoResponse(
            id = memo.id,
            cardId = memo.card?.id ?: "",
            content = memo.content,
            authorNickname = memo.authorNickname,
            participantId = memo.participant?.id,
            createdAt = memo.createdAt,
            updatedAt = memo.updatedAt
        )
    }
}
