package com.retra.domain.repository

import com.retra.domain.model.Participant
import org.springframework.data.jpa.repository.JpaRepository

interface ParticipantRepository : JpaRepository<Participant, String> {
    fun findByBoardId(boardId: String): List<Participant>
    fun findBySessionId(sessionId: String): Participant?
    fun findByBoardIdAndSessionId(boardId: String, sessionId: String): Participant?
}
