package com.retra.card.gateway.db

import com.retra.card.domain.Vote
import org.springframework.data.jpa.repository.JpaRepository

interface SpringDataVoteRepository : JpaRepository<Vote, String> {
    fun findByCardIdAndParticipantId(cardId: String, participantId: String): Vote?
    fun countByParticipantIdAndCardBoardId(participantId: String, boardId: String): Long
}
