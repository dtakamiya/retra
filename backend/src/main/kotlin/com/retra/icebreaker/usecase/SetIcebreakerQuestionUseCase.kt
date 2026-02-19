package com.retra.icebreaker.usecase

import com.retra.board.domain.BoardRepository
import com.retra.icebreaker.domain.IcebreakerEvent
import com.retra.icebreaker.domain.IcebreakerQuestions
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class SetIcebreakerQuestionUseCase(
    private val boardRepository: BoardRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {
    @Transactional
    fun execute(slug: String, request: SetQuestionRequest): IcebreakerResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found")
        val participant = board.findParticipantById(request.participantId)
        if (!participant.isFacilitator) {
            throw ForbiddenException("Only facilitator can set icebreaker question")
        }
        if (!board.phase.canAnswerIcebreaker()) {
            throw BadRequestException("Can only set question during ICEBREAK phase")
        }

        val question = when (request.type.uppercase()) {
            "RANDOM" -> IcebreakerQuestions.random()
            "CUSTOM" -> request.questionText?.trim()
                ?: throw BadRequestException("questionText is required for CUSTOM type")
            else -> throw BadRequestException("Invalid type: ${request.type}")
        }

        board.icebreakerQuestion = question
        boardRepository.save(board)

        eventPublisher.publish(IcebreakerEvent.QuestionSet(boardSlug = slug, question = question))

        return IcebreakerResponse(question = question, answers = emptyList())
    }
}
