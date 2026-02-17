package com.retra.board.usecase

import com.retra.board.domain.Board
import com.retra.board.domain.Participant
import com.retra.board.domain.Phase
import com.retra.card.usecase.CardMapper

object BoardMapper {

    fun toBoardResponse(board: Board, requesterId: String? = null): BoardResponse {
        val isPrivateWritingActive = board.privateWriting && board.phase == Phase.WRITING

        return BoardResponse(
            id = board.id,
            slug = board.slug,
            title = board.title,
            teamName = board.teamName,
            framework = board.framework,
            phase = board.phase,
            maxVotesPerPerson = board.maxVotesPerPerson,
            isAnonymous = board.isAnonymous,
            privateWriting = board.privateWriting,
            columns = board.columns.map { col ->
                val sortedCards = col.cards.sortedBy { it.sortOrder }
                if (isPrivateWritingActive) {
                    val visibleCards = if (requesterId != null) {
                        sortedCards.filter { it.participant?.id == requesterId }
                    } else {
                        emptyList()
                    }
                    val hiddenCount = sortedCards.size - visibleCards.size
                    ColumnResponse(
                        id = col.id,
                        name = col.name,
                        sortOrder = col.sortOrder,
                        color = col.color,
                        cards = visibleCards.map { CardMapper.toCardResponse(it, board.isAnonymous, requesterId) },
                        hiddenCardCount = hiddenCount
                    )
                } else {
                    ColumnResponse(
                        id = col.id,
                        name = col.name,
                        sortOrder = col.sortOrder,
                        color = col.color,
                        cards = sortedCards.map { CardMapper.toCardResponse(it, board.isAnonymous, requesterId) },
                        hiddenCardCount = 0
                    )
                }
            },
            participants = board.participants.map { toParticipantResponse(it) },
            createdAt = board.createdAt,
            updatedAt = board.updatedAt
        )
    }

    fun toParticipantResponse(participant: Participant): ParticipantResponse {
        return ParticipantResponse(
            id = participant.id,
            nickname = participant.nickname,
            isFacilitator = participant.isFacilitator,
            isOnline = participant.isOnline,
            createdAt = participant.createdAt
        )
    }
}
