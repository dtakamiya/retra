package com.retra.board.usecase

import com.retra.board.domain.ParticipantRepository
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UpdateOnlineStatusUseCase(
    private val participantRepository: ParticipantRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(participantId: String, isOnline: Boolean, sessionId: String? = null) {
        val participant = participantRepository.findById(participantId) ?: return

        participant.updateOnlineStatus(isOnline, sessionId)
        participantRepository.save(participant)

        eventPublisher.publishAll(participant.getDomainEvents())
        participant.clearDomainEvents()
    }

    @Transactional
    fun setSessionId(participantId: String, sessionId: String) {
        val participant = participantRepository.findById(participantId)
            ?: throw NotFoundException("Participant not found")
        participant.sessionId = sessionId
        participant.isOnline = true
        participantRepository.save(participant)
    }

    @Transactional
    fun handleDisconnect(sessionId: String) {
        val participant = participantRepository.findBySessionId(sessionId) ?: return
        participant.updateOnlineStatus(false)
        participantRepository.save(participant)

        eventPublisher.publishAll(participant.getDomainEvents())
        participant.clearDomainEvents()
    }
}
