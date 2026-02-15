package com.retra.card.usecase

import com.retra.card.domain.VoteEvent
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import com.retra.card.domain.CardRepository
import com.retra.card.domain.VoteRepository
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AddVoteUseCase(
    private val boardRepository: BoardRepository,
    private val cardRepository: CardRepository,
    private val voteRepository: VoteRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(slug: String, request: VoteRequest): VoteResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        if (!board.phase.canVote()) {
            throw BadRequestException("Voting is only allowed during VOTING phase")
        }

        val card = cardRepository.findById(request.cardId)
            ?: throw NotFoundException("Card not found")

        if (card.board?.id != board.id) {
            throw BadRequestException("Card does not belong to this board")
        }

        val participant = board.findParticipantById(request.participantId)

        val usedVotes = voteRepository.countByParticipantIdAndCardBoardId(request.participantId, board.id)
        if (board.getVoteLimit().isExceeded(usedVotes)) {
            throw BadRequestException("Vote limit reached (max: ${board.maxVotesPerPerson})")
        }

        val vote = card.addVote(participant)

        val response = VoteResponse(
            id = vote.id,
            cardId = request.cardId,
            participantId = request.participantId,
            createdAt = vote.createdAt
        )
        eventPublisher.publish(
            VoteEvent.VoteAdded(
                boardSlug = slug,
                voteId = vote.id,
                cardId = request.cardId,
                participantId = request.participantId,
                createdAt = vote.createdAt
            )
        )
        return response
    }
}
