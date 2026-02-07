package com.retra.domain.repository

import com.retra.domain.model.Vote
import org.springframework.data.jpa.repository.JpaRepository

interface VoteRepository : JpaRepository<Vote, String> {
    fun findByCardId(cardId: String): List<Vote>
    fun findByParticipantId(participantId: String): List<Vote>
    fun findByCardIdAndParticipantId(cardId: String, participantId: String): Vote?
    fun countByParticipantIdAndCardBoardId(participantId: String, boardId: String): Long
}
