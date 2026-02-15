package com.retra.card.usecase

import com.retra.card.domain.VoteEvent
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import com.retra.card.domain.VoteRepository
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class RemoveVoteUseCase(
    private val boardRepository: BoardRepository,
    private val voteRepository: VoteRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(slug: String, request: RemoveVoteRequest) {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        if (!board.phase.canVote()) {
            throw BadRequestException("Vote removal is only allowed during VOTING phase")
        }

        val vote = voteRepository.findByCardIdAndParticipantId(request.cardId, request.participantId)
            ?: throw NotFoundException("Vote not found")

        voteRepository.delete(vote)

        eventPublisher.publish(VoteEvent.VoteRemoved(boardSlug = slug, cardId = request.cardId, participantId = request.participantId))
    }
}
