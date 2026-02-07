package com.retra.card.gateway.db

import com.retra.card.domain.Vote
import com.retra.card.domain.VoteRepository
import org.springframework.stereotype.Repository

@Repository
class JpaVoteRepository(
    private val springDataRepo: SpringDataVoteRepository
) : VoteRepository {

    override fun save(vote: Vote): Vote = springDataRepo.save(vote)

    override fun delete(vote: Vote) = springDataRepo.delete(vote)

    override fun findByCardIdAndParticipantId(cardId: String, participantId: String): Vote? =
        springDataRepo.findByCardIdAndParticipantId(cardId, participantId)

    override fun countByParticipantIdAndCardBoardId(participantId: String, boardId: String): Long =
        springDataRepo.countByParticipantIdAndCardBoardId(participantId, boardId)
}
