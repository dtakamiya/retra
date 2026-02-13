package com.retra.card.usecase

import com.retra.card.domain.Card
import com.retra.card.domain.Vote

object CardMapper {

    fun toCardResponse(card: Card, isAnonymous: Boolean = false, requesterId: String? = null): CardResponse {
        val authorNickname = if (isAnonymous && card.participant?.id != requesterId) {
            null
        } else {
            card.authorNickname
        }
        return CardResponse(
            id = card.id,
            columnId = card.column?.id ?: "",
            content = card.content,
            authorNickname = authorNickname,
            participantId = card.participant?.id,
            voteCount = card.votes.size,
            votedParticipantIds = card.votes.mapNotNull { it.participant?.id },
            sortOrder = card.sortOrder,
            isDiscussed = card.isDiscussed,
            discussionOrder = card.discussionOrder,
            createdAt = card.createdAt,
            updatedAt = card.updatedAt,
            memos = card.memos.map { MemoMapper.toMemoResponse(it) },
            reactions = card.reactions.map { ReactionMapper.toReactionResponse(it) }
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
