package com.retra.card.usecase

import com.retra.card.domain.CardEvent
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import com.retra.card.domain.CardRepository
import com.retra.board.domain.BoardAuthorizationService
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class DeleteCardUseCase(
    private val boardRepository: BoardRepository,
    private val cardRepository: CardRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(slug: String, cardId: String, request: DeleteCardRequest) {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        val card = cardRepository.findById(cardId)
            ?: throw NotFoundException("Card not found")

        if (card.board?.id != board.id) {
            throw BadRequestException("Card does not belong to this board")
        }

        val participant = board.findParticipantById(request.participantId)
        val isAuthor = card.participant?.id == request.participantId

        BoardAuthorizationService.validateCardDeletion(isAuthor, participant.isFacilitator)

        val columnId = card.column?.id ?: ""
        cardRepository.delete(card)

        eventPublisher.publish(CardEvent.CardDeleted(boardSlug = slug, cardId = cardId, columnId = columnId))
    }
}
