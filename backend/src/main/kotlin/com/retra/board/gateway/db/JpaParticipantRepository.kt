package com.retra.board.gateway.db

import com.retra.board.domain.Participant
import com.retra.board.domain.ParticipantRepository
import org.springframework.stereotype.Repository

@Repository
class JpaParticipantRepository(
    private val springDataRepo: SpringDataParticipantRepository
) : ParticipantRepository {

    override fun save(participant: Participant): Participant =
        springDataRepo.save(participant)

    override fun findById(id: String): Participant? =
        springDataRepo.findById(id).orElse(null)

    override fun findBySessionId(sessionId: String): Participant? =
        springDataRepo.findBySessionId(sessionId)
}
