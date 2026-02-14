package com.retra.board.usecase

import com.retra.board.domain.Board
import com.retra.board.domain.Participant
import com.retra.card.usecase.CardMapper

object BoardMapper {

    fun toBoardResponse(board: Board, requesterId: String? = null): BoardResponse {
        return BoardResponse(
            id = board.id,
            slug = board.slug,
            title = board.title,
            teamName = board.teamName,
            framework = board.framework,
            phase = board.phase,
            maxVotesPerPerson = board.maxVotesPerPerson,
            isAnonymous = board.isAnonymous,
            columns = board.columns.map { col ->
                ColumnResponse(
                    id = col.id,
                    name = col.name,
                    sortOrder = col.sortOrder,
                    color = col.color,
                    cards = col.cards.sortedBy { it.sortOrder }.map { CardMapper.toCardResponse(it, board.isAnonymous, requesterId) }
                )
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
