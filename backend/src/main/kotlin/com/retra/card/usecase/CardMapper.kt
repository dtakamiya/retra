package com.retra.card.usecase

import com.retra.card.domain.Card

object CardMapper {

    fun toCardResponse(card: Card, isAnonymous: Boolean = false, requesterId: String? = null): CardResponse {
        val isOtherPersonCard = isAnonymous && card.participant?.id != requesterId
        val authorNickname = if (isOtherPersonCard) {
            null
        } else {
            card.authorNickname
        }
        val participantId = if (isOtherPersonCard) {
            null
        } else {
            card.participant?.id
        }
        return CardResponse(
            id = card.id,
            columnId = card.column?.id ?: "",
            content = card.content,
            authorNickname = authorNickname,
            participantId = participantId,
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
}
