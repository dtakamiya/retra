package com.retra.card.gateway.db

import com.retra.card.domain.Reaction
import com.retra.card.domain.ReactionRepository
import org.springframework.stereotype.Repository

@Repository
class JpaReactionRepository(
    private val springDataRepo: SpringDataReactionRepository
) : ReactionRepository {

    override fun save(reaction: Reaction): Reaction = springDataRepo.save(reaction)

    override fun delete(reaction: Reaction) = springDataRepo.delete(reaction)

    override fun findByCardIdAndParticipantIdAndEmoji(cardId: String, participantId: String, emoji: String): Reaction? =
        springDataRepo.findByCardIdAndParticipantIdAndEmoji(cardId, participantId, emoji)
}
