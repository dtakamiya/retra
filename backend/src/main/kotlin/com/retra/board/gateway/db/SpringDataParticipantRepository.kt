package com.retra.board.gateway.db

import com.retra.board.domain.Participant
import org.springframework.data.jpa.repository.JpaRepository

interface SpringDataParticipantRepository : JpaRepository<Participant, String> {
    fun findBySessionId(sessionId: String): Participant?
}
