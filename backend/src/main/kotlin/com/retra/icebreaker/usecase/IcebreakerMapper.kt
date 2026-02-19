package com.retra.icebreaker.usecase

import com.retra.board.domain.Participant
import com.retra.icebreaker.domain.IcebreakerAnswer

object IcebreakerMapper {
    fun toAnswerResponse(answer: IcebreakerAnswer, participant: Participant): IcebreakerAnswerResponse {
        return IcebreakerAnswerResponse(
            id = answer.id,
            participantId = answer.participantId,
            participantNickname = participant.nickname,
            answerText = answer.answerText,
            createdAt = answer.createdAt
        )
    }
}
