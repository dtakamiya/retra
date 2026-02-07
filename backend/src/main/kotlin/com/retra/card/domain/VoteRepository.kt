package com.retra.card.domain

interface VoteRepository {
    fun save(vote: Vote): Vote
    fun delete(vote: Vote)
    fun findByCardIdAndParticipantId(cardId: String, participantId: String): Vote?
    fun countByParticipantIdAndCardBoardId(participantId: String, boardId: String): Long
}
