package com.retra.card.usecase

import com.retra.card.domain.Reaction

object ReactionMapper {

    fun toReactionResponse(reaction: Reaction): ReactionResponse {
        return ReactionResponse(
            id = reaction.id,
            cardId = reaction.card?.id ?: "",
            participantId = reaction.participant?.id ?: "",
            emoji = reaction.emoji,
            createdAt = reaction.createdAt
        )
    }
}
