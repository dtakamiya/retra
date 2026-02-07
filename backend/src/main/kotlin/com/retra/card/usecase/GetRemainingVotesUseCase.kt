package com.retra.card.usecase

import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import com.retra.card.domain.VoteRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class GetRemainingVotesUseCase(
    private val boardRepository: BoardRepository,
    private val voteRepository: VoteRepository
) {

    @Transactional(readOnly = true)
    fun execute(slug: String, participantId: String): RemainingVotesResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        val usedVotes = voteRepository.countByParticipantIdAndCardBoardId(participantId, board.id)

        return RemainingVotesResponse(
            participantId = participantId,
            remaining = board.getVoteLimit().remaining(usedVotes),
            max = board.maxVotesPerPerson,
            used = usedVotes.toInt()
        )
    }
}
