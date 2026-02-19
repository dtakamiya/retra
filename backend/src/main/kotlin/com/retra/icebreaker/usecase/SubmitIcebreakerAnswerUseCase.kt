package com.retra.icebreaker.usecase

import com.retra.board.domain.BoardRepository
import com.retra.icebreaker.domain.IcebreakerAnswer
import com.retra.icebreaker.domain.IcebreakerAnswerRepository
import com.retra.icebreaker.domain.IcebreakerEvent
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class SubmitIcebreakerAnswerUseCase(
    private val boardRepository: BoardRepository,
    private val answerRepository: IcebreakerAnswerRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {
    @Transactional
    fun execute(slug: String, request: SubmitAnswerRequest): IcebreakerAnswerResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found")
        val participant = board.findParticipantById(request.participantId)
        if (!board.phase.canAnswerIcebreaker()) {
            throw BadRequestException("Can only submit answer during ICEBREAK phase")
        }

        val answer = IcebreakerAnswer.create(
            boardId = board.id,
            participantId = participant.id,
            answerText = request.answerText
        )
        answerRepository.save(answer)

        eventPublisher.publish(
            IcebreakerEvent.AnswerSubmitted(
                boardSlug = slug,
                answerId = answer.id,
                participantId = participant.id,
                participantNickname = participant.nickname,
                answerText = answer.answerText,
                createdAt = answer.createdAt
            )
        )

        return IcebreakerMapper.toAnswerResponse(answer, participant)
    }
}
