package com.retra.icebreaker.usecase

import com.retra.board.domain.BoardRepository
import com.retra.icebreaker.domain.IcebreakerAnswerRepository
import com.retra.icebreaker.domain.IcebreakerEvent
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UpdateIcebreakerAnswerUseCase(
    private val boardRepository: BoardRepository,
    private val answerRepository: IcebreakerAnswerRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {
    @Transactional
    fun execute(slug: String, answerId: String, request: UpdateAnswerRequest): IcebreakerAnswerResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found")
        if (!board.phase.canAnswerIcebreaker()) {
            throw BadRequestException("Can only update answer during ICEBREAK phase")
        }
        val participant = board.findParticipantById(request.participantId)
        val answer = answerRepository.findById(answerId)
            ?: throw NotFoundException("Answer not found")

        if (answer.participantId != participant.id) {
            throw ForbiddenException("Only the author can update the answer")
        }

        answer.updateText(request.answerText)
        answerRepository.save(answer)

        eventPublisher.publish(
            IcebreakerEvent.AnswerUpdated(
                boardSlug = slug,
                answerId = answer.id,
                participantId = participant.id,
                participantNickname = participant.nickname,
                answerText = answer.answerText
            )
        )

        return IcebreakerMapper.toAnswerResponse(answer, participant)
    }
}
