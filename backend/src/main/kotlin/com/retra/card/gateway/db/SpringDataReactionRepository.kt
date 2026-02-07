package com.retra.card.gateway.db

import com.retra.card.domain.Reaction
import org.springframework.data.jpa.repository.JpaRepository

interface SpringDataReactionRepository : JpaRepository<Reaction, String> {
    fun findByCardIdAndParticipantIdAndEmoji(cardId: String, participantId: String, emoji: String): Reaction?
    fun findByCardId(cardId: String): List<Reaction>
}
