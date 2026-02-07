package com.retra.card.usecase

import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import com.retra.card.domain.CardRepository
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UpdateCardUseCase(
    private val boardRepository: BoardRepository,
    private val cardRepository: CardRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(slug: String, cardId: String, request: UpdateCardRequest): CardResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        val card = cardRepository.findById(cardId)
            ?: throw NotFoundException("Card not found")

        if (card.board?.id != board.id) {
            throw BadRequestException("Card does not belong to this board")
        }

        card.updateContent(request.content, request.participantId)
        cardRepository.save(card)

        eventPublisher.publishAll(card.getDomainEvents())
        card.clearDomainEvents()

        return CardMapper.toCardResponse(card)
    }
}
