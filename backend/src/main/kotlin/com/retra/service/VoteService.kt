package com.retra.service

import com.retra.domain.model.Phase
import com.retra.domain.model.Vote
import com.retra.domain.repository.CardRepository
import com.retra.domain.repository.ParticipantRepository
import com.retra.domain.repository.VoteRepository
import com.retra.dto.*
import com.retra.exception.BadRequestException
import com.retra.exception.ConflictException
import com.retra.exception.NotFoundException
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Service
class VoteService(
    private val voteRepository: VoteRepository,
    private val cardRepository: CardRepository,
    private val participantRepository: ParticipantRepository,
    private val boardService: BoardService,
    private val eventPublisher: ApplicationEventPublisher
) {

    @Transactional
    fun addVote(slug: String, request: VoteRequest): VoteResponse {
        val board = boardService.findBoardBySlug(slug)

        if (board.phase != Phase.VOTING) {
            throw BadRequestException("Voting is only allowed during VOTING phase")
        }

        val card = cardRepository.findById(request.cardId)
            .orElseThrow { NotFoundException("Card not found") }

        if (card.board?.id != board.id) {
            throw BadRequestException("Card does not belong to this board")
        }

        val participant = participantRepository.findById(request.participantId)
            .orElseThrow { NotFoundException("Participant not found") }

        // Check for duplicate vote
        val existing = voteRepository.findByCardIdAndParticipantId(request.cardId, request.participantId)
        if (existing != null) {
            throw ConflictException("Already voted on this card")
        }

        // Check vote limit
        val usedVotes = voteRepository.countByParticipantIdAndCardBoardId(request.participantId, board.id)
        if (usedVotes >= board.maxVotesPerPerson) {
            throw BadRequestException("Vote limit reached (max: ${board.maxVotesPerPerson})")
        }

        val vote = Vote(
            id = UUID.randomUUID().toString(),
            card = card,
            participant = participant,
            createdAt = Instant.now().toString()
        )

        voteRepository.save(vote)

        val response = VoteResponse(
            id = vote.id,
            cardId = request.cardId,
            participantId = request.participantId,
            createdAt = vote.createdAt
        )
        eventPublisher.publishEvent(VoteAddedEvent(slug, response))
        return response
    }

    @Transactional
    fun removeVote(slug: String, request: RemoveVoteRequest) {
        val board = boardService.findBoardBySlug(slug)

        if (board.phase != Phase.VOTING) {
            throw BadRequestException("Vote removal is only allowed during VOTING phase")
        }

        val vote = voteRepository.findByCardIdAndParticipantId(request.cardId, request.participantId)
            ?: throw NotFoundException("Vote not found")

        voteRepository.delete(vote)

        eventPublisher.publishEvent(VoteRemovedEvent(slug, request.cardId, request.participantId))
    }

    @Transactional(readOnly = true)
    fun getRemainingVotes(slug: String, participantId: String): RemainingVotesResponse {
        val board = boardService.findBoardBySlug(slug)
        val usedVotes = voteRepository.countByParticipantIdAndCardBoardId(participantId, board.id)

        return RemainingVotesResponse(
            participantId = participantId,
            remaining = (board.maxVotesPerPerson - usedVotes).toInt().coerceAtLeast(0),
            max = board.maxVotesPerPerson,
            used = usedVotes.toInt()
        )
    }
}
