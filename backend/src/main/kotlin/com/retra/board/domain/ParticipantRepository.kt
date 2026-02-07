package com.retra.board.domain

interface ParticipantRepository {
    fun save(participant: Participant): Participant
    fun findById(id: String): Participant?
    fun findBySessionId(sessionId: String): Participant?
}
