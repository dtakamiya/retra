package com.retra.card.usecase

import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import com.retra.card.domain.CardRepository
import com.retra.board.domain.BoardAuthorizationService
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MoveCardUseCase(
    private val boardRepository: BoardRepository,
    private val cardRepository: CardRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(slug: String, cardId: String, request: MoveCardRequest) {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        val card = cardRepository.findById(cardId)
            ?: throw NotFoundException("Card not found")

        if (card.board?.id != board.id) {
            throw BadRequestException("Card does not belong to this board")
        }

        val participant = board.findParticipantById(request.participantId)
        val isAuthor = card.participant?.id == request.participantId
        val sourceColumnId = card.column?.id ?: ""
        val isCrossColumnMove = sourceColumnId != request.targetColumnId

        BoardAuthorizationService.validateCardMove(
            phase = board.phase,
            isAuthor = isAuthor,
            isFacilitator = participant.isFacilitator,
            isCrossColumnMove = isCrossColumnMove
        )

        val targetColumn = board.findColumnById(request.targetColumnId)

        if (targetColumn.board?.id != board.id) {
            throw BadRequestException("Target column does not belong to this board")
        }

        val targetCards = cardRepository.findByColumnIdOrderBySortOrderAsc(request.targetColumnId)
            .filter { it.id != cardId }

        val cardsToUpdate = targetCards.mapIndexedNotNull { index, c ->
            val newOrder = if (index >= request.sortOrder) index + 1 else index
            if (c.sortOrder != newOrder) {
                c.sortOrder = newOrder
                c
            } else null
        }
        if (cardsToUpdate.isNotEmpty()) {
            cardRepository.saveAll(cardsToUpdate)
        }

        card.moveTo(targetColumn, request.sortOrder)
        cardRepository.save(card)

        eventPublisher.publishAll(card.getDomainEvents())
        card.clearDomainEvents()
    }
}
