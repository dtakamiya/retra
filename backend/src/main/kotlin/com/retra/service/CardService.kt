package com.retra.service

import com.retra.domain.model.Card
import com.retra.domain.model.Phase
import com.retra.domain.repository.BoardColumnRepository
import com.retra.domain.repository.CardRepository
import com.retra.domain.repository.ParticipantRepository
import com.retra.dto.*
import com.retra.exception.BadRequestException
import com.retra.exception.ForbiddenException
import com.retra.exception.NotFoundException
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Service
class CardService(
    private val cardRepository: CardRepository,
    private val columnRepository: BoardColumnRepository,
    private val participantRepository: ParticipantRepository,
    private val boardService: BoardService,
    private val eventPublisher: ApplicationEventPublisher
) {

    companion object {
        private val CARD_MOVABLE_PHASES = listOf(Phase.WRITING, Phase.DISCUSSION, Phase.ACTION_ITEMS)
    }

    @Transactional
    fun createCard(slug: String, request: CreateCardRequest): CardResponse {
        val board = boardService.findBoardBySlug(slug)

        if (board.phase != Phase.WRITING) {
            throw BadRequestException("Cards can only be created during WRITING phase")
        }

        val column = columnRepository.findById(request.columnId)
            .orElseThrow { NotFoundException("Column not found") }

        if (column.board?.id != board.id) {
            throw BadRequestException("Column does not belong to this board")
        }

        val participant = participantRepository.findById(request.participantId)
            .orElseThrow { NotFoundException("Participant not found") }

        val now = Instant.now().toString()
        val nextSortOrder = cardRepository.countByColumnId(request.columnId).toInt()
        val card = Card(
            id = UUID.randomUUID().toString(),
            column = column,
            board = board,
            content = request.content,
            authorNickname = participant.nickname,
            participant = participant,
            sortOrder = nextSortOrder,
            createdAt = now,
            updatedAt = now
        )

        cardRepository.save(card)

        val response = toResponse(card)
        eventPublisher.publishEvent(CardCreatedEvent(slug, response))
        return response
    }

    @Transactional
    fun updateCard(slug: String, cardId: String, request: UpdateCardRequest): CardResponse {
        val board = boardService.findBoardBySlug(slug)
        val card = cardRepository.findById(cardId)
            .orElseThrow { NotFoundException("Card not found") }

        if (card.board?.id != board.id) {
            throw BadRequestException("Card does not belong to this board")
        }

        if (card.participant?.id != request.participantId) {
            throw ForbiddenException("Only the author can edit this card")
        }

        card.content = request.content
        card.updatedAt = Instant.now().toString()
        cardRepository.save(card)

        val response = toResponse(card)
        eventPublisher.publishEvent(CardUpdatedEvent(slug, response))
        return response
    }

    @Transactional
    fun deleteCard(slug: String, cardId: String, request: DeleteCardRequest) {
        val board = boardService.findBoardBySlug(slug)
        val card = cardRepository.findById(cardId)
            .orElseThrow { NotFoundException("Card not found") }

        if (card.board?.id != board.id) {
            throw BadRequestException("Card does not belong to this board")
        }

        val participant = board.participants.find { it.id == request.participantId }
            ?: throw NotFoundException("Participant not found")

        val isAuthor = card.participant?.id == request.participantId
        val isFacilitator = participant.isFacilitator

        if (!isAuthor && !isFacilitator) {
            throw ForbiddenException("Only the author or facilitator can delete this card")
        }

        val columnId = card.column?.id ?: ""
        cardRepository.delete(card)

        eventPublisher.publishEvent(CardDeletedEvent(slug, cardId, columnId))
    }

    @Transactional
    fun moveCard(slug: String, cardId: String, request: MoveCardRequest) {
        val board = boardService.findBoardBySlug(slug)
        val card = cardRepository.findById(cardId)
            .orElseThrow { NotFoundException("Card not found") }

        if (card.board?.id != board.id) {
            throw BadRequestException("Card does not belong to this board")
        }

        if (board.phase !in CARD_MOVABLE_PHASES) {
            throw BadRequestException("Cards cannot be moved in ${board.phase} phase")
        }

        val participant = board.participants.find { it.id == request.participantId }
            ?: throw NotFoundException("Participant not found")

        val isAuthor = card.participant?.id == request.participantId
        val isFacilitator = participant.isFacilitator

        if (board.phase == Phase.WRITING && !isAuthor) {
            throw ForbiddenException("Only the author can move this card during WRITING phase")
        }
        if (board.phase in listOf(Phase.DISCUSSION, Phase.ACTION_ITEMS) && !isFacilitator) {
            throw ForbiddenException("Only facilitator can reorder cards during ${board.phase} phase")
        }

        val sourceColumnId = card.column?.id ?: ""
        if (sourceColumnId != request.targetColumnId && board.phase != Phase.WRITING) {
            throw BadRequestException("Cross-column moves are only allowed during WRITING phase")
        }

        val targetColumn = columnRepository.findById(request.targetColumnId)
            .orElseThrow { NotFoundException("Target column not found") }

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

        card.column = targetColumn
        card.sortOrder = request.sortOrder
        card.updatedAt = Instant.now().toString()
        cardRepository.save(card)

        eventPublisher.publishEvent(
            CardMovedEvent(slug, cardId, sourceColumnId, request.targetColumnId, request.sortOrder)
        )
    }

    private fun toResponse(card: Card): CardResponse {
        return CardResponse(
            id = card.id,
            columnId = card.column?.id ?: "",
            content = card.content,
            authorNickname = card.authorNickname,
            participantId = card.participant?.id,
            voteCount = card.votes.size,
            sortOrder = card.sortOrder,
            createdAt = card.createdAt,
            updatedAt = card.updatedAt
        )
    }
}
