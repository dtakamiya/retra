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
        val card = Card(
            id = UUID.randomUUID().toString(),
            column = column,
            board = board,
            content = request.content,
            authorNickname = participant.nickname,
            participant = participant,
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

    private fun toResponse(card: Card): CardResponse {
        return CardResponse(
            id = card.id,
            columnId = card.column?.id ?: "",
            content = card.content,
            authorNickname = card.authorNickname,
            participantId = card.participant?.id,
            voteCount = card.votes.size,
            createdAt = card.createdAt,
            updatedAt = card.updatedAt
        )
    }
}
