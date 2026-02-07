package com.retra.card.usecase

import com.retra.board.domain.BoardRepository
import com.retra.card.domain.ReactionEvent
import com.retra.card.domain.ReactionRepository
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class RemoveReactionUseCase(
    private val boardRepository: BoardRepository,
    private val reactionRepository: ReactionRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(slug: String, request: RemoveReactionRequest) {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        val reaction = reactionRepository.findByCardIdAndParticipantIdAndEmoji(
            request.cardId, request.participantId, request.emoji
        ) ?: throw NotFoundException("Reaction not found")

        if (reaction.board?.id != board.id) {
            throw NotFoundException("Reaction not found")
        }

        reactionRepository.delete(reaction)

        eventPublisher.publish(
            ReactionEvent.ReactionRemoved(
                slug = slug,
                cardId = request.cardId,
                participantId = request.participantId,
                emoji = request.emoji
            )
        )
    }
}
