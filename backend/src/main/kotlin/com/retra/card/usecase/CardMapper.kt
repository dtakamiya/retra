package com.retra.card.usecase

import com.retra.card.domain.Card
import com.retra.card.domain.Vote

object CardMapper {

    fun toCardResponse(card: Card): CardResponse {
        return CardResponse(
            id = card.id,
            columnId = card.column?.id ?: "",
            content = card.content,
            authorNickname = card.authorNickname,
            participantId = card.participant?.id,
            voteCount = card.votes.size,
            sortOrder = card.sortOrder,
            createdAt = card.createdAt,
            updatedAt = card.updatedAt
        )
    }

    fun toVoteResponse(vote: Vote): VoteResponse {
        return VoteResponse(
            id = vote.id,
            cardId = vote.card?.id ?: "",
            participantId = vote.participant?.id ?: "",
            createdAt = vote.createdAt
        )
    }
}
