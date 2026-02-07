package com.retra.card.domain

interface ReactionRepository {
    fun save(reaction: Reaction): Reaction
    fun delete(reaction: Reaction)
    fun findByCardIdAndParticipantIdAndEmoji(cardId: String, participantId: String, emoji: String): Reaction?
    fun findByCardId(cardId: String): List<Reaction>
}
