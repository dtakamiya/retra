package com.retra.icebreaker.usecase

import com.retra.board.domain.BoardRepository
import com.retra.icebreaker.domain.IcebreakerAnswerRepository
import com.retra.icebreaker.domain.IcebreakerEvent
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class DeleteIcebreakerAnswerUseCase(
    private val boardRepository: BoardRepository,
    private val answerRepository: IcebreakerAnswerRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {
    @Transactional
    fun execute(slug: String, answerId: String, participantId: String) {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found")
        val participant = board.findParticipantById(participantId)
        val answer = answerRepository.findById(answerId)
            ?: throw NotFoundException("Answer not found")

        if (answer.participantId != participant.id) {
            throw ForbiddenException("Only the author can delete the answer")
        }

        answerRepository.delete(answer)

        eventPublisher.publish(
            IcebreakerEvent.AnswerDeleted(
                boardSlug = slug,
                answerId = answerId
            )
        )
    }
}
