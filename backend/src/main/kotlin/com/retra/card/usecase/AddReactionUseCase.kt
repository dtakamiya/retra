package com.retra.card.usecase

import com.retra.board.domain.BoardRepository
import com.retra.card.domain.CardRepository
import com.retra.card.domain.Reaction
import com.retra.card.domain.ReactionEvent
import com.retra.card.domain.ReactionRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.ConflictException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AddReactionUseCase(
    private val boardRepository: BoardRepository,
    private val cardRepository: CardRepository,
    private val reactionRepository: ReactionRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(slug: String, request: AddReactionRequest): ReactionResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        val card = cardRepository.findById(request.cardId)
            ?: throw NotFoundException("Card not found")

        if (card.board?.id != board.id) {
            throw BadRequestException("Card does not belong to this board")
        }

        val participant = board.findParticipantById(request.participantId)

        val existing = reactionRepository.findByCardIdAndParticipantIdAndEmoji(
            request.cardId, request.participantId, request.emoji
        )
        if (existing != null) {
            throw ConflictException("Already reacted with this emoji")
        }

        val reaction = Reaction.create(
            card = card,
            board = board,
            participant = participant,
            emoji = request.emoji
        )
        reactionRepository.save(reaction)

        val response = ReactionMapper.toReactionResponse(reaction)
        eventPublisher.publish(
            ReactionEvent.ReactionAdded(
                boardSlug = slug,
                reactionId = reaction.id,
                cardId = request.cardId,
                participantId = request.participantId,
                emoji = request.emoji,
                createdAt = reaction.createdAt
            )
        )
        return response
    }
}
