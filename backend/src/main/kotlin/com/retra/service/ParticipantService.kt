package com.retra.service

import com.retra.domain.model.Participant
import com.retra.domain.repository.ParticipantRepository
import com.retra.dto.JoinBoardRequest
import com.retra.dto.ParticipantResponse
import com.retra.exception.NotFoundException
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Service
class ParticipantService(
    private val participantRepository: ParticipantRepository,
    private val boardService: BoardService,
    private val eventPublisher: ApplicationEventPublisher
) {

    @Transactional
    fun joinBoard(slug: String, request: JoinBoardRequest): ParticipantResponse {
        val board = boardService.findBoardBySlug(slug)
        val isFirst = board.participants.isEmpty()

        val participant = Participant(
            id = UUID.randomUUID().toString(),
            board = board,
            nickname = request.nickname,
            isFacilitator = isFirst,
            isOnline = true,
            createdAt = Instant.now().toString()
        )

        participantRepository.save(participant)

        val response = toResponse(participant)
        eventPublisher.publishEvent(ParticipantJoinedEvent(slug, response))
        return response
    }

    @Transactional
    fun updateOnlineStatus(participantId: String, isOnline: Boolean, sessionId: String?) {
        val participant = participantRepository.findById(participantId)
            .orElse(null) ?: return

        participant.isOnline = isOnline
        if (sessionId != null) {
            participant.sessionId = sessionId
        }
        participantRepository.save(participant)

        val board = participant.board ?: return
        eventPublisher.publishEvent(ParticipantOnlineEvent(board.slug, participantId, isOnline))
    }

    @Transactional
    fun setSessionId(participantId: String, sessionId: String) {
        val participant = participantRepository.findById(participantId)
            .orElseThrow { NotFoundException("Participant not found") }
        participant.sessionId = sessionId
        participant.isOnline = true
        participantRepository.save(participant)
    }

    @Transactional
    fun handleDisconnect(sessionId: String) {
        val participant = participantRepository.findBySessionId(sessionId) ?: return
        participant.isOnline = false
        participantRepository.save(participant)

        val board = participant.board ?: return
        eventPublisher.publishEvent(ParticipantOnlineEvent(board.slug, participant.id, false))
    }

    fun toResponse(participant: Participant): ParticipantResponse {
        return ParticipantResponse(
            id = participant.id,
            nickname = participant.nickname,
            isFacilitator = participant.isFacilitator,
            isOnline = participant.isOnline,
            createdAt = participant.createdAt
        )
    }
}
