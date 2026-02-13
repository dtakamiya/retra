package com.retra.card.usecase

import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import com.retra.card.domain.CardRepository
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MarkCardDiscussedUseCase(
    private val boardRepository: BoardRepository,
    private val cardRepository: CardRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(slug: String, cardId: String, request: MarkCardDiscussedRequest): CardResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        if (!board.phase.canMarkDiscussed()) {
            throw BadRequestException("Cannot mark discussed in ${board.phase} phase")
        }

        val participant = board.participants.find { it.id == request.participantId }
            ?: throw NotFoundException("Participant not found")

        if (!participant.isFacilitator) {
            throw ForbiddenException("Only facilitator can mark discussed")
        }

        val card = cardRepository.findById(cardId)
            ?: throw NotFoundException("Card not found")

        if (card.board?.id != board.id) {
            throw BadRequestException("Card does not belong to this board")
        }

        val event = if (request.isDiscussed) card.markAsDiscussed() else card.unmarkAsDiscussed()
        cardRepository.save(card)
        eventPublisher.publish(event)

        return CardMapper.toCardResponse(card)
    }
}
