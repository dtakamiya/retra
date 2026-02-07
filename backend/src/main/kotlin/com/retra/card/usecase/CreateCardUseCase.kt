package com.retra.card.usecase

import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.NotFoundException
import com.retra.card.domain.Card
import com.retra.board.domain.BoardRepository
import com.retra.card.domain.CardRepository
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CreateCardUseCase(
    private val boardRepository: BoardRepository,
    private val cardRepository: CardRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(slug: String, request: CreateCardRequest): CardResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        if (!board.phase.canCreateCard()) {
            throw BadRequestException("Cards can only be created during WRITING phase")
        }

        val column = board.findColumnById(request.columnId)

        if (column.board?.id != board.id) {
            throw BadRequestException("Column does not belong to this board")
        }

        val participant = board.findParticipantById(request.participantId)

        val nextSortOrder = cardRepository.countByColumnId(request.columnId).toInt()
        val card = Card.create(
            board = board,
            column = column,
            content = request.content,
            author = participant,
            sortOrder = nextSortOrder
        )

        cardRepository.save(card)

        eventPublisher.publishAll(card.getDomainEvents())
        card.clearDomainEvents()

        return CardMapper.toCardResponse(card)
    }
}
